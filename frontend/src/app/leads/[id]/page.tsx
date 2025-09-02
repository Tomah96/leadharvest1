"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { perfMonitor } from "@/utils/performanceMonitor";
import Link from "next/link";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Home, 
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  Edit,
  MessageSquare,
  FileText,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  User,
  PawPrint,
  CalendarClock,
  Briefcase,
  Info
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { ConversationWindow } from "@/components/conversations/ConversationWindow";
import { api } from "@/lib/api-client";
import type { Lead } from "@/types";

const statusOptions = [
  { value: "new", label: "New", icon: "🆕", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  { value: "contacted", label: "Contacted", icon: "📞", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  { value: "qualified", label: "Qualified", icon: "✅", color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  { value: "closed", label: "Closed", icon: "🔒", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" }
];

// Utility functions
const formatPhone = (phone: string | null) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
};

const formatInquiryDateTime = (date: string | null) => {
  if (!date) return 'Date not available';
  
  const inquiryDate = new Date(date);
  // Check if date is valid
  if (isNaN(inquiryDate.getTime())) return 'Invalid date';
  
  // Format date: "Aug 27, 2025"
  const dateStr = inquiryDate.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Format time: "4:37 PM"
  const timeStr = inquiryDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Combine: "Aug 27, 2025 at 4:37 PM"
  return `${dateStr} at ${timeStr}`;
};

const daysSince = (date: string | null) => {
  // We don't want relative time anymore
  return '';
};

const getEmptyMessage = (field: string) => {
  const messages: Record<string, string> = {
    credit_score: 'Not shared yet',
    income: 'To be verified',
    move_in_date: 'Flexible',
    pets: 'Not mentioned',
    occupants: 'Not specified',
    lease_length: 'Open to options',
    phone: 'No phone provided',
    email: 'No email provided',
    property_address: 'Property not specified',
    unit: 'Any available'
  };
  return messages[field] || '—';
};

const calculateCompleteness = (lead: Lead): number => {
  const importantFields = [
    'first_name', 'last_name', 'phone', 'email',
    'credit_score', 'income', 'move_in_date',
    'occupants', 'pets', 'lease_length'
  ];
  const filled = importantFields.filter(field => {
    const value = (lead as any)[field];
    return value !== null && value !== undefined && value !== '';
  }).length;
  return Math.round((filled / importantFields.length) * 100);
};

const getCreditScoreRange = (score: string | number | null, metadata?: any): { label: string; color: string; badge: string } => {
  if (!score) return { label: 'Not provided', color: 'text-gray-500', badge: 'bg-gray-100 text-gray-700' };
  
  // Convert to string for consistent handling
  const scoreStr = score.toString();
  
  // Handle range format like "620-659" or "620 to 659"
  if (scoreStr.includes('-') || scoreStr.toLowerCase().includes('to')) {
    const cleanScore = scoreStr.replace(/to/gi, '-');
    const parts = cleanScore.split('-').map(s => parseInt(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [min, max] = parts;
      // Just display the range as-is, don't add extra text
      const label = scoreStr;
      if (max >= 750) return { label, color: 'text-green-600', badge: 'bg-green-100 text-green-800' };
      if (max >= 700) return { label, color: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' };
      if (max >= 650) return { label, color: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' };
      if (min >= 600) return { label, color: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' };
      return { label, color: 'text-red-600', badge: 'bg-red-100 text-red-800' };
    }
  }
  
  // Handle single number scores
  const numScore = typeof score === 'number' ? score : parseInt(scoreStr);
  if (numScore >= 750) return { label: `Excellent (${numScore})`, color: 'text-green-600', badge: 'bg-green-100 text-green-800' };
  if (numScore >= 700) return { label: `Good (${numScore})`, color: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' };
  if (numScore >= 650) return { label: `Fair (${numScore})`, color: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' };
  if (numScore >= 600) return { label: `Needs Review (${numScore})`, color: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' };
  return { label: scoreStr, color: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' };
};

const formatIncome = (income: number | null, monthlyIncome: number | null, lead?: Lead): string => {
  const value = monthlyIncome || income;
  if (!value) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (!numValue || isNaN(numValue)) return 'Not provided';
  
  // Format as currency
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
  
  // Smart detection of income type
  // Check if lead has income_type field (from new parser)
  const incomeType = (lead as any)?.income_type;
  
  // Respect explicit income_type from backend
  if (incomeType === 'annual') {
    // Explicitly annual
    return `${formatted}/yr`;
  } else if (incomeType === 'monthly') {
    // Explicitly monthly - show with annual calculation
    const annual = numValue * 12;
    const annualFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(annual);
    return `${formatted}/mo (${annualFormatted}/yr)`;
  } else {
    // Auto-detect based on amount when no type specified
    if (numValue > 15000) {  // Raised threshold for better auto-detection
      return `${formatted}/yr`;
    } else {
      const annual = numValue * 12;
      const annualFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(annual);
      return `${formatted}/mo (${annualFormatted}/yr)`;
    }
  }
};

const hasDataQualityIssue = (lead: Lead): boolean => {
  // Check for parsing issues
  if (lead.first_name?.includes('RentMarketplace')) return true;
  if (lead.first_name?.includes('.com')) return true;
  if (lead.first_name?.includes('@')) return true;
  if (lead.parsing_errors && lead.parsing_errors.length > 0) return true;
  return false;
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showOriginalNotes, setShowOriginalNotes] = useState(false);
  const [showRawEmail, setShowRawEmail] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    setLoading(true);
    setError(null);
    
    // Start performance monitoring
    perfMonitor.start(`LeadDetails.fetchLead`, { leadId });

    try {
      // Start the lead fetch immediately
      const leadPromise = api.leads.getById(leadId);
      
      // Wait for the lead data (this is the critical path)
      const response = await leadPromise;
      
      // Backend returns { success: true, lead: {...} }
      const leadData = response.data.lead || response.data;
      setLead(leadData);
      
      // Log successful load
      console.log(`[LeadDetails] Successfully loaded lead #${leadId}`, {
        hasName: !!(leadData.first_name || leadData.last_name),
        hasPhone: !!leadData.phone,
        hasEmail: !!leadData.email,
        status: leadData.status
      });
      
      // Note: ConversationWindow will load its own data when it mounts
      // This prevents blocking the lead display while loading conversations
    } catch (err) {
      console.error(`[LeadDetails] Failed to load lead #${leadId}:`, err);
      setError("Failed to load lead details. Please try again.");
    } finally {
      setLoading(false);
      perfMonitor.end(`LeadDetails.fetchLead`);
    }
  };

  const updateStatus = async (newStatus: "new" | "contacted" | "qualified" | "closed") => {
    if (!lead || lead.status === newStatus) return;

    setUpdating(true);
    try {
      const response = await api.leads.update(leadId, { status: newStatus });
      // Backend returns { success: true, lead: {...} }
      const leadData = response.data.lead || response.data;
      setLead(leadData);
    } catch (err) {
      setError("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading lead details..." />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorAlert 
          message={error || "Lead not found"} 
          actionText="Go back"
          onAction={() => router.push("/leads")}
        />
      </div>
    );
  }

  const fullName = [
    lead.first_name,
    lead.last_name && lead.last_name !== '' ? lead.last_name : null
  ].filter(Boolean).join(" ") || "Unknown";
  const completeness = calculateCompleteness(lead);
  const hasQualityIssue = hasDataQualityIssue(lead);
  const creditScoreInfo = getCreditScoreRange(lead.credit_score, lead.metadata);
  const currentStatus = statusOptions.find(s => s.value === lead.status);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Link href="/leads">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fullName}</h1>
              {hasQualityIssue && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Needs review
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lead #{lead.id} · via {lead.source}
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      completeness >= 80 ? 'bg-green-500' : 
                      completeness >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{width: `${completeness}%`}}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {completeness}% complete
                </span>
              </div>
            </div>
          </div>
        </div>
        <button className="button-primary flex items-center space-x-2">
          <Edit className="w-4 h-4" />
          <span>Edit Lead</span>
        </button>
      </div>

      {/* Status Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <div className="flex items-center space-x-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateStatus(option.value as any)}
                  disabled={updating}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    lead.status === option.value
                      ? option.color
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                  } ${updating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatInquiryDateTime(lead.inquiry_date)}</span>
            </div>
            <div className="text-gray-400">·</div>
            <span className="capitalize">{lead.source}</span>
          </div>
        </div>
      </div>

      {/* Inquiry Message - Prominent Display */}
      {lead.notes && !lead.notes.includes('</') && !lead.notes.includes('style=') && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Inquiry Message from {lead.first_name}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                "{lead.notes.split('\n\n')[0]}"
              </p>
              {lead.notes.includes('Credit Score Range:') && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                  Note: Credit score range parsed from email: {lead.notes.match(/Credit Score Range: ([\d-]+)/)?.[1]}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact Lead Info Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact</h3>
            <div className="space-y-1">
              <a href={`tel:${lead.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {formatPhone(lead.phone) || 'No phone'}
              </a>
              <a href={`mailto:${lead.email}`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm">
                <Mail className="w-3 h-3" />
                {lead.email || 'No email'}
              </a>
            </div>
          </div>
          {/* Property Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Property Interest</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>{lead.property_address || 'No specific property'}</p>
              <p>Move-in: {lead.move_in_date ? new Date(lead.move_in_date + 'T00:00:00').toLocaleDateString() : 'Flexible'}</p>
            </div>
          </div>
          {/* Financial Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Qualification</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Credit: {lead.credit_score || 'Not provided'}</p>
              <p>Income: {lead.income || lead.monthly_income ? `$${(lead.income || lead.monthly_income || 0).toLocaleString()}` : 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Conversation Window */}
      <div className="mb-4">
        <ConversationWindow 
          leadId={lead.id}
          initialInquiry={{
            content: lead.notes || '',
            date: lead.inquiry_date
          }}
        />
      </div>

      {/* Additional Details - Only non-duplicate info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


          {/* Financial Information - Enhanced */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                💰 Financial Information
              </h2>
              {(!lead.income && !lead.monthly_income && !lead.credit_score) && (
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Request financial info
                </button>
              )}
            </div>
            <div className="space-y-4">
              {/* Income */}
              <div className="flex items-start space-x-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Income</p>
                  {(lead.income || lead.monthly_income) ? (
                    <div>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatIncome(lead.income, lead.monthly_income, lead)}
                      </p>
                      {lead.employment_status && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Employment: {lead.employment_status}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">{getEmptyMessage('income')}</p>
                  )}
                </div>
              </div>

              {/* Credit Score */}
              <div className="flex items-start space-x-3">
                <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Credit Score</p>
                  {lead.credit_score ? (
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${creditScoreInfo.color}`}>
                        {creditScoreInfo.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${creditScoreInfo.badge}`}>
                        {lead.credit_score.toString().includes('-') ? 'Range' : 'Exact'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">{getEmptyMessage('credit_score')}</p>
                  )}
                </div>
              </div>

              {/* Rent Budget */}
              {(lead.desired_rent_min || lead.desired_rent_max) && (
                <div className="flex items-start space-x-3">
                  <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rent Budget</p>
                    <p className="font-medium">
                      {lead.desired_rent_min && lead.desired_rent_max ? (
                        `$${lead.desired_rent_min.toLocaleString()} - $${lead.desired_rent_max.toLocaleString()}/mo`
                      ) : lead.desired_rent_min ? (
                        `From $${lead.desired_rent_min.toLocaleString()}/mo`
                      ) : (
                        `Up to $${lead.desired_rent_max?.toLocaleString()}/mo`
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Background Check Info */}
              {(lead.has_eviction !== null || lead.has_criminal_record !== null) && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Information</p>
                  <div className="space-y-1">
                    {lead.has_eviction !== null && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        • Eviction History: {lead.has_eviction ? '⚠️ Yes' : '✅ No'}
                      </p>
                    )}
                    {lead.has_criminal_record !== null && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        • Criminal Record: {lead.has_criminal_record ? '⚠️ Yes' : '✅ No'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Qualification Status */}
              {(lead.income || lead.monthly_income) && lead.credit_score && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Qualification Status: 
                    <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                      ✅ Financially Qualified
                    </span>
                  </p>
                  {lead.credit_score && lead.credit_score.toString().includes('-') && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      *Pending exact credit score verification
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preferences Section - New */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🏡 Housing Preferences
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Move-in Date */}
              <div className="flex items-start space-x-3">
                <CalendarClock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Move-in Date</p>
                  {lead.move_in_date ? (
                    <p className="font-medium">
                      {new Date(lead.move_in_date + 'T00:00:00').toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">{getEmptyMessage('move_in_date')}</p>
                  )}
                </div>
              </div>

              {/* Lease Length */}
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lease Length</p>
                  {lead.lease_length ? (
                    <p className="font-medium">{lead.lease_length} months</p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">{getEmptyMessage('lease_length')}</p>
                  )}
                </div>
              </div>

              {/* Occupants */}
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Occupants</p>
                  {lead.occupants || lead.additional_occupants ? (
                    <p className="font-medium">
                      {lead.occupants || (lead.additional_occupants ? lead.additional_occupants + 1 : 0)} {(lead.occupants || 0) === 1 ? 'person' : 'people'}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">{getEmptyMessage('occupants')}</p>
                  )}
                </div>
              </div>

              {/* Bedrooms */}
              <div className="flex items-start space-x-3">
                <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bedrooms</p>
                  {lead.preferred_bedrooms ? (
                    <p className="font-medium">{lead.preferred_bedrooms} BR</p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">Not specified</p>
                  )}
                </div>
              </div>

              {/* Pets */}
              <div className="flex items-start space-x-3">
                <PawPrint className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pets</p>
                  {(lead.pets !== null || lead.has_pets !== null) ? (
                    <div>
                      <p className="font-medium">
                        {(lead.pets && lead.pets !== "" && lead.pets !== "false" && lead.pets !== "No" && lead.pets !== "no") ? 
                          `🐕 Has pets${lead.pets !== 'Yes' && lead.pets !== 'yes' && lead.pets !== 'true' ? `: ${lead.pets}` : ''}` : 
                          '❌ No pets'}
                      </p>
                      {lead.pet_details && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">{lead.pet_details}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">{getEmptyMessage('pets')}</p>
                  )}
                </div>
              </div>

              {/* Bathrooms */}
              {lead.preferred_bathrooms && (
                <div className="flex items-start space-x-3">
                  <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bathrooms</p>
                    <p className="font-medium">{lead.preferred_bathrooms} BA</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Communication */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                📝 Notes & Communication
              </h2>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Add Note
              </button>
            </div>
            
            {/* Original Inquiry Section - Only show if notes contain HTML */}
            {lead.notes && (lead.notes.includes('</') || lead.notes.includes('style=')) && (
              <div className="mb-4">
                <button
                  onClick={() => setShowOriginalNotes(!showOriginalNotes)}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  {showOriginalNotes ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span>View raw notes (contains HTML)</span>
                </button>
                
                {showOriginalNotes && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">⚠️ Raw HTML content - needs parsing</p>
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                      {lead.notes}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Raw Email Viewer - New */}
            {lead.metadata?.raw_email && (
              <div className="mb-4">
                <button
                  onClick={() => setShowRawEmail(!showRawEmail)}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  {showRawEmail ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <Mail className="w-4 h-4" />
                  <span>View original email</span>
                </button>
                
                {showRawEmail && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Original Email Content</p>
                      {lead.metadata?.parsed_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Parsed: {new Date(lead.metadata.parsed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">
                      {lead.metadata.raw_email}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            {/* Parsing Errors */}
            {lead.parsing_errors && lead.parsing_errors.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Data Quality Issues
                    </p>
                    <ul className="mt-1 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      {lead.parsing_errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* No notes message */}
            {!lead.notes && (!lead.parsing_errors || lead.parsing_errors.length === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">No notes or communication history yet</p>
              </div>
            )}
          </div>

          {/* System Information */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">System Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Gmail Message ID</p>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                  {lead.gmail_message_id || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Created</p>
                <p className="text-gray-700 dark:text-gray-300">
                  {new Date(lead.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="text-gray-700 dark:text-gray-300">
                  {new Date(lead.updated_at).toLocaleString()}
                </p>
              </div>
              {Array.isArray(lead.parsing_errors) && lead.parsing_errors.length > 0 && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Parsing Errors</p>
                  <ul className="mt-1 space-y-1">
                    {lead.parsing_errors.map((error, index) => (
                      <li key={index} className="text-xs text-error">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}