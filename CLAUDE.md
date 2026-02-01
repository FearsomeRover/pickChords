# PickChords

A personal guitar chord library web application with songs, tags, favorites, and progress tracking.

## Project Status

**Current State:** Deployed and running at https://bujdi.sch.bme.hu/pickChords/

### Completed Features

#### Core Functionality
- NestJS backend with TypeScript
- React TypeScript frontend with Vite
- PostgreSQL database with JSONB storage
- User authentication (JWT) with role-based access control
- TanStack Query for data fetching with optimistic updates
- Tailwind CSS styling system

#### Chord Management
- Chords CRUD with SVG diagrams (add, edit, delete)
- Visual chord diagram editor with finger positions
- Search functionality
- Start fret selector

#### Song Management
- Songs with associated chords and tags
- **Dedicated edit page** with drag-and-drop chord reordering
- Strumming pattern editor with:
  - Visual beat display with tempo control
  - Keyboard shortcuts (↑/↓ for strokes, R for rest, X for skip)
  - Preset patterns (folk, rock, alternating)
  - Multiple note lengths (1/4, 1/8, 1/16, triplets)
  - Song part labeling (verse, chorus, etc.)
- Artist info and playing notes
- View/edit separation for cleaner UI

#### Progress Tracking System
- **Kanban board** with drag-and-drop functionality
- Four status columns:
  - Want to Learn (Indigo)
  - Learning (Amber)
  - Practicing (Green)
  - Mastered (Teal)
- Color-coded progress badges on song pages
- Optimistic UI updates for instant feedback
- Per-user progress tracking

#### Organization
- Tags with custom colors for categorization
- Favorites system (requires login)
- Filter songs by tag and favorites
- Search across chords and songs

#### Admin Features
- System logging with activity tracking
- Logs page with filtering:
  - Log level (info, warn, error)
  - Action type
  - User
  - Date range
- Pagination for large log sets
- IP address and user agent tracking

#### UI/UX
- React Router with code splitting and lazy loading
- Bookmarkable URLs and browser navigation
- Warm cream & coral themed UI with Tailwind
- Content max-width with margins for readability
- Stable navbar without layout shifts
- Responsive design
- Docker containerization with multi-stage build
- Subpath deployment support (BASE_PATH)
- Nginx reverse proxy configuration

### Architecture
```
Nginx  →  Docker (Frontend + NestJS API)  →  PostgreSQL
```

## Tech Stack
- **Frontend:** React 19, Vite, TypeScript, React Router 7, TanStack Query v5
- **Styling:** Tailwind CSS 3
- **Drag & Drop:** @dnd-kit/core, @dnd-kit/sortable
- **Backend:** NestJS 10, TypeScript
- **Database:** PostgreSQL with JSONB
- **Auth:** JWT with Passport
- **Deployment:** Docker, Nginx

## Color Scheme
**Primary Colors:**
- Deep Navy `#00162D` - Text, buttons, active states
- Cream `#F5F0E8` - Main background
- Peachy Pink `#EFAA97` - Outer background, hover states

**Accent Colors:**
- Coral `#FF9F87` - Decorative accents, navbar active indicator
- Golden Orange `#F4A261` - Warm highlights
- Teal Green `#2D6A5C` - Chord names, buttons

**Supporting Colors:**
- Light Gray `#B8BAB8` - Muted text, borders
- Off White `#FFFEF9` - Surface backgrounds
- Mustard Yellow `#E8A83A` - Favorites

**Progress Status Colors:**
- Indigo `#6366F1` - Want to Learn
- Amber `#F59E0B` - Learning
- Green `#10B981` - Practicing
- Teal Green `#2D6A5C` - Mastered

## Project Structure
```
server/                         # NestJS Backend
  src/
    main.ts                     # NestJS bootstrap
    app.module.ts               # Root module
    database/                   # PostgreSQL connection & migrations
    auth/                       # JWT authentication
    chords/                     # Chords CRUD
    songs/                      # Songs CRUD
    tags/                       # Tags CRUD
    favorites/                  # Favorites management
    progress/                   # Progress tracking (Kanban)
    logs/                       # System logging

src/                            # React TypeScript Frontend
  main.tsx                      # Entry point
  App.tsx                       # RouterProvider setup
  router.tsx                    # Route configuration
  index.css                     # Tailwind imports
  types/                        # TypeScript interfaces
    index.ts                    # Shared types (Chord, Song, Tag, Progress, etc.)
  components/                   # React components
    Layout.tsx                  # Shared layout with navbar
    TabNav.tsx                  # Navigation tabs (Chords, Songs, Favorites, Progress, Logs)
    ChordDiagram.tsx           # SVG chord visualization
    SongPage.tsx               # Song detail view (read-only)
    SongCard.tsx               # Song list item
    AuthModal.tsx              # Login/register modal
    AddSongModal.tsx           # Add song modal
    TagChip.tsx                # Tag display component
    StrummingPatternEditor.tsx # Visual strumming pattern editor
    StrummingPatternDisplay.tsx # Read-only pattern display
  pages/                        # Route pages
    ChordsPage.tsx             # /chords route
    SongsPage.tsx              # /songs route
    FavoritesPage.tsx          # /favorites route
    EditSongPage.tsx           # /songs/:id/edit route
    ProgressPage.tsx           # /progress route (Kanban board)
    LogsPage.tsx               # /logs route (admin only)
    NewSongPage.tsx            # /songs/new route
    NotFoundPage.tsx           # 404 page
  hooks/                        # Custom hooks
    useAuth.ts                 # Authentication hook
    useApi.ts                  # API client hook
    useQueries.ts              # TanStack Query hooks with optimistic updates
  context/                      # React context
    AuthContext.tsx            # Auth state management
```

