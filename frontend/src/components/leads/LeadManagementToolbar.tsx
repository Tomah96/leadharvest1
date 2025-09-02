import { Trash2, Download, RefreshCw, CheckSquare, Square, Mail } from 'lucide-react';
import Link from 'next/link';

interface LeadManagementToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onRefresh: () => void;
  onExport?: () => void;
  isAllSelected: boolean;
  displayLimit: number | 'all';
  onLimitChange: (limit: number | 'all') => void;
  loading?: boolean;
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
  onLimitChange,
  loading = false
}: LeadManagementToolbarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left side - Selection controls and actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Select All Checkbox */}
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            disabled={loading}
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
          
          {/* Selected count and actions */}
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {selectedCount} selected
              </span>
              
              <button
                onClick={onDeleteSelected}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </button>
            </>
          )}

          {/* Import from Gmail Link */}
          <Link
            href="/settings/gmail"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <Mail className="h-4 w-4" />
            Import from Gmail
          </Link>
        </div>

        {/* Right side - Display options */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
          <select
            value={displayLimit}
            onChange={(e) => onLimitChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">All</option>
          </select>
          
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Export leads"
              disabled={loading}
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={onRefresh}
            className={`p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors ${
              loading ? 'animate-spin' : ''
            }`}
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile-friendly info row */}
      {totalCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          Showing {displayLimit === 'all' ? totalCount : Math.min(displayLimit as number, totalCount)} of {totalCount} total leads
        </div>
      )}
    </div>
  );
}