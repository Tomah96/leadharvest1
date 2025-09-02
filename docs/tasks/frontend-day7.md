# Frontend Claude - Day 7 Tasks

## Priority 1: Add Manual Lead Entry Form

Since many imported emails are missing phone numbers, we need a way to manually add/edit lead information.

### Task 1: Create Lead Edit Modal
**File**: `/frontend/src/components/leads/LeadEditModal.tsx`

Create a modal that allows editing lead details:
- Shows all lead fields
- Highlights missing required fields (phone)
- Can be triggered from lead table or lead details page

```typescript
interface LeadEditModalProps {
  lead: Partial<Lead>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => Promise<void>;
}

// Key fields to include:
// - first_name, last_name
// - phone (required, with validation)
// - email
// - property_address
// - move_in_date
// - credit_score (dropdown with ranges)
// - income
// - occupants, pets
```

### Task 2: Add "Needs Review" Badge

For leads imported without phone numbers:

**File**: `/frontend/src/components/leads/LeadRow.tsx`

Add visual indicator for incomplete leads:
```typescript
{!lead.phone && (
  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
    <AlertCircle className="w-3 h-3 mr-1" />
    Needs Phone
  </span>
)}
```

### Task 3: Enhance Import Results Display

**File**: `/frontend/src/components/gmail/ImportControls.tsx`

Add a detailed results modal after import:
1. Show successfully parsed leads
2. Show leads needing review (missing phone)
3. Allow quick edit of missing data
4. Provide "Review All" button

## Priority 2: Create Import Review Page

### New Page: `/frontend/src/app/import-review/page.tsx`

A dedicated page for reviewing imported leads that need information:

Features:
- List all leads with missing required fields
- Bulk edit capabilities
- Quick phone number entry
- Mark as "reviewed" after updating
- Filter by source (Zillow, Realtor, etc.)

## Priority 3: Improve Console Output Formatting

### Update: `/frontend/src/components/gmail/ConsoleOutput.tsx`

Make the console output more actionable:

```typescript
// Add parsing summary section
const renderParsingSummary = (results: ImportResult) => {
  const needsReview = results.results.filter(r => !r.data?.phone);
  
  return (
    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
        Import Summary
      </h4>
      <ul className="mt-2 text-sm space-y-1">
        <li>✅ {results.parsed} leads fully parsed</li>
        <li>⚠️ {needsReview.length} leads need phone numbers</li>
        <li>❌ {results.imported - results.parsed} failed to parse</li>
      </ul>
      {needsReview.length > 0 && (
        <button className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 dark:text-yellow-300">
          Review incomplete leads →
        </button>
      )}
    </div>
  );
};
```

## Priority 4: Add Quick Actions Menu

### Update: `/frontend/src/components/ui/QuickActions.tsx`

Add a floating action button for common tasks:
- Import from Gmail
- Add lead manually
- Review incomplete leads
- View recent imports

## Testing Checklist

After implementation:
1. Import emails and see clear indication of missing data
2. Can edit lead to add missing phone number
3. Review page shows all incomplete leads
4. Console provides actionable next steps
5. UI clearly indicates lead completeness status

## Success Criteria

1. Users can easily identify leads missing phone numbers
2. Quick edit modal allows fixing missing data
3. Import review workflow is intuitive
4. Console output guides users on next steps
5. No confusion about why leads aren't showing up

## Design Guidelines

- Use yellow/warning colors for "needs review" states
- Make phone number field prominent in edit forms
- Show progress indicators (X of Y leads complete)
- Provide bulk actions where possible
- Keep the workflow smooth and intuitive