import { NavLink } from 'react-router-dom'

export type TabType = 'chords' | 'songs' | 'favorites' | 'progress' | 'logs'

interface TabNavProps {
  showFavorites: boolean
  user: { username: string; is_admin?: boolean } | null
  onLoginClick: () => void
  onLogout: () => void
}

export default function TabNav({ showFavorites, user, onLoginClick, onLogout }: TabNavProps) {
  const isAdmin = user?.is_admin === true
  return (
    <nav className="bg-deep-navy rounded-xl mb-6 px-8 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-off-white">Pick Chords</h1>

        <div className="flex gap-8 items-center">
          <NavLink
            to="/chords"
            className={({ isActive }) =>
              `px-6 py-2 text-sm font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 no-underline border-b-2 ${
                isActive
                  ? 'text-off-white border-coral'
                  : 'text-cream border-transparent hover:text-off-white'
              }`
            }
          >
            Chords
          </NavLink>
          <NavLink
            to="/songs"
            className={({ isActive }) =>
              `px-6 py-2 text-sm font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 no-underline border-b-2 ${
                isActive
                  ? 'text-off-white border-coral'
                  : 'text-cream border-transparent hover:text-off-white'
              }`
            }
          >
            Songs
          </NavLink>
          {showFavorites && (
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `px-6 py-2 text-sm font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 no-underline border-b-2 ${
                  isActive
                    ? 'text-off-white border-coral'
                    : 'text-cream border-transparent hover:text-off-white'
                }`
              }
            >
              Favorites
            </NavLink>
          )}
          {user && (
            <NavLink
              to="/progress"
              className={({ isActive }) =>
                `px-6 py-2 text-sm font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 no-underline border-b-2 ${
                  isActive
                    ? 'text-off-white border-coral'
                    : 'text-cream border-transparent hover:text-off-white'
                }`
              }
            >
              My Progress
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/logs"
              className={({ isActive }) =>
                `px-6 py-2 text-sm font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 no-underline border-b-2 ${
                  isActive
                    ? 'text-off-white border-coral'
                    : 'text-cream border-transparent hover:text-off-white'
                }`
              }
            >
              Logs
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-cream font-medium">{user.username}</span>
              <button
                className="px-4 py-2 text-sm rounded-lg font-medium bg-coral text-deep-navy transition-all duration-200 hover:bg-golden-orange border-0 cursor-pointer"
                onClick={onLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="px-4 py-2 text-sm rounded-lg font-medium bg-coral text-deep-navy transition-all duration-200 hover:bg-golden-orange border-0 cursor-pointer"
              onClick={onLoginClick}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
