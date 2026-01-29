import { Link } from 'react-router-dom'
import { Song } from '../types'
import TagChip from './TagChip'

interface SongCardProps {
  song: Song
  onFavorite?: () => void
  isFavorite?: boolean
}

export default function SongCard({ song, onFavorite, isFavorite }: SongCardProps) {
  return (
    <Link
      to={`/songs/${song.id}`}
      className="block bg-off-white rounded-xl p-5 cursor-pointer transition-all duration-200 border-2 border-[#D4C9BC] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,22,45,0.1)] hover:border-deep-navy no-underline text-deep-navy"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl">{song.name}</h3>
        {onFavorite && (
          <button
            className={`bg-transparent border-0 text-2xl cursor-pointer p-1 transition-all duration-200 hover:scale-110 ${
              isFavorite ? 'text-mustard-yellow' : 'text-light-gray'
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onFavorite()
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>
      {song.artist && <p className="text-light-gray text-sm mb-3">{song.artist}</p>}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {song.chords?.slice(0, 4).map((chord) => (
          <span key={chord.id} className="bg-teal-green text-off-white px-2.5 py-1 rounded text-[0.85rem]">
            {chord.name}
          </span>
        ))}
        {song.chords && song.chords.length > 4 && (
          <span className="bg-off-white text-light-gray px-2.5 py-1 rounded text-[0.85rem] border border-[#D4C9BC]">
            +{song.chords.length - 4}
          </span>
        )}
      </div>
      {song.tags && song.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {song.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </Link>
  )
}
