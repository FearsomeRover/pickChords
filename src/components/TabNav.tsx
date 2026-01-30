import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut, LogIn } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

export type TabType = 'chords' | 'songs' | 'progress' | 'logs'

interface TabNavProps {
  user: { username: string; is_admin?: boolean } | null
  onLoginClick: () => void
  onLogout: () => void
}

export default function TabNav({ user, onLoginClick, onLogout }: TabNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const isMobile = useIsMobile()
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

  // Mobile hamburger menu link style
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 text-base font-medium transition-all duration-200 no-underline rounded-lg ${
      isActive
        ? 'bg-coral text-deep-navy'
        : 'text-cream hover:bg-[#001a3d] hover:text-off-white'
    }`

  // Desktop horizontal nav link style
  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 no-underline border-b-2 whitespace-nowrap ${
      isActive
        ? 'text-off-white border-coral'
        : 'text-cream border-transparent hover:text-off-white'
    }`

  // Mobile Layout - Hamburger Menu
  if (isMobile) {
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
            <NavLink to="/chords" className={mobileLinkClass}>
              Chords
            </NavLink>
            <NavLink to="/songs" className={mobileLinkClass}>
              Songs
            </NavLink>
            {user && (
              <NavLink to="/progress" className={mobileLinkClass}>
                My Progress
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/logs" className={mobileLinkClass}>
                Logs
              </NavLink>
            )}

            {/* Divider */}
            <div className="h-px bg-[#003366] my-2" />

            {/* Auth section */}
            {user ? (
              <>
                <NavLink to="/profile" className={mobileLinkClass}>
                  Profile
                </NavLink>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-cream font-medium">{user.username}</span>
                  <button
                    className="p-2 rounded-lg bg-coral text-deep-navy transition-all duration-200 hover:bg-golden-orange border-0 cursor-pointer"
                    onClick={() => {
                      onLogout()
                      setIsOpen(false)
                    }}
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <button
                className="w-full px-4 py-3 text-base rounded-lg font-medium bg-coral text-deep-navy transition-all duration-200 hover:bg-golden-orange border-0 cursor-pointer flex items-center justify-center gap-2"
                onClick={() => {
                  onLoginClick()
                  setIsOpen(false)
                }}
              >
                <LogIn size={20} />
                Login
              </button>
            )}
          </div>
        </div>
      </nav>
    )
  }

  // Desktop Layout - Horizontal Navbar
  return (
    <nav className="bg-deep-navy rounded-xl mb-6 px-6 py-4">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-off-white whitespace-nowrap">Pick Chords</h1>

        <div className="flex gap-4 items-center">
          <NavLink to="/chords" className={desktopLinkClass}>
            Chords
          </NavLink>
          <NavLink to="/songs" className={desktopLinkClass}>
            Songs
          </NavLink>
          {user && (
            <NavLink to="/progress" className={desktopLinkClass}>
              My Progress
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/logs" className={desktopLinkClass}>
              Logs
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NavLink
                to="/profile"
                className="text-cream font-medium hover:text-off-white transition-colors no-underline whitespace-nowrap"
              >
                {user.username}
              </NavLink>
              <button
                className="p-2 rounded-lg bg-coral text-deep-navy transition-all duration-200 hover:bg-golden-orange border-0 cursor-pointer"
                onClick={onLogout}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              className="px-4 py-2 text-sm rounded-lg font-medium bg-coral text-deep-navy transition-all duration-200 hover:bg-golden-orange border-0 cursor-pointer whitespace-nowrap flex items-center gap-2"
              onClick={onLoginClick}
            >
              <LogIn size={16} />
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
