import { useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'

// Use VITE_API_URL if set (for local dev), otherwise use base URL
const BASE_URL = import.meta.env.BASE_URL || '/'
const API_URL = import.meta.env.VITE_API_URL || (BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL)

export function useApi() {
  const { token } = useAuth()

  const getHeaders = useCallback((): HeadersInit => {
    const h: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (token) {
      h['Authorization'] = `Bearer ${token}`
    }
    return h
  }, [token])

  const get = useCallback(async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, { headers: getHeaders() })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Request failed')
    }
    return res.json()
  }, [getHeaders])

  const post = useCallback(async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Request failed')
    }
    return res.json()
  }, [getHeaders])

  const put = useCallback(async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Request failed')
    }
    return res.json()
  }, [getHeaders])

  const del = useCallback(async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Request failed')
    }
    return res.json()
  }, [getHeaders])

  return useMemo(() => ({ get, post, put, del }), [get, post, put, del])
}
