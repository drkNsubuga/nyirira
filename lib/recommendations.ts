import { BarrierRepairProduct, SafetyFlag, SkinAnalysisResult } from './types';

/**
 * Score-driven guidance for Nyirira's results dashboard.
 *
 * Optimised for Fitzpatrick V-VI (melanin-rich) skin in Uganda/East Africa:
 * - Post-inflammatory hyperpigmentation (PIH) is the #1 complication from any skin trauma
 * - Ochronosis (paradoxical permanent darkening) from hydroquinone misuse is endemic
 * - Mercury-containing skin-lightening products are widespread in Kampala markets
 * - Equatorial UV (UV index 10-14 year-round) makes unprotected skin deteriorate fast
 * - Keloid scarring risk is elevated; barrier damage causes raised, permanent scars
 * - Skin thinning with visible subcutaneous veins = corticosteroid/steroid abuse sign
 *
 * Score bands:  <50 critical repair · 50-69 moderate repair · 70-84 balance · ≥85 thrive
 */
export type SkinSnapshot = Pick<
  SkinAnalysisResult,
  'healthScore' | 'spots' | 'texture' | 'redness'
>;

export type ScoreBand = 'critical' | 'repair' | 'balance' | 'thrive';

export function scoreBand(score: number): ScoreBand {
  if (score < 50) return 'critical';
  if (score < 70) return 'repair';
  if (score < 85) return 'balance';
  return 'thrive';
}

/**
 * Safety flags targeting the specific damage patterns seen in melanin-rich skin
 * exposed to counterfeit cosmetics and equatorial UV.
 */
