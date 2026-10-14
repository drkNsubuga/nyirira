# Development Roadmap - Nyirira

## MVP (v1.0) - COMPLETE ✅

### Core Features
- ✅ Selfie capture & image upload (camera + file)
- ✅ Mocked dual YouCam API (skin analysis + VTO)
- ✅ Results dashboard (health score, metrics, safety flags, barrier repair, colors)
- ✅ localStorage persistence
- ✅ Mobile-responsive design (Tailwind CSS)
- ✅ Error handling (permissions, file size, timeouts)

### Image Preview & Overlay Features
- ✅ Image preview with confirmation (FR1.4)
  - [x] Show captured/uploaded image before analysis
  - [x] Allow user to confirm or retake the image
  - [ ] Add image quality indicator (blur, lighting, composition)

### Infrastructure
- ✅ Next.js 16+ (App Router)
- ✅ TypeScript strict mode
- ✅ Tailwind CSS (slate/emerald/amber)
- ✅ Lucide React icons
- ✅ Git repo + .gitignore
- ✅ GitHub Actions CI/CD (lint, test, deploy)
- ✅ Jest + React Testing Library setup
- ✅ README + SRS documentation

---

## v1.1 - Live API Integration (Q1 2027)

### Tasks
- [ ] Obtain YouCam API credentials
  - [ ] API key & endpoint documentation
  - [ ] Skin Analysis endpoint confirmation
  - [ ] Virtual Try-On endpoint confirmation

- [ ] Implement real API calls
  - [ ] Replace `getMockSkinAnalysis()` with real endpoint
  - [ ] Replace `getMockVTOResult()` with real endpoint
  - [ ] Add request/response logging for debugging
  - [ ] Handle API rate limits & throttling

- [x] Enhance error handling
  - [x] Retry logic with exponential backoff
  - [x] API timeout handling (5-30s)
  - [x] Clear user-facing error messages for API failures
  - [ ] Fallback to mocked data if API unavailable

- [ ] Testing
  - [ ] Mock YouCam API responses in Jest
  - [ ] E2E tests for real API flow
  - [ ] Load testing (stress test pipeline)

### Acceptance Criteria
- Live API successfully processes real images
- Response time < 10 seconds typical
- Graceful fallback if API unavailable
- All E2E tests pass

---

## New Features - Image Overlays & Enhanced History (Q4 2026)

### Image Overlay Markers (FR2.4)
- [ ] Create ImageOverlay component for analysis results
  - [ ] Implement spot detection markers with tooltips
  - [ ] Add color-coded texture/redness overlays
  - [ ] Make overlays interactive (tap for details)
  - [ ] Test overlay accuracy with mock data

- [ ] Enhance image preview quality
  - [ ] Add blur detection algorithm
  - [ ] Evaluate lighting conditions
  - [ ] Check composition and framing
  - [ ] Display quality score and recommendations

### Enhanced History Comparison (FR4.3)
- [ ] Update HistoryCompare to show side-by-side images
  - [ ] Add overlay markers for condition changes
  - [ ] Visual health score indicators (arrows, colors)
  - [ ] Date comparison formatting
  - [ ] Export comparison results

- [ ] Visual history comparison features
  - [ ] Side-by-side image comparison in history
  - [ ] Overlay markers showing condition changes over time
  - [ ] Health score visual indicators (trend arrows, colors)
  - [ ] Date comparison formatting
  - [ ] Export comparison results

### Acceptance Criteria
- Image overlays accurately display detected skin conditions
- Interactive tooltips provide detailed condition information
- History comparison shows visual improvements/declines
- All overlay features work on mobile and desktop
- Image quality indicators provide actionable feedback

---

## v1.2 - User Authentication & History (Q2 2027)

### Tasks
- [ ] Auth system design
  - [ ] Decide on provider: Firebase, Auth0, or custom
  - [ ] Plan data model (User, Analysis, Session)
  - [ ] Security review (HTTPS, token storage, CSRF protection)

