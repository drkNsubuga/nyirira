# Software Requirements Specification (SRS) - Nyirira

**Document Version**: 1.0  
**Date**: October 2026  
**Status**: MVP  

---

## 1. Executive Summary

Nyirira is a mobile-responsive, cost-optimized SPA designed for the Ugandan market, providing localized, safe skincare diagnostics and virtual beauty color matching for melanin-rich skin (Fitzpatrick V-VI). It bridges the gap between accessible AI-powered skincare advice and cultural/aesthetic preferences specific to East Africa.

**Key USPs:**
- Fitzpatrick V-VI optimization (no generic "one-size-fits-all" advice)
- Warns against counterfeit bleaching products common in Uganda
- Recommends safe, locally-available ingredients
- Kitenge-inspired color recommendations for virtual makeup & fashion
- Zero-cost backend (MVP): client-side state only

---

## 2. Scope

### In Scope (MVP)
- Selfie capture and image upload
- Mocked dual AI analysis (skin diagnostics + VTO)
- Results dashboard with health score, safety flags, barrier repair regimen
- localStorage persistence
- Mobile-responsive UI
- Git repo with CI/CD workflows
- Unit test suite
- Documentation (SRS, README, API integration guide)

### Out of Scope (Post-MVP)
- User authentication/accounts
- Deep database storage
- Live YouCam API integration (placeholder in code)
- Real-time video consultations
- Multi-language support
- Payment/monetization
- Analytics tracking

---

## 3. Functional Requirements

### FR1: Image Capture & Upload
- **FR1.1**: User can take a live selfie using `navigator.mediaDevices`
  - Support front-facing camera on mobile devices
  - Show live preview before capture
  - Capture button to snap photo from video stream

- **FR1.2**: User can upload image from device storage
  - Accept JPG, PNG files
  - Validate file size (< 10MB)
  - Show upload progress/error messages
  - Display instant preview of uploaded image

- **FR1.3**: User can retake photo or cancel operation
  - Back button from camera mode
  - Retake button from preview mode
  - Return to selection screen (camera vs. upload)

### FR2: Skin Analysis
- **FR2.1**: Analyze image for skin conditions
  - Detect/count hyperpigmented spots
  - Assess skin texture (smoothness/roughness)
  - Measure redness/inflammation levels
  - Generate health score (0-100)

- **FR2.2**: Output safety-critical warnings
  - Flag bleaching agents (hydroquinone, mercury, kojic acid)
  - Recommend safe alternatives
  - Suggest sun protection importance

- **FR2.3**: Provide barrier repair regimen
  - Niacinamide serum recommendation
  - Glycerin + shea butter moisturizer
  - Natural oils (argan, jojoba)
  - Include frequency and notes on local availability

### FR3: Virtual Try-On (VTO) + Colorimetry
- **FR3.1**: Suggest warm-toned lip shades
  - Return 3+ color recommendations
  - Include hex color codes
  - Classify undertone (warm, cool, neutral)
  - Brief description of why shade complements complexion

- **FR3.2**: Suggest outfit color palette
  - Primary, secondary, accent colors
  - Kitenge-inspired inspiration label
  - Pair with recommended lip shade for cohesive look

### FR4: Results Persistence
- **FR4.1**: Save analysis to browser localStorage
  - Allow user to save results without login
  - Restore last analysis on app reload
  - Display "Last Analysis" indicator

- **FR4.2**: Allow result export/sharing (future)
  - Generate shareable link or PDF (post-MVP)

### FR5: Error Handling
- **FR5.1**: Camera permission denied → fallback to upload
- **FR5.2**: File upload size limit exceeded → error message
- **FR5.3**: API timeout → retry logic with exponential backoff
- **FR5.4**: Network error → friendly error message

---

## 4. Non-Functional Requirements

### Performance
- **NF1.1**: Page load < 3 seconds on 4G
- **NF1.2**: Image capture/upload response < 5 seconds
- **NF1.3**: Analysis processing (mocked) simulates 2-second delay
- **NF1.4**: Optimize images for mobile (compress before analysis)

### Scalability
- **NF2.1**: Zero backend = no server scaling needed (MVP)
- **NF2.2**: Client-side state only, so no database bottlenecks
- **NF2.3**: Post-MVP: Layer in backend gradually with API integration

### Usability & Accessibility
- **NF3.1**: WCAG 2.1 AA compliance (keyboard navigation, screen reader support)
- **NF3.2**: Mobile-first design (touch-friendly buttons, readable text)
- **NF3.3**: Support iOS and Android browsers
- **NF3.4**: Clear loading states and error messages

### Security & Privacy
- **NF4.1**: Images analyzed client-side only (no server upload)
- **NF4.2**: No third-party trackers (privacy-first)
- **NF4.3**: HTTPS enforcement in production
- **NF4.4**: Clear privacy policy in footer

### Maintainability
- **NF5.1**: TypeScript strict mode
- **NF5.2**: Unit test coverage > 70%
- **NF5.3**: ESLint/Prettier code formatting
- **NF5.4**: Clear component separation and type definitions

---

## 5. User Interface Requirements

