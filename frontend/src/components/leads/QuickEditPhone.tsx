import { useState } from "react";
import { Phone } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Lead } from "@/types";

interface QuickEditPhoneProps {
  lead: Lead;
  onUpdate: (updatedLead: Lead) => void;
  onClose: () => void;
}

export default function QuickEditPhone({ lead, onUpdate, onClose }: QuickEditPhoneProps) {
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!phone.match(/^\d{3}-?\d{3}-?\d{4}$/)) {
      setError("Please enter a valid phone number (XXX-XXX-XXXX)");
      return;
    }

    setSaving(true);
    try {
      const response = await api.leads.update(lead.id, { phone });
      onUpdate(response.data);
      onClose();
    } catch (err) {
      setError("Failed to update phone number");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Add Phone Number</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Lead: {lead.first_name} {lead.last_name}
          </p>
          {(lead.property || lead.property_address) && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Property: {lead.property || lead.property_address}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="XXX-XXX-XXXX"
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="button-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="button-primary"
            disabled={saving || !phone}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}