export function buildSafetyFlags(skin: SkinSnapshot): SafetyFlag[] {
  const score = skin.healthScore;
  const band = scoreBand(score);
  const flags: SafetyFlag[] = [];

  // ── 1. ALWAYS: Mercury / hydroquinone / steroid abuse warning ───────────────
  // This is the most common source of severe, irreversible damage in Uganda.
  flags.push({
    id: 'toxic-bleaching',
    severity: 'critical',
    title: 'Danger: Illegal Bleaching Agents Common in Uganda Markets',
    description:
      'Some products sold in Kikuubo, Owino Market and online contain mercury, high-strength hydroquinone (>2%), and unlabelled corticosteroids. On Fitzpatrick V-VI skin these cause ochronosis (permanent bluish-black darkening), skin thinning, visible veins, and mercury kidney damage. The damage is often irreversible.',
    recommendation:
      'Never buy skin-lightening creams without checking the UNBS registration number. Safe brighteners available in pharmacies: Niacinamide 5%, Vitamin C, and Azelaic Acid 10-15%. Avoid any product labelled "fast-acting" or sold without an ingredient list.',
  });

  // ── 2. ALWAYS: Equatorial UV ─────────────────────────────────────────────────
  flags.push({
    id: 'equatorial-uv',
    severity: 'warning',
    title: 'High UV Index Year-Round — SPF 50+ Required Daily',
    description:
      'Uganda sits at the equator with UV Index 10-14 daily. UV is the single biggest driver of PIH (post-inflammatory hyperpigmentation) darkening in melanin-rich skin — unprotected skin accumulates melanin unevenly, making spots and scars darker within days.',
    recommendation:
      'Apply broad-spectrum SPF 50+ every morning before leaving home, even on overcast days. Reapply every 2 hours outdoors. La Roche-Posay, Neutrogena, and Gold Bond are stocked at Uchumi and Quality Supermarkets in Kampala.',
  });

  // ── 3. Conditional: band and metric-driven ───────────────────────────────────

  if (band === 'critical') {
    flags.push({
      id: 'critical-barrier',
      severity: 'critical',
      title: `Score ${score}/100 — Barrier Critically Compromised`,
      description:
        'A score under 50 on melanin-rich skin means the epidermal barrier is severely damaged. Classic signs: burning after water contact, raw-feeling skin, rapid rebound darkening, or visible thinning/veins. Steroid or mercury product misuse is a frequent cause. Applying any active ingredient now (vitamin C, acids, retinoids) will worsen damage.',
      recommendation:
        'Stop all actives immediately. Cleanse with plain water or an ultra-gentle soap-free wash. Apply only petroleum jelly (Vaseline, widely available in Uganda) or pure shea butter as an emergency barrier seal. See a dermatologist or visit Mulago Hospital dermatology clinic. Do not wait.',
    });
  } else if (band === 'repair') {
    if (skin.spots.severity === 'severe') {
      flags.push({
        id: 'severe-pih',
        severity: 'critical',
        title: 'Severe Hyperpigmentation — Post-Inflammatory Risk Very High',
        description:
          'Widespread dark spots on Fitzpatrick V-VI skin indicate significant PIH. Any additional trauma (scratching, picking, harsh scrubs, or a new bleaching product) will add new dark marks that take 6-24 months to fade — or never fade without treatment.',
        recommendation:
          'Absolutely do not pick, scratch, or exfoliate. Use a gentle non-foaming cleanser (CeraVe Hydrating Cleanser available at Uchumi Supermarket). Start niacinamide 5% serum (Ordinary or CeraVe, Kampala city centre pharmacies) with SPF 50+ daily. Book a dermatologist consultation to assess whether in-clinic azelaic acid or tranexamic acid treatment is appropriate.',
      });
    } else if (skin.redness.level >= 50) {
      flags.push({
        id: 'inflammatory-redness',
        severity: 'critical',
        title: 'High Redness — Active Inflammation Detected',
        description:
          `Redness at ${skin.redness.level}% on melanin-rich skin signals active barrier inflammation. In Fitzpatrick V-VI, inflammatory episodes directly trigger melanocyte overproduction, leaving dark marks after the redness resolves. Harsh soaps, fragranced products, and "antiseptic" lemon treatments popular in Uganda all worsen this cycle.`,
        recommendation:
          'Eliminate all fragrance, alcohol, and soap-based cleansers. Use only lukewarm water and a cotton pad. Apply a minimal ceramide moisturiser (CeraVe or Cetaphil, available at Uchumi). If redness persists beyond 5 days or spreads, seek clinical review — it may be perioral dermatitis or seborrheic dermatitis, both common and treatable.',
      });
    } else {
      flags.push({
        id: 'repair-pih-prevention',
        severity: 'warning',
        title: 'Repair Phase — Prevent New PIH Triggers',
        description:
          'Score 50-69 means the barrier is stressed. Any new trauma — over-cleansing, scrubbing, or a new "brightening" product — can set off PIH on Fitzpatrick V-VI skin within 48 hours, creating marks that last months.',
        recommendation:
          'Cleanse gently once per day with a pH-balanced cleanser (avoid bar soap — alkaline pH disrupts melanin-rich skin barriers). Pause all exfoliants, retinoids, and vitamin C for 21 days to allow recovery. Moisturise on damp skin with glycerin or shea butter.',
      });
    }
  } else if (band === 'balance') {
    if (skin.spots.severity !== 'mild') {
      flags.push({
        id: 'pih-management',
        severity: 'warning',
        title: 'Pigmentation — Target PIH With Proven Actives',
        description:
          'Moderate spots on melanin-rich skin are typically PIH from old acne, insect bites, or friction. Bleaching products are not the answer — they make it worse. Safe, clinically proven actives work slowly but permanently.',
        recommendation:
          'Layer niacinamide 5% in the morning and vitamin C 10% in the evening, under SPF 50+. Consistency over 90 days is key — expect visible fading in 8-12 weeks. The Ordinary Niacinamide 10% + Zinc and Vitamin C Suspension are stocked at some Kampala pharmacies and through trusted online vendors.',
      });
    } else if (skin.redness.level >= 35) {
      flags.push({
        id: 'redness-watch',
        severity: 'warning',
        title: 'Mild Redness — Protect the Barrier',
        description:
          `Redness at ${skin.redness.level}% is mild but worth watching. Melanin-rich skin can appear less visibly red even when inflamed — the underlying inflammation still triggers PIH.`,
        recommendation:
          'Switch to a fragrance-free cleanser and add a ceramide-based moisturiser (CeraVe Moisturising Cream). Avoid scrubbing, toners with alcohol, or astringents common in East African pharmacies.',
      });
    } else {
      flags.push({
        id: 'maintenance-balance',
        severity: 'warning',
        title: `Score ${score}/100 — Maintain Consistency`,
        description:
          'Good barrier health. Scores drop quickly on melanin-rich skin when sunscreen is skipped, barrier is stripped by harsh soaps, or stress triggers inflammation.',
        recommendation:
          'SPF 50+ daily is non-negotiable. Keep glycerin or hyaluronic acid in your routine. Add niacinamide if you want to maintain even tone long-term.',
      });
    }
  } else {
    // thrive
    flags.push({
      id: 'thrive-protect',
      severity: 'warning',
      title: `Score ${score}/100 — Protect What You Have`,
      description:
        'Excellent skin health. Fitzpatrick V-VI skin can deteriorate rapidly with a single bad product or sun exposure episode — the "good period" is worth protecting actively.',
      recommendation:
        'Maintain SPF 50+ daily, keep niacinamide in rotation, and avoid introducing new harsh products even when marketed as "natural". Check UNBS registration on any new skincare product before use.',
    });
  }

  return flags;
}

