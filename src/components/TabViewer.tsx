import { useEffect, useRef, useState } from 'react'
import * as alphaTab from '@coderline/alphatab'

interface TabViewerProps {
  alphaTex: string | object | undefined // string expected, but handle legacy object format gracefully
  title?: string
  artist?: string
}

export default function TabViewer({ alphaTex, title, artist }: TabViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<alphaTab.AlphaTabApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clean up previous instance
    if (apiRef.current) {
      apiRef.current.destroy()
      apiRef.current = null
    }

    // Validate alphaTex - must be a non-empty string
    if (!alphaTex || typeof alphaTex !== 'string') {
      setIsLoading(false)
      setError(typeof alphaTex === 'object' ? 'Tablature is in legacy format' : 'No tablature data')
      return
    }

    const trimmedTex = alphaTex.trim()
    if (!trimmedTex) {
      setIsLoading(false)
      setError('No tablature data')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build the final tex string with optional title/artist
      let tex = alphaTex

      // Add title/artist if provided and not already in the tex
      if (title && !tex.includes('\\title')) {
        tex = `\\title "${title}"\n${tex}`
      }
      if (artist && !tex.includes('\\artist')) {
        tex = `\\artist "${artist}"\n${tex}`
      }

      console.log('Rendering alphaTex:', tex)

      // Initialize AlphaTab
      const settings = new alphaTab.Settings()
      settings.core.tex = true
      settings.core.engine = 'svg'
      // Font directory - use base URL for fonts
      settings.core.fontDirectory = import.meta.env.BASE_URL + 'font/'

      // Display settings
      settings.display.scale = 1.0
      settings.display.stretchForce = 0.8

      // Custom colors
      const staffLineColor = alphaTab.model.Color.fromJson('#B8BAB8')
      const mainGlyphColor = alphaTab.model.Color.fromJson('#00162D')
      const secondaryGlyphColor = alphaTab.model.Color.fromJson('#2D6A5C')
      const barSeparatorColor = alphaTab.model.Color.fromJson('#B8BAB8')

      if (staffLineColor) settings.display.resources.staffLineColor = staffLineColor
      if (mainGlyphColor) settings.display.resources.mainGlyphColor = mainGlyphColor
      if (secondaryGlyphColor) settings.display.resources.secondaryGlyphColor = secondaryGlyphColor
      if (barSeparatorColor) settings.display.resources.barSeparatorColor = barSeparatorColor

      // Notation settings - show only tabs, not standard notation
      settings.notation.elements.set(alphaTab.NotationElement.ScoreTitle, false)
      settings.notation.elements.set(alphaTab.NotationElement.ScoreSubTitle, false)
      settings.notation.elements.set(alphaTab.NotationElement.ScoreArtist, false)
      settings.notation.elements.set(alphaTab.NotationElement.ScoreAlbum, false)
      settings.notation.elements.set(alphaTab.NotationElement.ScoreWords, false)
      settings.notation.elements.set(alphaTab.NotationElement.ScoreMusic, false)
      settings.notation.elements.set(alphaTab.NotationElement.ScoreCopyright, false)
      settings.notation.elements.set(alphaTab.NotationElement.GuitarTuning, true)

      // Create API
      const api = new alphaTab.AlphaTabApi(containerRef.current, settings)
      apiRef.current = api

      // Event handlers
      api.renderStarted.on(() => {
        setIsLoading(true)
      })

      api.renderFinished.on(() => {
        setIsLoading(false)
      })

      api.error.on((e) => {
        console.error('AlphaTab error:', e)
        setError(e.message || 'Failed to render tablature')
        setIsLoading(false)
      })

      // Load the tex
      api.tex(tex)

    } catch (e) {
      console.error('AlphaTab initialization error:', e)
      setError(e instanceof Error ? e.message : 'Failed to initialize tablature viewer')
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      if (apiRef.current) {
        apiRef.current.destroy()
        apiRef.current = null
      }
    }
  }, [alphaTex, title, artist])

  if (error) {
    return (
      <div className="bg-cream rounded-lg p-4 text-center text-light-gray">
        {error}
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-off-white/80 z-10">
          <div className="text-light-gray">Loading tablature...</div>
        </div>
      )}
      <div
        ref={containerRef}
        className="alphatab-container bg-off-white rounded-lg overflow-x-auto"
        style={{ minHeight: '200px' }}
      />
    </div>
  )
}
