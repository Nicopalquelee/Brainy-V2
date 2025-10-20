import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from './api'

// Mock fetch
global.fetch = vi.fn()

describe('API Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('getApiBase returns correct base URL', () => {
    const baseUrl = api.getApiBase()
    expect(baseUrl).toBe('http://localhost:3000/api')
  })

  it('joinBaseAndPath correctly joins URLs', () => {
    const result = api.joinBaseAndPath('http://localhost:3000/api', '/users')
    expect(result).toBe('http://localhost:3000/api/users')
  })

  it('joinBaseAndPath handles double slashes', () => {
    const result = api.joinBaseAndPath('http://localhost:3000/api/', '/users')
    expect(result).toBe('http://localhost:3000/api/users')
  })

  it('fetchJson makes request with correct headers', async () => {
    const mockResponse = { data: 'test' }
    ;(global.fetch as unknown).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const result = await api.fetchJson('/test', { token: 'test-token' })
    
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        })
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('fetchJson throws error for error responses', async () => {
    const errorResponse = { error: 'Test error' }
    ;(global.fetch as unknown).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(errorResponse)
    })

    await expect(api.fetchJson('/test')).rejects.toThrow('Test error')
  })

  it('absoluteFromContentUrl converts relative URLs', () => {
    const result = api.absoluteFromContentUrl('/uploads/test.pdf')
    expect(result).toBe('http://localhost:3000/api/uploads/test.pdf')
  })
})








