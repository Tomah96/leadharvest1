# Day 9 Work Instructions - Critical Fixes
**Date**: 2025-08-13
**Orchestrator**: Claude 1
**Status**: 🚀 ACTIVE

## 🚨 CRITICAL: Database Fix Required First

**Claude 1 MUST complete the database schema change before others can proceed with testing**

The Supabase `credit_score` column needs to be changed from INTEGER to VARCHAR(50) to accept ranges like "660-719".

---

## 📋 Claude 1 (Orchestrator) Work Instructions

### ✅ Priority 0: Database Schema Fix (DO IMMEDIATELY)
1. Access Supabase dashboard
2. Navigate to SQL Editor
3. Run this SQL command:
```sql
ALTER TABLE leads 
ALTER COLUMN credit_score TYPE VARCHAR(50);
```
4. Test with a sample insert to verify it accepts ranges
5. Document completion in ACTIVE-WORK-LOG.md

### Task 1: Revert Parser Credit Score Logic (30 min)
**File**: `/backend/src/parsers/zillowParser.js`
- Remove lines 66-73 (midpoint calculation)
- Restore original format to return string ranges: `"660-719"`
```javascript
// Change FROM:
if (creditMatch[2]) {
  const min = parseInt(creditMatch[1]);
  const max = parseInt(creditMatch[2]);
  result.credit_score = Math.round((min + max) / 2);
} else {
  result.credit_score = parseInt(creditMatch[1]);
}

// Change TO:
if (creditMatch[2]) {
  result.credit_score = `${creditMatch[1]}-${creditMatch[2]}`;
} else {
  result.credit_score = creditMatch[1];
}
```

### Task 2: Monitor & Coordinate (Ongoing)
- Check ACTIVE-WORK-LOG.md every 30 minutes
- Test completed fixes from Claude 2 & 3
- Update AGENT-COMMUNICATION-LOG.md with status

### Task 3: Integration Testing (After others complete)
```bash
# Test import from all sources
curl -X POST http://localhost:3001/api/gmail/test/import

# Check for duplicate IDs
curl http://localhost:3001/api/leads | python -m json.tool | grep '"id"' | sort | uniq -d

# Monitor Gmail connection stability
for i in {1..6}; do 
  curl http://localhost:3001/api/gmail/status
  echo " - Check $i at $(date)"
  sleep 600
done
```

---

## 💻 Claude 2 (Backend) Work Instructions

### Task 1: Fix Phone Extraction Bug (45 min) 🔴 CRITICAL
**File**: `/backend/src/parsers/zillowParser.js`

Add enhanced phone extraction around line 117:
```javascript
// Extract contact information
let phoneMatch = cleanBody.match(patterns.phone);

// NEW: Try to extract from contact info link
if (!phoneMatch) {
  const contactLinkMatch = body.match(/contact\?[^"]*phone=([0-9-]+)/i);
  if (contactLinkMatch) {
    phoneMatch = [null, contactLinkMatch[1]];
  }
}

if (!phoneMatch) {
  phoneMatch = cleanBody.match(/Phone\s*\n\s*([\d\s\-\(\)\.]+)/i);
}

if (phoneMatch) {
  result.phone = this.normalizePhone(phoneMatch[1]);
} else {
  // NEW: Better fallback strategy
  if (result.email) {
    // Let leadService handle dedup by email
    result.phone = null;
  } else {
    // Generate unique placeholder with timestamp
    result.phone = '999' + Date.now().toString().slice(-7);
    result.parsing_errors.push('Generated unique placeholder phone');
  }
}
```

### Task 2: Add Request Timeout (30 min) 🔴 CRITICAL
**File**: `/backend/src/models/leadModel.js`

Update lines 83-97:
```javascript
const req = require('https').request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => responseData += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      resolve({ data: parsed, error: null });
    } catch (e) {
      resolve({ data: null, error: e });
    }
  });
});

// ADD TIMEOUT HANDLING:
req.setTimeout(5000, () => {
  req.abort();
  resolve({ 
    data: null, 
    error: new Error('Request timeout after 5 seconds') 
  });
});

req.on('error', (error) => {
  if (error.code === 'ECONNABORTED') {
    resolve({ 
      data: null, 
      error: new Error('Request timeout') 
    });
  } else {
    resolve({ data: null, error });
  }
});
```

### Task 3: Gmail Token Auto-Refresh (1 hour)
**File**: `/backend/src/controllers/gmailController.js`

Add token refresh mechanism:
```javascript
// Add at top of file
let tokenRefreshInterval = null;

// Add new function
const startTokenRefresh = () => {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }
  
  tokenRefreshInterval = setInterval(async () => {
    try {
      if (oauth2Client.credentials && oauth2Client.credentials.refresh_token) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        
        // Save to memory
        gmailTokens = credentials;
        
        console.log('✅ Gmail token auto-refreshed at', new Date().toISOString());
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
    }
  }, 50 * 60 * 1000); // 50 minutes
};

// Add to callback function after successful auth:
startTokenRefresh();

// Add to disconnect function:
if (tokenRefreshInterval) {
  clearInterval(tokenRefreshInterval);
  tokenRefreshInterval = null;
}
```

