# Nyirira 🌍✨

**Localized Safe Skincare Diagnostics & Virtual Beauty Matching for Melanin-Rich Skin**

Nyirira is a mobile-responsive single-page web application built for the Ugandan market, providing AI-powered skincare diagnostics optimized for Fitzpatrick skin types V-VI and personalized virtual makeup/fashion color recommendations rooted in local aesthetics (Kitenge-inspired).

## Features

### 1. Selfie Capture & Image Upload
- Take a live selfie using device camera (`navigator.mediaDevices`)
- Upload existing photos (JPG, PNG; max 10MB)
- Instant preview before analysis
- Mobile-first responsive design

### 2. Dual AI Analysis
- **Skin Diagnostics**: Detects spots, texture, redness, and provides a health score (0-100)
- **Virtual Try-On (VTO) + Colorimetry**: Suggests warm-toned lip shades and Kitenge-inspired outfit color palettes harmonizing with the user's complexion

### 3. Localized Results Dashboard
- **Skin Health & Safety Score** with visual indicators
- **Safety Flags**: Critical warnings against bleaching agents (hydroquinone, mercury, kojic acid); recommendations for safe alternatives
- **Barrier Repair Regimen**: Curated list of ingredients common in East African pharmacies (glycerin, niacinamide, natural oils)
- **Harmonized Look**: Virtual makeup + outfit color suggestions paired with warm color undertones

### 4. Client-Side Data Persistence
- Results saved to browser localStorage
- No backend database required (MVP cost-optimization)
- Privacy-first: images analyzed locally, no server storage

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS 4+
- **Icons**: Lucide React
- **State Management**: React `useState` + `localStorage`
- **API Integration**: YouCam REST endpoints (mocked for MVP, togglable to live)
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

3. **Results Step**: AnalysisDashboard displays findings
   - Health score gauge
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

### Production (Real API)

To swap mocked responses for live YouCam API:

1. Obtain YouCam API credentials:
   - `NEXT_PUBLIC_YOUCAM_API_KEY`
   - `NEXT_PUBLIC_YOUCAM_API_URL`

2. Set environment variables:
   ```bash
   # .env.local
   NEXT_PUBLIC_USE_REAL_API=true
   NEXT_PUBLIC_YOUCAM_API_KEY=your_api_key_here
   NEXT_PUBLIC_YOUCAM_API_URL=https://api.youcam.ai
   ```

3. Rebuild & deploy:
   ```bash
   pnpm build
   pnpm start
   ```

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

Includes tests for:
- `youcamClient.ts`: Mocked API response validation
- `CameraCapture.tsx`: Camera permission handling, file upload
- `AnalysisDashboard.tsx`: Result rendering

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
