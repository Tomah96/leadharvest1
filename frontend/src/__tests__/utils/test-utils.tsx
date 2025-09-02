import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock API client
export const mockApi = {
  leads: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  healthCheck: jest.fn(),
  auth: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  conversations: {
    getByLeadId: jest.fn(),
    sendMessage: jest.fn(),
  },
  settings: {
    templates: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
  gmail: {
    getAuthUrl: jest.fn(),
    handleCallback: jest.fn(),
  },
}

// Mock the API client module
jest.mock('@/lib/api-client', () => ({
  api: mockApi,
  default: mockApi,
}))

// Custom render function with providers
interface CustomRenderOptions extends RenderOptions {
  // Add any additional options here in the future
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Test data factories
export const createMockLead = (overrides = {}) => ({
  id: 'test-lead-1',
  first_name: 'John',
  last_name: 'Doe',
  phone: '(555) 123-4567',
  email: 'john.doe@example.com',
  property: '123 Main St, Apt 4',
  source: 'zillow' as const,
  status: 'new' as const,
  inquiry_date: '2025-01-15T10:30:00Z',
  credit_score: '720-799',
  income: 5000,
  move_in_date: '2025-02-01',
  occupants: 2,
  pets: false,
  lease_length: 12,
  missing_info: [],
  gmail_message_id: 'msg-123',
  parsing_errors: [],
  created_at: '2025-01-15T10:30:00Z',
  updated_at: '2025-01-15T10:30:00Z',
  notes: null,
  lead_type: null,
  property_address: null,
  ...overrides,
})

export const createMockPaginatedResponse = (leads = [createMockLead()]) => ({
  leads,
  pagination: {
    page: 1,
    limit: 20,
    total: leads.length,
    pages: 1,
  },
})

// Re-export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Test to verify utilities work correctly
describe('Test utilities', () => {
  it('should create a mock lead with default values', () => {
    const mockLead = createMockLead();
    expect(mockLead).toHaveProperty('id');
    expect(mockLead).toHaveProperty('first_name', 'John');
    expect(mockLead).toHaveProperty('last_name', 'Doe');
    expect(mockLead).toHaveProperty('source', 'zillow');
  });

  it('should create a mock lead with overrides', () => {
    const overrides = { first_name: 'Jane', phone: '9999999999' };
    const mockLead = createMockLead(overrides);
    expect(mockLead.first_name).toBe('Jane');
    expect(mockLead.phone).toBe('9999999999');
  });

  it('should create a mock paginated response', () => {
    const leads = [createMockLead(), createMockLead({ id: 'test-lead-2' })];
    const response = createMockPaginatedResponse(leads);
    expect(response.leads).toHaveLength(2);
    expect(response.pagination.total).toBe(2);
  });
});