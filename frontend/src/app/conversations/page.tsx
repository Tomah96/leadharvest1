"use client";

import { useState, useEffect } from "react";
import { Search, MessageSquare, Users, Filter } from "lucide-react";
import { api } from "@/lib/api-client";
import SearchBar from "@/components/ui/SearchBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import ConversationHistory from "@/components/conversations/ConversationHistory";
import MessageForm from "@/components/conversations/MessageForm";
import { useDebounce } from "@/hooks/useDebounce";
import type { Lead } from "@/types";

export default function ConversationsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchLeads();
  }, [debouncedSearch]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        limit: 100, // Get more leads for conversations
        ...(debouncedSearch && { search: debouncedSearch }),
        // Only get leads that have some contact info for messaging
      };

      const response = await api.leads.getAll(params);
      const filteredLeads = response.data.leads.filter(lead => 
        lead.phone || lead.email
      );
      setLeads(filteredLeads);

      // Auto-select first lead if none selected
      if (!selectedLead && filteredLeads.length > 0) {
        setSelectedLead(filteredLeads[0]);
      }
    } catch (err) {
      setError("Failed to load leads. Please try again.");
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setShowMessageForm(false);
  };

  const fetchMessageCounts = async (leadList: Lead[]) => {
    try {
      // Fetch message counts for all leads in parallel (limit to first 20 for performance)
      const leadsToCheck = leadList.slice(0, 20);
      const countPromises = leadsToCheck.map(async (lead) => {
        try {
          const response = await api.conversations.getStats(lead.id);
          return { leadId: lead.id, count: response.data.total || 0 };
        } catch (err) {
          // Silent fail for individual lead stats
          return { leadId: lead.id, count: 0 };
        }
      });

      const results = await Promise.all(countPromises);
      const counts: Record<string, number> = {};
      results.forEach(({ leadId, count }) => {
        counts[leadId] = count;
      });
      
      setMessageCounts(counts);
    } catch (err) {
      console.error("Error fetching message counts:", err);
    }
  };

  useEffect(() => {
    if (leads.length > 0) {
      fetchMessageCounts(leads);
    }
  }, [leads.length]); // Only depend on length to avoid re-fetching when leads array reference changes

  const handleMessageSent = () => {
    setShowMessageForm(false);
    // Refresh the selected lead's conversation and counts
    if (selectedLead) {
      fetchMessageCounts(leads);
    }
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading conversations..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorAlert 
        message={error} 
        actionText="Try again"
        onAction={() => fetchLeads(1)}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Conversations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage communications with your leads
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{leads.length} leads with contact info</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Leads Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search leads..."
            />
          </div>

          {/* Leads List */}
          <div className="flex-1 overflow-y-auto">
            {leads.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No leads with contact info found</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {leads.map((lead) => {
                  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown";
                  const isSelected = selectedLead?.id === lead.id;

                  return (
                    <button
                      key={lead.id}
                      onClick={() => handleLeadSelect(lead)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium">
                            {fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {fullName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {lead.phone || lead.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {lead.property_address || 'No property specified'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              lead.status === 'new' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                              lead.status === 'contacted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                              lead.status === 'qualified' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                              'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                            }`}>
                              {lead.status}
                            </span>
                            {messageCounts[lead.id] > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
                                {messageCounts[lead.id]} {messageCounts[lead.id] === 1 ? 'message' : 'messages'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className="flex-1 flex flex-col">
          {selectedLead ? (
            <>
              <div className="flex-1">
                <ConversationHistory leadId={selectedLead.id} />
              </div>
              
              {/* Message Form Toggle */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                {showMessageForm ? (
                  <div className="space-y-4">
                    <MessageForm
                      leadId={selectedLead.id}
                      leadEmail={selectedLead.email || undefined}
                      leadPhone={selectedLead.phone || undefined}
                      onMessageSent={handleMessageSent}
                    />
                    <button
                      onClick={() => setShowMessageForm(false)}
                      className="w-full button-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMessageForm(true)}
                    className="w-full button-primary flex items-center justify-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Select a Lead
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a lead from the sidebar to view their conversation history
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}