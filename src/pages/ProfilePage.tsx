import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useApi } from '../hooks/useApi'
import { User } from '../types'

export default function ProfilePage() {
  const { user, updateAuth } = useAuth()
  const api = useApi()
  const navigate = useNavigate()

  // Username form
  const [newUsername, setNewUsername] = useState('')
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  if (!user) {
    return (
      <div className="text-center py-10 text-light-gray">
        Please log in to view your profile.
      </div>
    )
  }

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameError('')
    setUsernameSuccess('')

    if (newUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      return
    }

    if (newUsername === user.username) {
      setUsernameError('New username must be different from current')
      return
    }

    setUsernameLoading(true)
    try {
      const result = await api.put<{ user: User; token: string }>('/api/auth/username', {
        newUsername,
      })
      updateAuth(result.user, result.token)
      setUsernameSuccess('Username updated successfully!')
      setNewUsername('')
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : 'Failed to update username')
    } finally {
      setUsernameLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordLoading(true)
    try {
      await api.put('/api/auth/password', {
        currentPassword,
        newPassword,
      })
      setPasswordSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <button
        className="mb-6 px-4 py-2 text-sm rounded-lg font-medium bg-light-gray/20 text-deep-navy transition-all duration-200 hover:bg-light-gray/40 border-0 cursor-pointer"
        onClick={() => navigate(-1)}
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold text-deep-navy mb-6">Profile Settings</h1>

      {/* Current User Info */}
      <div className="bg-cream rounded-xl p-6 mb-6 border-2 border-peachy-pink/30">
        <h2 className="text-lg font-semibold text-deep-navy mb-2">Current Account</h2>
        <p className="text-deep-navy">
          <span className="text-light-gray">Username:</span>{' '}
          <span className="font-medium">{user.username}</span>
        </p>
        {user.is_admin && (
          <p className="text-teal-green text-sm mt-1">Administrator</p>
        )}
      </div>

      {/* Change Username */}
      <div className="bg-cream rounded-xl p-6 mb-6 border-2 border-peachy-pink/30">
        <h2 className="text-lg font-semibold text-deep-navy mb-4">Change Username</h2>
        <form onSubmit={handleUsernameChange}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-deep-navy mb-2">
              New Username
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              className="w-full px-4 py-3 rounded-lg border-2 border-peachy-pink/30 bg-off-white text-deep-navy outline-none focus:border-coral transition-colors"
              minLength={3}
            />
          </div>

          {usernameError && (
            <p className="text-red-600 text-sm mb-4">{usernameError}</p>
          )}
          {usernameSuccess && (
            <p className="text-teal-green text-sm mb-4">{usernameSuccess}</p>
          )}

          <button
            type="submit"
            disabled={usernameLoading || !newUsername}
            className="w-full px-4 py-3 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {usernameLoading ? 'Updating...' : 'Update Username'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-cream rounded-xl p-6 border-2 border-peachy-pink/30">
        <h2 className="text-lg font-semibold text-deep-navy mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-3 rounded-lg border-2 border-peachy-pink/30 bg-off-white text-deep-navy outline-none focus:border-coral transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-deep-navy mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className="w-full px-4 py-3 rounded-lg border-2 border-peachy-pink/30 bg-off-white text-deep-navy outline-none focus:border-coral transition-colors"
              minLength={6}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 rounded-lg border-2 border-peachy-pink/30 bg-off-white text-deep-navy outline-none focus:border-coral transition-colors"
            />
          </div>

          {passwordError && (
            <p className="text-red-600 text-sm mb-4">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-teal-green text-sm mb-4">{passwordSuccess}</p>
          )}

          <button
            type="submit"
            disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full px-4 py-3 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
