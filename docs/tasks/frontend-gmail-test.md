# Frontend Gmail Test Tasks - Claude 3

Date: 2025-07-17  
Priority: Build Gmail test interface for parser verification

## 🔴 Task 1: Update Test Gmail Page

**File**: `/frontend/src/app/test/gmail/page.tsx`

Replace or enhance the current test page with:

```typescript
"use client";

import { useState } from "react";
import { Search, Download, Loader2, Mail } from "lucide-react";
import { api } from "@/lib/api-client";
import ConsoleOutput from "@/components/gmail/ConsoleOutput";

export default function TestGmailPage() {
  const [labelName, setLabelName] = useState("processed-lead");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const searchLabel = async () => {
    addLog(`Searching for label "${labelName}"...`);
    
    try {
      const response = await api.gmail.searchLabel(labelName);
      setSearchResult(response.data);
      
      if (response.data.emailCount > 0) {
        addLog(`✅ Found ${response.data.emailCount} emails with label "${labelName}"`);
      } else {
        addLog(`❌ No emails found with label "${labelName}"`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const importEmails = async (count: number) => {
    if (!searchResult?.labelId) return;
    
    setImporting(true);
    addLog(`\nImporting ${count} emails from "${labelName}"...`);
    
    try {
      const response = await api.gmail.importEmails({
        labelId: searchResult.labelId,
        labelName: labelName,
        maxResults: count
      });
      
      // Log to browser console as expandable objects
      console.log('=== Gmail Import Results ===', {
        label: response.data.labelName,
        summary: {
          total: response.data.results.total,
          successful: response.data.results.successful,
          failed: response.data.results.failed
        },
        emails: response.data.results.leads
      });
      
      // Log each email separately for easier inspection
      response.data.results.leads.forEach((email, index) => {
        console.log(`📧 Email ${index + 1}/${response.data.results.total}:`, {
          metadata: {
            subject: email.subject,
            from: email.from,
            date: email.date,
            source: email.source,
            status: email.parseStatus
          },
          parsedData: email.parsedData,
          error: email.error,
          rawEmail: email.rawEmail
        });
      });
      
      // Summary in UI console
      addLog(`\n✅ Import Complete!`);
      addLog(`- Total: ${response.data.results.total}`);
      addLog(`- Successfully parsed: ${response.data.results.successful}`);
      addLog(`- Failed: ${response.data.results.failed}`);
      addLog(`\n⚠️ Check browser console (F12) for detailed results`);
      
    } catch (error) {
      addLog(`❌ Import failed: ${error.message}`);
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setConsoleLogs([]);
    console.clear();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Gmail Parser Test</h1>
      
      {/* Label Search Section */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Step 1: Search for Gmail Label</h2>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={labelName}
            onChange={(e) => setLabelName(e.target.value)}
            placeholder="Enter Gmail label..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={searchLabel}
            className="button-primary flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
        
        {searchResult && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm">
              Found <span className="font-bold">{searchResult.emailCount}</span> emails 
              with label "<span className="font-mono">{labelName}</span>"
            </p>
          </div>
        )}
      </div>

      {/* Import Options */}
      {searchResult?.emailCount > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Step 2: Import Test Emails</h2>
          
          <div className="flex gap-3">
            {[3, 5, 10].map(count => (
              <button
                key={count}
                onClick={() => importEmails(count)}
                disabled={importing || searchResult.emailCount < count}
                className={`
                  button-secondary flex items-center gap-2
                  ${searchResult.emailCount < count ? 'opacity-50' : ''}
                `}
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Import {count}
              </button>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 mt-3">
            Import a small batch to test email parsing. Results will appear in browser console.
          </p>
        </div>
      )}

      {/* Console Output */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Console Output</h2>
          <button
            onClick={clearLogs}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4">
          <ConsoleOutput logs={consoleLogs} maxHeight="300px" />
        </div>
        
        <p className="text-sm text-gray-600 mt-3">
          💡 Press F12 to open browser console for detailed, expandable results
        </p>
      </div>
    </div>
  );
}
```

## 🔴 Task 2: Update API Client

**File**: `/frontend/src/lib/api-client.ts`

Add/update methods:

```typescript
gmail: {
  // ... existing methods ...
  
  searchLabel: (query: string) => 
    apiClient.get<LabelSearchResponse>(`/gmail/search-label?query=${query}`),
  
  importEmails: (data: ImportEmailsRequest) =>
    apiClient.post<ImportTestResult>("/gmail/import-emails", data),
}
```

## 🔴 Task 3: Add Type Definitions

**File**: `/frontend/src/types/index.ts`

Add new types:

```typescript
export interface LabelSearchResponse {
  query: string;
  matchingLabels: GmailLabel[];
  emailCount: number;
  labelId: string;
  found: boolean;
}

export interface ImportEmailsRequest {
  labelId: string;
  labelName: string;
  maxResults: number;
}

export interface ImportTestResult {
  success: boolean;
  labelName: string;
  results: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    leads: ParsedEmail[];
  };
}

export interface ParsedEmail {
  emailId: string;
  subject: string;
  from: string;
  date: string;
  source: string;
  parseStatus: 'success' | 'failed';
  parsedData?: ParsedLead;
  error?: string;
  rawEmail: {
    subject: string;
    body: string;
  };
}

export interface ParsedLead {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  property_address?: string;
  move_in_date?: string;
  credit_score?: number;
  income?: string;
  occupants?: number;
  pets?: string;
  lease_length?: string;
  missing_info?: string[];
}
```

## 🎯 Expected Browser Console Output

When user imports 3 emails, they'll see in browser console:

```javascript
=== Gmail Import Results ===
{
  label: "processed-lead",
  summary: {
    total: 3,
    successful: 2,
    failed: 1
  },
  emails: [...]  // Expandable array
}

📧 Email 1/3:
{
  metadata: {
    subject: "New Lead from Zillow - 3 bed 2 bath",
    from: "noreply@zillow.com",
    date: "2024-01-15",
    source: "zillow",
    status: "success"
  },
  parsedData: {
    first_name: "John",
    last_name: "Doe",
    phone: "555-123-4567",
    email: "john.doe@email.com",
    property_address: "123 Main St",
    credit_score: 750,
    missing_info: []
  },
  error: null,
  rawEmail: {
    subject: "...",
    body: "..."
  }
}

📧 Email 2/3:
// ... similar structure
```

## Testing Flow

1. Go to `/test/gmail`
2. Enter label name (default: "processed-lead")
3. Click Search → See email count
4. Click "Import 3" → See logs in UI console
5. Press F12 → See detailed objects in browser console
6. Expand objects to inspect parsed data

This gives the user exactly what they need to verify parsers are working correctly!