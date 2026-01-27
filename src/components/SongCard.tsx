import React from 'react'
import { Song } from '../types'
import TagChip from './TagChip'

interface SongCardProps {
  song: Song
  onClick: () => void
  onFavorite?: () => void
  isFavorite?: boolean
}

export default function SongCard({ song, onClick, onFavorite, isFavorite }: SongCardProps) {
  return (
    <div className="song-card" onClick={onClick}>
      <div className="song-card-header">
        <h3>{song.name}</h3>
        {onFavorite && (
          <button
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onFavorite()
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '\u2605' : '\u2606'}
          </button>
        )}
      </div>
      {song.artist && <p className="song-artist">{song.artist}</p>}
      <div className="song-chords-preview">
        {song.chords?.slice(0, 4).map((chord) => (
          <span key={chord.id} className="chord-badge">
            {chord.name}
          </span>
        ))}
        {song.chords && song.chords.length > 4 && (
          <span className="chord-badge more">+{song.chords.length - 4}</span>
        )}
      </div>
      {song.tags && song.tags.length > 0 && (
        <div className="song-tags">
          {song.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  )
}
