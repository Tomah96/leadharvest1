# Frontend Claude - Day 8: Display Gmail-Only Leads

## Overview
Backend will provide leads through memory store. Frontend needs to display them and handle Gmail-only mode gracefully.

## Priority 1: Update Dashboard for Gmail-Only Mode

### Update: `/frontend/src/app/page.tsx`

Add Gmail-only mode detection and messaging:

```typescript
// Add state for Gmail-only mode
const [isGmailOnlyMode, setIsGmailOnlyMode] = useState(false);

// In the API error handler
if (error.response?.data?.message?.includes('Database not configured')) {
  setIsGmailOnlyMode(true);
}

// Add banner when in Gmail-only mode
{isGmailOnlyMode && (
  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <div className="flex items-start space-x-3">
      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
          Gmail-Only Mode Active
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          Running without database. Leads are stored temporarily in memory.
        </p>
        <Link 
          href="/settings/gmail" 
          className="inline-flex items-center text-sm text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 mt-2"
        >
          Import leads from Gmail →
        </Link>
      </div>
    </div>
  </div>
)}
```

## Priority 2: Enhance Leads Page

### Update: `/frontend/src/app/leads/page.tsx`

1. **Add Import Button**:
```typescript
// In the header section
<div className="flex items-center space-x-4">
  <Link
    href="/settings/gmail"
    className="button-primary flex items-center space-x-2"
  >
    <Download className="w-4 h-4" />
    <span>Import from Gmail</span>
  </Link>
  <button className="button-secondary">
    Add Lead Manually
  </button>
</div>
```

2. **Handle Placeholder Phones**:
```typescript
// In LeadRow component
const isPlaceholderPhone = lead.phone === '9999999999';

{isPlaceholderPhone ? (
  <span className="text-yellow-600 dark:text-yellow-400 flex items-center space-x-1">
    <AlertCircle className="w-3 h-3" />
    <span>Phone needed</span>
  </span>
) : (
  <span>{lead.phone}</span>
)}
```

## Priority 3: Create Quick Edit Modal

### Create: `/frontend/src/components/leads/QuickEditPhone.tsx`

```typescript
import { useState } from "react";
import { Phone } from "lucide-react";
import { api } from "@/lib/api-client";

interface QuickEditPhoneProps {
  lead: Lead;
  onUpdate: (updatedLead: Lead) => void;
  onClose: () => void;
}

export default function QuickEditPhone({ lead, onUpdate, onClose }: QuickEditPhoneProps) {
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!phone.match(/^\d{3}-?\d{3}-?\d{4}$/)) {
      setError("Please enter a valid phone number (XXX-XXX-XXXX)");
      return;
    }

    setSaving(true);
    try {
      const response = await api.leads.update(lead.id, { phone });
      onUpdate(response.data);
      onClose();
    } catch (err) {
      setError("Failed to update phone number");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Add Phone Number</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Lead: {lead.first_name} {lead.last_name}
          </p>
          {lead.property && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Property: {lead.property}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="XXX-XXX-XXXX"
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-error mt-1">{error}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="button-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="button-primary"
            disabled={saving || !phone}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Priority 4: Add Import Success Flow

### Update: `/frontend/src/app/settings/gmail/page.tsx`

After successful import, redirect to leads page:

```typescript
// In ImportControls onImportComplete
onImportComplete={(result) => {
  addLog(`Import complete: ${result.parsed}/${result.imported} emails parsed`);
  
  // Show success message
  if (result.parsed > 0) {
    setTimeout(() => {
      router.push('/leads?imported=true');
    }, 2000);
  }
}}
```

### Update: `/frontend/src/app/leads/page.tsx`

Show success banner after import:

```typescript
// Check for import success
const searchParams = useSearchParams();
const justImported = searchParams.get('imported') === 'true';

{justImported && (
  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
    <div className="flex items-center space-x-3">
      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      <div>
        <p className="font-medium text-green-800 dark:text-green-200">
          Leads imported successfully!
        </p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Click on any lead with "Phone needed" to add their phone number.
        </p>
      </div>
    </div>
  </div>
)}
```

## Priority 5: Add Stats Widget

### Create: `/frontend/src/components/leads/LeadStats.tsx`

```typescript
interface LeadStatsProps {
  stats: {
    total: number;
    needsPhone: number;
    bySource: Record<string, number>;
  };
}

export default function LeadStats({ stats }: LeadStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="card p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      
      <div className="card p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Need Phone</p>
        <p className="text-2xl font-bold text-yellow-600">{stats.needsPhone}</p>
      </div>
      
      <div className="card p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Zillow</p>
        <p className="text-2xl font-bold">{stats.bySource.zillow || 0}</p>
      </div>
      
      <div className="card p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Realtor</p>
        <p className="text-2xl font-bold">{stats.bySource.realtor || 0}</p>
      </div>
    </div>
  );
}
```

## Testing Flow

1. Import emails from Gmail settings
2. Get redirected to leads page
3. See success banner
4. View all imported leads
5. Click on leads with "Phone needed"
6. Add real phone numbers
7. See stats update in real-time

## Success Criteria

1. Leads display without database errors
2. Clear indication of Gmail-only mode
3. Easy phone number updates for placeholder phones
4. Import → View → Edit workflow is smooth
5. Stats show accurate counts