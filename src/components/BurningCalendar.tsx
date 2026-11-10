import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Grid,
  LayoutGrid,
  Palette,
  Sparkles,
  Flame,
} from 'lucide-react';
import {
  ColorRamp,
  DataViewMode,
  HarmonizedDataset,
  WeeklyFireRecord,
} from '../types/fire';

interface BurningCalendarProps {
  dataset: HarmonizedDataset;
  viewMode: DataViewMode;
  onChangeViewMode: (mode: DataViewMode) => void;
  colorRamp: ColorRamp;
  onChangeColorRamp: (ramp: ColorRamp) => void;
  selectedRecord: WeeklyFireRecord;
  onSelectRecord: (record: WeeklyFireRecord) => void;
}

const MONTHS = [
  { label: 'Jan', startWeek: 1, span: 4 },
  { label: 'Feb', startWeek: 5, span: 4 },
  { label: 'Mar', startWeek: 9, span: 5 },
  { label: 'Apr', startWeek: 14, span: 4 },
  { label: 'May', startWeek: 18, span: 4 },
  { label: 'Jun', startWeek: 22, span: 5 },
  { label: 'Jul', startWeek: 27, span: 4 },
  { label: 'Aug', startWeek: 31, span: 4 },
  { label: 'Sep', startWeek: 35, span: 5 },
  { label: 'Oct', startWeek: 40, span: 4 },
  { label: 'Nov', startWeek: 44, span: 4 },
  { label: 'Dec', startWeek: 48, span: 5 },
];

const BLOCK_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'PEAK'];

/**
 * Exact warm amber/ochre/navy palette from Video Screenshots 3 & 4
 */
const RAMP_STOPS: Record<ColorRamp, string[]> = {
  'fire-amber': [
    '#162441', // 0 - Quiet Deep Navy (Screenshot 3 top row)
    '#293552', // 1 - Muted Slate Navy
    '#573726', // 2 - Warm Espresso Umber (Screenshot 3 row 2)
    '#874D1E', // 3 - Burnt Sienna Ochre
    '#B56918', // 4 - Rich Amber
    '#D48820', // 5 - Golden Fire Amber
    '#E5A93C', // 6 - Bright Warm Gold (Screenshot 3 glowing tile)
    '#F5D076', // 7 - Solar Core Gold
  ],
  viridis: [
    '#1A153B',
    '#440154',
    '#3B528B',
    '#21918C',
    '#5EC962',
    '#AADC32',
    '#FDE725',
    '#FFF9B0',
  ],
  inferno: [
    '#0D0826',
    '#320A5A',
    '#781C6D',
    '#BB3754',
    '#ED6925',
    '#FB9B06',
    '#FCFFA4',
    '#FFFFFF',
  ],
  cividis: [
    '#00204C',
    '#1F396C',
    '#49526B',
    '#6F6E72',
    '#958F78',
    '#C1B26E',
    '#EAD95B',
    '#FFEA46',
  ],
};

function getCellColor(
  normValue: number,
  ramp: ColorRamp,
  isAnomalyMode: boolean,
  sfai: number
): string {
  if (isAnomalyMode) {
    if (sfai <= -0.6) return '#162441';
    if (sfai < 0.35) return '#243456';
    if (sfai < 0.85) return '#6E4222';
    if (sfai < 1.35) return '#B86B19';
    if (sfai < 1.95) return '#DF8E22';
    return '#F5C45E';
  }

  const clamped = Math.max(0, Math.min(1, normValue));
  const palette = RAMP_STOPS[ramp];
  const idx = Math.min(
    palette.length - 1,
    Math.floor(Math.pow(clamped, 0.72) * palette.length)
  );
  return palette[idx];
}

