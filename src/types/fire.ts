export type ColorRamp = 'fire-amber' | 'viridis' | 'inferno' | 'cividis';

export type DataViewMode = 'harmonized' | 'raw' | 'anomaly';

export interface AOI {
  id: string;
  name: string;
  shortName: string;
  region: string;
  country: string;
  isFeaturedLocal?: boolean;
  /** [west, south, east, north] */
  bbox: [number, number, number, number];
  /** [lat, lng] */
  center: [number, number];
  zoom: number;
  description: string;
  ecosystem: string;
  fireRegime: string;
  /** Peak week of year (1-52) */
  peakWeekCenter: number;
  /** Width of primary fire season in weeks */
  seasonSpread: number;
  /** Secondary burn season week if bi-modal */
  secondaryPeakWeek?: number;
  /** Base weekly MODIS fire detections at peak */
  basePeakModis: number;
  /** Power-law scaling coefficient alpha: N_viirs_eq = alpha * (N_modis ^ beta) */
  calibrationAlpha: number;
  /** Power-law scaling exponent beta */
  calibrationBeta: number;
  /** Known extreme fire anomaly years in the 2000-2026 record */
  anomalyYears: number[];
  /** Multi-decadal climate trend (% per year) */
  climateTrendRate: number;
  /** Shift in fire season onset (weeks per decade, negative = earlier) */
  onsetShiftPerDecade: number;
  /** Correlation R with NASA MCD64A1 Burned Area product */
  mcd64a1Correlation: number;
}

export interface WeeklyFireRecord {
  year: number;
  week: number;
  dateRangeLabel: string;
  isoDateStart: string;
  modisRaw: number;
  viirsRaw: number | null;
  /** Unharmonized series that naively switches/adds VIIRS in 2012 (shows the 3x-5x jump) */
  rawCombined: number;
  /** Cauchy's Comet harmonized VIIRS-equivalent count (continuous 2000-2026) */
  harmonizedCount: number;
  /** Harmonized Fire Radiative Power (MW) */
  totalFrpMw: number;
  /** Independent NASA MCD64A1 Burned Area estimate (Hectares) */
  burnedAreaHa: number;
  /** Historical median for this specific week (1..52) across 2000-2026 */
  weeklyHistoricalMedian: number;
  /** Interquartile range (Q75 - Q25) for this week */
  weeklyHistoricalIqr: number;
  /** Standardized Fire Anomaly Index: (Harmonized - Median) / IQR */
  sfai: number;
  /** Empirical percentile (0 to 100) for this week across all years */
  percentile: number;
  anomalyStatus: 'low' | 'normal' | 'elevated' | 'critical';
  sensorOrigin: 'MODIS (Terra/Aqua 1km)' | 'Harmonized Overlap (MODIS+VIIRS)' | 'VIIRS (S-NPP/NOAA-20 375m)';
}

export interface YearlySummary {
  year: number;
  rawTotal: number;
  harmonizedTotal: number;
  modisTotal: number;
  viirsTotal: number | null;
  burnedAreaTotalHa: number;
  meanFrpMw: number;
  criticalWeeksCount: number;
  peakWeek: number;
  seasonOnsetWeek: number;
  seasonEndWeek: number;
  isAnomalyYear: boolean;
}

export interface SeasonalityMetrics {
  onsetWeek: number;
  onsetMonthLabel: string;
  peakWeekStart: number;
  peakWeekEnd: number;
  peakPeriodLabel: string;
  cessationWeek: number;
  cessationMonthLabel: string;
  seasonDurationWeeks: number;
  earlyDecadeOnsetWeek: number;
  recentDecadeOnsetWeek: number;
  shiftDays: number;
  shiftDirection: 'earlier' | 'later' | 'stable';
  pre2012RawAnnualMean: number;
  post2012RawAnnualMean: number;
  rawArtificialJumpPct: number;
  pre2012HarmonizedAnnualMean: number;
  post2012HarmonizedAnnualMean: number;
  harmonizedRealChangePct: number;
  overlapRSquared: number;
  mcd64a1Correlation: number;
  currentWeekRecord: WeeklyFireRecord;
}

export interface HarmonizedDataset {
  aoi: AOI;
  records: WeeklyFireRecord[];
  yearlySummaries: YearlySummary[];
  weeklyMedians: number[]; // index 0..51 for weeks 1..52
  weeklyIqrs: number[];
  weeklyQ75: number[];
  metrics: SeasonalityMetrics;
}

export interface LiveHotspot {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: 'MODIS' | 'VIIRS';
  confidence: string;
  frp: number;
  daynight: 'D' | 'N';
  harmonizedEquivalentWeight: number;
}
