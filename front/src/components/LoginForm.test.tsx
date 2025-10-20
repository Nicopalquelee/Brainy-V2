import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginForm from './LoginForm'

// Mock the API module
vi.mock('../lib/api', () => ({
  fetchJson: vi.fn()
}))

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form elements', () => {
    render(<LoginForm />)
    
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('shows password when toggle is clicked', () => {
    render(<LoginForm />)
    
    const passwordInput = screen.getByPlaceholderText('Contraseña')
    const toggleButton = screen.getByRole('button', { name: /mostrar contraseña/i })
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('validates email format', async () => {
    render(<LoginForm />)
    
    const emailInput = screen.getByPlaceholderText('Correo electrónico')
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Por favor, ingresa un correo válido')).toBeInTheDocument()
    })
  })
})





