import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Modal, ModalFooter, FormInput, Button } from './ui'

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={mode === 'login' ? 'Login' : 'Create Account'}
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          minLength={3}
          required
        />

        <FormInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          minLength={6}
          required
          error={error}
        />

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'login' ? 'Login' : 'Register'}
          </Button>
        </ModalFooter>
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
    </Modal>
  )
}
