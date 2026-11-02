/**
 * Nyirira-specific types for the Crowdsourced Counterfeit Detection feature.
 * Core app types live in lib/types.ts.
 */

/** Adverse reaction symptoms the user can report. */
export type AdverseSymptom =
  | 'burning_stinging'
  | 'skin_thinning_veins'
  | 'ochronosis'
  | 'severe_acne';

export const ADVERSE_SYMPTOM_LABELS: Record<AdverseSymptom, string> = {
  burning_stinging: 'Burning / Stinging',
  skin_thinning_veins: 'Rapid Skin Thinning / Visible Veins',
  ochronosis: 'Ochronosis (Rebound Darkening)',
  severe_acne: 'Sudden Severe Acne',
};

/** Known Kampala / Uganda trading markets for filtering. */
export const UGANDA_MARKETS = [
  'Kikuubo / Downtown Kampala',
  'Owino Market (St. Balikuddembe)',
  'Nakasero Market',
  'Kalerwe Market',
  'Bugolobi / Supermarkets',
  'Instagram Vendor',
  'Facebook Marketplace',
  'WhatsApp Reseller',
  'Other / Unknown',
] as const;

export type UgandaMarket = (typeof UGANDA_MARKETS)[number];

/** A single crowdsourced adverse-reaction report. */
export interface CounterfeitReport {
  id: string;
  /** ISO timestamp of submission. */
  createdAt: string;
  productName: string;
  vendorBrand: string;
  purchaseLocation: string;
  batchNumber?: string;
  symptoms: AdverseSymptom[];
  /** Skin health score at the time of the report (from current analysis). */
  healthScoreAtReport?: number;
}

/** Aggregated community alert derived from one or more reports. */
export interface CommunityAlert {
  id: string;
  productName: string;
  vendorBrand: string;
  location: string;
  reportCount: number;
  /** Dominant symptoms across all reports for this product. */
  dominantSymptoms: AdverseSymptom[];
  lastReported: string; // ISO timestamp
  /**
   * RED_ALERT  — multiple chemical burn / mercury-type reports (reportCount >= 3)
   * WARNING    — 1-2 reports, needs monitoring
   * VERIFIED_SAFE — manually curated safe product (reportCount === 0)
   */
  riskLevel: 'RED_ALERT' | 'WARNING' | 'VERIFIED_SAFE';
}

/** localStorage keys for crowdsource data. */
export const COUNTERFEIT_REPORTS_KEY = 'nyirira_counterfeit_reports';
export const COMMUNITY_ALERTS_KEY = 'nyirira_community_alerts';
