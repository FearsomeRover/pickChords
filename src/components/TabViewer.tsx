import { useEffect, useRef, useState } from 'react'
import * as alphaTab from '@coderline/alphatab'
import { SongTablature } from '../types'
import { tablatureToAlphaTex } from '../utils/alphaTexConverter'

interface TabViewerProps {
  tablature: SongTablature
  title?: string
  artist?: string
}

export default function TabViewer({ tablature, title, artist }: TabViewerProps) {
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

    // Validate tablature structure
    console.log('TabViewer received tablature:', JSON.stringify(tablature, null, 2))

    if (!tablature || typeof tablature !== 'object') {
      console.log('TabViewer: tablature is null or not an object')
      setIsLoading(false)
      setError('Invalid tablature data')
      return
    }

    // Check if we have any measures - handle both direct and nested structures
    let measures = tablature.measures

    // Sometimes the data might come as a string from the database
    if (typeof tablature === 'string') {
      try {
        const parsed = JSON.parse(tablature)
        measures = parsed.measures
        console.log('TabViewer: parsed string tablature')
      } catch (e) {
        console.log('TabViewer: failed to parse string tablature')
        setIsLoading(false)
        setError('Invalid tablature format')
        return
      }
    }

    console.log('TabViewer measures:', measures)

    if (!measures || !Array.isArray(measures) || measures.length === 0) {
      console.log('TabViewer: no valid measures found')
      setIsLoading(false)
      setError('No tablature data')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Ensure we have a proper tablature object with measures
      const normalizedTablature: SongTablature = {
        measures: measures,
        tuning: tablature.tuning
      }

      // Convert our data model to alphaTex
      const tex = tablatureToAlphaTex(normalizedTablature, { title, artist })
      console.log('Generated alphaTex:', tex)

      // Initialize AlphaTab
      const settings = new alphaTab.Settings()
      settings.core.tex = true
      settings.core.engine = 'svg'

      // Display settings
      settings.display.scale = 1.0
      settings.display.stretchForce = 0.8

      // Custom colors (using type assertion since fromJson can return null but won't with valid hex)
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
  }, [tablature, title, artist])

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