- [ ] Backend setup (Supabase or Firebase)
  - [ ] Real database (PostgreSQL or Firestore)
  - [ ] User table & authentication
  - [ ] Analysis history table
  - [ ] API endpoints for save/retrieve

- [ ] Frontend auth
  - [ ] Login/signup screens
  - [ ] Session management (localStorage token)
  - [ ] Protected routes
  - [ ] User profile page

- [x] Analysis history
  - [x] List previous analyses with thumbnails
  - [x] View past results
  - [x] Compare analyses over time
  - [x] Export analysis to PDF/image

### Acceptance Criteria
- User can create account & login
- Analysis history persists on server
- User can view & compare past results
- JWT tokens refresh properly

---

## v1.3 - Product Recommendations (Q2 2027)

### Tasks
- [ ] Build product database
  - [ ] Curate East African skincare brands
  - [ ] Link ingredients to Nyirira recommendations
  - [ ] Include pricing (UGX) & availability

- [ ] Integration
  - [ ] Display recommended products on dashboard
  - [ ] Link to affiliate/marketplace (e.g., Jumia Uganda)
  - [ ] Track clicks for analytics (post-MVP)

- [ ] Localization
  - [ ] Feature available in Uganda first
  - [ ] Expandable to Kenya, Tanzania, Rwanda

### Acceptance Criteria
- Dashboard displays relevant local products
- Links to purchase work correctly
- No dead links or broken product pages

---

## v1.4 - Multi-Language Support (Q3 2027)

### Tasks
- [ ] Internationalization (i18n) setup
  - [ ] Choose library: `next-i18next` or `react-intl`
  - [ ] Define supported languages: English, Luganda, Swahili

- [ ] Translate content
  - [ ] App copy (UI labels, buttons, messages)
  - [ ] SRS & documentation
  - [ ] Error messages & alerts

- [ ] Right-to-left (RTL) support (future: Arabic)
  - [ ] Tailwind directives for RTL layout

### Acceptance Criteria
- App fully functional in English, Luganda, Swahili
- Language switcher in header
- All user-facing text translated

---

## v1.5 - Video Consultation Booking (Q3 2027)

### Tasks
- [ ] Booking system
  - [ ] Integrate dermatologist database
  - [ ] Calendar scheduling (Calendly or custom)
  - [ ] Video call integration (Zoom, Google Meet, or Jitsi)

- [ ] Payment integration
  - [ ] Stripe or M-Pesa (for Uganda)
  - [ ] Consultation pricing
  - [ ] Invoice generation

- [ ] Notifications
  - [ ] Email/SMS reminders
  - [ ] Booking confirmation

### Acceptance Criteria
- Dermatologists can list availability
- Users can book consultations
- Video calls functional
- Payment processing works

---

## v1.6 - Offline Mode & Service Workers (Q4 2027)

### Tasks
- [ ] Service worker setup
  - [ ] Cache app shell & static assets
  - [ ] Background sync for offline analysis save
  - [ ] offline.html fallback page

- [ ] Offline UI
  - [ ] Indicate offline status in UI
  - [ ] Queue analyses for sync when online
  - [ ] Sync status indicator

### Acceptance Criteria
- App loads & functions offline
- Images can be captured offline
- Results sync when connection restored

---

## v2.0 - Advanced Analytics & Insights (Q1 2028)

### Tasks
- [ ] Analytics pipeline
  - [ ] Google Analytics or Posthog integration
  - [ ] Track user flow, feature usage, conversion funnels
  - [ ] Privacy compliance (GDPR, CCPA)

- [ ] Insights dashboard (admin)
  - [ ] User demographics (region, age, skin type)
  - [ ] Most common skin concerns
  - [ ] Popular color recommendations
  - [ ] Performance metrics

- [ ] Trend reports
  - [ ] Monthly reports on usage patterns
  - [ ] Seasonal skincare trends
  - [ ] Regional insights for product recommendations

### Acceptance Criteria
- Analytics integrated without breaking privacy
- Admin dashboard displays key metrics
- Reports generated automatically

---

## v2.1 - AI Model Customization (Q1 2028)

