# Task Delegation: Fix Missing Lead Data
**Created**: 2025-08-10 by Orchestrator Claude
**Issue**: 48 out of 50 leads are missing their data because raw emails weren't saved

## 🚨 ROOT CAUSE IDENTIFIED

### The Problem:
1. **Only 2 leads have raw email content** (302 and 252) out of 50 total
2. **NO Gmail message IDs saved** - can't re-fetch from Gmail
3. **Original import process was flawed**:
   - Tried to parse HTML emails
   - Failed and saved HTML fragments in notes
   - Did NOT save the original email for re-parsing
   - Did NOT save Gmail message IDs for recovery

### Why Lead 302 Works:
- Backend Claude manually updated it WITH raw email in metadata
- The parser can then extract all the data
- Other leads have no raw email to parse!

---

## 🔧 BACKEND CLAUDE TASKS (Priority 1)

### Task 1: Create Manual Update Script (2 hours)
Since we can't recover from Gmail (no message IDs), create a script to manually update leads with email content.

**File**: `/backend/scripts/update-lead-with-email.js`

```javascript
// Script to update a lead with raw email content and re-parse
const leadId = process.argv[2];
const emailContent = process.argv[3]; // or read from file

// 1. Update lead with raw email in metadata
// 2. Run parser on the email
// 3. Update all fields in database
```

### Task 2: Fix Daniela Lin (Lead 301) First
Using the email content provided by user:
```
Subject: Daniela Lin is requesting information about 1741 Fontain St #3

Daniela Lin says:
Hi Toma Holovatskyy, My partner, his mom, and I are moving from Chicago...

Move in: Aug 15, 2025
Credit score: 660 to 719
Pets: No
Lease Length: 12 months
Number of Bedrooms: 2
Number of Occupants: 3
```

Update lead 301 with:
- last_name: "Lin"
- notes: The actual message
- credit_score: "660-719"
- move_in_date: "2025-08-15"
- occupants: 3
- preferred_bedrooms: 2
- lease_length: 12
- metadata: Store raw email

### Task 3: Fix Import Process (1 hour)
Update `/backend/src/controllers/gmailController.js`:
1. ALWAYS save raw email content in metadata
2. ALWAYS save Gmail message ID
3. Add error handling for parse failures
4. Keep original email even if parsing fails

---

## 🎨 FRONTEND CLAUDE TASKS (Priority 2)

### Task 1: Add Data Quality Dashboard (1 hour)
Create a view showing:
```typescript
// Component to show data quality
const DataQualityDashboard = () => {
  // Show:
  // - Total leads: 50
  // - Complete data: 2
  // - Missing data: 48
  // - List of affected leads
}
```

### Task 2: Add Manual Update UI (1.5 hours)
Create interface to paste email content:
```typescript
// Allow user to paste email content
// Send to backend update endpoint
// Re-parse and display results
```

### Task 3: Visual Indicators (30 min)
In lead list and details:
- Red badge for "Missing Data"
- Yellow badge for "Partial Data"
- Green badge for "Complete"
- "Fix Data" button for affected leads

---

## 📋 ORCHESTRATOR TASKS (Me)

### Task 1: Get Email Content from User
Ask user for raw email content for critical leads:
- Daniela Lin (301)
- Other important leads

### Task 2: Coordinate Fix Process
1. Backend creates update script
2. Test with Daniela Lin first
3. Frontend adds UI for manual updates
4. Process remaining leads

### Task 3: Prevent Future Issues
Ensure import process changes are tested

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Immediate Fix (Today)
1. Backend creates manual update script
2. Fix Daniela Lin (301) with provided email
3. Verify all data displays correctly

### Phase 2: Bulk Recovery (Tomorrow)
1. Frontend adds manual update UI
2. User provides email content for important leads
3. Process all affected leads

### Phase 3: Prevention (Future)
1. Fix import process to save raw emails
2. Add Gmail message ID storage
3. Implement automatic re-parsing

---

## 📝 Ready-to-Use Prompts

### For Backend Claude:
```
You're Backend Claude. We have a critical issue: 48 leads are missing data because raw emails weren't saved during import.

Read: /docs/CLAUDE-TASKS-DATA-RECOVERY.md

Your tasks:
1. Create script to manually update leads with email content
2. Fix lead 301 (Daniela Lin) using the email content in the doc
3. Update import process to ALWAYS save raw emails

Start with the manual update script, then fix Daniela's lead.
```

### For Frontend Claude:
```
You're Frontend Claude. We have 48 leads missing data because raw emails weren't saved.

Read: /docs/CLAUDE-TASKS-DATA-RECOVERY.md

Your tasks:
1. Add data quality indicators to lead list
2. Create UI for manual email content updates
3. Show which leads need fixing

Start by adding visual indicators for data quality.
```

---

## ✅ Success Criteria

1. Daniela Lin (301) shows all data correctly
2. Manual update process works for any lead
3. Future imports save raw email content
4. UI clearly shows which leads need attention

---

END OF TASK DELEGATION