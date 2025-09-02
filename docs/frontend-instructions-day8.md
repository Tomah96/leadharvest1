# Frontend Instructions for Claude 3 - Day 8

## 🟢 You Can Start Immediately!
The frontend changes don't depend on the database migration, so you can begin right away.

## Your Mission
Update the frontend to display and handle the new property fields (property_address, unit, lease_length).

## Task 1: Update TypeScript Types
**File:** `/frontend/src/types/index.ts`

Add these fields to the Lead interface:
```typescript
export interface Lead {
  id: string;
  // ... existing fields ...
  
  // Add these new fields:
  property_address?: string;  // Full property address
  unit?: string;              // Unit/Apartment number
  lease_length?: number;       // Lease duration in months
  
  // These still exist:
  occupants?: number;
  pets?: boolean;
  
  // Remove if present (don't exist in DB):
  // property?: string;  // Use property_address instead
  // missing_info?: string[];  // Frontend-only calculation
  // parsing_errors?: string[];  // Not stored in DB
}
```

## Task 2: Update Lead Display Components

### A. Lead Card Component
**File:** `/frontend/src/components/leads/LeadCard.tsx`

Update to show property with unit:
```tsx
// Display property address with unit
<div className="text-sm text-gray-600">
  <Home className="inline w-4 h-4 mr-1" />
  {lead.property_address}
  {lead.unit && ` Unit ${lead.unit}`}
</div>

// Show lease length if available
{lead.lease_length && (
  <span className="text-xs text-gray-500">
    Lease: {lead.lease_length} months
  </span>
)}
```

### B. Lead Details Component
**File:** `/frontend/src/components/leads/LeadDetails.tsx`

Add new fields to the details view:
```tsx
// Property Information Section
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium text-gray-500">Property Address</label>
    <p className="mt-1">{lead.property_address || 'Not provided'}</p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Unit</label>
    <p className="mt-1">{lead.unit || 'N/A'}</p>
  </div>
</div>

// Lease Information
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium text-gray-500">Lease Length</label>
    <p className="mt-1">{lead.lease_length ? `${lead.lease_length} months` : 'Not specified'}</p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Occupants</label>
    <p className="mt-1">{lead.occupants || 'Not specified'}</p>
  </div>
</div>
```

## Task 3: Update Import Review Component
**File:** `/frontend/src/components/gmail/ImportReview.tsx`

Display parsed property and unit:
```tsx
// Around line 225-230, update property display
<div className="flex items-center space-x-3">
  <Home className="w-4 h-4 text-gray-400" />
  <div>
    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Property</p>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      {currentLead.property_address || 'Not provided'}
      {currentLead.unit && (
        <span className="ml-1 font-medium">Unit {currentLead.unit}</span>
      )}
    </p>
  </div>
</div>

// Add lease length display
{currentLead.lease_length && (
  <div className="flex items-center space-x-3">
    <Calendar className="w-4 h-4 text-gray-400" />
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Lease Length</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {currentLead.lease_length} months
      </p>
    </div>
  </div>
)}
```

## Task 4: Update Lead Form
**File:** `/frontend/src/components/leads/LeadForm.tsx`

Add input fields for new properties:
```tsx
// Property Address field (replace property field if exists)
<div>
  <label className="block text-sm font-medium text-gray-700">
    Property Address
  </label>
  <input
    type="text"
    name="property_address"
    value={formData.property_address || ''}
    onChange={handleChange}
    className="mt-1 block w-full rounded-md border-gray-300"
    placeholder="123 Main Street"
  />
</div>

// Unit field
<div>
  <label className="block text-sm font-medium text-gray-700">
    Unit/Apartment
  </label>
  <input
    type="text"
    name="unit"
    value={formData.unit || ''}
    onChange={handleChange}
    className="mt-1 block w-full rounded-md border-gray-300"
    placeholder="2B"
  />
</div>

// Lease Length field
<div>
  <label className="block text-sm font-medium text-gray-700">
    Lease Length (months)
  </label>
  <input
    type="number"
    name="lease_length"
    value={formData.lease_length || ''}
    onChange={handleChange}
    className="mt-1 block w-full rounded-md border-gray-300"
    placeholder="12"
    min="1"
    max="24"
  />
</div>
```

## Task 5: Update API Client
**File:** `/frontend/src/lib/api-client.ts`

Ensure the API client handles new fields:
```typescript
// In the lead interfaces/types
interface LeadData {
  // ... existing fields ...
  property_address?: string;
  unit?: string;
  lease_length?: number;
  // Remove: property, missing_info, parsing_errors
}
```

## Task 6: Update Progress Tracking

After each task, update `/docs/collaboration-status-day8.md`:

```markdown
### 🟢 Claude 3 (Frontend) - IN PROGRESS

✅ **Completed:**
- [ ] Updated TypeScript types
- [ ] Updated LeadCard component
- [ ] Updated LeadDetails component
- [ ] Updated ImportReview component
- [ ] Updated LeadForm component
- [ ] Updated API client

🔧 **Current Task:**
[What you're working on now]

📝 **Notes:**
[Any UI/UX improvements or issues]
```

## Testing Your Changes

1. **Type Safety:** Run TypeScript compiler
```bash
cd /frontend
npm run type-check
```

2. **Component Display:** Start dev server
```bash
npm run dev
```

3. **Test These Flows:**
- View lead list - property shows with unit
- Open lead details - new fields display
- Edit a lead - new form fields work
- Import preview - shows extracted units

## UI/UX Guidelines

1. **Property Display Format:**
   - With unit: "123 Main St Unit 2B"
   - Without unit: "123 Main St"

2. **Empty States:**
   - Property: "No property specified"
   - Unit: "N/A" or just omit
   - Lease Length: "Not specified"

3. **Icons to Use:**
   - Property: `Home` icon
   - Unit: `Hash` or `Building` icon
   - Lease: `Calendar` icon
   - Occupants: `Users` icon

## Communication Protocol

1. **Check status:** Review `/docs/collaboration-status-day8.md` regularly
2. **Update progress:** Every time you complete a component
3. **Report blockers:** If you need backend changes
4. **Coordinate:** With Claude 2 on API contract

## Expected Outcome

After your changes:
- ✅ Leads display property address and unit separately
- ✅ Forms can edit all new fields
- ✅ Import review shows parsed units
- ✅ Type safety with new fields
- ✅ Clean UI with proper empty states

## Common Issues & Solutions

**Issue:** TypeScript errors about missing fields
**Solution:** Update the Lead interface in types/index.ts

**Issue:** Property not displaying
**Solution:** Check if using property_address instead of property

**Issue:** Unit showing as "undefined"
**Solution:** Add null checks: `{lead.unit || ''}`

---
*Created by: Claude 1 (Orchestrator)*
*For: Claude 3 (Frontend Engineer)*
*Date: 2025-08-08*