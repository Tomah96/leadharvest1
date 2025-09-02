# Frontend Task: Selection UI and Bulk Operations
**Assigned to**: Frontend Claude (Claude 3)
**Priority**: HIGH - Start after backend API ready
**Estimated Time**: 3 hours
**Dependencies**: Backend bulk delete API

## 📋 Task Overview
Implement selection UI with checkboxes, management toolbar, and bulk delete functionality. Fix the display limit to show all 50+ leads.

## ✅ Acceptance Criteria
- [ ] Default display shows 50 leads (not 20)
- [ ] Dropdown to select 20/50/100/All leads
- [ ] Checkbox on each lead card
- [ ] Select All functionality
- [ ] Selected count display
- [ ] Bulk delete with confirmation
- [ ] UI updates after deletion
- [ ] Proper error handling

## 🎨 Implementation Tasks

### 1. Fix Display Limit (15 min)
**File**: `/frontend/src/app/leads/page.tsx`

Change line 29:
```typescript
// OLD
limit: 20,

// NEW
limit: 50,
```

Add limit selector:
```typescript
const [displayLimit, setDisplayLimit] = useState<number | 'all'>(50);

const handleLimitChange = (newLimit: number | 'all') => {
  setDisplayLimit(newLimit);
  setPagination(prev => ({ 
    ...prev, 
    limit: newLimit === 'all' ? 1000 : newLimit,
    page: 1 
  }));
};
```

### 2. Add Selection State (30 min)
**File**: `/frontend/src/app/leads/page.tsx`

Add state management:
```typescript
const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
const [selectAll, setSelectAll] = useState(false);

const handleSelectLead = (leadId: number) => {
  setSelectedLeads(prev => {
    const newSet = new Set(prev);
    if (newSet.has(leadId)) {
      newSet.delete(leadId);
    } else {
      newSet.add(leadId);
    }
    return newSet;
  });
};

const handleSelectAll = () => {
  if (selectAll) {
    setSelectedLeads(new Set());
  } else {
    setSelectedLeads(new Set(leads.map(lead => lead.id)));
  }
  setSelectAll(!selectAll);
};
```

### 3. Update LeadCard Component (30 min)
**File**: `/frontend/src/components/leads/LeadCard.tsx`

Add checkbox to card:
```typescript
interface LeadCardProps {
  lead: Lead;
  onUpdate?: (lead: Lead) => void;
  isSelected?: boolean;
  onSelect?: (leadId: number) => void;
}

export default function LeadCard({ 
  lead, 
  onUpdate, 
  isSelected = false,
  onSelect 
}: LeadCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(lead.id)}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              aria-label={`Select ${lead.first_name} ${lead.last_name}`}
            />
          )}
          
          {/* Rest of lead info */}
          <div className="flex-1">
            {/* Existing lead card content */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4. Create Management Toolbar (1 hour)
**File**: `/frontend/src/components/leads/LeadManagementToolbar.tsx`

```typescript
import { Trash2, Download, RefreshCw, CheckSquare, Square } from 'lucide-react';

interface LeadManagementToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onRefresh: () => void;
  onExport: () => void;
  isAllSelected: boolean;
  displayLimit: number | 'all';
  onLimitChange: (limit: number | 'all') => void;
}

