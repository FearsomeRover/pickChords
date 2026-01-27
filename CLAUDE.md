# PickChords

A personal guitar chord library web application with songs, tags, and favorites.

## Project Status

**Current State:** Deployed and running at https://bujdi.sch.bme.hu/pickChords/

### Completed
- NestJS backend with TypeScript
- React TypeScript frontend with Vite
- PostgreSQL database with JSONB storage
- User authentication (JWT)
- Chords CRUD with SVG diagrams (add, edit, delete)
- Songs with associated chords and tags
- Tags with custom colors
- Favorites system (requires login)
- Search and filter functionality
- Responsive dark-themed UI
- Docker containerization with multi-stage build
- Subpath deployment support (BASE_PATH)
- Nginx reverse proxy configuration

### Architecture
```
Nginx  →  Docker (Frontend + NestJS API)  →  PostgreSQL
```

## Tech Stack
- **Frontend:** React 19, Vite, TypeScript
- **Backend:** NestJS 10, TypeScript
- **Database:** PostgreSQL with JSONB
- **Auth:** JWT with Passport
- **Styling:** Plain CSS (dark theme)
- **Deployment:** Docker, Nginx

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
  chord_ids: [1, 3, 5],
  tag_ids: [1, 2],
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

## Future Plans

### Features to Consider
- [ ] Edit existing songs
- [ ] Chord categories/types (major, minor, 7th, etc.)
- [ ] Barre chord indicator on diagrams
- [ ] Import/export chord collections
- [ ] Audio playback of chord (Web Audio API)
- [ ] Chord progressions / song builder
- [ ] Print-friendly chord sheets
- [ ] Start fret selector in chord editor

### Technical Improvements
- [ ] Add unit tests
- [ ] Add error boundaries in React
- [ ] Add loading states/skeletons
