# PickChords

A personal guitar chord library web application.

## Project Status

**Current State:** MVP Complete - Ready for deployment

### Completed
- React frontend with SVG-based chord diagram rendering
- Express.js backend with REST API
- PostgreSQL database integration with JSONB storage for chord data
- Search functionality with debounced queries
- Add/delete chord operations
- Responsive dark-themed UI

### Architecture
```
Frontend (React + Vite)  →  Express API  →  PostgreSQL
```

## Tech Stack
- **Frontend:** React 19, Vite
- **Backend:** Express.js 5
- **Database:** PostgreSQL with JSONB
- **Styling:** Plain CSS (dark theme)

## Data Model

Chords are stored as structured data, not images:

```javascript
{
  id: 1,
  name: "Am",
  strings: [
    { fret: 'x' },           // 6th string - muted
    { fret: 0 },             // 5th string - open
    { fret: 2, finger: 2 },  // 4th string - fret 2, finger 2
    { fret: 2, finger: 3 },  // 3rd string - fret 2, finger 3
    { fret: 1, finger: 1 },  // 2nd string - fret 1, finger 1
    { fret: 0 },             // 1st string - open
  ],
  start_fret: 1  // For barre chords higher up the neck
}
```

## Commands
- `npm run dev` - Start Vite dev server (frontend only)
- `npm run server` - Start Express server
- `npm run build` - Build frontend for production
- `npm run start` - Build + start server (production)

## Future Plans

### High Priority
- [ ] Deploy to production server
- [ ] Add seed data with common chords (A, Am, C, D, Dm, E, Em, F, G, etc.)
- [ ] Add user authentication (optional - for multi-user support)

### Features to Consider
- [ ] Chord categories/tags (major, minor, 7th, barre, etc.)
- [ ] Barre chord indicator on diagrams
- [ ] Edit existing chords
- [ ] Import/export chord collections
- [ ] Chord variations (multiple fingerings for same chord)
- [ ] Audio playback of chord (using Web Audio API)
- [ ] Chord progressions / song builder
- [ ] Transpose chords feature
- [ ] Print-friendly chord sheets

### Technical Improvements
- [ ] Add input validation on backend
- [ ] Add error boundaries in React
- [ ] Add loading skeletons
- [ ] Implement proper logging
- [ ] Add health check endpoint
- [ ] Docker containerization

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=postgresql://user:password@localhost:5432/pickchords
PORT=3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chords` | List all chords (supports `?search=`) |
| GET | `/api/chords/:id` | Get single chord |
| POST | `/api/chords` | Create new chord |
| PUT | `/api/chords/:id` | Update chord |
| DELETE | `/api/chords/:id` | Delete chord |
