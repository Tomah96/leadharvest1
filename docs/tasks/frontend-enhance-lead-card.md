# Task Assignment: Enhance Lead Card Display

**Assigned to**: Claude 3 (Frontend)  
**Date**: 2025-01-08
**Priority**: High
**Dependencies**: Backend parsing fixes (Claude 2)

## Problem Statement

Lead details page shows data but needs better presentation:
1. Many fields show "Not provided" (poor UX)
2. No indication of data quality/parsing status
3. Name showing incorrectly due to parsing issues
4. Missing helpful context for empty fields

## Requirements

### 1. Improve Empty State Handling

**Current**: Shows "Not provided" or "Not specified" everywhere
**Needed**: Contextual empty states

```typescript
// Instead of generic "Not provided"
const getEmptyMessage = (field: string) => {
  switch(field) {
    case 'credit_score':
      return 'Not shared yet';
    case 'income':
      return 'To be verified';
    case 'move_in_date':
      return 'Flexible';
    case 'pets':
      return 'Not mentioned';
    default:
      return '—';
  }
};
```

### 2. Add Data Quality Indicators

Show when data needs attention:
```jsx
// If name seems wrong (e.g., contains "RentMarketplace")
{lead.first_name?.includes('RentMarketplace') && (
  <span className="text-amber-500 text-xs ml-2">
    ⚠️ Needs review
  </span>
)}
```

### 3. Enhanced Information Cards

**Contact Card** should show:
- Full name with quality indicator
- Phone (formatted: (555) 123-4567)
- Email with source indicator
- Best time to contact (if available)

**Property Interest Card**:
- Property address prominently
- Move-in timeline (ASAP, specific date, flexible)
- Inquiry date with "X days ago" format
- Unit preferences

**Financial Snapshot Card**:
- Income range if no exact number
- Credit score range (Excellent/Good/Fair)
- Employment status
- Qualification status indicator

**Preferences Card**:
- Occupants with icons (adults/children)
- Pets with details
- Lease term preference
- Special requirements

### 4. Show Original Notes

Add expandable section for raw email content:
```jsx
<details className="mt-4">
  <summary className="cursor-pointer text-sm text-gray-600">
    View original inquiry
  </summary>
  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs">
    {lead.notes}
  </pre>
</details>
```

### 5. Visual Improvements

**Status Pills**:
- Add icons to status (✓ for qualified, 📞 for contacted)
- Animate status changes
- Show last status change time

**Data Completeness Score**:
```jsx
const completeness = calculateCompleteness(lead);
<div className="flex items-center space-x-2">
  <div className="w-32 bg-gray-200 rounded-full h-2">
    <div 
      className="bg-green-500 h-2 rounded-full"
      style={{width: `${completeness}%`}}
    />
  </div>
  <span className="text-sm text-gray-600">
    {completeness}% complete
  </span>
</div>
```

### 6. Quick Actions

Add action buttons where data is missing:
```jsx
{!lead.credit_score && (
  <button className="text-xs text-blue-600 hover:underline">
    Request credit info
  </button>
)}
```

## Implementation Details

### File to Modify
`/frontend/src/app/leads/[id]/page.tsx`

### New Components Needed
1. `DataQualityBadge` - Shows parsing confidence
2. `CompletionMeter` - Shows profile completeness
3. `InfoCard` - Reusable card component
4. `EmptyState` - Better empty field display

### Utility Functions
```typescript
// Format phone numbers
export const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
};

// Calculate days since inquiry
export const daysSince = (date: string) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  return days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} ago`;
};

// Calculate profile completeness
export const calculateCompleteness = (lead: Lead) => {
  const fields = ['first_name', 'last_name', 'phone', 'email', 
                  'credit_score', 'income', 'move_in_date'];
  const filled = fields.filter(f => lead[f]).length;
  return Math.round((filled / fields.length) * 100);
};
```

## Visual Design

```
┌─────────────────────────────────────────┐
│ ← Back         John Smith      [Status] │
│                70% Complete     📝 Edit  │
├─────────────────────────────────────────┤
│ 📱 Contact Information                  │
│ John Smith ⚠️                          │
│ (555) 123-4567                         │
│ john@email.com · via Zillow            │
├─────────────────────────────────────────┤
│ 🏠 Property Interest                   │
│ 123 Main St, Apt 4B                    │
│ Inquired 3 days ago                    │
│ Move-in: ASAP                           │
├─────────────────────────────────────────┤
│ 💰 Financial Overview                  │
│ Income: To be verified [Request]        │
│ Credit: Not shared yet [Request]       │
├─────────────────────────────────────────┤
│ 👥 Household Details                   │
│ Occupants: 2 adults                    │
│ Pets: 1 small dog                      │
│ Lease: 12 months preferred             │
└─────────────────────────────────────────┘
```

## Success Criteria

- [ ] No generic "Not provided" messages
- [ ] Data quality indicators for suspicious values
- [ ] Profile completeness percentage shown
- [ ] Original notes viewable but collapsed
- [ ] Phone numbers properly formatted
- [ ] Dates shown as relative (X days ago)
- [ ] Visual hierarchy improved
- [ ] Action buttons for missing data
- [ ] Mobile responsive

## Communication Protocol

1. **Coordinate with Backend**:
   - Wait for parsing fixes from Claude 2
   - Test with re-parsed data
   
2. **Documentation**:
   - Update ACTIVE-WORK-LOG.md
   - Note any new components created
   - Document utility functions

## Notes

- Keep it clean and minimalistic
- Use existing Tailwind classes
- Don't over-complicate - better empty states are the priority
- Test with leads that have varying amounts of data