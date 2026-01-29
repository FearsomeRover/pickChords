import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ChordsPage from './pages/ChordsPage'
import SongsPage from './pages/SongsPage'
import FavoritesPage from './pages/FavoritesPage'
import NewSongPage from './pages/NewSongPage'
import StrummingPatternPage from './pages/StrummingPatternPage'
import LogsPage from './pages/LogsPage'
import ProgressPage from './pages/ProgressPage'
import NotFoundPage from './pages/NotFoundPage'

// Lazy load the SongPage component for code splitting
const SongPage = lazy(() => import('./components/SongPage'))

// Get the base path from Vite's configuration
const basePath = import.meta.env.BASE_URL

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/chords" replace />,
      },
      {
        path: 'chords',
        element: <ChordsPage />,
      },
      {
        path: 'songs',
        element: <SongsPage />,
      },
      {
        path: 'songs/new',
        element: <NewSongPage />,
      },
      {
        path: 'songs/:id',
        element: <SongPage />,
      },
      {
        path: 'songs/:id/strumming',
        element: <StrummingPatternPage />,
      },
      {
        path: 'favorites',
        element: <FavoritesPage />,
      },
      {
        path: 'progress',
        element: <ProgressPage />,
      },
      {
        path: 'logs',
        element: <LogsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
], {
  basename: basePath,
})
