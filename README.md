# Nyirira ✨

[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com)
[![Tests](https://img.shields.io/badge/tests-150%20passing-brightgreen.svg)](#testing)
[![Coverage](https://img.shields.io/badge/coverage-70%25%2B-brightgreen.svg)](#testing)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black.svg?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4%2B-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![pnpm](https://img.shields.io/badge/pnpm-9%2B-F69220.svg?logo=pnpm)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#privacy--disclaimer)

**Localized Safe Skincare Diagnostics & Virtual Beauty Matching for Melanin-Rich Skin**

Nyirira is a mobile-responsive single-page web application built for the Ugandan market, providing AI-powered skincare diagnostics optimized for Fitzpatrick skin types V-VI and personalized virtual makeup/fashion color recommendations rooted in local aesthetics (Kitenge-inspired).

## Features

### 1. Selfie Capture and Image Upload
- Live selfie via device camera or file upload (JPG/PNG, max 10MB)
- ML quality validation: face detection (TensorFlow.js), blur/lighting/orientation checks
- All validation runs client-side -- images never leave the device during this step

### 2. Dual YouCam API Analysis
- **Skin Diagnostics** (/task/skin-analysis): spots, texture, redness, radiance scored via YouCam uiskin_score (not client-computed). Optimised for Fitzpatrick V-VI
- **Virtual Try-On** (/task/look-vto + /task/makeup-vto): rendered try-on image, warm-toned lip shades, Kitenge-inspired palettes
- NEXT_PUBLIC_USE_REAL_API toggle + per-browser Settings switch

### 3. Results Dashboard: 4 Tabs

**Analysis Results** (Microscope tab)
- Health score ring (0-100), 4-band: critical <50 / repair 50-69 / balance 70-84 / thrive 85+
- Anatomical damage markers on real facial zones: PIH Spots (amber), Inflammation (red), Texture (violet), Barrier Damage (orange) -- severe markers pulse
- Toggle to YouCam mask overlays (redness, age_spot, texture, radiance) when live API is active
- Counterfeit prompt triggers on redness >= 40%, moderate/severe spots, or critical safety flag

**Safety & Regimen** (Shield tab)
- Flags targeting Uganda-specific damage: ochronosis, PIH cycle, mercury/steroid abuse, equatorial UV (index 10-14)
- Named Ugandan brands + UGX prices: Vaseline, Bepanthen (Mulago Hospital pharmacy), raw shea from Owino Market, CeraVe at Uchumi
- Critical band directs to Mulago Hospital dermatology clinic

**Harmonized Look** (Palette tab)
- Per-shade VTO: tap any lip shade to trigger YouCam Makeup VTO API; result shown inline, cached per shade
- Colour palette picker: click any swatch to open the native colour-picker wheel; committing triggers live makeup VTO; hex input syncs in real time
- Score-aware Kitenge-inspired lead text

**Community Watch** (Users tab)
- Report form with product photo proof (camera or file, stored as base64)
- Feed: RED ALERT / WARNING / VERIFIED SAFE tiers with product thumbnail
- Search + filter by Uganda market (Kikuubo, Owino, etc.) and risk level

### 4. Scan Comparison and History
- Side-by-side scan photos with animated SVG score rings showing delta badge (+/- pts)
- Stacked metric bars (grey = previous, coloured = current) for Redness, Smoothness, Roughness
- Spots severity trend; always-visible summary banner; expandable detail panel

### 5. Dark Mode
- One-tap toggle in the header (Moon/Sun icon); persisted to localStorage
- Full dark variants across header, footer, settings, all dashboard tabs, modals, community feed

### 6. Animated Scan
- Glowing SVG facial mesh (~39 landmarks) + 60fps cosine scanning beam with afterglow
- 5-phase micro-copy: Preparing -> Face Detection -> Skin Analysis -> Color Matching -> Finalizing

### 7. Privacy
- **Your privacy comes first.** All photo analysis runs locally on your device
- Optional live API: image sent to Perfect Corp (YouCam), deleted within 24 hours
- Community reports stored in your browser only -- no backend, no accounts required

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS 4+
- **Icons**: Lucide React
- **State Management**: React `useState` + `localStorage`
- **API Integration**: YouCam REST endpoints (mocked for MVP, togglable to live)
- **ML Libraries**: TensorFlow.js, Tesseract.js
- **Testing**: Jest + React Testing Library
- **Package Manager**: pnpm

## Quick Start

### Prerequisites
- Node.js 18+ (or use pnpm via standalone)
- pnpm 9+

### Installation

```bash
# Navigate to project directory
cd nyirira

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables & Deployment (Cloudflare Pages)

The app ships as a **static export** (`output: "export"`). `NEXT_PUBLIC_*` variables are
inlined into the bundle **at build time** — they are *not* read at runtime.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_YOUCAM_API_KEY` | Perfect Corp API key (live analysis) |
| `NEXT_PUBLIC_YOUCAM_API_URL` | API base URL, e.g. `https://yce-api-01.makeupar.com` |
| `NEXT_PUBLIC_USE_REAL_API` | `true` = call the live API; `false`/unset = mock results |

On Cloudflare Pages:

1. Project → **Settings → Environment variables** → add the vars for **Production AND Preview**
   (variables added after a build, or only in one environment, never reach the served bundle).
2. **Redeploy** — the build must run *after* the vars exist.
3. Do **not** put these in `wrangler.toml` `[vars]` — that is for Workers runtime config and is
   ignored by this static export.
4. `pnpm build` logs a loud `[nyirira] Live YouCam API enabled but credentials missing: ...`
   warning if the build env is misconfigured, so check the build logs first.

The in-app **Settings → "Use live API"** toggle can also enable live mode per-browser; if the
built bundle has no credentials, the app shows a clear "not configured for this deployment"
message instead of raw errors.

## Project Structure

```
nyirira/
├── app/
│   ├── page.tsx                    # Main app entry & step flow
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── components/
│   ├── CameraCapture.tsx           # Camera/upload UI
│   └── AnalysisDashboard.tsx       # Results display
├── lib/
│   ├── types.ts                    # TypeScript type definitions
│   ├── youcamClient.ts             # API client (mocked + live toggle)
│   ├── recommendations.ts          # Score bands, safety flags, barrier repair regimen, harmonized look (Uganda/East Africa context)
│   ├── imageValidation.ts          # Client-side validation
│   └── advancedValidation.ts       # ML-powered validation
├── docs/
│   ├── SRS.md                      # Software Requirements Spec
│   ├── TODO.md                     # Development roadmap
│   └── API.md                      # API integration guide
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI: lint + test on PR
│       └── deploy.yml              # CD: build & deploy to Vercel
├── jest.config.js                  # Jest configuration
├── package.json                    # Dependencies & scripts
├── pnpm-lock.yaml                  # Dependency lock file
├── tsconfig.json                   # TypeScript config
└── README.md                       # This file
```

## Usage Flow

1. **Capture Step**: User takes selfie or uploads photo
   - CameraCapture component handles camera/file input
   - Image preview before submission

2. **Processing Step**: Image sent to YouCam API
   - Skin analysis: spots, texture, redness (Fitzpatrick V-VI optimized)
   - VTO + Colorimetry: lip shade & outfit color recommendations
   - Simulated 2-second delay for MVP demo

3. **Results Step**: AnalysisDashboard displays findings in tabs (Analysis Results / Safety & Regimen / Harmonized Look)
   - Health score gauge (score from YouCam API 'uiskin_score', not client-computed)
   - Safety warnings with recommendations
   - Barrier repair regimen (East African ingredients)
   - Color palette + lip shade suggestions
   - Save results to localStorage

## API Integration

### Development (Mocked Responses)

By default, the app uses mocked API responses for rapid MVP development. Responses simulate real YouCam AI analysis.

```typescript
// lib/youcamClient.ts
const IS_PRODUCTION = process.env.NODE_ENV === 'production' && 
                      process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
```

#### How the Skin Score is derived

The Skin Health Score (0-100) shown in the results dashboard comes **directly from the YouCam API response (`uiskin_score`)** — it is **not** computed client-side. Built on top of that score, `lib/recommendations.ts` turns it into score bands (`<60` repair · `60–79` balance · `≥80` thrive) and derives Nyirira's curated content: **Safety Flags** (bleaching/mercury warning, SPF 50+ reminder), **Barrier Repair Regimen** (shea butter, niacinamide, glycerin — East African pharmacy ingredients), and **Harmonized Look** guidance (Kitenge-inspired warm palettes). All product/regimen text is Nyirira's Uganda/East-Africa-context content; only the raw skin measurements come from the API.

### Production (Real API)

To swap mocked responses for live YouCam API:

1. Obtain YouCam API credentials:
   - `NEXT_PUBLIC_YOUCAM_API_KEY`
   - `NEXT_PUBLIC_YOUCAM_API_URL`
   - `NEXT_PUBLIC_YOUCAM_SKIN_ENDPOINT` (optional, default: /api/skinAnalysis)
   - `NEXT_PUBLIC_YOUCAM_VTO_ENDPOINT` (optional, default: /api/virtualTryOn)

2. Set environment variables:
   ```bash
   # .env.local
   NEXT_PUBLIC_USE_REAL_API=true
   NEXT_PUBLIC_YOUCAM_API_KEY=your_api_key_here
   NEXT_PUBLIC_YOUCAM_API_URL=https://api.youcam.ai
   NEXT_PUBLIC_YOUCAM_SKIN_ENDPOINT=/api/skinAnalysis
   NEXT_PUBLIC_YOUCAM_VTO_ENDPOINT=/api/virtualTryOn
   ```

3. Rebuild & deploy:
   ```bash
   pnpm build
   pnpm start
   ```

**Note:** If the live API fails (e.g., 404 error), the app will automatically fall back to the mock analysis to ensure a smooth user experience.

## Development

### Scripts

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Build for production
pnpm start        # Run production build
pnpm test         # Run Jest unit tests
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type check
```

### Color Palette

**Tailwind Config**: slate/emerald/amber

- **Slate**: Background, neutral text
- **Emerald**: Primary actions, health score (safe)
- **Amber**: Secondary accents, warnings

### Camera Permissions

- iOS: Requires HTTPS or localhost for `navigator.mediaDevices`
- Android: Requires camera permission in manifest
- Fallback: File upload always available if camera access denied

## Testing

### Unit Tests (Jest)

```bash
pnpm test
```

Includes tests for (23 suites, 150 tests):
- `youcamClient.ts`: Mocked API response validation; score-derived safety flags & regimen in both mock and live paths
- `CameraCapture.tsx`: Camera permission handling, file upload
- `AnalysisDashboard.tsx`: Result rendering; tab switching (Analysis Results / Safety & Regimen / Harmonized Look)
- `lib/recommendations.ts`: score bands, safety flag generation, barrier repair regimen, harmonized look lead

## CI/CD

### GitHub Actions Workflows

#### `.github/workflows/ci.yml` (On PR)
- Run ESLint
- Run Jest tests
- TypeScript type check

#### `.github/workflows/deploy.yml` (On Push to Main)
- Build Next.js app
- Deploy to Vercel (or configured host)
- Environment: production

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

## DevPost Submission Notes

### What was built for this hackathon
**Nyirira** ([devpost.com/software/nyirira-skin-ai-for-melanin-rich-skin](https://devpost.com/software/nyirira-skin-ai-for-melanin-rich-skin)) — localized safe skincare diagnostics & virtual beauty matching for melanin-rich skin (Fitzpatrick types V-VI), built for the Ugandan/East African market.

### Demo flow
1. `pnpm dev` → open http://localhost:3000
2. Take a selfie or upload a photo → skin analysis runs (mocked YouCam API by default; flip "Use live API" in Settings for the real API)
3. Review the 4-tab results dashboard: Analysis Results / Safety & Regimen / Harmonized Look / Community Watch
4. Community Watch tab shows flagged products and lets you file an adverse-reaction report at any time
5. Save results → reopen any past scan from Recent History on the capture screen

### Key implementation notes
- The Skin Health Score comes **directly from the YouCam API (`uiskin_score`)** — not client-computed. Nyirira's curated guidance (`lib/recommendations.ts`, Uganda/East Africa context: bleaching/mercury warning, SPF 50+, shea butter, niacinamide, Kitenge-inspired palettes) is derived from that score via score bands (`<60` repair · `60–79` balance · `≥80` thrive)
- `pnpm test` — 23 suites / 150 tests passing; `pnpm build` passes; `tsc --noEmit` clean; ESLint 0 errors
- Static export; `NEXT_PUBLIC_*` variables are inlined at build time (Cloudflare Pages / Vercel compatible)

## Localization & Cultural Context

### Fitzpatrick V-VI Optimization

- Skin analysis accounts for melanin-rich skin specifics
- Hyperpigmentation detection
- Post-inflammatory hyperpigmentation (PIP) assessment
- Redness detection adjusted for deeper complexions

### Ugandan Market

- East African pharmacy ingredients (glycerin, niacinamide, shea butter, argan oil)
- Kitenge-inspired color palettes (warm emerald, gold, terracotta)
- Warm undertone recommendations for melanin-rich skin
- Warn against counterfeit bleaching creams (mercury, hydroquinone)

## Privacy & Disclaimer

- **Privacy**: Images are analyzed client-side. No images stored on servers.
- **Disclaimer**: This tool provides guidance only. Always consult a dermatologist for serious skin concerns.

## Contributing

To contribute: fork, create feature branch, commit, and open PR.

## Future Enhancements (Post-MVP)

See [docs/TODO.md](docs/TODO.md) for detailed roadmap.

---

**Built with ❤️ for beautiful, healthy melanin-rich skin in Uganda and beyond.**