### Tasks
- [ ] Fine-tune skin analysis for Fitzpatrick V-VI
  - [ ] Collect feedback on current mocked results
  - [ ] Partner with dermatologists for validation
  - [ ] Adjust model weights/thresholds

- [ ] Advanced features
  - [ ] Trend detection (improving/worsening skin over time)
  - [ ] Personalized ingredient recommendations
  - [ ] Predictive care suggestions (e.g., "increase sunscreen in July")

### Acceptance Criteria
- AI recommendations accuracy improves (measured by user feedback surveys)
- Dermatologist validation score > 90%

---

## Backlog (Future Scope)

### Tech Debt
- [ ] Refactor YoucamClient.ts for better testability
- [ ] Add Storybook for component documentation
- [ ] Performance audit & optimization
- [ ] Accessibility audit (WCAG 2.1 AAA)

### Features (Lower Priority)
- [x] Dark mode toggle
- [ ] Social sharing (Instagram, TikTok)
- [ ] User-generated content (before/after galleries)
- [ ] Influencer partnerships
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

### Monetization (Future)
- [ ] Premium subscription (advanced analytics, priority support)
- [ ] Affiliate commissions (product links)
- [ ] B2B partnerships (skincare brands, dermatologists)
- [ ] API licensing for other apps

---

## Known Issues & Limitations (MVP)

### Current
- ❌ API responses are mocked (placeholder only)
- ❌ No user authentication
- ❌ No persistent backend database
- ❌ No multi-language support
- ❌ No product recommendations
- ❌ Limited Accessibility (WIP)

### Workarounds
- Use mocked API for development
- Save results to localStorage manually
- Test in English only

---

## Testing & QA Strategy

### Unit Testing
- [x] Complete 70% code coverage
- [x] Mock all external APIs
- [x] Test error scenarios

### Integration Testing
- [x] Test component interactions
- [ ] Test state flow (capture → processing → results)

### End-to-End Testing
- [ ] Complete user flow on real devices
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Cross-platform testing (iOS, Android)

### Performance Testing
- [ ] Lighthouse audit > 90 in all categories
- [x] Image optimization (JPEG compression)
- [ ] Bundle size < 500KB (gzipped)

### Security Testing
- [ ] OWASP Top 10 review
- [ ] Penetration testing (post-MVP)
- [ ] Privacy audit (GDPR compliance)

### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] WCAG 2.1 AA compliance

---

## Success Metrics

### User Engagement
- Daily active users (DAU)
- Monthly active users (MAU)
- Session duration average
- Return user rate
- Feature adoption rate (VTO vs. skin analysis)

### Technical
- App load time < 3s
- API response time < 10s (when live)
- Error rate < 0.1%
- Uptime > 99.9%
- Crash rate < 0.01%

### Business
- User retention (30-day, 7-day)
- Referral rate (viral coefficient)
- Product recommendation click-through rate
- Booking conversion rate (consultations)

---

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| MVP (v1.0) | 4 weeks | ✅ COMPLETE |
| Live API (v1.1) | 4 weeks | ⏳ Q1 2027 |
| Auth & History (v1.2) | 6 weeks | ⏳ Q2 2027 |
| Products (v1.3) + i18n (v1.4) | 6 weeks | ⏳ Q2 2027 |
| Consultation Booking (v1.5) | 4 weeks | ⏳ Q3 2027 |
| Offline Mode (v1.6) | 3 weeks | ⏳ Q4 2027 |
| Analytics v2.0 + AI v2.1 | 8 weeks | ⏳ Q1 2028 |

---

## Notes

- **Priorities**: Live API, then Auth, then Product Recommendations
- **Risk Areas**: YouCam API reliability, feature scope creep, device compatibility
- **Dependencies**: Awaiting YouCam API documentation and credentials
- **Team**: Adjust timeline based on team size & availability
- **Image sources**: 
  - [BlackSkinCare](https://www.reddit.com/r/Blackskincare/)

---

**Last Updated**: October 2026  
**Maintained By**: Dev Team
