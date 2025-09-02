import { z } from "zod";

// Lead creation/update schema
export const leadSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(255),
  last_name: z.string().min(1, "Last name is required").max(255),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[\d\s\-\(\)]+$/, "Invalid phone number format"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  property_address: z.string().min(1, "Property address is required"),
  unit: z.string().optional().or(z.literal('')),
  source: z.enum(["zillow", "realtor", "apartments", "rentmarketplace"]),
  
  // Optional fields
  move_in_date: z.string().optional().or(z.literal('')),
  occupants: z.number().min(1).max(20).optional(),
  pets: z.boolean().optional(),
  lease_length: z.number().min(1).max(60).optional(),
  income: z.number().min(0).optional(),
  credit_score: z.string().optional(),
  notes: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Template schema for auto-reply
export const templateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Body content is required").max(2000),
  active: z.boolean().default(true),
});

export type TemplateFormData = z.infer<typeof templateSchema>;

// Lead status update schema
export const leadStatusSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "closed"]),
});

// Note schema
export const noteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(1000),
});