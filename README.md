# PickChords

A self-hosted guitar chord library for organizing your chords and songs with progress tracking.

## Features

### Chord Library
- Visual SVG chord diagrams with finger positions
- Add, edit, and delete custom chords
- Search by chord name
- Organized display with reorderable chords

### Songs
- Store songs with their associated chords
- Drag-and-drop chord reordering in edit mode
- Add artist info and playing notes
- Tag system with custom colors for categorization
- Filter songs by tag
- Strumming pattern editor with visual beats and keyboard shortcuts

### User Features
- User accounts with authentication (JWT)
- Role-based access control (user/admin)
- Favorite songs for quick access
- **Progress tracking with Kanban board** (Want to Learn → Learning → Practicing → Mastered)
- Drag-and-drop song progress management
- Color-coded progress badges on song pages

### Admin Features
- System logs with filtering (level, action, user, date range)
- User activity monitoring
- Full system access

## Quick Start

```bash
# Clone the repository
git clone https://github.com/FearsomeRover/pickChords.git
cd pickChords

# Start with Docker Compose
docker compose up -d
```

App runs at http://localhost:3000

### Subpath Deployment

To deploy under a subpath (e.g., `/pickChords/`):

```bash
BASE_PATH=/pickChords/ docker compose up -d --build
```

## Configuration

Create a `.env` file with:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for authentication |
| `PORT` | Server port (default: 3000) |
| `BASE_PATH` | URL base path for subpath deployment |

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, TanStack Query
- **Backend:** NestJS 10, TypeScript
- **Database:** PostgreSQL with JSONB
- **Auth:** JWT with Passport
- **Drag & Drop:** @dnd-kit/core
- **Deployment:** Docker, Nginx

## License

ISC License