/**
 * Realistic barrier-repair regimen using products actually available in Uganda.
 * Named brands stocked at Uchumi, Quality, Carrefour Kampala, or trusted pharmacies.
 */
export function buildBarrierRepairRegimen(skin: SkinSnapshot): BarrierRepairProduct[] {
  const band = scoreBand(skin.healthScore);

  if (band === 'critical') {
    return [
      {
        id: 'emergency-barrier',
        name: 'Vaseline Pure Petroleum Jelly (Emergency Barrier Seal)',
        activeIngredients: ['White Petrolatum 100%'],
        frequency: 'Apply generously 3-4× daily',
        notes:
          'Available everywhere in Uganda at 500-1,500 UGX. The safest occlusive barrier for critically damaged melanin-rich skin — no fragrance, no actives, just sealing. Do not substitute with cooking oils; they can harbour bacteria on broken skin.',
      },
      {
        id: 'water-wash',
        name: 'Lukewarm Water-Only Cleanse',
        activeIngredients: ['Water'],
        frequency: 'Once daily, evening only',
        notes:
          'All cleansers — including "gentle" ones — should be paused when the barrier is critically compromised. Use only lukewarm water and your hands. Pat dry with a clean soft cloth; do not rub.',
      },
      {
        id: 'oral-hydration',
        name: 'Oral Hydration + Anti-Inflammatory Support',
        activeIngredients: ['Water (2L/day)', 'Omega-3 (fish or flaxseed)'],
        frequency: 'Daily',
        notes:
          'Skin barrier repair happens from inside too. Drink 2 litres of water daily. Omega-3-rich foods (fresh Nile perch from Owino market, groundnuts) support internal anti-inflammation. Seek clinical review at Mulago Hospital or a UNBS-registered dermatologist.',
      },
    ];
  }

  if (band === 'repair') {
    return [
      {
        id: 'gentle-cleanser-repair',
        name: 'CeraVe Hydrating Cleanser (or Dove Sensitive Fragrance-Free Bar)',
        activeIngredients: ['Ceramides', 'Glycerin', 'Hyaluronic Acid'],
        frequency: 'Once daily, evening only',
        notes:
          'CeraVe Hydrating Cleanser is stocked at Uchumi Supermarket and Kampala Pharmacy. The Dove Sensitive Beauty Bar (fragrance-free) is a reliable backup available across Uganda and costs ~2,500 UGX. Do not use regular bar soap — the alkaline pH damages melanin-rich skin barriers.',
      },
      {
        id: 'shea-ceramide-repair',
        name: 'Raw Shea Butter (Unrefined, Northern Uganda Source)',
        activeIngredients: ['Shea Butter', 'Vitamin E naturally occurring', 'Triterpenes'],
        frequency: 'Twice daily on damp skin',
        notes:
          'Unrefined shea butter from northern Uganda (sold in Owino Market, ~3,000-5,000 UGX per kg) contains triterpenes with proven anti-inflammatory effect on dark skin. Apply immediately after washing while skin is still damp to lock in moisture. Skip this step if the skin is actively broken or weeping.',
      },
      {
        id: 'panthenol-repair',
        name: 'Bepanthen Wound Healing Ointment (Panthenol 5%)',
        activeIngredients: ['Dexpanthenol (Panthenol) 5%'],
        frequency: 'Evening, over shea butter',
        notes:
          'Bepanthen is available at Mulago Hospital pharmacy and most Kampala pharmacies (~8,000-12,000 UGX). Panthenol accelerates keratinocyte repair — clinically validated for post-inflammatory healing on darker skin tones. Apply as final step over moisturiser.',
      },
    ];
  }

  if (band === 'thrive') {
    return [
      {
        id: 'niacinamide-maintain',
        name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        activeIngredients: ['Niacinamide 10%', 'Zinc PCA 1%'],
        frequency: 'Morning, before SPF',
        notes:
          'Available at some Kampala pharmacies and online (~15,000-25,000 UGX). Niacinamide regulates melanin transfer — the most evidence-backed ingredient for maintaining even tone on Fitzpatrick V-VI skin. Combine with SPF 50+ every morning for best results.',
      },
      {
        id: 'hyaluronic-gel',
        name: 'Neutrogena Hydro Boost Water Gel',
        activeIngredients: ['Hyaluronic Acid', 'Glycerin'],
        frequency: 'Twice daily',
        notes:
          'Available at Quality Supermarket Kampala and select pharmacies (~20,000-30,000 UGX). Lightweight gel formula suits Kampala\'s humid climate without congesting pores. Apply on damp skin for maximum water-binding effect.',
      },
      {
        id: 'shea-night',
        name: 'Raw Shea Butter Night Seal',
        activeIngredients: ['Shea Butter', 'Natural Vitamin E'],
        frequency: '2-3× per week, evening',
        notes:
          'A thin overnight layer of raw northern Ugandan shea butter keeps the barrier resilient without disrupting the niacinamide-SPF routine. Traditional, locally available, and still one of the most effective occlusive choices for melanin-rich skin.',
      },
    ];
  }

  // balance band (70-84) — evidence-backed routine for Uganda context
  return [
    {
      id: 'niacinamide-balance',
      name: 'Niacinamide 5% Serum (The Ordinary or CeraVe)',
      activeIngredients: ['Niacinamide 5%', 'Hyaluronic Acid'],
      frequency: 'Morning + evening',
      notes:
        'The single most important active for Fitzpatrick V-VI skin — reduces melanin transfer, strengthens barrier, and calms inflammation. Stocked at Uchumi Supermarket and Kampala city centre pharmacies. Use consistently for 90 days before judging results.',
    },
    {
      id: 'glycerin-shea-balance',
      name: 'Glycerin 10% + Raw Shea Butter Moisturiser',
      activeIngredients: ['Glycerin 10%', 'Shea Butter', 'Sweet Almond Oil'],
      frequency: 'Daily after cleansing, on damp skin',
      notes:
        'Mix pure glycerin (pharmacy grade, ~2,000 UGX per 100ml) with raw shea butter from Owino Market. The glycerin draws water into the skin, the shea seals it. This combination outperforms most imported moisturisers at a fraction of the cost.',
    },
    {
      id: 'vitamin-c-balance',
      name: 'Vitamin C 10% Serum (The Ordinary Ascorbic Acid)',
      activeIngredients: ['L-Ascorbic Acid 10%', 'Alpha Arbutin 0.5%'],
      frequency: 'Evening, 3-4× per week',
      notes:
        'Vitamin C inhibits tyrosinase (the enzyme that overproduces melanin after inflammation) — directly prevents new PIH formation. Use in the evening to avoid UV interaction. Available through trusted Kampala online vendors. Store in a cool, dark place — it oxidises in heat.',
    },
  ];
}

/**
 * Score-aware lead text for the Harmonized Look tab.
 */
export function harmonizedLookLead(skin: SkinSnapshot): string {
  const score = skin.healthScore;
  const band = scoreBand(score);

  if (band === 'thrive') {
    return `At ${score}/100, your skin is an even, well-hydrated canvas — base makeup sits smoothly and Kitenge-inspired golds, emeralds and terracottas read true against your undertone.`;
  }
  if (band === 'balance') {
    return `Your ${score}/100 score shows a mostly healthy barrier with some ${skin.spots.severity === 'mild' ? 'minor unevenness' : 'pigmentation to work with'} — press shea butter in first so base blends evenly, then let warm gold and terracotta tones do the rest.`;
  }
  if (band === 'repair') {
    return `Your ${score}/100 score means the barrier needs attention first. Keep base makeup light and non-occlusive while skin recovers. Warm golds, deep emeralds and rich plums will suit your undertone beautifully once the barrier is calmer.`;
  }
  return `Your ${score}/100 score signals active skin distress — skip heavy coverage for now and let skin breathe. Focus on healing; the colour recommendations are ready when your barrier recovers.`;
}
