# Nyirira - Skin AI for Melanin-Rich Skin

**Project URL:** [To be added upon submission]  
**Demo Video:** [To be added upon submission]  
**Tech Stack:** Next.js, TypeScript, TensorFlow.js, YouCam API

## Project Overview

Nyirira is a revolutionary web application that brings safe, localized skincare diagnostics to the Ugandan market and beyond, specifically optimized for melanin-rich skin tones (Fitzpatrick V-VI). By leveraging the power of Perfect Corp's YouCam API, Nyirira addresses a critical gap in the beauty tech industry: the underrepresentation and misdiagnosis of skin concerns in darker skin tones.

## The Problem

Traditional skincare analysis tools often fail melanin-rich skin tones, leading to:
- Inaccurate skin condition assessments
- Inappropriate product recommendations
- Wasted resources on ineffective treatments
- Lack of trust in AI-driven beauty solutions

Nyirira was born to solve this by providing tailored skincare insights that actually work for melanin-rich skin.

## Solution & Features

### 1. Smart Skin Analysis
- **Personalized Diagnostics:** Uses YouCam's advanced skin analysis API to provide accurate assessments of skin health, spots, texture, and redness specifically calibrated for melanin-rich skin.
- **Safety-First Recommendations:** Identifies potentially harmful ingredients (e.g., hydroquinone) and provides safer alternatives.
- **Barrier Health Focus:** Specialized analysis for skin barrier repair and maintenance.

### 2. Virtual Try-On (VTO)
- **Makeup Recommendations:** Suggests suitable lip shades and makeup looks based on individual skin tone and analysis.
- **Outfit Palette Integration:** Provides complementary color palettes for different occasions.
- **Personalized Suggestions:** Goes beyond generic recommendations to offer culturally relevant beauty advice.

### 3. User Experience
- **Real-time Validation:** Advanced image validation ensures optimal analysis conditions.
- **Privacy-First:** All processing happens locally; no images are stored on servers.
- **History Tracking:** Users can compare their skin analysis over time to track progress.
- **Export Functionality:** Save analysis results as images for future reference.

### 4. Technical Excellence
- **Robust Error Handling:** Comprehensive error management for network issues, API limitations, and invalid inputs.
- **Performance Optimized:** Efficient image processing and analysis with mock data fallback for development.
## YouCam API Integration

Nyirira integrates multiple YouCam API endpoints to deliver comprehensive functionality:

### Skin Analysis API
- **Endpoint:** `analyzeImage`
- **Functionality:** Processes uploaded images to analyze:
  - Overall skin health score
  - Spot detection and severity (hyperpigmentation, acne)
  - Texture analysis (smoothness, roughness)
  - Redness and inflammation levels
  - Personalized product recommendations
- **Implementation:** The `analyzeImageWithFallback` function in `youcamClient.ts` handles both live API calls and mock data for development.

### Virtual Try-On API
- **Endpoint:** `getVTOSuggestions`
- **Functionality:** Provides:
  - Recommended lipstick shades
  - Outfit color palettes
  - Beauty inspiration based on skin tone
- **Implementation:** Transforms raw VTO data into user-friendly recommendations through the `transformVTOData` function.

### Technical Challenges & Solutions
- **TensorFlow.js Backend Registry:** Resolved bundling issues by explicitly importing CPU/WebGL backends to prevent "No backend found in registry" errors during face detection.
- **Image Validation:** Implemented comprehensive validation pipeline for resolution, face detection, and image quality.
- **Error Handling:** Created detailed mapping of YouCam API error codes to user-friendly guidance.

## Target Market & Impact

### Primary Audience
- Ugandan consumers with melanin-rich skin
- Beauty enthusiasts of color
- E-commerce shoppers looking for personalized beauty advice
- Skincare professionals needing diagnostic tools

### Market Impact
- **Democratizes Beauty Tech:** Makes advanced skincare analysis accessible to underserved markets
- **Builds Trust:** Accurate diagnoses for melanin-rich skin increase confidence in AI beauty solutions
- **Drives E-commerce:** Personalized product recommendations increase conversion for beauty retailers
- **Health Education:** Promotes safer skincare practices and ingredient awareness

## Technical Implementation

