import { ExternalLink } from 'lucide-react'

type LinkType = 'songsterr' | 'ultimate-guitar' | 'youtube' | 'other'

interface SongLinksProps {
  links: string[]
  size?: 'sm' | 'md'
}

function getLinkType(url: string): LinkType {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('songsterr')) return 'songsterr'
    if (hostname.includes('ultimate-guitar') || hostname.includes('ultimateguitar') || hostname.includes('tabs.ultimate-guitar')) return 'ultimate-guitar'
    if (hostname.includes('youtube') || hostname.includes('youtu.be')) return 'youtube'
    return 'other'
  } catch {
    return 'other'
  }
}

function getLinkLabel(type: LinkType): string {
  switch (type) {
    case 'songsterr': return 'Songsterr'
    case 'ultimate-guitar': return 'Ultimate Guitar'
    case 'youtube': return 'YouTube'
    default: return 'Link'
  }
}

// SVG icons for each platform
function SongsterrIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/>
    </svg>
  )
}

function UltimateGuitarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z"/>
    </svg>
  )
}

function YouTubeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
    </svg>
  )
}

function LinkIcon({ type, size }: { type: LinkType; size: number }) {
  switch (type) {
    case 'songsterr':
      return <SongsterrIcon size={size} />
    case 'ultimate-guitar':
      return <UltimateGuitarIcon size={size} />
    case 'youtube':
      return <YouTubeIcon size={size} />
    default:
      return <ExternalLink size={size} />
  }
}

function getLinkColor(type: LinkType): string {
  switch (type) {
    case 'songsterr': return 'text-[#FF6B35] hover:text-[#FF8255]'
    case 'ultimate-guitar': return 'text-[#FFC600] hover:text-[#FFD633]'
    case 'youtube': return 'text-[#FF0000] hover:text-[#FF3333]'
    default: return 'text-deep-navy hover:text-light-gray'
  }
}

export default function SongLinks({ links, size = 'md' }: SongLinksProps) {
  if (!links || links.length === 0) return null

  const iconSize = size === 'sm' ? 18 : 24
  const padding = size === 'sm' ? 'p-1.5' : 'p-2'

  return (
    <div className="flex items-center gap-2">
      {links.map((url, index) => {
        const type = getLinkType(url)
        const label = getLinkLabel(type)
        const colorClass = getLinkColor(type)

        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${padding} rounded-lg transition-all duration-200 ${colorClass} hover:bg-cream`}
            title={label}
          >
            <LinkIcon type={type} size={iconSize} />
          </a>
        )
      })}
    </div>
  )
}
