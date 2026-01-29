import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAuth } from './hooks/useAuth'

function App() {
  const { loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-10 text-light-gray">Loading...</div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default App
