import { 
  Phone, 
  Mail, 
  Home, 
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  PhoneOff,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import QuickEditPhone from "./QuickEditPhone";
import type { Lead } from "@/types";

interface LeadCardProps {
  lead: Lead;
  onUpdate?: (updatedLead: Lead) => void;
  isSelected?: boolean;
  onSelect?: (leadId: string) => void;
}

const sourceColors = {
  zillow: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  realtor: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  apartments: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  rentmarketplace: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
};

const statusColors = {
  new: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  contacted: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  qualified: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  closed: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
};

// Format credit score - handle both integers and ranges
const formatCreditScore = (score: string | number | null): React.ReactNode => {
  if (!score) return null;
  
  // Check if it's a range string like "660-719"
  if (typeof score === 'string' && score.includes('-')) {
    const [min, max] = score.split('-').map(s => s.trim());
    return (
      <span className="font-medium">
        {min}-{max}
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          (Range)
        </span>
      </span>
    );
  }
  
  // Otherwise just return the score
  return <span className="font-medium">{score}</span>;
};

// Get credit score color based on value
const getCreditScoreColor = (score: string | number | null): string => {
  if (!score) return 'text-gray-600 dark:text-gray-400';
  
  // Extract first number if it's a range
  const value = typeof score === 'string' 
    ? parseInt(score.split('-')[0]) 
    : score;
  
  if (value >= 720) return 'text-green-600 dark:text-green-400';
  if (value >= 660) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

// Format income with smart detection
const formatIncome = (value: number | string | null): string => {
  if (!value) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (!numValue || isNaN(numValue)) return '';
  
  // Smart detection: amounts over $10,000 are likely annual
  if (numValue > 10000) {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
    return `${formatted}/yr`;
  } else {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
    return `${formatted}/mo`;
  }
};

// Format lead date to show actual date and time (absolute format only)
const formatLeadDate = (inquiry_date: string | null) => {
  if (!inquiry_date) return 'Date not available';
  
  const date = new Date(inquiry_date);
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Format date: "Aug 27, 2025"
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Format time: "4:37 PM"
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Combine: "Aug 27, 2025 at 4:37 PM"
  return `${dateStr} at ${timeStr}`;
};

export default function LeadCard({ lead, onUpdate, isSelected = false, onSelect }: LeadCardProps) {
  const [showEditPhone, setShowEditPhone] = useState(false);
  const [currentLead, setCurrentLead] = useState(lead);
  
  const fullName = [
    currentLead.first_name,
    currentLead.last_name && currentLead.last_name !== '' ? currentLead.last_name : null
  ].filter(Boolean).join(" ") || "Unknown";
  const isPlaceholderPhone = currentLead.phone === '9999999999';

  const handleUpdate = (updatedLead: Lead) => {
    setCurrentLead(updatedLead);
    onUpdate?.(updatedLead);
  };

  const handlePhoneNeededClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditPhone(true);
  };

  return (
    <>
      <div className={`card hover:shadow-lg transition-shadow h-full relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        {/* Selection checkbox */}
        {onSelect && (
          <div className="absolute top-4 left-4 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(lead.id);
              }}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              aria-label={`Select ${fullName}`}
            />
          </div>
        )}
        
        <Link href={`/leads/${lead.id}`}>
          <div className={`cursor-pointer h-full ${onSelect ? 'pl-10' : ''}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {fullName}
                  </h3>
            {(!currentLead.phone || isPlaceholderPhone) && (
              <button
                onClick={handlePhoneNeededClick}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/30 transition-colors"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Phone needed
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatLeadDate(currentLead.inquiry_date)}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[lead.status]}`}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${sourceColors[lead.source]}`}>
            {lead.source}
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {currentLead.phone && !isPlaceholderPhone ? (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4" />
            <span>{currentLead.phone}</span>
          </div>
        ) : (
          <button 
            onClick={handlePhoneNeededClick}
            className="flex items-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Phone needed</span>
          </button>
        )}
        {currentLead.email && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4" />
            <span className="truncate">{currentLead.email}</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Home className="w-4 h-4" />
          <span className="truncate">
            {currentLead.property_address || 'No address'}
            {currentLead.unit && ` Unit ${currentLead.unit}`}
          </span>
        </div>
      </div>

      {/* Lead Details */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {currentLead.move_in_date && (
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{new Date(currentLead.move_in_date + 'T00:00:00').toLocaleDateString()}</span>
          </div>
        )}
        {currentLead.income && (
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <DollarSign className="w-3 h-3" />
            <span>{formatIncome(currentLead.income)}</span>
          </div>
        )}
        {currentLead.credit_score && (
          <div className={`flex items-center space-x-1 ${getCreditScoreColor(currentLead.credit_score)}`}>
            <CreditCard className="w-3 h-3" />
            {formatCreditScore(currentLead.credit_score)}
          </div>
        )}
        {currentLead.occupants && (
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Users className="w-3 h-3" />
            <span>{currentLead.occupants} occupant{currentLead.occupants > 1 ? "s" : ""}</span>
          </div>
        )}
        {currentLead.lease_length && (
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{currentLead.lease_length} months</span>
          </div>
        )}
      </div>

          </div>
        </Link>
      </div>

      {/* Quick Edit Phone Modal */}
      {showEditPhone && (
        <QuickEditPhone
          lead={currentLead}
          onUpdate={handleUpdate}
          onClose={() => setShowEditPhone(false)}
        />
      )}
    </>
  );
}