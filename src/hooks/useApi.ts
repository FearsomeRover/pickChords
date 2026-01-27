import { useAuth } from './useAuth'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useApi() {
  const { token } = useAuth()

  const headers = (): HeadersInit => {
    const h: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (token) {
      h['Authorization'] = `Bearer ${token}`
    }
    return h
  }

  const get = async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, { headers: headers() })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Request failed')
    }
    return res.json()
  }

  const post = async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Request failed')
    }
    return res.json()
  }

  const put = async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Request failed')
    }
    return res.json()
  }

  const del = async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: headers(),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Request failed')
    }
    return res.json()
  }

  return { get, post, put, del }
}
