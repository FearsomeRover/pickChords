# PickChords

A personal guitar chord library web application with songs, tags, and favorites.

## Project Status

**Current State:** Migrated to NestJS + TypeScript with Songs Feature

### Completed
- NestJS backend with TypeScript
- React TypeScript frontend with Vite
- PostgreSQL database with JSONB storage
- User authentication (JWT)
- Chords CRUD with SVG diagrams
- Songs with associated chords and tags
- Tags with custom colors
- Favorites system (requires login)
- Search and filter functionality
- Responsive dark-themed UI

### Architecture
```
Frontend (React + Vite + TypeScript)  →  NestJS API  →  PostgreSQL
```

## Tech Stack
- **Frontend:** React 19, Vite, TypeScript
- **Backend:** NestJS 10, TypeScript
- **Database:** PostgreSQL with JSONB
- **Auth:** JWT with Passport
- **Styling:** Plain CSS (dark theme)

## Project Structure
```
server/                         # NestJS Backend
  src/
    main.ts                     # NestJS bootstrap
    app.module.ts               # Root module
    database/                   # PostgreSQL connection
    chords/                     # Chords CRUD
    auth/                       # JWT authentication
    tags/                       # Tags CRUD
    songs/                      # Songs CRUD
    favorites/                  # Favorites management

src/                            # React TypeScript Frontend
  main.tsx
  App.tsx
  index.css
  types/                        # TypeScript interfaces
  components/                   # React components
  hooks/                        # Custom hooks
  context/                      # React context
```

## Data Models

### Chord
```javascript
{
  id: 1,
  name: "Am",
  strings: [
    { fret: 'x' },
    { fret: 0 },
    { fret: 2, finger: 2 },
    { fret: 2, finger: 3 },
    { fret: 1, finger: 1 },
    { fret: 0 },
  ],
  start_fret: 1
}
```

### Song
```javascript
{
  id: 1,
  name: "Wonderwall",
  artist: "Oasis",
  notes: "Capo 2nd fret",
  chord_ids: [1, 3, 5],  // References chord IDs
  tag_ids: [1, 2],       // References tag IDs
  chords: [...],         // Expanded when fetched
  tags: [...],           // Expanded when fetched
  is_favorite: true      // When user is logged in
}
```

### Tag
```javascript
{
  id: 1,
  name: "Rock",
  color: "#e74c3c"
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
| POST | `/api/chords` | Create chord |
| PUT | `/api/chords/:id` | Update chord |
| DELETE | `/api/chords/:id` | Delete chord |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List all tags |
| POST | `/api/tags` | Create tag |
| DELETE | `/api/tags/:id` | Delete tag |

### Songs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/songs` | List songs (`?search=`, `?tag=`, `?favorites=true`) |
| GET | `/api/songs/:id` | Get song with expanded chords/tags |
| POST | `/api/songs` | Create song |
| PUT | `/api/songs/:id` | Update song |
| DELETE | `/api/songs/:id` | Delete song |

### Favorites (auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/songs/:id/favorite` | Add to favorites |
| DELETE | `/api/songs/:id/favorite` | Remove from favorites |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=postgresql://user:password@localhost:5432/pickchords
PORT=3000
JWT_SECRET=your-secret-key-here
```

## Setup (Local Development)

1. Install frontend dependencies: `npm install`
2. Install backend dependencies: `cd server && npm install`
3. Create `.env` file from `.env.example`
4. Start PostgreSQL database
5. Run `npm run server` (backend) and `npm run dev` (frontend)

## Docker Deployment

### Quick Start (with bundled PostgreSQL)
```bash
docker compose up -d
```
App will be available at http://localhost:3000

### Production (with external database)
1. Create a `.env` file:
```
DATABASE_URL=postgresql://user:password@your-db-host:5432/pickchords
JWT_SECRET=your-secure-secret-key
PORT=3000
```

2. Run with production compose:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Build image only
```bash
docker build -t pickchords .
```

## Future Plans

### Features to Consider
- [ ] Edit existing songs
- [ ] Chord categories/types (major, minor, 7th, etc.)
- [ ] Barre chord indicator on diagrams
- [ ] Import/export chord collections
- [ ] Audio playback of chord (Web Audio API)
- [ ] Chord progressions / song builder
- [ ] Print-friendly chord sheets

### Technical Improvements
- [ ] Add unit tests
- [ ] Add error boundaries in React
- [x] Docker containerization