export const BurningCalendar: React.FC<BurningCalendarProps> = ({
  dataset,
  viewMode,
  onChangeViewMode,
  colorRamp,
  onChangeColorRamp,
  selectedRecord,
  onSelectRecord,
}) => {
  const [hoveredRecord, setHoveredRecord] = useState<WeeklyFireRecord | null>(null);
  const [calendarLayout, setCalendarLayout] = useState<'both' | 'tactile' | 'matrix'>('both');

  const activeRecord = hoveredRecord || selectedRecord;

  const { rowsByYear, maxReferenceValue } = useMemo(() => {
    const map = new Map<number, WeeklyFireRecord[]>();
    const values: number[] = [];

    for (const r of dataset.records) {
      if (!map.has(r.year)) map.set(r.year, []);
      map.get(r.year)!.push(r);
      const val = viewMode === 'raw' ? r.rawCombined : r.harmonizedCount;
      values.push(val);
    }

    values.sort((a, b) => a - b);
    const p98 = values[Math.floor(values.length * 0.985)] || 100;

    return {
      rowsByYear: Array.from(map.entries()).sort((a, b) => a[0] - b[0]),
      maxReferenceValue: Math.max(10, p98),
    };
  }, [dataset, viewMode]);

  // Tactile 32-tile Seasonal Block Grid for the Selected Year (matches Video Screenshot 3 top-right card!)
  const tactileYearCells = useMemo(() => {
    const yearRecs = dataset.records.filter((r) => r.year === selectedRecord.year);
    // Focus on 32 weeks centered around the region's active fire season so it forms a lush 4x8 tactile rounded-tile grid
    const startW = Math.max(1, Math.min(21, dataset.aoi.peakWeekCenter - 12));
    return yearRecs.slice(startW - 1, startW - 1 + 32);
  }, [dataset, selectedRecord.year]);

  return (
    <div className="space-y-4">
      {/* Top Toolbar Card: Harmonized vs Raw vs SFAI + Layout Mode + Color Ramp */}
      <div className="bg-[#0A1730]/95 border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase">
                Burning Activity Calendar · {dataset.aoi.shortName}
              </h2>
              <p className="text-[11px] text-slate-300">
                With the busy, quiet, and unusual periods easy to see across 2000–2026
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Harmonized / Raw / Anomaly Switcher */}
            <div className="flex items-center bg-[#061024] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => onChangeViewMode('harmonized')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'harmonized'
                    ? 'bg-amber-500 text-space-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Harmonized</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('raw')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'raw'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Raw (2012 Jump)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('anomaly')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'anomaly'
                    ? 'bg-amber-300 text-space-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Unusual (SFAI)</span>
              </button>
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center bg-[#061024] p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setCalendarLayout('both')}
                className={`px-2 py-1 rounded-lg font-semibold ${
                  calendarLayout === 'both'
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Split View
              </button>
              <button
                type="button"
                onClick={() => setCalendarLayout('tactile')}
                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                  calendarLayout === 'tactile'
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3" /> Cards
              </button>
              <button
                type="button"
                onClick={() => setCalendarLayout('matrix')}
                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                  calendarLayout === 'matrix'
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3 h-3" /> 27-Yr Matrix
              </button>
            </div>

            {/* Accessible Color Ramp */}
            <div className="flex items-center gap-1.5 bg-[#061024] px-2.5 py-1 rounded-xl border border-white/10 text-xs">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <select
                aria-label="Select accessible color ramp"
                value={colorRamp}
                onChange={(e) => onChangeColorRamp(e.target.value as ColorRamp)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="fire-amber" className="bg-space-950">Fire-Amber (Video)</option>
                <option value="viridis" className="bg-space-950">Viridis (Colorblind Safe)</option>
                <option value="inferno" className="bg-space-950">Inferno (High Contrast)</option>
                <option value="cividis" className="bg-space-950">Cividis (CVD Uniform)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Raw Sensor Warning Banner */}
        {viewMode === 'raw' && (
          <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>2012 Sensor Jump Active:</strong> Unharmonized counts leap{' '}
                <strong className="text-white">+{dataset.metrics.rawArtificialJumpPct}%</strong> when 375 m VIIRS launches. Switch to{' '}
                <button
                  type="button"
                  onClick={() => onChangeViewMode('harmonized')}
                  className="underline font-bold text-amber-300"
                >
                  Harmonized
                </button>{' '}
                to remove sensor bias.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: Video Screenshot 3 Exact Tactile Rounded-Square Calendar Card */}
      {(calendarLayout === 'both' || calendarLayout === 'tactile') && (
        <div className="bg-[#0A1730]/95 border border-white/10 rounded-3xl p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                {selectedRecord.year} SEASONAL BURNING BLOCKS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
                Week {activeRecord.week} · {activeRecord.dateRangeLabel}
              </span>
            </div>

            {/* Year Selector Pill */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Year:</span>
              <select
                aria-label="Inspect calendar year"
                value={selectedRecord.year}
                onChange={(e) => {
                  const yr = Number(e.target.value);
                  const found = dataset.records.find(
                    (r) => r.year === yr && r.week === selectedRecord.week
                  );
                  if (found) onSelectRecord(found);
                }}
                className="bg-[#061024] text-amber-300 font-mono font-bold px-2.5 py-1 rounded-lg border border-white/15"
              >
                {Array.from({ length: 27 }, (_, i) => 2000 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} {dataset.aoi.anomalyYears.includes(yr) ? '★ Unusual' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Screenshot 3 Spaced Column Headers: SUN MON TUE WED THU FRI SAT PEAK */}
          <div className="grid grid-cols-8 gap-2.5 mb-2.5 px-1">
            {BLOCK_HEADERS.map((hdr, idx) => (
              <div
                key={idx}
                className="text-center text-[11px] font-bold tracking-[0.16em] text-slate-400"
              >
                {hdr}
              </div>
            ))}
          </div>

          {/* Screenshot 3 Large Rounded-Square Glowing Tiles Grid */}
          <div className="grid grid-cols-8 gap-2.5">
            {tactileYearCells.map((cell) => {
              const val = viewMode === 'raw' ? cell.rawCombined : cell.harmonizedCount;
              const norm = val / maxReferenceValue;
              const bg = getCellColor(norm, colorRamp, viewMode === 'anomaly', cell.sfai);
              const isSelected =
                selectedRecord.year === cell.year && selectedRecord.week === cell.week;
              const isBright = norm > 0.58;

              return (
                <button
                  key={cell.week}
                  type="button"
                  onMouseEnter={() => setHoveredRecord(cell)}
                  onMouseLeave={() => setHoveredRecord(null)}
                  onClick={() => onSelectRecord(cell)}
                  style={{
                    backgroundColor: bg,
                    boxShadow: isSelected
                      ? '0 0 22px rgba(251, 191, 36, 0.65), inset 0 0 12px rgba(255, 255, 255, 0.35)'
                      : isBright
                      ? '0 0 14px rgba(217, 119, 6, 0.32)'
                      : 'none',
                  }}
                  className={`h-11 sm:h-12 rounded-xl transition-all flex flex-col items-center justify-center relative ${
                    isSelected
                      ? 'ring-2 ring-amber-100 scale-[1.06] z-10'
                      : 'hover:scale-105 hover:ring-1 hover:ring-amber-300/60 border border-white/5'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      isBright ? 'text-space-950' : 'text-slate-200/90'
                    }`}
                  >
                    W{cell.week}
                  </span>
                  <span
                    className={`font-mono text-[9px] ${
                      isBright ? 'text-space-950/80 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {val}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Video Screenshot 4 Golden 27-Year x 52-Week Matrix with Ripple Wave Rings */}
      {(calendarLayout === 'both' || calendarLayout === 'matrix') && (
        <div className="bg-[#09142B]/95 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          {/* Decorative Golden Ripple Wave Rings from Video Screenshot 4 */}
          <svg
            viewBox="0 0 800 420"
            className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-35"
            preserveAspectRatio="none"
          >
            <g fill="none" stroke="#F59E0B" strokeWidth="1.8">
              <circle cx="95" cy="220" r="55" strokeOpacity="0.55" />
              <circle cx="95" cy="220" r="105" strokeOpacity="0.38" />
              <circle cx="95" cy="220" r="165" strokeOpacity="0.22" />
              <circle cx="95" cy="220" r="230" strokeOpacity="0.12" />
              <circle cx="735" cy="195" r="75" strokeOpacity="0.35" />
              <circle cx="735" cy="195" r="140" strokeOpacity="0.2" />
              <circle cx="735" cy="195" r="210" strokeOpacity="0.1" />
            </g>
          </svg>

          {/* Inspector Strip */}
          <div className="relative z-30 mb-3 bg-[#061024]/90 border border-white/10 rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-5 gap-3 items-center text-xs">
            <div className="col-span-2 sm:col-span-2">
              <div className="font-bold text-white text-sm">
                {activeRecord.year} · Week {activeRecord.week} ({activeRecord.dateRangeLabel})
              </div>
              <div className="text-[11px] text-amber-300/90 font-mono">
                {activeRecord.sensorOrigin}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Harmonized
              </div>
              <div className="font-mono font-bold text-sm text-amber-300">
                {activeRecord.harmonizedCount} <span className="text-[10px]">VIIRS-eq</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                27-Yr Median
              </div>
              <div className="font-mono font-semibold text-sm text-slate-200">
                {activeRecord.weeklyHistoricalMedian} (IQR {activeRecord.weeklyHistoricalIqr})
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Status
              </div>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  activeRecord.anomalyStatus === 'critical'
                    ? 'bg-amber-500 text-space-950'
                    : activeRecord.anomalyStatus === 'elevated'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {activeRecord.anomalyStatus} ({activeRecord.sfai >= 0 ? `+${activeRecord.sfai}` : activeRecord.sfai}σ)
              </span>
            </div>
          </div>

          {/* 52-Week x 27-Year Matrix */}
          <div className="relative z-30 overflow-x-auto pb-1">
            <div className="min-w-[740px]">
              {/* Month Headers */}
              <div className="flex items-center mb-1.5 pl-12 pr-14">
                <div className="grid grid-cols-52 w-full gap-[2px] text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {MONTHS.map((m) => (
                    <div
                      key={m.label}
                      style={{ gridColumn: `span ${m.span} / span ${m.span}` }}
                      className="border-l border-white/10 pl-1"
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Year Rows */}
              <div className="space-y-[2px]">
                {rowsByYear.map(([year, weeks]) => {
                  const yrSummary = dataset.yearlySummaries.find((y) => y.year === year)!;
                  const isTransitionYear = year === 2012;

                  return (
                    <React.Fragment key={year}>
                      {isTransitionYear && (
                        <div className="my-1 flex items-center gap-2 py-0.5">
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40">
                            2012 Instrument Transition (MODIS 1km → +VIIRS 375m)
                          </span>
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="w-10 shrink-0 font-mono text-[10px] text-slate-300 flex items-center justify-between">
                          <span className={yrSummary.isAnomalyYear ? 'font-bold text-amber-300' : ''}>
                            {year}
                          </span>
                        </div>

                        <div className="grid grid-cols-52 flex-1 gap-[2px] bg-[#060E20] p-[1px] rounded">
                          {weeks.map((cell) => {
                            const val =
                              viewMode === 'raw' ? cell.rawCombined : cell.harmonizedCount;
                            const bg = getCellColor(
                              val / maxReferenceValue,
                              colorRamp,
                              viewMode === 'anomaly',
                              cell.sfai
                            );
                            const isSelected =
                              selectedRecord.year === cell.year &&
                              selectedRecord.week === cell.week;

                            return (
                              <button
                                key={cell.week}
                                type="button"
                                onMouseEnter={() => setHoveredRecord(cell)}
                                onMouseLeave={() => setHoveredRecord(null)}
                                onClick={() => onSelectRecord(cell)}
                                aria-label={`Year ${cell.year} Week ${cell.week}: ${cell.harmonizedCount} hotspots`}
                                style={{ backgroundColor: bg }}
                                className={`h-3.5 w-full rounded-[2px] transition-transform focus:outline-none ${
                                  isSelected
                                    ? 'ring-2 ring-amber-100 scale-125 z-20'
                                    : 'hover:scale-125 hover:z-10 hover:ring-1 hover:ring-amber-300'
                                }`}
                              />
                            );
                          })}
                        </div>

                        <div className="w-12 shrink-0 text-right font-mono text-[10px] text-slate-400">
                          {(viewMode === 'raw'
                            ? yrSummary.rawTotal
                            : yrSummary.harmonizedTotal
                          ).toLocaleString()}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