### Task 4: Performance Logging (1 hour)
**Create**: `/backend/src/utils/performanceLogger.js`
```javascript
class PerformanceLogger {
  static logTiming(operation, startTime) {
    const duration = Date.now() - startTime;
    const level = duration > 5000 ? '🔴' : duration > 1000 ? '🟡' : '🟢';
    
    console.log(`${level} [PERF] ${operation}: ${duration}ms`);
    
    if (duration > 5000) {
      console.error(`CRITICAL: ${operation} took ${duration}ms`);
    }
    
    return duration;
  }
  
  static async measureAsync(operation, fn) {
    const start = Date.now();
    try {
      const result = await fn();
      this.logTiming(operation, start);
      return result;
    } catch (error) {
      this.logTiming(`${operation} (failed)`, start);
      throw error;
    }
  }
  
  static startTimer(operation) {
    const start = Date.now();
    return {
      end: () => this.logTiming(operation, start)
    };
  }
}

module.exports = PerformanceLogger;
```

Then update `/backend/src/models/leadModel.js`:
```javascript
const PerformanceLogger = require('../utils/performanceLogger');

// In findAll method:
static async findAll({ page = 1, limit = 50, search, status, source, missingInfo }) {
  const timer = PerformanceLogger.startTimer('LeadModel.findAll');
  
  try {
    // ... existing code ...
    
    const result = await PerformanceLogger.measureAsync(
      'Supabase REST API call',
      () => new Promise((resolve) => {
        // ... existing HTTPS request code ...
      })
    );
    
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
}
```

---

## 🎨 Claude 3 (Frontend) Work Instructions

### Task 1: Add Loading States (1 hour)
**File**: `/frontend/src/app/leads/page.tsx`

Add loading skeleton:
```typescript
// Add to imports
import { Skeleton } from '@/components/ui/skeleton';

// Add state
const [showSlowWarning, setShowSlowWarning] = useState(false);

// Add loading component
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="border rounded-lg p-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
    ))}
    {showSlowWarning && (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <strong>Slow Response:</strong> The server is taking longer than expected. Please wait...
      </div>
    )}
  </div>
);

// Add timeout warning
useEffect(() => {
  let timer: NodeJS.Timeout;
  if (loading) {
    timer = setTimeout(() => {
      setShowSlowWarning(true);
    }, 30000);
  } else {
    setShowSlowWarning(false);
  }
  return () => clearTimeout(timer);
}, [loading]);

// In render
if (loading) {
  return <LoadingSkeleton />;
}
```

### Task 2: Handle Credit Score Ranges (45 min)
**File**: `/frontend/src/components/leads/LeadCard.tsx`

Update credit score display:
```typescript
// Add utility functions
const formatCreditScore = (score: string | number | null) => {
  if (!score) return 'Not provided';
  
  // Handle range format
  if (typeof score === 'string' && score.includes('-')) {
    const [min, max] = score.split('-').map(s => s.trim());
    return (
      <span className={getCreditScoreColor(parseInt(min))}>
        {min}-{max}
        <span className="text-xs text-gray-500 ml-1">(range)</span>
      </span>
    );
  }
  
  // Handle single number
  return (
    <span className={getCreditScoreColor(Number(score))}>
      {score}
    </span>
  );
};

const getCreditScoreColor = (score: number) => {
  if (score >= 720) return 'text-green-600 font-semibold';
  if (score >= 660) return 'text-yellow-600 font-semibold';
  if (score >= 600) return 'text-orange-600 font-semibold';
  return 'text-red-600 font-semibold';
};

// In the component JSX:
<div className="text-sm">
  Credit Score: {formatCreditScore(lead.credit_score)}
</div>
```

### Task 3: API Timeout Handling (45 min)
**File**: `/frontend/src/lib/api-client.ts`

Add timeout wrapper:
```typescript
// Add timeout utility
const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout = 30000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout/1000} seconds. Please try again.`);
    }
    throw error;
  }
};

// Update all API calls to use fetchWithTimeout
async getLeads(params?: LeadQueryParams) {
  try {
    const queryString = params ? `?${new URLSearchParams(params as any)}` : '';
    const response = await fetchWithTimeout(
      `${this.baseUrl}/leads${queryString}`,
      { 
        headers: this.headers,
        credentials: 'include' 
      },
      30000 // 30 second timeout
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leads: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## 📊 Progress Reporting

### Every Hour Update Format
Post in `/docs/AGENT-COMMUNICATION-LOG.md`:
```markdown
## [2025-08-13 HH:MM] - Claude [Number] ([Role])
### Status Update
- ✅ **Completed**: [List completed tasks]
- 🔄 **In Progress**: [Current task and % complete]
- 🔴 **Blocked**: [Any blockers - tag other Claude if needed]
- 📝 **Next**: [What you'll work on next]
- 🧪 **Testing**: [Any test results]
```

### On Task Completion
Update `/docs/ACTIVE-WORK-LOG.md`:
```markdown
## [Timestamp] - Claude [Number] ([Role])
### Task: [Task Name]
**Status**: Completed ✅
**Time Spent**: [Actual time]
**Files Modified**: 
- [List files with line numbers]
**Changes Made**:
- [Bullet points of specific changes]
**Testing**:
- [How you tested]
- [Results]
**Issues Found**:
- [Any new issues discovered]
```

---

## 🚀 Execution Order

1. **NOW**: Claude 1 fixes database schema
2. **After DB Fix**: Claude 1 reverts parser, Claude 2 starts phone fix
3. **Parallel**: Claude 3 starts loading states
4. **Hourly**: All post progress updates
5. **Final**: Claude 1 runs integration tests

## ⚠️ Important Notes

- **Test locally** before committing any changes
- **Document everything** in work logs
- **Communicate blockers** immediately
- **Don't skip testing** - verify each fix works
- **Keep servers running** - both frontend and backend

---

**START TIME**: 2025-08-13 22:45 UTC
**TARGET COMPLETION**: 2025-08-14 02:45 UTC (4 hours)