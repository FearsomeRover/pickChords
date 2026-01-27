# PickChords

A self-hosted guitar chord library for organizing your chords and songs.

## Features

### Chord Library
- Visual SVG chord diagrams with finger positions
- Add, edit, and delete custom chords
- Search by chord name

### Songs
- Store songs with their associated chords
- Add artist info and playing notes
- Tag system with custom colors for categorization
- Filter songs by tag

### User Features
- User accounts with login
- Favorite songs for quick access

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

## License

ISC License
