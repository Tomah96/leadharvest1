"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock,
  AlertCircle,
  Database,
  Mail
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useApi } from "@/hooks/useApi";
import type { Lead, PaginatedResponse } from "@/types";

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
}

export default function Home() {
  const { data: leadsData, loading, error, execute: fetchLeads } = useApi<PaginatedResponse<Lead>>(
    () => api.leads.getAll({ limit: 4 })
  );
  
  const [isDatabaseDown, setIsDatabaseDown] = useState(false);
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: "Total Leads",
      value: "-",
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: "New This Week",
      value: "-",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      title: "Active Conversations",
      value: "-",
      icon: <MessageSquare className="w-5 h-5" />
    },
    {
      title: "Avg Response Time",
      value: "-",
      icon: <Clock className="w-5 h-5" />,
    }
  ]);

  // Fetch leads on component mount
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Check if error is database-related
  useEffect(() => {
    if (error) {
      // Check if it's a database error or Gmail-only mode
      const isDbError = error.toLowerCase().includes('database') || 
                       error.toLowerCase().includes('service unavailable') ||
                       error.toLowerCase().includes('database not configured') ||
                       (error as any).isDatabaseError;
      setIsDatabaseDown(isDbError);
    } else {
      setIsDatabaseDown(false);
    }
  }, [error]);

  // Update stats when data is available
  useEffect(() => {
    if (leadsData) {
      const totalLeads = leadsData?.pagination?.total || 0;
      
      // Calculate new leads this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // For now, use the already fetched leads for stats
      // In production, this should be a dedicated stats endpoint
      const newThisWeek = leadsData?.leads?.filter(lead => 
        new Date(lead.created_at) >= oneWeekAgo
      ).length || 0;
      
      setStats([
        {
          title: "Total Leads",
          value: totalLeads,
          icon: <Users className="w-5 h-5" />,
        },
        {
          title: "New This Week",
          value: newThisWeek,
          icon: <TrendingUp className="w-5 h-5" />,
        },
        {
          title: "Active Conversations",
          value: "0", // Placeholder - would need conversations endpoint
          icon: <MessageSquare className="w-5 h-5" />
        },
        {
          title: "Avg Response Time",
          value: "N/A", // Placeholder - would need metrics endpoint
          icon: <Clock className="w-5 h-5" />,
        }
      ]);
    }
  }, [leadsData]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than 1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  const getStatusColor = (status: Lead["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "contacted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "qualified":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (error && !isDatabaseDown) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button 
            onClick={() => fetchLeads()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome to LeadHarvest CRM - Your property rental lead management system
        </p>
      </div>

      {/* Gmail-only mode banner */}
      {isDatabaseDown && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                Gmail-Only Mode Active
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Running without database. Leads are stored temporarily in memory.
              </p>
              <a 
                href="/settings/gmail" 
                className="inline-flex items-center text-sm text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 mt-2"
              >
                Import leads from Gmail →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
        {stats.map((stat) => (
          <div key={stat.title} className={`card ${isDatabaseDown ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : isDatabaseDown ? (
                    "N/A"
                  ) : (
                    stat.value
                  )}
                </div>
                {stat.change && (
                  <p className={`text-sm mt-2 ${
                    stat.trend === "up" ? "text-success" : "text-error"
                  }`}>
                    {stat.change} from last month
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${
                stat.trend === "up" 
                  ? "bg-success/10 text-success" 
                  : stat.trend === "down"
                  ? "bg-error/10 text-error"
                  : "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
              }`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`card ${isDatabaseDown ? 'opacity-50' : ''}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Leads
            {isDatabaseDown && <span className="text-sm font-normal text-gray-500 ml-2">(Unavailable)</span>}
          </h2>
          <div className="space-y-3">
            {isDatabaseDown ? (
              // Database unavailable message
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Lead data unavailable in Gmail-only mode
              </div>
            ) : loading ? (
              // Loading skeleton
              [...Array(4)].map((_, i) => (
                <div key={i} className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : leadsData?.leads && leadsData.leads.length > 0 ? (
              // Real leads data
              leadsData.leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {lead.first_name && lead.last_name 
                          ? `${lead.first_name} ${lead.last_name}`
                          : lead.email || lead.phone || "Unknown Lead"}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {lead.property_address || "No property specified"}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {lead.source && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Source: {lead.source}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                    {formatTimeAgo(lead.created_at)}
                  </span>
                </div>
              ))
            ) : (
              // No leads
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No leads found
              </div>
            )}
          </div>
        </div>

        <div className={`card ${isDatabaseDown ? 'opacity-50' : ''}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Messages
            {isDatabaseDown && <span className="text-sm font-normal text-gray-500 ml-2">(Unavailable)</span>}
          </h2>
          <div className="space-y-3">
            {/* Placeholder for messages - would need messages endpoint */}
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isDatabaseDown ? "Message data unavailable in Gmail-only mode" : "Messages feature coming soon"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}