export default function LeadManagementToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeleteSelected,
  onRefresh,
  onExport,
  isAllSelected,
  displayLimit,
  onLimitChange
}: LeadManagementToolbarProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        {/* Left side - Selection controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
          >
            {isAllSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
          
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {selectedCount} selected
              </span>
              
              <button
                onClick={onDeleteSelected}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </button>
            </>
          )}
        </div>

        {/* Right side - Display options */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={displayLimit}
            onChange={(e) => onLimitChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-sm border-gray-300 rounded-md"
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">All</option>
          </select>
          
          <button
            onClick={onExport}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
            title="Export leads"
          >
            <Download className="h-4 w-4" />
          </button>
          
          <button
            onClick={onRefresh}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 5. Add Bulk Delete API Call (20 min)
**File**: `/frontend/src/lib/api-client.ts`

Add to leads object:
```typescript
leads: {
  // ... existing methods
  
  bulkDelete: (ids: number[]) =>
    apiClient.post('/leads/bulk-delete', { ids }),
}
```

### 6. Implement Bulk Delete with Confirmation (30 min)
**File**: `/frontend/src/app/leads/page.tsx`

Add delete handler:
```typescript
const handleBulkDelete = async () => {
  if (selectedLeads.size === 0) return;
  
  const confirmed = window.confirm(
    `Are you sure you want to delete ${selectedLeads.size} lead${selectedLeads.size > 1 ? 's' : ''}?`
  );
  
  if (!confirmed) return;
  
  try {
    setLoading(true);
    const response = await api.leads.bulkDelete(Array.from(selectedLeads));
    
    if (response.data.success) {
      // Show success message
      alert(`Successfully deleted ${response.data.deleted} leads`);
      
      // Clear selection
      setSelectedLeads(new Set());
      setSelectAll(false);
      
      // Refresh leads
      await fetchLeads();
    } else {
      // Handle partial failure
      if (response.data.failed?.length > 0) {
        alert(`Deleted ${response.data.deleted} leads. ${response.data.failed.length} failed.`);
      }
    }
  } catch (error) {
    console.error('Bulk delete error:', error);
    alert('Failed to delete leads. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### 7. Update Main Page Layout (20 min)
**File**: `/frontend/src/app/leads/page.tsx`

Update render:
```typescript
return (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="mt-2 text-gray-600">
          Manage your rental property leads
        </p>
      </div>

      {/* Stats */}
      <LeadStats stats={leadStats} />

      {/* Management Toolbar */}
      <LeadManagementToolbar
        selectedCount={selectedLeads.size}
        totalCount={pagination.total}
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleBulkDelete}
        onRefresh={fetchLeads}
        onExport={() => console.log('Export not implemented')}
        isAllSelected={selectAll}
        displayLimit={displayLimit}
        onLimitChange={handleLimitChange}
      />

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterDropdown filters={selectedFilters} onChange={handleFilterChange} />
      </div>

      {/* Leads Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : leads.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onUpdate={handleLeadUpdated}
              isSelected={selectedLeads.has(lead.id)}
              onSelect={handleSelectLead}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  </div>
);
```

## 🎨 UI/UX Guidelines

### Visual Design
- Checkboxes: Use Tailwind's form plugin for consistent styling
- Selected state: Add subtle blue border to selected cards
- Toolbar: Sticky position when scrolling
- Confirmation: Use modal instead of browser confirm for better UX

### Interaction Patterns
- Single click to select/deselect
- Shift+click for range selection (optional enhancement)
- Show loading state during bulk operations
- Disable buttons during API calls
- Show success toast notifications

### Responsive Design
- Mobile: Stack toolbar buttons vertically
- Tablet: 2-column grid for leads
- Desktop: 3-column grid for leads

## 🧪 Testing Checklist
- [ ] Display limit dropdown works
- [ ] Shows all 50+ leads with "All" option
- [ ] Individual selection works
- [ ] Select All selects visible leads
- [ ] Deselect All clears selection
- [ ] Selected count updates correctly
- [ ] Bulk delete confirmation appears
- [ ] Successful deletion updates UI
- [ ] Error handling for failed deletions
- [ ] Pagination works with new limits
- [ ] Mobile responsive layout

## 📝 TypeScript Types
**File**: `/frontend/src/types/index.ts`

Add types:
```typescript
export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deleted: number;
  failed: number[];
  errors: Array<{
    id: number;
    error: string;
  }>;
}

export interface LeadManagementState {
  selectedLeads: Set<number>;
  selectAll: boolean;
  displayLimit: number | 'all';
}
```

## 🚀 Completion Checklist
- [ ] Display limit fixed (20 → 50)
- [ ] Limit selector dropdown working
- [ ] Checkboxes on all lead cards
- [ ] Select All functionality
- [ ] Management toolbar created
- [ ] Bulk delete API integrated
- [ ] UI updates after operations
- [ ] Error handling complete
- [ ] Mobile responsive
- [ ] Posted completion in AGENT-COMMUNICATION-LOG.md

## 📢 When Complete
Post in AGENT-COMMUNICATION-LOG.md:
```
Frontend UI Complete - Lead Management
- Selection UI: Checkboxes and Select All working
- Display: Shows 50+ leads with limit selector
- Bulk Delete: Integrated with confirmation
- Toolbar: All management actions available
- Ready for integration testing
@Orchestrator please begin testing
```

---
END OF FRONTEND TASKS