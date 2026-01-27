# 🎸 PickChords

A modern, self-hosted guitar chord library for musicians who want to organize their chords and songs.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![NestJS](https://img.shields.io/badge/NestJS-10-e0234e.svg)

## Features

### Chord Library
- **Visual chord diagrams** - SVG-based diagrams showing finger positions
- **Add custom chords** - Create any chord with fret positions and finger numbers
- **Edit & delete** - Full control over your chord collection
- **Search** - Quickly find chords by name

### Songs
- **Organize songs** - Store songs with their associated chords
- **Artist & notes** - Add metadata and playing instructions
- **Tag system** - Categorize songs with colored tags (Rock, Ballad, etc.)
- **Filter by tag** - Quickly find songs in a category

### User Features
- **Authentication** - Register and login to access personal features
- **Favorites** - Star songs to build your personal practice list
- **Favorites tab** - Quick access to your starred songs

## Screenshots

```
┌─────────────────────────────────────────────────────────┐
│  Pick Chords                              [username] [Logout] │
│  Your personal guitar chord library                     │
├─────────────────────────────────────────────────────────┤
│  [Chords] [Songs] [Favorites]                           │
│                                                         │
│  [Search chords...]                                     │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │    Am   │  │    C    │  │    D    │  │    Em   │   │
│  │  ╔═════╗│  │  ╔═════╗│  │  ╔═════╗│  │  ╔═════╗│   │
│  │  ║x○   ○║│  │  ║x    ○║│  │  ║xx○  ║│  │  ║○    ○║│   │
│  │  ╠─────╣│  │  ╠─────╣│  │  ╠─────╣│  │  ╠─────╣│   │
│  │  ║  ●  ║│  │  ║    ●║│  │  ║  ● ●║│  │  ║  ●● ║│   │
│  │  ║ ● ● ║│  │  ║  ●  ║│  │  ║   ● ║│  │  ║     ║│   │
│  │  ╚═════╝│  │  ║ ●   ║│  │  ╚═════╝│  │  ╚═════╝│   │
│  │[Edit][Del]│  │  ╚═════╝│  │[Edit][Del]│  │[Edit][Del]│   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                    [+] │
└─────────────────────────────────────────────────────────┘
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│    Nginx     │────▶│   Docker     │────▶│  PostgreSQL  │
│   (Reverse   │     │  Container   │     │   Database   │
│    Proxy)    │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
     ┌──────────────┐           ┌──────────────┐
     │    React     │           │   NestJS     │
     │   Frontend   │           │   Backend    │
     │   (Static)   │           │    (API)     │
     └──────────────┘           └──────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Backend | NestJS 10, TypeScript |
| Database | PostgreSQL with JSONB |
| Auth | JWT with Passport |
| Deployment | Docker, Nginx |

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/FearsomeRover/pickChords.git
cd pickChords

# Start with Docker Compose
docker compose up -d

# App is now running at http://localhost:3000
```

### Subpath Deployment

To deploy under a subpath (e.g., `/pickChords/`):

```bash
BASE_PATH=/pickChords/ docker compose up -d --build
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Server port | `3000` |
| `BASE_PATH` | URL base path for subpath deployment | `/` |

### Generate a Secure JWT Secret

```bash
openssl rand -base64 32
```

## Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### Local Setup

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start backend (requires PostgreSQL)
npm run server

# Start frontend (in another terminal)
npm run dev
```

### Connect to Production API

Create `.env.local`:
```
VITE_API_URL=https://your-domain.com/pickChords
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create new account |
| `POST /api/auth/login` | Login and get JWT |
| `GET /api/chords` | List all chords |
| `GET /api/songs` | List songs (supports filtering) |
| `GET /api/tags` | List all tags |
| `POST /api/songs/:id/favorite` | Add to favorites |

See [CLAUDE.md](CLAUDE.md) for complete API documentation.

## Data Model

### Chord
Chords are stored as structured data, rendered as SVG:

```javascript
{
  name: "Am",
  strings: [
    { fret: 'x' },           // 6th string - muted
    { fret: 0 },             // 5th string - open
    { fret: 2, finger: 2 },  // 4th string - fret 2
    { fret: 2, finger: 3 },  // 3rd string - fret 2
    { fret: 1, finger: 1 },  // 2nd string - fret 1
    { fret: 0 },             // 1st string - open
  ],
  start_fret: 1
}
```

## License

ISC License - See [LICENSE](LICENSE) for details.

---

Built with 🎵 for guitar players everywhere.
