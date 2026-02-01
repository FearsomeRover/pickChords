import { SongTablature, TabMeasure, TabBeat, TabNote } from '../types'

/**
 * Convert our tablature data model to alphaTex format
 * alphaTex is alphaTab's text-based music notation language
 *
 * Format reference: https://alphatab.net/docs/alphatex/
 *
 * Note format for guitar: fret.string (1-indexed string)
 * Duration: :1 (whole), :2 (half), :4 (quarter), :8 (eighth), :16 (sixteenth)
 * Bar separator: |
 * Rest: r
 * Effects: { h } hammer-on, { p } pull-off, { s } slide, { b (0 4) } bend
 */

// Map technique to alphaTex effect
function getTechniqueEffect(technique?: string): string {
  const effects: Record<string, string> = {
    'h': 'h',   // hammer-on
    'p': 'p',   // pull-off
    '/': 's',   // slide (up)
    '\\': 's',  // slide (down)
    '~': 'v',   // vibrato
    'b': 'b (0 4)', // bend (default bend amount)
    'r': '',    // release - no direct equivalent
  }
  return technique ? effects[technique] || '' : ''
}

// Convert duration number to alphaTex duration
function getDuration(duration: number): string {
  // Our model: 1=whole, 2=half, 4=quarter, 8=eighth, 16=sixteenth
  // alphaTex: same format
  if ([1, 2, 4, 8, 16, 32].includes(duration)) {
    return `:${duration}`
  }
  return ':8' // default to eighth notes
}

// Convert a single note to alphaTex format
function noteToAlphaTex(note: TabNote): string {
  // alphaTex uses 1-indexed strings (1=high E, 6=low E)
  // Our model uses 0-indexed (0=high E, 5=low E)
  const stringNum = note.string + 1
  let result = `${note.fret}.${stringNum}`

  // Add technique effect if present
  const effect = getTechniqueEffect(note.technique)
  if (effect) {
    result += ` {${effect}}`
  }

  return result
}

// Convert a beat to alphaTex format
function beatToAlphaTex(beat: TabBeat, prevDuration: number): { tex: string; duration: number } {
  const parts: string[] = []

  // Add duration change if different from previous
  if (beat.duration !== prevDuration) {
    parts.push(getDuration(beat.duration))
  }

  if (beat.notes.length === 0) {
    // Rest
    parts.push('r')
  } else if (beat.notes.length === 1) {
    // Single note
    parts.push(noteToAlphaTex(beat.notes[0]))
  } else {
    // Chord - multiple notes played together
    // Format: (fret.string fret.string ...)
    const notes = beat.notes.map(noteToAlphaTex).join(' ')
    parts.push(`(${notes})`)
  }

  return {
    tex: parts.join(' '),
    duration: beat.duration
  }
}

// Convert a measure to alphaTex format
function measureToAlphaTex(measure: TabMeasure, prevDuration: number): { tex: string; duration: number } {
  const beatTexts: string[] = []
  let currentDuration = prevDuration

  for (const beat of measure.beats) {
    const result = beatToAlphaTex(beat, currentDuration)
    beatTexts.push(result.tex)
    currentDuration = result.duration
  }

  // If measure is empty, add a whole rest
  if (beatTexts.length === 0) {
    beatTexts.push(':1 r')
    currentDuration = 1
  }

  return {
    tex: beatTexts.join(' '),
    duration: currentDuration
  }
}

/**
 * Convert SongTablature to alphaTex format string
 */
export function tablatureToAlphaTex(
  tablature: SongTablature,
  options?: {
    title?: string
    artist?: string
    tempo?: number
  }
): string {
  const lines: string[] = []

  // Metadata
  if (options?.title) {
    lines.push(`\\title "${options.title}"`)
  }
  if (options?.artist) {
    lines.push(`\\artist "${options.artist}"`)
  }

  // Tempo from first measure or options
  const tempo = options?.tempo || tablature.measures[0]?.tempo || 120
  lines.push(`\\tempo ${tempo}`)

  // Track setup for guitar
  lines.push('\\track "Guitar"')
  lines.push('\\staff {tabs}')

  // Tuning - default to standard guitar tuning
  // alphaTex format: \tuning E4 B3 G3 D3 A2 E2 (high to low with octaves)
  if (tablature.tuning && tablature.tuning.length === 6) {
    // Our tuning is just note names, we need to add octaves
    // Standard: E4 B3 G3 D3 A2 E2
    const octaves = [4, 3, 3, 3, 2, 2]
    const tuningStr = tablature.tuning.map((note, i) => `${note}${octaves[i]}`).join(' ')
    lines.push(`\\tuning ${tuningStr}`)
  } else {
    lines.push('\\tuning E4 B3 G3 D3 A2 E2')
  }

  // Time signature from first measure
  const timeSignature = tablature.measures[0]?.timeSignature || '4/4'
  lines.push(`\\ts ${timeSignature.replace('/', ' ')}`)

  lines.push('') // blank line before notes

  // Convert measures
  let currentDuration = 4 // default to quarter notes
  const measureTexts: string[] = []

  for (const measure of tablature.measures) {
    const result = measureToAlphaTex(measure, currentDuration)
    measureTexts.push(result.tex)
    currentDuration = result.duration
  }

  // Join measures with bar lines
  lines.push(measureTexts.join(' | '))

  return lines.join('\n')
}

/**
 * Generate a simple test alphaTex string
 */
export function getTestAlphaTex(): string {
  return `
\\title "Test Tab"
\\tempo 120
\\track "Guitar"
\\staff {tabs}
\\tuning E4 B3 G3 D3 A2 E2
\\ts 4 4

:8 (0.1 0.2 2.3 2.4 0.5) (0.1 0.2 2.3 2.4 0.5) |
(0.1 2.2 2.3 2.4 0.5) r 3.2 5.2 |
:4 (2.1 2.2 2.3 4.4 4.5 2.6) :8 r r |
`.trim()
}
