"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, RefreshCw, Database, Download, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LeadCard from "@/components/leads/LeadCard";
import LeadStats from "@/components/leads/LeadStats";
import LeadManagementToolbar from "@/components/leads/LeadManagementToolbar";
import SearchBar from "@/components/ui/SearchBar";
import FilterDropdown from "@/components/ui/FilterDropdown";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import Modal from "@/components/ui/Modal";
import LeadForm from "@/components/leads/LeadForm";
import { api } from "@/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { useDatabaseStatus } from "@/hooks/useDatabaseStatus";
import type { Lead, LeadQueryParams } from "@/types";

export default function LeadsPage() {
  const { isDatabaseAvailable } = useDatabaseStatus();
  const searchParams = useSearchParams();
  const justImported = searchParams.get('imported') === 'true';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    status: "all",
    source: "all",
    missingInfo: false
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leadStats, setLeadStats] = useState({
    total: 0,
    needsPhone: 0,
    bySource: { zillow: 0, realtor: 0, apartments: 0, rentmarketplace: 0 }
  });

  // Selection state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [displayLimit, setDisplayLimit] = useState<number | 'all'>(50);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch leads from API
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: LeadQueryParams = {
        page: pagination.page,
        limit: displayLimit === 'all' ? 1000 : displayLimit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedFilters.status !== "all" && { status: selectedFilters.status }),
        ...(selectedFilters.source !== "all" && { source: selectedFilters.source }),
        ...(selectedFilters.missingInfo && { missingInfo: true })
      };

      const response = await api.leads.getAll(params);
      setLeads(response.data.leads || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
      });

      // Calculate stats
      const allLeads = response.data.leads || [];
      const needsPhone = allLeads.filter(lead => !lead.phone || lead.phone === '9999999999').length;
      const bySource = allLeads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setLeadStats({
        total: allLeads.length,
        needsPhone,
        bySource
      });
    } catch (err) {
      setError("Failed to load leads. Please try again.");
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, displayLimit, debouncedSearch, selectedFilters]);

  // Fetch leads when filters or display limit change
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, displayLimit]);

  // Show warning if loading takes too long
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setShowSlowWarning(false);
      timer = setTimeout(() => {
        if (loading) {
          setShowSlowWarning(true);
        }
      }, 30000); // 30 seconds
    } else {
      setShowSlowWarning(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Polling for new leads
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchLeads();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchLeads, loading]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (filterType: string, value: string | boolean) => {
    setSelectedFilters(prev => ({ ...prev, [filterType]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleLeadCreated = () => {
    setShowCreateModal(false);
    fetchLeads(); // Refresh the list
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    // Update the specific lead in the list
    setLeads(prevLeads => {
      const newLeads = prevLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      );

      // Recalculate stats
      const needsPhone = newLeads.filter(lead => !lead.phone || lead.phone === '9999999999').length;
      const bySource = newLeads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setLeadStats({
        total: newLeads.length,
        needsPhone,
        bySource
      });

      return newLeads;
    });
  };

  // Selection handlers
  const handleSelectLead = (leadId: string) => {
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

  // Display limit handler
  const handleLimitChange = (newLimit: number | 'all') => {
    setDisplayLimit(newLimit);
    setPagination(prev => ({ 
      ...prev, 
      limit: newLimit === 'all' ? 1000 : newLimit,
      page: 1 
    }));
  };

  // Bulk delete handler
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

  // Note: Removed database unavailable block - now works with in-memory storage

  return (
    <div>
      {/* Gmail-only mode banner */}
      {!isDatabaseAvailable && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Database className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Gmail-Only Mode Active
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Leads are stored temporarily in memory. Data will be lost when the server restarts.
              </p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <a 
                  href="/settings/gmail" 
                  className="inline-flex items-center gap-1 text-yellow-800 dark:text-yellow-200 hover:underline"
                >
                  Import more emails
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import success banner */}
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

      {/* Page Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and track your property rental leads
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="button-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Lead Manually</span>
        </button>
      </div>

      {/* Lead Stats */}
      <LeadStats stats={leadStats} />

      {/* Management Toolbar */}
      <LeadManagementToolbar
        selectedCount={selectedLeads.size}
        totalCount={pagination.total}
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleBulkDelete}
        onRefresh={fetchLeads}
        isAllSelected={selectAll}
        displayLimit={displayLimit}
        onLimitChange={handleLimitChange}
        loading={loading}
      />

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, phone, email, or address..."
          />
        </div>
        <div className="flex gap-2">
          <FilterDropdown
            label="Status"
            value={selectedFilters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[
              { label: "All", value: "all" },
              { label: "New", value: "new" },
              { label: "Contacted", value: "contacted" },
              { label: "Qualified", value: "qualified" },
              { label: "Closed", value: "closed" }
            ]}
          />
          <FilterDropdown
            label="Source"
            value={selectedFilters.source}
            onChange={(value) => handleFilterChange('source', value)}
            options={[
              { label: "All", value: "all" },
              { label: "Zillow", value: "zillow" },
              { label: "Realtor.com", value: "realtor" },
              { label: "Apartments.com", value: "apartments" },
              { label: "RentMarketplace", value: "rentmarketplace" }
            ]}
          />
          <button 
            className={`button-secondary flex items-center space-x-2 ${
              selectedFilters.missingInfo ? "bg-warning/10 text-warning border-warning" : ""
            }`}
            onClick={() => handleFilterChange('missingInfo', !selectedFilters.missingInfo)}
          >
            <Filter className="w-4 h-4" />
            <span>Missing Info</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading && leads.length === 0 ? (
        <div className="space-y-4">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
          </div>
          
          {/* Slow loading warning */}
          {showSlowWarning && (
            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    This is taking longer than usual
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    The server is processing your request. This can take up to 2 minutes during high load.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : error ? (
        <ErrorAlert 
          message={error} 
          actionText="Try again"
          onAction={fetchLeads}
        />
      ) : leads.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No leads found. Try adjusting your filters or search criteria.
          </p>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {leads.length} of {pagination.total} leads
          </div>

          {/* Leads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                onUpdate={handleLeadUpdated}
                isSelected={selectedLeads.has(lead.id)}
                onSelect={handleSelectLead}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.page;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        isActive 
                          ? "bg-primary-600 text-white" 
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {pagination.pages > 5 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Create Lead Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Lead"
        size="lg"
      >
        <LeadForm
          onSuccess={handleLeadCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}