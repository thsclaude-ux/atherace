# AT THE RACE

> Professional Race Predictions Platform — Compete. Predict. Win.

A portable, production-ready race prediction system with a premium sports-betting aesthetic. Built for global deployment on any hosting platform.

![Brand](brand/logo-primary.svg)

## Features

- **7-Round Predictions** — Participants pick horse numbers for each round
- **Live Leaderboard** — Real-time ranking with gold/silver/bronze badges
- **Access Code System** — Controlled entry with usage limits
- **Admin Dashboard** — Code management, results entry, analytics, Excel export
- **Bilingual** — Full Arabic and English support (RTL/LTR)
- **Portable Architecture** — Deploy anywhere: VPS, Docker, Vercel, Netlify, cPanel

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development (API + Web)
npm run dev
```

- **Web**: http://localhost:5173
- **API**: http://localhost:3001/api/v1/health

### Create First Admin

```bash
curl -X POST http://localhost:3001/api/v1/auth/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Secret: YOUR_BOOTSTRAP_SECRET" \
  -d '{"email":"admin@attherace.com","password":"SecurePass123!","name":"Admin"}'
```

## Project Structure

```
├── apps/
│   ├── api/          # Express REST API
│   └── web/          # React + Vite frontend
├── packages/
│   └── shared/       # Shared types & utilities
├── brand/            # Logo, design tokens, CSS system
└── docs/             # Architecture & brand guides
```

## Documentation

- [Brand Identity Guide](docs/BRAND.md)
- [Architecture & API Reference](docs/ARCHITECTURE.md)

## Deployment

### Docker
```bash
docker compose up -d
```

### Manual
```bash
npm run build
npm start                    # API on :3001
# Serve apps/web/dist with nginx or any static host
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, TypeScript |
| Backend | Node.js 20, Express 4 |
| Database | SQLite / PostgreSQL / MySQL / MongoDB |
| Auth | JWT + Refresh Tokens |
| Security | Helmet, Rate Limiting, Zod Validation |

## License

Proprietary — AT THE RACE Platform
