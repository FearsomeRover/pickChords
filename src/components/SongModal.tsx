import { Song } from '../types'
import ChordDiagram from './ChordDiagram'
import TagChip from './TagChip'

interface SongModalProps {
  song: Song
  onClose: () => void
  onDelete: () => void
  onFavorite?: () => void
  isFavorite?: boolean
}

export default function SongModal({ song, onClose, onDelete, onFavorite, isFavorite }: SongModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal song-modal" onClick={(e) => e.stopPropagation()}>
        <div className="song-modal-header">
          <div>
            <h2>{song.name}</h2>
            {song.artist && <p className="song-artist">{song.artist}</p>}
          </div>
          {onFavorite && (
            <button
              className={`favorite-btn large ${isFavorite ? 'active' : ''}`}
              onClick={onFavorite}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '\u2605' : '\u2606'}
            </button>
          )}
        </div>

        {song.tags && song.tags.length > 0 && (
          <div className="song-tags" style={{ marginBottom: '20px' }}>
            {song.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {song.notes && (
          <div className="song-notes">
            <h4>Notes</h4>
            <p>{song.notes}</p>
          </div>
        )}

        {song.chords && song.chords.length > 0 && (
          <div className="song-chords">
            <h4>Chords</h4>
            <div className="chords-grid compact">
              {song.chords.map((chord) => (
                <div key={chord.id} className="chord-card compact">
                  <h3>{chord.name}</h3>
                  <ChordDiagram chord={chord} width={120} height={150} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="button-group" style={{ marginTop: '24px' }}>
          <button className="btn btn-secondary" onClick={onDelete}>
            Delete
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
