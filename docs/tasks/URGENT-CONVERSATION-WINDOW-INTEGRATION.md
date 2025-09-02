# URGENT: Conversation Window Integration
**Date**: 2025-08-27 18:10
**Status**: NOT IMPLEMENTED - Frontend unchanged
**Priority**: P0 - User waiting

## Current Problem
Claude 2 and 3 claimed they implemented the conversation window, but the UI is completely unchanged:
- Still showing old Quick Actions sidebar
- Still showing broken "-1 days ago" 
- No conversation window visible
- No Email/Text tabs
- Layout not redesigned

## Screenshot Evidence
User's screenshot shows:
- "Inquired -1 days ago" (BROKEN)
- Old layout with Quick Actions sidebar
- Inquiry message in a card (not conversation format)
- No conversation window integration

## What Actually Exists
1. `/frontend/src/components/conversations/ConversationWindow.tsx` - Component created but NOT USED
2. Backend properly returns null for pets/occupants
3. Inquiry message captured in notes field

## IMMEDIATE TASKS REQUIRED

### For Frontend Developer:

#### 1. Fix the date display (5 minutes)
File: `/frontend/src/app/leads/[id]/page.tsx`

Find around line 89:
```typescript
if (days < 7) return `${days} days ago`;
```

REPLACE the entire daysSince function with:
```typescript
const daysSince = (date: string | null) => {
  // Don't show relative time - return empty string
  return '';
};
```

And where it shows "Inquired X days ago", change to show absolute date:
```typescript
// Instead of:
<span>Inquired {daysSince(lead.inquiry_date)}</span>

// Use:
<span>{formatInquiryDateTime(lead.inquiry_date)}</span>
```

#### 2. Replace Quick Actions with ConversationWindow (30 minutes)

REMOVE the entire Quick Actions section and REPLACE with:
```tsx
import { ConversationWindow } from '@/components/conversations/ConversationWindow';

// In the JSX, replace Quick Actions card with:
<ConversationWindow 
  leadId={lead.id}
  initialInquiry={{
    content: lead.notes,
    date: lead.inquiry_date
  }}
/>
```

#### 3. Redesign Layout (15 minutes)

Change the layout from side-by-side to top-bottom:
```tsx
// Current structure (REMOVE):
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">...</div>
  <div className="lg:col-span-1">Quick Actions</div>
</div>

// New structure (ADD):
<div className="space-y-4">
  {/* Compact lead info at top */}
  <div className="bg-white p-4 rounded-lg shadow">
    <h1>{lead.first_name} {lead.last_name}</h1>
    <div>Phone • Status • Property • Move-in date</div>
  </div>
  
  {/* Full width conversation below */}
  <ConversationWindow ... />
</div>
```

## Expected Result
- NO relative time display
- Absolute date format: "August 27, 2025 at 4:37 PM"
- Full width conversation window with Email/Text tabs
- Inquiry message as first item in conversation
- Compact lead info at top

## Testing
1. Navigate to http://localhost:3002/leads/648
2. Should see conversation window, not Quick Actions
3. Should see absolute date, not "-1 days ago"
4. Should see Email/Text tabs

## DO NOT:
- Create new components
- Over-engineer the solution  
- Add features not requested
- Leave the old UI in place

## Timeline
This should take 50 minutes maximum. The component already exists, just needs integration.