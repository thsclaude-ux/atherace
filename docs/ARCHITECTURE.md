# AT THE RACE — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  React + Vite + TypeScript (apps/web)                   │
│  Landing │ Predict │ Leaderboard │ Admin Dashboard      │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     API Layer                            │
│  Express.js (apps/api)                                  │
│  Routes → Controllers → Services → Repositories         │
└────────────────────────┬────────────────────────────────┘
                         │ Repository Pattern
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Database Adapters                       │
│  SQLite │ PostgreSQL │ MySQL │ MongoDB                  │
└─────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
at-the-race/
├── apps/
│   ├── api/                    # Backend API
│   │   └── src/
│   │       ├── config/         # Environment configuration
│   │       ├── database/       # Adapters + migrations
│   │       │   └── adapters/   # sqlite, pg, mysql, mongo
│   │       ├── middleware/     # Auth, error handling, sanitization
│   │       ├── repositories/   # Interface definitions
│   │       ├── routes/         # Express route definitions
│   │       ├── services/       # Business logic
│   │       └── server.ts       # Entry point
│   └── web/                    # Frontend SPA
│       └── src/
│           ├── components/     # Reusable UI
│           ├── context/        # i18n, auth providers
│           ├── lib/            # API client
│           ├── pages/          # Route pages
│           └── styles/         # Global CSS
├── packages/
│   └── shared/                 # Shared types + utilities
├── brand/                      # Logo, tokens, design system
├── docs/                       # Documentation
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.web
└── nginx.conf
```

---

## API Architecture

Base URL: `/api/v1`

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | — | Admin login |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/logout` | — | Revoke refresh token |
| POST | `/auth/bootstrap` | Secret header | Create first admin |

### Access Codes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/codes` | Admin | Generate code |
| GET | `/codes` | Admin | List codes |
| DELETE | `/codes/:code` | Admin | Delete code |
| GET | `/codes/validate` | Public | Validate + get session |

### Predictions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/predictions` | Session | Submit 7-round prediction |
| GET | `/predictions/status` | Public | Check submission status |

### Race & Leaderboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/race/winners` | Admin | Save results + score all |
| GET | `/race/winners` | Public | Get current results |
| GET | `/leaderboard` | Public/Admin | Ranked participants |
| DELETE | `/participants` | Admin | Clear all data |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/export/participants` | Admin | Excel export |
| GET | `/users` | Admin | User management |
| GET | `/audit` | Admin | Audit log |
| GET | `/health` | Public | Health check |

---

## Database Schema

```sql
users (id, email, password_hash, role, name, created_at, updated_at)
refresh_tokens (id, user_id, token_hash, expires_at, created_at)
access_codes (code, max_uses, used_count, created_at, created_by, expires_at)
code_usages (code, user_id, validated_at, submitted, submitted_at)
predictions (id, user_id, code, rounds, name, phone, submitted_at, consent_at, privacy_version)
participants (user_id, name, score, registered_at, last_scored_at)
race_results (id, rounds, saved_at, saved_by)
audit_logs (id, action, user_id, details, created_at)
```

### Entity Relationships
- `users` 1→N `refresh_tokens`
- `access_codes` 1→N `code_usages`
- `predictions` N→1 `access_codes` (via code field)
- `participants` 1→1 `predictions` (via user_id)
- `race_results` triggers score recalculation on all `participants`

---

## Security

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT access (15m) + refresh (7d) tokens |
| Authorization | Role-based (admin/user) middleware |
| Rate Limiting | express-rate-limit (100 req/min default) |
| Headers | Helmet (CSP, HSTS, X-Frame-Options) |
| Input | Zod validation + string sanitization |
| XSS | Content-Type enforcement, output encoding |
| SQL Injection | Parameterized queries (prepared statements) |
| CSRF | SameSite cookies + CORS origin whitelist |
| Audit | All admin actions logged to audit_logs |
| Sessions | Separate JWT for participant code validation |

---

## Deployment Architecture

### Option 1: Docker Compose (VPS/Railway/Render)
```bash
docker compose up -d
```
- API on port 3001
- Web (nginx) on port 5173
- SQLite volume persisted

### Option 2: Vercel/Netlify (Frontend) + Railway (API)
- Deploy `apps/web` as static site
- Deploy `apps/api` as Node service
- Set `VITE_API_URL` to API domain

### Option 3: cPanel Shared Hosting
- Build frontend: `npm run build --workspace=@atr/web`
- Upload `dist/` to public_html
- Run API via Node.js app manager
- Use SQLite or remote PostgreSQL

### Option 4: Single VPS with Nginx
- Nginx reverse proxy: `/api` → Node, `/` → static files
- PM2 for process management
- PostgreSQL for production DB

### Multi-Environment
| Env | NODE_ENV | DB | Notes |
|-----|----------|-----|-------|
| development | development | SQLite | Hot reload |
| staging | staging | PostgreSQL | CI branch deploy |
| production | production | PostgreSQL | Full security |

---

## Scalability

| Concern | Current | Future |
|---------|---------|--------|
| Database | SQLite (dev), PG (prod) | Read replicas |
| Caching | In-memory | Redis (`REDIS_URL`) |
| Rate Limiting | In-process | Redis-backed |
| Sessions | JWT stateless | Redis session store |
| File Export | On-demand XLSX | Queue-based (Bull) |
| Real-time LB | 15s polling | WebSocket/SSE |

Supports thousands of concurrent users with PostgreSQL + Redis caching layer.

---

## Production Stack Recommendation

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 + Vite 6 + TypeScript | Fast builds, type safety |
| Backend | Node.js 20 + Express 4 | Portable, ecosystem |
| Database | PostgreSQL 16 (prod) / SQLite (dev) | ACID, scalable |
| Auth | JWT + bcrypt | Stateless, standard |
| Cache | Redis 7 (optional) | Rate limits, sessions |
| Container | Docker + nginx | Universal deployment |
| CI/CD | GitHub Actions | Automated build/test |
| Monitoring | Sentry (optional) | Error tracking |
