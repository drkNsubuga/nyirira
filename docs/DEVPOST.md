# Nyirira - Skin AI for Melanin-Rich Skin

**Project URL:** [devpost.com/software/nyirira-skin-ai-for-melanin-rich-skin](https://devpost.com/software/nyirira-skin-ai-for-melanin-rich-skin)
**GitHub:** [github.com/drkNsubuga/nyirira](https://github.com/drkNsubuga/nyirira)
**Tech Stack:** Next.js 16.4.3, TypeScript, TensorFlow.js, YouCam API (Skin Analysis + Makeup VTO + Look VTO)

---

## The Problem

Uganda has two compounding skin health crises affecting melanin-rich skin:

1. **Generic AI tools misread Fitzpatrick V-VI.** Most skin analysis models are trained on lighter skin tones. They systematically misidentify post-inflammatory hyperpigmentation (PIH), ochronosis, and barrier damage on darker skin as generic acne or redness — producing irrelevant or harmful advice.

2. **Counterfeit cosmetics flood informal markets.** Kikuubo, Owino Market, and Instagram vendors sell products containing mercury, high-strength hydroquinone (>2%), and unlabelled corticosteroids. Victims have no way to check safety or report adverse reactions.

---

## The Solution: Nyirira

Nyirira is a mobile-first, privacy-first web application that gives melanin-rich skin the AI-powered diagnostics it deserves — and turns every scan into a community safety action.

### Step 1 — Selfie Capture
ML-powered quality validation (TensorFlow.js face detection, blur/lighting/orientation checks) runs entirely client-side before any API call. Images never leave the device during validation.

### Step 2 — Dual YouCam API Processing

**Skin Analysis API** (`/s2s/v2.0/task/skin-analysis`)
Evaluates spots, texture, redness, and radiance. The raw `uiskin_score` (0-100) drives everything downstream — safety flags, regimen recommendations, and look guidance. Nyirira requests `mask_urls` per concern type so affected areas can be overlaid directly on the user's photo.

**Makeup VTO API** (`/s2s/v2.0/task/makeup-vto`)
Powers the per-shade try-on feature: tapping any recommended lip shade calls the Makeup VTO API with that hex colour and renders the result inline. The same pipeline handles the editable colour palette — changing any swatch triggers a new VTO render with the selected colour.

**Look VTO API** (`/s2s/v2.0/task/look-vto`)
Renders the initial harmonized look result.

### Step 3 — Results Dashboard

**Analysis Results tab**
- Health score ring with 4-band interpretation: critical (<50) / repair (50-69) / balance (70-84) / thrive (85+)
- Anatomical damage markers placed on real facial zones (cheeks, forehead, temples, nasolabial folds, jaw, under-eye): PIH Spots, Inflammation, Texture, Barrier Damage — severe markers pulse
- Toggle to YouCam mask overlays when live API returns `mask_urls`

**Safety & Regimen tab**
- Flags targeting Uganda-specific damage patterns: ochronosis, PIH cycle, mercury/steroid abuse, equatorial UV index 10-14
- Realistic regimens with named Ugandan brands and UGX prices (Vaseline from any shop, Bepanthen from Mulago Hospital pharmacy, raw shea from Owino Market, CeraVe at Uchumi Supermarket)
- Critical band directs to Mulago Hospital dermatology

**Harmonized Look tab**
- Tap any lip shade → YouCam Makeup VTO renders inline (cached per shade)
- Click any palette swatch → native colour-picker wheel opens immediately → committing the colour triggers a live VTO render with that hex
- Score-aware Kitenge-inspired palette (Deep Emerald / Warm Gold / Terracotta)

**Community Watch tab**
- Counterfeit prompt appears when scan flags chemical irritation indicators
- Report form: product name, vendor, Uganda market location, batch number, symptom checklist, and **product photo proof** (camera or file upload)
- Feed: RED ALERT / WARNING / VERIFIED SAFE tiers with product thumbnails
- Pre-seeded RED ALERT data: Skin Light Body Lotion, Movate Skin Tone Cream
- UNBS emergency contact (+256 41 4505995) in footer

### Step 4 — Scan Comparison
Side-by-side photos with animated SVG score rings, stacked metric bars (previous vs current), and spots severity trend.

---

## YouCam API Integration Details

| API | Endpoint | What Nyirira uses it for |
|---|---|---|
| Skin Analysis | `/s2s/v2.0/task/skin-analysis` | `uiskin_score`, spot severity, texture, redness, `mask_urls` for overlays |
| Look VTO | `/s2s/v2.0/task/look-vto` | Initial harmonized look rendered image |
| Makeup VTO | `/s2s/v2.0/task/makeup-vto` | Per-shade lip colour renders, palette colour renders |
| File API | `/s2s/v2.0/file` | Single upload; file_id reused across all three tasks |

All three tasks share one uploaded `file_id` — one upload per scan, no duplication.

---

## Technical Architecture

- **Framework:** Next.js 16.4.3 (App Router), static export — Cloudflare Pages / Vercel, zero server cost
- **Styling:** Tailwind CSS 4+, Slate/Emerald/Amber/Red palette, full dark mode
- **ML validation:** TensorFlow.js + Tesseract.js, all client-side
- **State:** React `useState` + `localStorage` — no backend database
- **Fonts:** Geist self-hosted via `next/font/local` (no Google Fonts network dependency)
- **Security:** Next.js 16.4.3 — patched for GHSA-673q-mjm6-r5xr, GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r

---

## Technical Challenges

**TensorFlow.js backend registry conflicts:** Bundler tree-shaking removed CPU/WebGL backend registrations, causing silent face-detection failures. Fixed by explicitly importing both backends with a try/catch fallback and adding them to `transpilePackages` in `next.config.ts`.

**YouCam error payload shapes:** Task errors nest under `data.error` while file-init errors are flat. Built a unified `parseYouCamErrorPayload` parser that maps 25+ error codes to plain-English guidance — users see "Move closer to the camera" rather than raw JSON.

**Static export + CRLF:** PowerShell here-strings write CRLF line endings; git's `autocrlf` then staged whitespace-only diffs. Fixed by normalising all file writes to LF using `[System.IO.File]::WriteAllText` with `UTF8Encoding(false)`.

---

## Privacy

**Your privacy comes first.** All photo analysis runs locally on your device. If you use the optional live API, images are processed by Perfect Corp (YouCam) and deleted within 24 hours. Community reports are stored in your browser only — no backend, no accounts.

---

## Impact

- **Health equity:** Accurate Fitzpatrick V-VI diagnostics for a market systematically underserved by Western beauty AI
- **Consumer protection:** The only skincare AI tool that converts a personal scan directly into a community safety alert for Uganda's informal cosmetics market
- **UNBS pathway:** Batch number capture in reports is designed for future Uganda National Bureau of Standards enforcement integration
- **Zero-cost access:** Static hosting — no server, no subscription, works on 4G

---

*Built for the YouCam API Skin AI & eCommerce VTO Hackathon*