## Routes

```
/                          → Redirects to /chords
/chords                    → Chords list with search
/songs                     → Songs list with filters
/songs/new                 → Create new song
/songs/:id                 → Song detail page (view mode, lazy loaded)
/songs/:id/edit            → Edit song (chords, strumming, delete)
/favorites                 → User's favorite songs (auth required)
/progress                  → Kanban progress board (auth required)
/logs                      → System logs (admin only)
/*                         → 404 page
```

All routes support:
- URL search params (`?search=...&tag=...`)
- Browser back/forward navigation
- Direct linking
- Subpath deployment via `BASE_PATH`

## Data Models

### Chord
```typescript
{
  id: number
  name: string
  strings: Array<{
    fret: number | 'x'
    finger?: number
  }>
  start_fret: number
  created_at: string
}
```

### Song
```typescript
{
  id: number
  name: string
  artist?: string
  notes?: string
  chord_ids: number[]
  tag_ids: number[]
  chords?: Chord[]           // Expanded when fetched
  tags?: Tag[]               // Expanded when fetched
  is_favorite?: boolean      // When user is logged in
  strumming_pattern?: StrummingPattern
  tablature?: SongTablature  // Guitar tablature data
  capo?: number
  links?: string[]
  user_id?: number
  created_at: string
}
```

### SongTablature
```typescript
{
  measures: TabMeasure[]     // Flat array of measures
  tuning?: string[]          // e.g., ["E", "A", "D", "G", "B", "E"]
}
```

### TabMeasure
```typescript
{
  beats: TabBeat[]           // Beats in this measure
  number?: number            // Measure number for display
  timeSignature?: string     // e.g., "4/4" (only if changes)
  tempo?: number             // BPM (only if changes)
  section?: string           // Section name (e.g., "Verse 1")
  instructions?: string[]    // e.g., ["let ring", "palm mute"]
}
```

### TabBeat
```typescript
{
  notes: TabNote[]           // Notes played simultaneously
  duration: number           // 1=whole, 2=half, 4=quarter, 8=eighth, 16=sixteenth
  chord?: string             // Chord name displayed above
  lyric?: string             // Lyric syllable displayed below
}
```

### TabNote
```typescript
{
  string: number             // 0-5 (0=high E, 5=low E)
  fret: number               // 0-24
  technique?: 'h' | 'p' | '/' | '\\' | '~' | 'b' | 'r'
}
```

### Tag
```typescript
{
  id: number
  name: string
  color: string
}
```

### SongProgress
```typescript
{
  id: number
  user_id: number
  song_id: number
  status: 'want_to_learn' | 'learning' | 'practicing' | 'mastered'
  position: number
  created_at: string
  updated_at: string
  song_name?: string         // Expanded
  song_artist?: string       // Expanded
  chord_count?: number       // Expanded
}
```

### LogEntry
```typescript
{
  id: number
  level: 'info' | 'warn' | 'error'
  action: string
  message: string
  user_id: number | null
  username: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any> | null
  created_at: string
}
```

## Commands
- `npm run dev` - Start Vite dev server (frontend only)
- `npm run server` - Start NestJS server in watch mode
- `npm run build` - Build frontend for production
- `npm run server:build` - Build NestJS server
- `npm run start` - Build + start server (production)

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (auth required) |

### Chords
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chords` | List chords (`?search=`) |
| GET | `/api/chords/:id` | Get single chord |
| POST | `/api/chords` | Create chord (auth required) |
| PUT | `/api/chords/:id` | Update chord (owner/admin only) |
| DELETE | `/api/chords/:id` | Delete chord (owner/admin only) |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List all tags |
| POST | `/api/tags` | Create tag (auth required) |
| DELETE | `/api/tags/:id` | Delete tag (auth required) |

### Songs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/songs` | List songs (`?search=`, `?tag=`, `?favorites=true`) |
| GET | `/api/songs/:id` | Get song with expanded chords/tags |
| POST | `/api/songs` | Create song (auth required) |
| PUT | `/api/songs/:id` | Update song (owner/admin only) |
| DELETE | `/api/songs/:id` | Delete song (owner/admin only) |

