import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsCard from './StatsCard'

// Mock the API module
vi.mock('../lib/api', () => ({
  fetchJson: vi.fn()
}))

describe('StatsCard Component', () => {
  it('renders with correct title and value', () => {
    render(<StatsCard title="Test Title" value={42} />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders with icon when provided', () => {
    const TestIcon = () => <div data-testid="test-icon">Icon</div>
    render(<StatsCard title="Test Title" value={42} icon={<TestIcon />} />)
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <StatsCard title="Test Title" value={42} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})