### UI-1: Step Flow
1. **Capture Screen**: Camera/Upload selection → Camera/Upload mode → Preview
2. **Processing Screen**: Loading spinner with animated status indicators
3. **Results Screen**: Scrollable dashboard with:
   - Health score gauge
   - Metrics cards (spots, texture, redness)
   - Safety flags section
   - Barrier repair regimen
   - VTO color palette & lip shade suggestions
   - Save & New Analysis buttons

### UI-2: Design System
- **Color Palette**: Slate (neutral), Emerald (primary/safe), Amber (accent/warning)
- **Typography**: Clear hierarchy, readable on mobile (min 14px body text)
- **Spacing**: Consistent padding/margins (4px grid)
- **Icons**: Lucide React for consistency
- **Responsive**: Mobile-first (sm: 640px, md: 768px, lg: 1024px)

### UI-3: Localization
- App name: "Nyirira" (Ugandan-friendly)
- Copy mentions "Fitzpatrick V-VI", "melanin-rich skin", "East African pharmacies"
- Color suggestions reference "Kitenge" aesthetics
- footer includes disclaimer about dermatologist consultation

---

## 6. Data Structures

### SkinAnalysisResult
```typescript
{
  healthScore: number (0-100),
  spots: { count, severity, description },
  texture: { smoothness, roughness, description },
  redness: { level, description },
  safetyFlags: SafetyFlag[],
  barrierRepairRegimen: Product[]
}
```

### VTOResult
```typescript
{
  recommendedLipShades: LipShade[],
  outfitPalette: { primary, secondary, accent, inspiration },
  description: string
}
```

### AnalysisResponse
```typescript
{
  skinAnalysis: SkinAnalysisResult,
  vto: VTOResult,
  timestamp: string,
  imageWidth: number,
  imageHeight: number
}
```

---

## 7. API Integration

### YouCam API (Mocked in MVP)

**Endpoint 1: Skin Analysis** (Mocked via `getMockSkinAnalysis()`)
```
POST /api/skinAnalysis
Body: { image: base64_string, analyzeFor: ['spots', 'texture', 'redness'] }
Returns: SkinAnalysisResult
```

**Endpoint 2: Virtual Try-On** (Mocked via `getMockVTOResult()`)
```
POST /api/virtualTryOn
Body: { image: base64_string, analyzeFor: ['makeup', 'colorimetry'] }
Returns: VTOResult
```

**Toggle to Real API:**
- Set `NEXT_PUBLIC_USE_REAL_API=true` + credentials in `.env.local`
- Uncomment/implement `callRealYouCamAPI()` in `lib/youcamClient.ts`

---

## 8. Constraints & Assumptions

### Constraints
- **File Size**: < 10MB (mobile data efficiency)
- **Image Format**: JPG, PNG only
- **Device**: Mobile-first (iOS/Android browsers)
- **Connectivity**: Works on 4G but optimal on WiFi
- **Deployment**: Vercel or similar serverless host

### Assumptions
- YouCam API will provide documented REST endpoints
- Users have camera/upload access (fallback to upload if denied)
- localStorage is available (not in private browsing edge cases)
- HTTPS enforced in production

---

## 9. Testing Requirements

### Unit Tests
- `youcamClient.ts`: Mock response validation
- `CameraCapture.tsx`: Permission handling, file upload, preview
- `AnalysisDashboard.tsx`: Render correctness, color palette display

### E2E Tests (Future)
- Full user flow: capture → analysis → results
- Error scenarios: permission denied, oversized file, API timeout
- localStorage persistence: save & restore analysis

### Manual Testing
- Camera permissions (iOS, Android)
- File upload on various devices
- Responsive design on 320px to 1920px viewports

---

## 10. Deployment & Environment

### Development
- `pnpm dev` → localhost:3000 with hot reload
- Mocked API by default

### Production
- Build: `pnpm build`
- Start: `pnpm start`
- Deploy: Vercel (recommended) or Docker
- Environment variables:
  - `NEXT_PUBLIC_USE_REAL_API` (default: false)
  - `NEXT_PUBLIC_YOUCAM_API_KEY` (if real API)
  - `NEXT_PUBLIC_YOUCAM_API_URL` (if real API)

---

## 11. Success Criteria

- ✅ App loads, renders camera/upload UI
- ✅ Camera capture & image upload work on mobile
- ✅ Mocked API response displays on dashboard
- ✅ Health score, metrics, safety flags render correctly
- ✅ Barrier repair regimen shows East African ingredients
- ✅ Color palette & lip shade suggestions display
- ✅ localStorage save/restore works
- ✅ Responsive design passes mobile viewport tests
- ✅ No console errors, ESLint/TypeScript clean
- ✅ Unit tests pass with >70% coverage
- ✅ CI/CD workflows run on PR & deploy on merge

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **Fitzpatrick Scale** | Classification of skin type by melanin content (types I-VI) |
| **Melanin-rich skin** | Fitzpatrick types V-VI (deep brown to black skin) |
| **Hyperpigmentation** | Darkened patches of skin (common in Fitzpatrick V-VI) |
| **Post-inflammatory hyperpigmentation (PIP)** | Darkening after skin injury or inflammation |
| **Kitenge** | Colorful East African wax print fabric, design inspiration |
| **VTO / Virtual Try-On** | AI technology to visualize makeup/accessories on user's face |
| **Colorimetry** | Science of matching colors to skin tone for aesthetics |
| **Barrier repair** | Strengthening skin's protective moisture barrier |

---

**Document End**
