import { Chord, StringData } from "../types";

interface ChordDiagramProps {
  chord: Partial<Chord> & { strings: StringData[] };
  width?: number;
  height?: number;
}

interface Barre {
  fret: number;
  finger: number;
  fromString: number;
  toString: number;
}

export default function ChordDiagram({
  chord,
  width = 160,
  height = 200,
}: ChordDiagramProps) {
  const padding = { top: 35, left: 20, right: 20, bottom: 15 };
  const numStrings = 6;
  const numFrets = 5;

  const diagramWidth = width - padding.left - padding.right;
  const diagramHeight = height - padding.top - padding.bottom;

  const stringSpacing = diagramWidth / (numStrings - 1);
  const fretSpacing = diagramHeight / numFrets;

  const getStringX = (stringIndex: number) =>
    padding.left + stringIndex * stringSpacing;
  const getFretY = (fretIndex: number) => padding.top + fretIndex * fretSpacing;

  const backgroundColor = "#2B7463";
  const lineColor = "#00162D";
  const fingerColor = "#FFBA55";
  const textColor = "#00162D";
  const mutedColor = "#00162D";

  const startFret = chord.start_fret || 1;

  // Detect barres: same finger on same fret across multiple strings
  const detectBarres = (): Barre[] => {
    const barres: Barre[] = [];
    const fingerPositions: Map<string, number[]> = new Map();

    // Group strings by finger+fret combination
    chord.strings.forEach((string, i) => {
      if (string.fret !== "x" && string.fret !== 0 && string.finger) {
        const key = `${string.finger}-${string.fret}`;
        if (!fingerPositions.has(key)) {
          fingerPositions.set(key, []);
        }
        fingerPositions.get(key)!.push(i);
      }
    });

    // Create barre spanning from first to last string with same finger+fret
    fingerPositions.forEach((strings, key) => {
      if (strings.length >= 2) {
        const [finger, fret] = key.split("-").map(Number);
        const minString = Math.min(...strings);
        const maxString = Math.max(...strings);

        barres.push({
          fret,
          finger,
          fromString: minString,
          toString: maxString,
        });
      }
    });

    return barres;
  };

  const barres = detectBarres();

  // Check if a string position is covered by a barre
  const isInBarre = (stringIndex: number, fret: number): boolean => {
    return barres.some(
      (b) =>
        b.fret === fret &&
        stringIndex >= b.fromString &&
        stringIndex <= b.toString,
    );
  };

  const radius = Math.min(14, stringSpacing * 0.4, fretSpacing * 0.35);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Background */}
      <rect width={width} height={height} fill={backgroundColor} rx={4} />

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
          x={padding.left - 12}
          y={padding.top + fretSpacing / 2 + 4}
          fill={mutedColor}
          fontSize={Math.max(10, width * 0.07)}
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

      {/* Draw barres */}
      {barres.map((barre, i) => {
        const fretNum = startFret > 1 ? barre.fret - startFret + 1 : barre.fret;
        const y = getFretY(fretNum) - fretSpacing / 2;
        const x1 = getStringX(barre.fromString);
        const x2 = getStringX(barre.toString);
        const barreWidth = x2 - x1;
        const barreHeight = radius * 2;

        return (
          <g key={`barre-${i}`}>
            <rect
              x={x1 - radius}
              y={y - radius}
              width={barreWidth + radius * 2}
              height={barreHeight}
              rx={radius}
              ry={radius}
              fill={fingerColor}
            />
            <text
              x={x1 + barreWidth / 2}
              y={y + radius * 0.35}
              fill={textColor}
              fontSize={radius}
              fontWeight="bold"
              textAnchor="middle"
            >
              {barre.finger}
            </text>
          </g>
        );
      })}

      {/* String markers (X, O, and finger positions) */}
      {chord.strings.map((string, i) => {
        const x = getStringX(i);

        if (string.fret === "x") {
          // Muted string - draw X
          const size = Math.min(8, radius * 0.6);
          const y = padding.top - 18;
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
          );
        }

        if (string.fret === 0) {
          // Open string - draw O
          return (
            <circle
              key={`marker-${i}`}
              cx={x}
              cy={padding.top - 18}
              r={Math.min(8, radius * 0.6)}
              fill="none"
              stroke={mutedColor}
              strokeWidth={2}
            />
          );
        }

        // Skip if this position is part of a barre
        if (isInBarre(i, string.fret)) {
          return null;
        }

        // Fretted note - draw filled circle with finger number
        const fretNum =
          startFret > 1 ? string.fret - startFret + 1 : string.fret;
        const y = getFretY(fretNum) - fretSpacing / 2;

        return (
          <g key={`marker-${i}`}>
            <circle cx={x} cy={y} r={radius} fill={fingerColor} />
            {string.finger && (
              <text
                x={x}
                y={y + radius * 0.35}
                fill={textColor}
                fontSize={radius}
                fontWeight="bold"
                textAnchor="middle"
              >
                {string.finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
