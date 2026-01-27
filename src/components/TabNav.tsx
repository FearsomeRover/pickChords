export type TabType = 'chords' | 'songs' | 'favorites'

interface TabNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  showFavorites: boolean
}

export default function TabNav({ activeTab, onTabChange, showFavorites }: TabNavProps) {
  return (
    <div className="tab-nav">
      <button
        className={`tab-btn ${activeTab === 'chords' ? 'active' : ''}`}
        onClick={() => onTabChange('chords')}
      >
        Chords
      </button>
      <button
        className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
        onClick={() => onTabChange('songs')}
      >
        Songs
      </button>
      {showFavorites && (
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => onTabChange('favorites')}
        >
          Favorites
        </button>
      )}
    </div>
  )
}
