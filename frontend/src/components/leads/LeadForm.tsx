"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadFormData } from "@/lib/validations";
import { api } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type { Lead } from "@/types";

interface LeadFormProps {
  lead?: Lead;
  mode?: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LeadForm({ lead, mode = 'create', onSuccess, onCancel }: LeadFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = mode === 'edit' && lead;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source: "zillow",
      pets: false,
    },
  });

  // Populate form with lead data in edit mode
  useEffect(() => {
    if (isEditMode && lead) {
      reset({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        phone: lead.phone,
        email: lead.email || '',
        property_address: lead.property_address || '',
        unit: lead.unit || '',
        source: lead.source || 'zillow',
        move_in_date: lead.move_in_date || '',
        income: lead.income || undefined,
        occupants: lead.occupants || undefined,
        lease_length: lead.lease_length || undefined,
        credit_score: lead.credit_score || '',
        pets: lead.pets || false,
        notes: lead.notes || '',
      });
    }
  }, [lead, isEditMode, reset]);

  const onSubmit = async (data: LeadFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...data,
        email: data.email || null,
        move_in_date: data.move_in_date || null,
        credit_score: data.credit_score || null,
        notes: data.notes || null,
      };

      if (isEditMode && lead) {
        await api.leads.update(lead.id, cleanedData);
      } else {
        await api.leads.create(cleanedData);
      }
      onSuccess();
    } catch (err: any) {
      const action = isEditMode ? "update" : "create";
      setError(err.response?.data?.error?.message || `Failed to ${action} lead`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Show lead source if editing */}
      {isEditMode && lead?.source && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Lead Source: {lead.source}</p>
              <ul className="mt-1 space-y-0.5">
                {lead.missing_info.map((field) => (
                  <li key={field} className="text-xs">• {field.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name *
          </label>
          <input
            {...register("first_name")}
            className="input"
            placeholder="John"
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-error">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name *
          </label>
          <input
            {...register("last_name")}
            className="input"
            placeholder="Doe"
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-error">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone Number *
        </label>
        <input
          {...register("phone")}
          className="input"
          placeholder="(555) 123-4567"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-error">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          className="input"
          placeholder="john.doe@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-error">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Property Address *
        </label>
        <input
          {...register("property_address")}
          className="input"
          placeholder="123 Main Street"
        />
        {errors.property_address && (
          <p className="mt-1 text-xs text-error">{errors.property_address.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Unit/Apartment
        </label>
        <input
          {...register("unit")}
          className="input"
          placeholder="2B"
        />
        {errors.unit && (
          <p className="mt-1 text-xs text-error">{errors.unit.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Source *
        </label>
        <select {...register("source")} className="input">
          <option value="zillow">Zillow</option>
          <option value="realtor">Realtor.com</option>
          <option value="apartments">Apartments.com</option>
          <option value="rentmarketplace">RentMarketplace</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Move-in Date
          </label>
          <input
            {...register("move_in_date")}
            type="date"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monthly Income
          </label>
          <input
            {...register("income", { valueAsNumber: true })}
            type="number"
            className="input"
            placeholder="5000"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Occupants
          </label>
          <input
            {...register("occupants", { valueAsNumber: true })}
            type="number"
            min="1"
            className="input"
            placeholder="2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Lease Length (months)
          </label>
          <input
            {...register("lease_length", { valueAsNumber: true })}
            type="number"
            min="1"
            className="input"
            placeholder="12"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Credit Score
          </label>
          <input
            {...register("credit_score")}
            className="input"
            placeholder="720-799"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            {...register("pets")}
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Has pets
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          className="input"
          placeholder="Additional information..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="button-secondary"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="button-primary flex items-center space-x-2"
          disabled={submitting}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{submitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Lead" : "Create Lead")}</span>
        </button>
      </div>
    </form>
  );
}