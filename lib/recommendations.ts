import { BarrierRepairProduct, SafetyFlag, SkinAnalysisResult } from './types';

/**
 * Score-driven guidance for the results dashboard.
 *
 * The YouCam API (or the mock) provides the measurements — health score,
 * pigmentation severity, redness — but the advice below is Nyirira's own
 * curated content: safety warnings and a barrier-repair regimen that adapt
 * to what the scan actually found, grounded in the Ugandan/East African
 * context (equatorial UV, common bleaching products, locally available
 * ingredients, kitenge color aesthetics).
 *
 * Bands:  <60 repair-first · 60–79 balance/watch · ≥80 maintain/thrive
 */
export type SkinSnapshot = Pick<
  SkinAnalysisResult,
  'healthScore' | 'spots' | 'texture' | 'redness'
>;

export type ScoreBand = 'repair' | 'balance' | 'thrive';

export function scoreBand(score: number): ScoreBand {
  if (score < 60) return 'repair';
  if (score < 80) return 'balance';
  return 'thrive';
}

/**
 * Safety flags derived from the scan. Every run gets the two standing
 * warnings for melanin-rich skin in an equatorial climate (bleaching risk +
 * UV), plus one flag chosen from the score band and the weakest metric.
 */
export function buildSafetyFlags(skin: SkinSnapshot): SafetyFlag[] {
  const score = skin.healthScore;
  const band = scoreBand(score);

  const flags: SafetyFlag[] = [
    {
      id: 'bleaching-warning',
      severity: 'critical',
      title: '⚠️ Avoid Bleaching Agents',
      description:
        'Products containing hydroquinone, kojic acid, or mercury can damage melanin-rich skin and cause additional hyperpigmentation.',
      recommendation:
        skin.spots.severity === 'severe'
          ? 'Visible pigmentation tempts people to buy "lightening" soaps and creams from open markets — those usually carry mercury or high-strength hydroquinone and make PIP worse. Use pharmacy-tested brighteners instead: niacinamide, vitamin C, azelaic acid, plus daily SPF.'
          : 'Focus on safe brighteners: niacinamide, vitamin C, and natural botanicals like turmeric.',
    },
    {
      id: 'sun-protection',
      severity: 'warning',
      title: 'Sun Protection Essential',
      description:
        'Uganda sits close to the equator, so UV stays strong all year and can worsen hyperpigmentation and uneven tone — even on cloudy days.',
      recommendation:
        'Use broad-spectrum SPF 50+ daily. Reapply every 2 hours if outdoors; a wide-brim hat or kitenge headwrap adds welcome shade.',
    },
  ];

  if (band === 'repair') {
    flags.push({
      id: 'barrier-first',
      severity: 'critical',
      title: `Skin Score ${score}/100 — Repair Before Actives`,
      description:
        'A score under 60 usually means the barrier is stressed: skin stings with products, feels tight after washing, or flares easily. Pushing brighteners or exfoliants now can set pigmentation back months.',
      recommendation:
        'Pause acids, scrubs, retinoids and vitamin C for 14 days. Cleanse gently, moisturize on damp skin, and see a clinician if redness, pain or itching persists.',
    });
  } else if (skin.spots.severity === 'moderate' || skin.spots.severity === 'severe') {
    flags.push({
      id: 'pip-prevention',
      severity: 'warning',
      title: 'Don’t Pick or Scratch Spots',
      description:
        'In melanin-rich skin, picking pimples, insect bites or razor bumps triggers post-inflammatory hyperpigmentation (PIP) that can take months to fade — the marks often outlast the blemish itself.',
      recommendation:
        'Never squeeze. Treat breakouts early with a gentle spot gel, and fade existing marks with niacinamide + vitamin C under daily sunscreen.',
    });
  } else if (skin.redness.level >= 35) {
    flags.push({
      id: 'gentle-cleansing',
      severity: 'warning',
      title: 'Watch Harsh Soaps & Fragrances',
      description: `Redness at ${skin.redness.level}% suggests reactive skin. Strong “medicated” or lanolin soaps common in open markets strip the barrier and leave melanin-rich skin dull and sensitive.`,
      recommendation:
        'Switch to a fragrance-free, pH-balanced cleanser and stop scrubbing — cleanse with fingertips and lukewarm water only.',
    });
  } else {
    flags.push({
      id: 'maintain-barrier',
      severity: 'warning',
      title: `Skin Score ${score}/100 — Keep It Steady`,
      description:
        'Your barrier is in good shape. Scores drift downward with harsh soaps, skipped sunscreen and picking at breakouts — small habits keep this number climbing.',
      recommendation:
        'Keep cleansing gentle, moisturize while skin is still damp, and continue daily SPF so next scan builds on today’s result.',
    });
  }

  return flags;
}

/**
 * Barrier-repair regimen derived from the scan. The 60–79 band keeps the
 * original baseline trio (pharmacy staples already familiar to users); the
 * repair band simplifies everything, and the thrive band focuses on upkeep.
 */
