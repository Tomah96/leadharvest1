# Task Assignments for Message Templates Feature

## Overview
This document assigns specific tasks to Backend and Frontend Claudes for implementing the message templates feature. Each Claude should update their progress in the ACTIVE-COLLABORATION.md file.

## Backend Claude Tasks

### Priority 1: Database & Infrastructure
1. [ ] **Create database migration for tour_availability field**
   - Add JSONB column to leads table
   - File: `/backend/migrations/002_add_tour_availability.sql`
   - Test migration up and down

2. [ ] **Create message_templates table migration**
   - Create new table with all fields
   - Add updated_at trigger
   - File: `/backend/migrations/003_create_message_templates.sql`

### Priority 2: Tour Date Parser
3. [ ] **Build tour date parser utility**
   - File: `/backend/src/utils/tourDateParser.js`
   - Handle all date/time formats listed in spec
   - Return structured JSON
   - Include confidence scores
   - Write comprehensive unit tests

4. [ ] **Update all 4 email parsers**
   - Update zillowParser.js
   - Update realtorParser.js
   - Update apartmentsParser.js
   - Update rentMarketplaceParser.js
   - Use tourDateParser utility
   - Store results in tour_availability field

### Priority 3: Template API
5. [ ] **Create template service**
   - File: `/backend/src/services/templateService.js`
   - CRUD operations
   - Variable substitution logic
   - Smart tour question generation
   - Acknowledgment text generation

6. [ ] **Create template routes**
   - File: `/backend/src/routes/templateRoutes.js`
   - All CRUD endpoints
   - Preview endpoint
   - Apply template endpoint
   - Input validation

7. [ ] **Add template processing logic**
   - Process all variable types
   - Handle missing data gracefully
   - Generate smart sections dynamically

### Priority 4: Testing
8. [ ] **Write tour date parser tests**
   - File: `/backend/src/utils/__tests__/tourDateParser.test.js`
   - Test all format variations
   - Test edge cases
   - Test timezone handling

9. [ ] **Write API tests**
   - File: `/backend/src/routes/__tests__/templateRoutes.test.js`
   - Test CRUD operations
   - Test variable substitution
   - Test error handling

## Frontend Claude Tasks

### Priority 1: Settings Page
1. [ ] **Create settings/templates page structure**
   - File: `/frontend/src/app/settings/templates/page.tsx`
   - Main page layout
   - Template type selector
   - Save/Load functionality

2. [ ] **Build template editor component**
   - File: `/frontend/src/app/settings/templates/TemplateEditor.tsx`
   - Text area with syntax highlighting
   - Variable insertion on cursor position
   - Drag and drop support
   - Undo/redo functionality

3. [ ] **Implement variable palette**
   - File: `/frontend/src/app/settings/templates/VariablePalette.tsx`
   - Grouped variable buttons
   - Click to insert
   - Hover descriptions
   - Search/filter variables

### Priority 2: Preview & Integration
4. [ ] **Add live preview panel**
   - File: `/frontend/src/app/settings/templates/TemplatePreview.tsx`
   - Split-screen view
   - Real-time updates
   - Sample data generation
   - Highlight unprocessed variables

5. [ ] **Update ConversationWindow**
   - Add template dropdown
   - Load templates by type
   - Apply template on selection
   - Show loading states
   - Allow post-application editing

### Priority 3: API Integration
6. [ ] **Create template API client**
   - Update `/frontend/src/lib/api-client.ts`
   - Add template CRUD methods
   - Add preview method
   - Add apply template method
   - Handle errors gracefully

7. [ ] **Add template state management**
   - Use React Query for caching
   - Optimistic updates
   - Background refetching
   - Error recovery

### Priority 4: Polish & Testing
8. [ ] **Style with Tailwind**
   - Match existing design system
   - Responsive layout
   - Dark mode support
   - Loading skeletons
   - Error states

9. [ ] **Write component tests**
   - Test editor functionality
   - Test variable insertion
   - Test preview generation
   - Test API integration
   - Test error handling

## Integration Points (Both Claudes)

### API Contract
- Backend provides OpenAPI spec
- Frontend generates TypeScript types
- Agree on error format
- Coordinate on variable names

### Testing Coordination
- Backend provides test data
- Frontend uses same test data
- End-to-end testing together
- Performance testing

## Timeline

### Week 1
- Backend: Database, parser, basic API
- Frontend: Settings page, editor
- Integration: API contract agreement

### Week 2
- Backend: Complete API, testing
- Frontend: ConversationWindow, polish
- Integration: E2E testing, bug fixes

## Communication Protocol

1. **Daily Updates**: Update your section in ACTIVE-COLLABORATION.md
2. **Blockers**: Flag immediately in collaboration doc
3. **Questions**: Add to "Questions/Decisions" section
4. **Completion**: Mark tasks complete with timestamp
5. **Testing**: Coordinate on shared test data

## Success Metrics

### Backend Success
- [ ] All parsers extract tour dates
- [ ] API handles all CRUD operations
- [ ] Variable substitution works correctly
- [ ] 90%+ test coverage
- [ ] No performance regression

### Frontend Success
- [ ] Template editor fully functional
- [ ] Live preview updates in real-time
- [ ] ConversationWindow integration seamless
- [ ] Responsive on all screen sizes
- [ ] Accessibility standards met

### Integration Success
- [ ] Templates save and load correctly
- [ ] Variables process with real data
- [ ] No console errors
- [ ] Page load time < 2 seconds
- [ ] All E2E tests passing