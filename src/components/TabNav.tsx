import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export type TabType = 'chords' | 'songs' | 'favorites' | 'progress' | 'logs'

interface TabNavProps {
  showFavorites: boolean
  user: { username: string; is_admin?: boolean } | null
  onLoginClick: () => void
  onLogout: () => void
}

export default function TabNav({ showFavorites, user, onLoginClick, onLogout }: TabNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const isAdmin = user?.is_admin === true

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 text-base font-medium transition-all duration-200 no-underline rounded-lg ${
      isActive
        ? 'bg-coral text-deep-navy'
        : 'text-cream hover:bg-[#001a3d] hover:text-off-white'
    }`

  return (
    <nav className="bg-deep-navy rounded-xl mb-6 relative" ref={menuRef}>
      {/* Header bar */}
      <div className="flex justify-between items-center px-5 py-4">
        <h1 className="text-xl font-bold text-off-white">Pick Chords</h1>

        <button
          className="w-10 h-10 flex flex-col justify-center items-center gap-1.5 bg-transparent border-0 cursor-pointer p-2 rounded-lg hover:bg-[#001a3d] transition-all duration-200"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <span
            className={`block w-6 h-0.5 bg-off-white transition-all duration-300 ${
              isOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-off-white transition-all duration-300 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-off-white transition-all duration-300 ${
              isOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>
      </div>

      {/* Dropdown menu */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 flex flex-col gap-1">
          {/* Navigation links */}
          <NavLink to="/chords" className={linkClass}>
            Chords
          </NavLink>
          <NavLink to="/songs" className={linkClass}>
            Songs
          </NavLink>
          {showFavorites && (
            <NavLink to="/favorites" className={linkClass}>
              Favorites
            </NavLink>
          )}
          {user && (
            <NavLink to="/progress" className={linkClass}>
              My Progress
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/logs" className={linkClass}>
              Logs
            </NavLink>
          )}

          {/* Divider */}
          <div className="h-px bg-[#003366] my-2" />

          {/* Auth section */}
          {user ? (
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-cream font-medium">{user.username}</span>
              <button
                className="px-4 py-2 text-sm rounded-lg font-medium bg-coral text-deep-navy transition-all duration-200 hover:bg-golden-orange border-0 cursor-pointer"
                onClick={() => {
                  onLogout()
                  setIsOpen(false)
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              className="w-full px-4 py-3 text-base rounded-lg font-medium bg-coral text-deep-navy transition-all duration-200 hover:bg-golden-orange border-0 cursor-pointer"
              onClick={() => {
                onLoginClick()
                setIsOpen(false)
              }}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
