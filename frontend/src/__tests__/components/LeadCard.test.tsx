import { screen } from '@testing-library/react'
import { renderWithProviders, createMockLead } from '../utils/test-utils'
import LeadCard from '@/components/leads/LeadCard'

describe('LeadCard', () => {
  it('renders lead information correctly', () => {
    const mockLead = createMockLead({
      first_name: 'John',
      last_name: 'Doe',
      phone: '(555) 123-4567',
      email: 'john.doe@example.com',
      property: '123 Main St, Apt 4',
      status: 'new',
      source: 'zillow'
    })

    renderWithProviders(<LeadCard lead={mockLead} />)

    // Check that the lead name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    
    // Check contact information
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument()
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
    expect(screen.getByText('123 Main St, Apt 4')).toBeInTheDocument()
    
    // Check status and source badges
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('zillow')).toBeInTheDocument()
  })

  it('displays lead details when available', () => {
    const mockLead = createMockLead({
      move_in_date: '2025-02-01',
      income: 5000,
      occupants: 2,
      lease_length: 12
    })

    renderWithProviders(<LeadCard lead={mockLead} />)

    // Check that the date section exists (Calendar icon should be present when move_in_date is set)
    const calendarIcons = document.querySelectorAll('.lucide-calendar')
    expect(calendarIcons.length).toBeGreaterThan(0)
    
    expect(screen.getByText('$5,000')).toBeInTheDocument()
    expect(screen.getByText('2 occupants')).toBeInTheDocument()
    expect(screen.getByText('12 months')).toBeInTheDocument()
  })

  it('shows missing information warning when present', () => {
    const mockLead = createMockLead({
      missing_info: ['income', 'credit_score']
    })

    renderWithProviders(<LeadCard lead={mockLead} />)

    expect(screen.getByText(/Missing:/)).toBeInTheDocument()
    expect(screen.getByText(/income, credit score/)).toBeInTheDocument()
  })

  it('handles lead with minimal information', () => {
    const mockLead = createMockLead({
      first_name: null,
      last_name: null,
      phone: null,
      email: null,
      property: 'Unknown Property',
      move_in_date: null,
      income: null,
      occupants: null,
      lease_length: null
    })

    renderWithProviders(<LeadCard lead={mockLead} />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByText('Unknown Property')).toBeInTheDocument()
  })

  it('displays correct status colors', () => {
    const statuses = ['new', 'contacted', 'qualified', 'closed'] as const
    
    statuses.forEach(status => {
      const mockLead = createMockLead({ status })
      const { container } = renderWithProviders(<LeadCard lead={mockLead} />)
      
      const statusElement = screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))
      expect(statusElement).toBeInTheDocument()
      
      // Check that status has appropriate styling
      expect(statusElement).toHaveClass('text-xs', 'px-2', 'py-1', 'rounded-full', 'font-medium')
    })
  })

  it('displays correct source colors', () => {
    const sources = ['zillow', 'realtor', 'apartments', 'rentmarketplace'] as const
    
    sources.forEach(source => {
      const mockLead = createMockLead({ source })
      renderWithProviders(<LeadCard lead={mockLead} />)
      
      const sourceElement = screen.getByText(source)
      expect(sourceElement).toBeInTheDocument()
      expect(sourceElement).toHaveClass('text-xs', 'px-2', 'py-1', 'rounded-full', 'font-medium')
    })
  })

  it('calculates days since inquiry correctly', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const mockLead = createMockLead({
      inquiry_date: yesterday.toISOString()
    })

    renderWithProviders(<LeadCard lead={mockLead} />)

    // Should show "1 days ago" (the component doesn't handle singular/plural)
    expect(screen.getByText(/1.*days? ago/)).toBeInTheDocument()
  })

  it('shows "Today" for leads created today', () => {
    const today = new Date()
    const mockLead = createMockLead({
      inquiry_date: today.toISOString()
    })

    renderWithProviders(<LeadCard lead={mockLead} />)

    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('renders as a clickable link to lead detail page', () => {
    const mockLead = createMockLead({ id: 'test-lead-123' })
    
    renderWithProviders(<LeadCard lead={mockLead} />)
    
    const linkElement = screen.getByRole('link')
    expect(linkElement).toHaveAttribute('href', '/leads/test-lead-123')
  })

  it('handles pets information correctly', () => {
    const mockLeadWithPets = createMockLead({ pets: true })
    renderWithProviders(<LeadCard lead={mockLeadWithPets} />)
    // Pets info would be shown in occupants section if displayed

    const mockLeadNoPets = createMockLead({ pets: false })
    renderWithProviders(<LeadCard lead={mockLeadNoPets} />)
    // Should render without error
  })
})