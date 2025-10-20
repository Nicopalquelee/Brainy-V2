import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock the API module
vi.mock('./lib/api', () => ({
  fetchJson: vi.fn()
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('AcadUSS')).toBeInTheDocument()
  })

  it('shows login form when not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null)
    render(<App />)
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
  })
})





