import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, password)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(15,27,46,0.7)] backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-off-white rounded-2xl p-8 max-w-[400px] w-[90%] border-2 border-[#D4C9BC] shadow-[0_12px_48px_rgba(15,27,46,0.2)]" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-6 text-2xl font-bold text-deep-navy">{mode === 'login' ? 'Login' : 'Create Account'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 font-medium text-deep-navy">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              minLength={3}
              required
              className="w-full px-3.5 py-2.5 text-base border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy focus:shadow-[0_0_0_3px_rgba(0,22,45,0.1)] placeholder:text-light-gray"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-medium text-deep-navy">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              minLength={6}
              required
              className="w-full px-3.5 py-2.5 text-base border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy focus:shadow-[0_0_0_3px_rgba(0,22,45,0.1)] placeholder:text-light-gray"
            />
          </div>

          {error && (
            <p className="text-[#D64545] mb-4">{error}</p>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              className="px-5 py-2.5 text-base rounded-lg font-medium bg-off-white text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-light-gray text-sm">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="bg-transparent border-0 text-teal-green cursor-pointer underline hover:opacity-80"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="bg-transparent border-0 text-teal-green cursor-pointer underline hover:opacity-80"
              >
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
