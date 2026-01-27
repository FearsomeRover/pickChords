import React from 'react'
import { Chord, StringData } from '../types'

interface ChordDiagramProps {
  chord: Partial<Chord> & { strings: StringData[] };
  width?: number;
  height?: number;
}

export default function ChordDiagram({ chord, width = 160, height = 200 }: ChordDiagramProps) {
  const padding = { top: 35, left: 20, right: 20, bottom: 15 }
  const numStrings = 6
  const numFrets = 5

  const diagramWidth = width - padding.left - padding.right
  const diagramHeight = height - padding.top - padding.bottom

  const stringSpacing = diagramWidth / (numStrings - 1)
  const fretSpacing = diagramHeight / numFrets

  const getStringX = (stringIndex: number) => padding.left + stringIndex * stringSpacing
  const getFretY = (fretIndex: number) => padding.top + fretIndex * fretSpacing

  const backgroundColor = '#1a1a1a'
  const lineColor = '#666'
  const fingerColor = '#5b8bd4'
  const textColor = '#fff'
  const mutedColor = '#888'

  const startFret = chord.start_fret || 1

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Background */}
      <rect width={width} height={height} fill={backgroundColor} />

      {/* Nut (thick line at top if starting from fret 1) */}
      {startFret === 1 && (
        <line
          x1={padding.left}
          y1={padding.top}
          x2={width - padding.right}
          y2={padding.top}
          stroke={lineColor}
          strokeWidth={4}
        />
      )}

      {/* Start fret indicator for barre chords */}
      {startFret > 1 && (
        <text
          x={padding.left - 15}
          y={padding.top + fretSpacing / 2 + 5}
          fill={textColor}
          fontSize="12"
          textAnchor="middle"
        >
          {startFret}
        </text>
      )}

      {/* Frets (horizontal lines) */}
      {Array.from({ length: numFrets + 1 }).map((_, i) => (
        <line
          key={`fret-${i}`}
          x1={padding.left}
          y1={getFretY(i)}
          x2={width - padding.right}
          y2={getFretY(i)}
          stroke={lineColor}
          strokeWidth={i === 0 ? 2 : 1}
        />
      ))}

      {/* Strings (vertical lines) */}
      {Array.from({ length: numStrings }).map((_, i) => (
        <line
          key={`string-${i}`}
          x1={getStringX(i)}
          y1={padding.top}
          x2={getStringX(i)}
          y2={height - padding.bottom}
          stroke={lineColor}
          strokeWidth={1}
        />
      ))}

      {/* String markers (X, O, and finger positions) */}
      {chord.strings.map((string, i) => {
        const x = getStringX(i)

        if (string.fret === 'x') {
          // Muted string - draw X
          const size = 8
          const y = padding.top - 18
          return (
            <g key={`marker-${i}`}>
              <line
                x1={x - size}
                y1={y - size}
                x2={x + size}
                y2={y + size}
                stroke={mutedColor}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <line
                x1={x + size}
                y1={y - size}
                x2={x - size}
                y2={y + size}
                stroke={mutedColor}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </g>
          )
        }

        if (string.fret === 0) {
          // Open string - draw O
          return (
            <circle
              key={`marker-${i}`}
              cx={x}
              cy={padding.top - 18}
              r={8}
              fill="none"
              stroke={mutedColor}
              strokeWidth={2}
            />
          )
        }

        // Fretted note - draw filled circle with finger number
        const fretNum = startFret > 1
          ? string.fret - startFret + 1
          : string.fret
        const y = getFretY(fretNum) - fretSpacing / 2
        const radius = 14

        return (
          <g key={`marker-${i}`}>
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={fingerColor}
            />
            {string.finger && (
              <text
                x={x}
                y={y + 5}
                fill={textColor}
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
              >
                {string.finger}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
