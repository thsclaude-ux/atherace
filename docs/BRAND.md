# AT THE RACE — Brand Identity Guide

## Brand Essence

**AT THE RACE** embodies the thrill of horse racing: speed, competition, luxury, and crowd energy. The visual identity draws from the iconic racing banner — deep navy, gold accents, and dynamic italic typography.

---

## Logo

### Primary Wordmark
- File: `brand/logo-primary.svg`
- Usage: Website header, marketing materials, social media covers
- Minimum width: 160px (digital), 40mm (print)

### App Icon
- File: `brand/logo-icon.svg`
- Usage: Favicon, mobile app icon, PWA manifest
- Works on dark and light backgrounds

### Logo Rules
- Always maintain clear space equal to the height of the "A" in AT
- Never stretch, rotate, or recolor the gold horse mark
- On dark backgrounds: white wordmark + gold horse
- On light backgrounds: navy wordmark + gold horse

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Navy 950 | `#060D18` | Primary background (dark mode) |
| Navy 900 | `#0A1628` | Elevated surfaces, banner |
| Navy 800 | `#0D2137` | Cards, inputs |
| Gold 500 | `#D4AF37` | Primary accent, CTA buttons |
| Gold 400 | `#E8C547` | Hover states |
| White | `#FFFFFF` | Text on dark, light mode bg |
| Racing Green | `#006B3F` | Success accents, silk pattern |
| Racing Red | `#C41E3A` | Live indicators, alerts |
| Dirt Brown | `#8B6914` | Earthy secondary accents |

### Semantic Colors
- Success: `#22C55E`
- Error: `#EF4444`
- Warning: `#F59E0B`
- Info: `#3B82F6`

---

## Typography

### English
| Role | Font | Weight | Style |
|------|------|--------|-------|
| Display/Headlines | Barlow Condensed | 700 | Italic |
| Body | Inter | 400–600 | Normal |
| UI Labels | Inter | 500 | Normal |

### Arabic
| Role | Font | Weight |
|------|------|--------|
| All text | Tajawal | 400–700 |

### Scale
- H1: clamp(2rem, 5vw, 3.5rem)
- H2: clamp(1.5rem, 3vw, 2rem)
- Body: 1rem / 16px
- Small: 0.875rem

---

## UI Style

- **Dark Mode First**: Navy-based, never pure black
- **Glassmorphism**: `backdrop-filter: blur(16px)` with 65% opacity surfaces
- **Motion**: Subtle hover lifts (translateY -1px), gold glow on focus
- **Spacing**: 4px base grid (0.25rem increments)
- **Border Radius**: 6px (sm), 10px (md), 16px (lg)

---

## Design System Components

All components defined in `brand/design-system.css` and implemented in React at `apps/web/src/`.

| Component | Class Prefix | Notes |
|-----------|-------------|-------|
| Button | `.atr-btn` | primary, secondary, ghost, danger variants |
| Card | `.atr-card` | Standard + glass variant |
| Form | `.atr-input`, `.atr-field` | Gold focus ring |
| Table | `.atr-table` | Admin dashboard |
| Leaderboard | `.atr-leaderboard-item` | Rank badges 1-3 gold/silver/bronze |
| Badge | `.atr-badge` | live, gold, green, red |
| Stats | `.atr-stat` | Dashboard KPI cards |

---

## Jockey Silk Patterns (Decorative)

Use as subtle borders or status indicators:
- Green & White stripes → Active/Open
- Red & Black checkers → Live/Competitive
- Orange & Blue diagonal → Premium events
- Purple & Yellow blocks → VIP/Special

---

## Voice & Tone

- **Professional** but energetic
- **Confident** — "Compete. Predict. Win."
- **Inclusive** — bilingual AR/EN by default
- Avoid gambling terminology; focus on "predictions" and "competition"