export function buildBarrierRepairRegimen(
  skin: SkinSnapshot,
): BarrierRepairProduct[] {
  const band = scoreBand(skin.healthScore);

  if (band === 'repair') {
    return [
      {
        id: 'gentle-cleanser',
        name: 'Soap-Free Gentle Cleanser',
        activeIngredients: ['Glycerin', 'Panthenol'],
        frequency: 'Morning & night',
        notes:
          'Cleanses without stripping — skip harsh soaps and scrubs while the barrier recovers. Widely stocked in Ugandan pharmacies; a plain glycerin bar works too.',
      },
      {
        id: 'glycerin-shea',
        name: 'Glycerin + Shea Butter Moisturizer',
        activeIngredients: ['Glycerin (10%)', 'Shea Butter', 'Ceramides'],
        frequency: 'Twice daily, on damp skin',
        notes:
          'Shea butter (sourced from northern Ugandan markets) seals in water while ceramides rebuild the barrier — the fastest way to lift a sub-60 score.',
      },
      {
        id: 'repair-balm',
        name: 'Panthenol Overnight Repair Balm',
        activeIngredients: ['Panthenol (5%)', 'Squalane', 'Vitamin E'],
        frequency: 'Evening, as final step',
        notes:
          'A two-week reset: pause all actives and let this sit overnight. If stinging, itching or redness continues past the reset, consult a dermatologist.',
      },
    ];
  }

  if (band === 'thrive') {
    return [
      {
        id: 'niacinamide-maintenance',
        name: 'Niacinamide Maintenance Serum',
        activeIngredients: ['Niacinamide (5%)'],
        frequency: 'Once daily (AM)',
        notes:
          'Keeps tone even and pores clear — a pharmacy staple across East Africa. Consistency beats strength: 5% daily outperforms occasional high doses.',
      },
      {
        id: 'lightweight-moisturizer',
        name: 'Lightweight Glycerin Moisturizer',
        activeIngredients: ['Glycerin', 'Hyaluronic Acid'],
        frequency: 'Twice daily',
        notes:
          'Gel-cream textures suit Kampala’s warm, humid climate — hydrates and protects the barrier without heaviness under sunscreen.',
      },
      {
        id: 'shea-night-seal',
        name: 'Shea Butter Night Seal',
        activeIngredients: ['Shea Butter', 'Vitamin E'],
        frequency: 'Evening, 2–3× per week',
        notes:
          'A thin overnight seal of raw, unrefined shea locks in moisture so the barrier stays resilient — a traditional staple, and still one of the best.',
      },
    ];
  }

  // Balance band (60–79) — the baseline trio.
  return [
    {
      id: 'niacinamide',
      name: 'Niacinamide Serum',
      activeIngredients: ['Niacinamide (5%)', 'Hyaluronic Acid'],
      frequency: 'Twice daily (AM/PM)',
      notes:
        'Strengthens skin barrier. Reduces inflammation. Available in East African pharmacies (e.g., CeraVe, Cocoa Brown).',
    },
    {
      id: 'glycerin',
      name: 'Glycerin + Shea Butter Moisturizer',
      activeIngredients: ['Glycerin (10%)', 'Shea Butter', 'Coconut Oil'],
      frequency: 'Daily, after cleansing',
      notes:
        'Natural barrier repair. Glycerin is affordable and widely available in local markets. Shea butter is traditionally used in Uganda.',
    },
    {
      id: 'natural-oil',
      name: 'Organic Argan or Jojoba Oil',
      activeIngredients: ['Argan Oil', 'Jojoba Oil', 'Vitamin E'],
      frequency: 'Evening, as occlusive layer',
      notes:
        'Rich in antioxidants. Apply as final step before sleep. Available locally or online (e.g., through WhatsApp vendors in Uganda).',
    },
  ];
}

/**
 * One-line, score-relevant lead-in above the API's color guidance on the
 * Harmonized Look tab — ties the makeup advice back to how the skin is
 * actually doing today.
 */
export function harmonizedLookLead(skin: SkinSnapshot): string {
  const score = skin.healthScore;
  const band = scoreBand(score);

  if (band === 'thrive') {
    return `At ${score}/100, your skin is an even, well-hydrated canvas — base makeup sits smoothly and Kitenge-inspired golds, emeralds and terracottas read true against your undertone.`;
  }
  if (band === 'balance') {
    return `Your ${score}/100 score shows a mostly happy barrier with a little ${skin.spots.severity === 'mild' ? 'unevenness' : 'pigmentation'} to work with — press in shea butter first so base makeup blends evenly, then let warm gold and terracotta tones do the rest.`;
  }
  return `Your ${score}/100 score means gentleness comes first: keep base makeup light and let your repairing barrier show through. Once skin is calmer, warm golds, emeralds and deep plums flatter melanin-rich undertones beautifully.`;
}