### Architecture
- **Frontend:** Next.js with TypeScript for optimal performance and type safety
- **API Integration:** Custom client (`youcamClient.ts`) with mock/fallback mechanism
- **Image Processing:** Client-side validation and compression
- **State Management:** React hooks with localStorage persistence
- **UI Components:** Custom React components with Lucide React icons

### Key Files
- `app/page.tsx` - Main application component and state management
- `lib/youcamClient.ts` - YouCam API integration and data transformation
- `lib/advancedValidation.ts` - Image validation pipeline
- `lib/types.ts` - TypeScript interfaces for API responses
- `lib/storage.ts` - Local storage utilities
- `components/` - Reusable UI components

## Development Journey

### API Surprises
During development, we discovered that the YouCam API's skin analysis is remarkably accurate for hyperpigmentation detection in melanin-rich skin, often identifying concerns users hadn't noticed. However, we also encountered limitations in the VTO color recommendations for very dark skin tones, which inspired us to develop additional filtering and personalization logic.

### Technical Challenges
The most significant challenge was resolving TensorFlow.js backend registry conflicts in a Next.js environment. Bundlers were tree-shaking essential backend registrations, causing face detection to fail. We solved this by explicitly importing CPU and WebGL backends with a fallback mechanism, ensuring robust functionality across different browser environments.

### Future Enhancements
- Mobile app development for broader reach
- Integration with local Ugandan beauty retailers
- Advanced acne tracking and treatment plans
- Community features for user experiences and product reviews

## Why Nyirira Matters

Nyirira isn't just another beauty app – it's a movement toward inclusive beauty technology. By providing accurate, localized skincare insights for melanin-rich skin, we're:

1. **Reducing Health Disparities:** Making advanced skincare accessible to communities that have been historically underserved by beauty tech.
2. **Building Confidence:** Helping users understand their skin better and make informed decisions about their beauty routines.
3. **Supporting Local E-commerce:** Driving targeted sales for beauty brands that cater to diverse skin tones.
4. **Educating Users:** Promulating safer skincare practices and ingredient awareness.

Join us in redefining beauty tech for everyone, starting with melanin-rich skin in Uganda and beyond.

---

*Built for the YouCam API Skin AI & eCommerce VTO Hackathon*
- **Responsive Design:** Works seamlessly across desktop and mobile devices.

---

## 5. Crowdsourced Counterfeit Detection & Community Safety Watch

### The Problem
Uganda's informal beauty market (Kikuubo, Owino, Instagram vendors) is flooded with counterfeit skincare products containing illegal bleaching agents — hydroquinone above 2%, mercury, and corticosteroids. Victims rarely report adverse reactions because no accessible channel exists.

### Our Solution
Nyirira's Step 4 turns every skin scan into a community safety action:

**Diagnostic Trigger:** When the AI flags high redness (≥40%), moderate/severe spots, or a critical safety flag (chemical bleaching indicators), the app surfaces an interactive prompt — *"Did this barrier damage start after using a recent product?"*

**ReportCounterfeitModal:** A clean bottom-sheet form lets users log:
- Product name + vendor/brand
- Purchase location (pre-populated Ugandan markets: Kikuubo, Owino, Nakasero, Instagram vendors, etc.)
- Optional batch number (UNBS traceability)
- Multi-select symptom checklist: Burning/Stinging, Skin Thinning/Veins, Ochronosis, Severe Acne

Reports are saved to `localStorage` — simulating a crowdsourced data pipeline with zero backend cost.

**CommunitySafetyWatch Feed:** A searchable, filterable feed in the "Community Watch" tab shows:
- 🔴 **RED ALERT** — 3+ chemical burn/mercury reports (e.g. Skin Light Body Lotion, Movate Skin Tone Cream)
- 🟡 **WARNING** — 1–2 reports under review
- 🟢 **VERIFIED SAFE** — curated authentic products (Nivea, Vaseline)

Filters: product/brand search + Uganda market dropdown + risk level dropdown.

Footer directs serious hazard cases to UNBS (+256 41 4505995).

### Impact
- Empowers ordinary Ugandan consumers to protect each other
- Creates a verifiable adverse-reaction dataset for future UNBS integration
- Reduces harm from counterfeit products in underserved markets
