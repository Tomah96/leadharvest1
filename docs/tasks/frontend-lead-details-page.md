# Task Assignment: Lead Details Page

**Assigned to**: Claude 2 (Frontend)
**Date**: 2025-01-08
**Priority**: High
**Dependencies**: Backend API endpoint (Claude 3 will handle)

## Objective
Create a minimalistic lead details page that displays comprehensive lead information when clicking on a lead from the leads list.

## Requirements

### 1. Route Setup
- Route: `/leads/[id]`
- Should fetch lead data based on ID from URL
- Use existing API client pattern from `/frontend/lib/api-client/`

### 2. Lead Information to Display

**Header Section**:
- Full name (first_name + last_name)
- Phone number (formatted)
- Email
- Status badge (new/contacted/qualified/closed)

**Property Interest**:
- Property address
- Unit number (if available)
- Inquiry date
- Move-in date

**Financial Information**:
- Credit score (display as range if needed, e.g., "700-750")
- Income (formatted as currency)
- Lease length preference

**Additional Details**:
- Number of occupants
- Pets information
- Source (Zillow/Apartments.com/etc.)
- Any notes

**System Information** (subtle/small):
- Date created
- Last updated
- Gmail message ID (if needed for debugging)

### 3. Design Requirements

**Minimalistic Approach**:
- Clean card-based layout
- Use Tailwind CSS classes consistently
- White background with subtle borders
- Consistent spacing (use p-4, p-6 for padding)
- Typography hierarchy:
  - Name: text-2xl font-semibold
  - Section headers: text-sm font-medium text-gray-500 uppercase
  - Values: text-base text-gray-900

**Layout Structure**:
```
┌──────────────────────────────────┐
│ [Back to Leads]                  │
│                                   │
│ John Smith            [Status]   │
│ (555) 123-4567                   │
│ john@email.com                   │
├──────────────────────────────────┤
│ PROPERTY INTEREST                │
│ 123 Main St, Apt 4B             │
│ Inquiry: Jan 5, 2025            │
│ Move-in: Feb 1, 2025             │
├──────────────────────────────────┤
│ FINANCIAL                        │
│ Credit Score: 720                │
│ Income: $5,000/mo                │
│ Lease: 12 months                 │
├──────────────────────────────────┤
│ ADDITIONAL INFO                  │
│ Occupants: 2                     │
│ Pets: 1 small dog                │
│ Source: Zillow                   │
└──────────────────────────────────┘
```

### 4. Technical Implementation

**File Location**: `/frontend/app/leads/[id]/page.tsx`

**Use Existing Patterns**:
- Check `/frontend/app/leads/page.tsx` for API client usage
- Follow the same error handling pattern
- Use the same loading states
- Maintain consistent styling

**API Call**:
```typescript
const lead = await apiClient.get(`/api/leads/${id}`);
```

### 5. Edge Cases to Handle
- Lead not found (404)
- Missing data fields (show "-" or "Not provided")
- Loading state while fetching
- Error state if API fails

## Definition of Done
- [ ] Lead details page created at `/leads/[id]`
- [ ] All lead information displayed as specified
- [ ] Minimalistic, clean design implemented
- [ ] Loading and error states handled
- [ ] Clicking lead in list navigates to details
- [ ] Back button returns to leads list
- [ ] Responsive on mobile devices
- [ ] Tested with multiple leads

## Communication Protocol

1. **Before Starting**:
   ```bash
   cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md
   tail -50 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md
   ```

2. **Check Existing Code**:
   - Review `/frontend/app/leads/page.tsx` for patterns
   - Check `/frontend/lib/api-client/` for API setup
   - Look at existing components for styling patterns

3. **When Complete**:
   - Update `/docs/ACTIVE-WORK-LOG.md` with your work
   - Update `/docs/progress-reports.md` with completion
   - Note any issues in `/docs/blockers-and-issues.md`

## Notes
- Keep it simple and clean - "Toyota not BMW"
- Don't over-engineer - basic display is the goal
- Reuse existing patterns from the codebase
- Test with the imported Gmail leads to ensure real data displays correctly