### Favorites (auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/songs/:id/favorite` | Add to favorites |
| DELETE | `/api/songs/:id/favorite` | Remove from favorites |

### Progress (auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress` | Get user's progress items |
| POST | `/api/progress` | Add song to progress |
| PUT | `/api/progress/:songId` | Update song progress/position |
| DELETE | `/api/progress/:songId` | Remove from progress |

### Logs (admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | Get logs with filters (`?level=`, `?action=`, `?user=`, `?startDate=`, `?endDate=`, `?page=`, `?limit=`) |

## Access Control

### Ownership-based Permissions
- Users can only edit/delete their own chords and songs
- Admins can edit/delete any chord or song
- Authentication required for creating content
- Progress tracking is per-user

### Admin-only Features
- System logs access
- View all user activity
- Full CRUD on all resources

## Environment Variables

### Server (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/pickchords
PORT=3000
JWT_SECRET=your-secret-key-here
```

### Frontend (.env.local for local dev)
```
VITE_API_URL=https://bujdi.sch.bme.hu/pickChords
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```

2. For frontend only (connecting to production API):
   ```bash
   # Create .env.local with VITE_API_URL=https://bujdi.sch.bme.hu/pickChords
   npm run dev
   ```

3. For full local stack:
   ```bash
   # Start PostgreSQL, create .env with DATABASE_URL
   npm run server    # Terminal 1: backend on :3000
   npm run dev       # Terminal 2: frontend on :5173
   ```

## Docker Deployment

### Subpath deployment (e.g., /pickChords/)
```bash
BASE_PATH=/pickChords/ docker compose up -d --build
```

### Nginx configuration
```nginx
location /pickChords/ {
    proxy_pass http://localhost:8080/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Server setup
```bash
# Create user
sudo useradd -r -s /bin/bash -m -d /opt/pickchords pickchords
sudo usermod -aG docker pickchords

# Clone and deploy
sudo -u pickchords git clone https://github.com/FearsomeRover/pickChords.git /opt/pickchords/app
cd /opt/pickchords/app
sudo -u pickchords tee .env << EOF
JWT_SECRET=$(openssl rand -base64 32)
EOF
BASE_PATH=/pickChords/ sudo -u pickchords docker compose up -d --build
```

### Update deployment
```bash
cd /opt/pickchords/app
git pull
BASE_PATH=/pickChords/ docker compose up -d --build
```

## Database Schema

### Tables
- `users` - User accounts (id, username, password_hash, is_admin)
- `chords` - Chord definitions (id, name, strings JSONB, start_fret, user_id)
- `tags` - Tag definitions (id, name, color)
- `songs` - Song details (id, name, artist, notes, chord_ids, tag_ids, strumming_pattern JSONB, user_id)
- `favorites` - User favorites (user_id, song_id)
- `song_progress` - Progress tracking (id, user_id, song_id, status, position)
- `logs` - System logs (id, level, action, message, user_id, ip_address, user_agent, metadata JSONB)

## Key Features Explained

### Strumming Pattern Editor
- Visual beat grid with measure divisions
- Keyboard navigation with arrow keys
- Stroke types: down, up, muted down/up, accented down/up, rest, skip
- Preset patterns for quick setup
- Tempo control (30-300 BPM)
- Note length selector with triplet support
- Song part labeling (verse, chorus, bridge, etc.)

### Progress Tracking Kanban
- Drag-and-drop between status columns
- Optimistic UI updates via TanStack Query
- Position tracking for custom ordering within columns
- Color-coded status badges throughout app
- Quick add from song detail page
- Remove via drag to delete or from Kanban

### Logging System
- Automatic logging of key actions (login, CRUD operations)
- Context capture (user, IP, user agent)
- Flexible filtering and pagination
- Admin-only access for privacy

## Future Plans

### Features to Consider
- [ ] Chord categories/types (major, minor, 7th, etc.)
- [ ] Barre chord indicator on diagrams
- [ ] Import/export chord collections
- [ ] Audio playback of chord (Web Audio API)
- [ ] Chord progressions / song builder
- [ ] Print-friendly chord sheets
- [ ] Shared song collections
- [ ] Practice timer/metronome integration
- [ ] Song setlists for performances
- [ ] Mobile app (React Native)

### Technical Improvements
- [ ] Add unit tests (Vitest, Jest)
- [ ] Add E2E tests (Playwright)
- [ ] Add error boundaries in React
- [ ] Add loading states/skeletons
- [ ] Implement caching strategies
- [ ] Add rate limiting
- [ ] Websockets for real-time updates
- [ ] Better error handling and user feedback
