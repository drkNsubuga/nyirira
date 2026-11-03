'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Search, ShieldAlert, Filter, Clock } from 'lucide-react';
import Image from 'next/image';
import {
  CommunityAlert,
  CounterfeitReport,
  COUNTERFEIT_REPORTS_KEY,
  ADVERSE_SYMPTOM_LABELS,
  UGANDA_MARKETS,
} from '@/types/nyirira';

const SEED_ALERTS: CommunityAlert[] = [
  {
    id: 'seed_1',
    productName: 'Skin Light Body Lotion',
    vendorBrand: 'Skin Light',
    location: 'Kikuubo / Downtown Kampala',
    reportCount: 5,
    dominantSymptoms: ['ochronosis', 'skin_thinning_veins'],
    lastReported: '2026-10-15T09:00:00Z',
    riskLevel: 'RED_ALERT',
  },
  {
    id: 'seed_2',
    productName: 'Movate Skin Tone Cream',
    vendorBrand: 'Movate',
    location: 'Owino Market (St. Balikuddembe)',
    reportCount: 4,
    dominantSymptoms: ['burning_stinging', 'ochronosis'],
    lastReported: '2026-10-20T14:30:00Z',
    riskLevel: 'RED_ALERT',
  },
  {
    id: 'seed_3',
    productName: 'Nivea Natural Fairness Body Lotion',
    vendorBrand: 'Nivea (Beiersdorf)',
    location: 'Bugolobi / Supermarkets',
    reportCount: 0,
    dominantSymptoms: [],
    lastReported: '2026-09-01T00:00:00Z',
    riskLevel: 'VERIFIED_SAFE',
  },
  {
    id: 'seed_4',
    productName: 'Vaseline Intensive Care Cocoa',
    vendorBrand: 'Unilever',
    location: 'Bugolobi / Supermarkets',
    reportCount: 0,
    dominantSymptoms: [],
    lastReported: '2026-09-01T00:00:00Z',
    riskLevel: 'VERIFIED_SAFE',
  },
];

function buildAlerts(reports: CounterfeitReport[]): CommunityAlert[] {
  const map = new Map<string, CommunityAlert>();

  for (const s of SEED_ALERTS) {
    map.set(s.id, { ...s });
  }

  for (const r of reports) {
    const key = `${r.productName.toLowerCase()}|${r.vendorBrand.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.reportCount += 1;
      existing.lastReported =
        r.createdAt > existing.lastReported ? r.createdAt : existing.lastReported;
      for (const sym of r.symptoms) {
        if (!existing.dominantSymptoms.includes(sym)) {
          existing.dominantSymptoms.push(sym);
        }
      }
      existing.riskLevel = existing.reportCount >= 3 ? 'RED_ALERT' : 'WARNING';
      if (!existing.productImageDataUrl && r.productImageDataUrl) {
        existing.productImageDataUrl = r.productImageDataUrl;
      }
    } else {
      map.set(key, {
        id: key,
        productName: r.productName,
        vendorBrand: r.vendorBrand,
        location: r.purchaseLocation,
        reportCount: 1,
        dominantSymptoms: [...r.symptoms],
        lastReported: r.createdAt,
        riskLevel: 'WARNING',
        ...(r.productImageDataUrl ? { productImageDataUrl: r.productImageDataUrl } : {}),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const order: Record<CommunityAlert['riskLevel'], number> = { RED_ALERT: 0, WARNING: 1, VERIFIED_SAFE: 2 };
    return order[a.riskLevel] - order[b.riskLevel];
  });
}

function RiskBadge({ level }: { level: CommunityAlert['riskLevel'] }) {
  if (level === 'RED_ALERT')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/60 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-300">
        <ShieldAlert className="w-3.5 h-3.5" /> RED ALERT
      </span>
    );
  if (level === 'WARNING')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5" /> WARNING
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
      <CheckCircle className="w-3.5 h-3.5" /> VERIFIED SAFE
    </span>
  );
}

export default function CommunitySafetyWatch() {
  const [reports, setReports] = useState<CounterfeitReport[]>(() => {
    try {
      const raw = localStorage.getItem(COUNTERFEIT_REPORTS_KEY);
      if (raw) return JSON.parse(raw) as CounterfeitReport[];
    } catch {
      // ignore
    }
    return [];
  });
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState<CommunityAlert['riskLevel'] | ''>('');

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === COUNTERFEIT_REPORTS_KEY && e.newValue) {
        try {
          setReports(JSON.parse(e.newValue) as CounterfeitReport[]);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const alerts = useMemo(() => buildAlerts(reports), [reports]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return alerts.filter((a) => {
      const matchQuery =
        !q ||
        a.productName.toLowerCase().includes(q) ||
        a.vendorBrand.toLowerCase().includes(q);
      const matchLocation = !locationFilter || a.location === locationFilter;
      const matchRisk = !riskFilter || a.riskLevel === riskFilter;
      return matchQuery && matchLocation && matchRisk;
    });
  }, [alerts, query, locationFilter, riskFilter]);

  const redCount = alerts.filter((a) => a.riskLevel === 'RED_ALERT').length;
  const warnCount = alerts.filter((a) => a.riskLevel === 'WARNING').length;
  const safeCount = alerts.filter((a) => a.riskLevel === 'VERIFIED_SAFE').length;

  return (
    <div className="space-y-5">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{redCount}</p>
          <p className="text-xs text-red-700 dark:text-red-300 font-medium">Red Alerts</p>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{warnCount}</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Warnings</p>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{safeCount}</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Verified Safe</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product or brand..."
            className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter by market"
            className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-3 pr-8 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">All markets</option>
            {UGANDA_MARKETS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as CommunityAlert['riskLevel'] | '')}
            aria-label="Filter by risk level"
            className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-3 pr-8 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">All risks</option>
            <option value="RED_ALERT">Red Alert</option>
            <option value="WARNING">Warning</option>
            <option value="VERIFIED_SAFE">Verified Safe</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No products match your search.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 ${
                alert.riskLevel === 'RED_ALERT'
                  ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900'
                  : alert.riskLevel === 'WARNING'
                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900'
                  : 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {alert.productName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{alert.vendorBrand}</p>
                </div>
                <div className="flex items-center gap-2">
                  {alert.productImageDataUrl && (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={alert.productImageDataUrl}
                        alt={`${alert.productName} photo`}
                        fill
                        className="object-cover rounded-lg border border-slate-300"
                        unoptimized
                      />
                    </div>
                  )}
                  <RiskBadge level={alert.riskLevel} />
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                📍 {alert.location}
              </p>

              {alert.dominantSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {alert.dominantSymptoms.map((sym) => (
                    <span
                      key={sym}
                      className="text-xs rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-slate-700 dark:text-slate-300"
                    >
                      {ADVERSE_SYMPTOM_LABELS[sym]}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.lastReported).toLocaleDateString()}
                </span>
                {alert.reportCount > 0 && (
                  <span className="font-medium">
                    {alert.reportCount} report{alert.reportCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2">
        Community reports are stored locally and have not been independently verified. If you
        suspect a product contains illegal bleaching agents, contact UNBS (+256 41 4505995).
      </p>
    </div>
  );
}
