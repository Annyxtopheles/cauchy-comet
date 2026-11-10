import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
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
 * Restrained, modern earth-science amber palette matching Video Screenshot 3 & 4.
 * Soft, warm, low-saturation steps that feel calm and readable instead of glaring neon.
 */
const RAMP_STOPS: Record<ColorRamp, string[]> = {
  'fire-amber': [
    '#0F1B33', // 0 - Deep Quiet Navy (seamless with card background)
    '#1A2844', // 1 - Soft Slate Navy
    '#3D2B24', // 2 - Muted Espresso Umber
    '#6E3E1F', // 3 - Soft Burnt Ochre
    '#9C5B23', // 4 - Warm Terracotta
    '#C47B28', // 5 - Earth Amber
    '#DE9B3A', // 6 - Warm Golden Amber
    '#F0BE62', // 7 - Soft Honey Gold
  ],
  viridis: [
    '#14142B',
    '#2E1E3B',
    '#31446B',
    '#256B73',
    '#389466',
    '#6DB04B',
    '#B5C736',
    '#F2DC5D',
  ],
  inferno: [
    '#0F1226',
    '#2A133D',
    '#541B4B',
    '#822744',
    '#AC432D',
    '#CE6D1B',
    '#E5A12D',
    '#F2D479',
  ],
  cividis: [
    '#0F1E38',
    '#1E2F4D',
    '#39455B',
    '#585D6B',
    '#797778',
    '#9E937D',
    '#C6B468',
    '#EDD95D',
  ],
};

function getCellColor(
  normValue: number,
  ramp: ColorRamp,
  isAnomalyMode: boolean,
  sfai: number
): string {
  if (isAnomalyMode) {
    if (sfai <= -0.6) return '#101E38';
    if (sfai < 0.35) return '#182744';
    if (sfai < 0.85) return '#57331D';
    if (sfai < 1.35) return '#99561E';
    if (sfai < 1.95) return '#C97C26';
    return '#EAA946';
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
  selectedRecord,
  onSelectRecord,
}) => {
  const [hoveredRecord, setHoveredRecord] = useState<WeeklyFireRecord | null>(null);
  const [viewStyle, setViewStyle] = useState<'matrix' | 'cards'>('matrix');

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

  const tactileYearCells = useMemo(() => {
    const yearRecs = dataset.records.filter((r) => r.year === selectedRecord.year);
    const startW = Math.max(1, Math.min(21, dataset.aoi.peakWeekCenter - 12));
    return yearRecs.slice(startW - 1, startW - 1 + 32);
  }, [dataset, selectedRecord.year]);

  return (
    <div className="bg-[#081226] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3">
      {/* Header & Clean Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
              Burning Activity Calendar
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            2000–2026 satellite record · {dataset.aoi.shortName}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Segmented View Mode */}
          <div className="flex items-center bg-[#060D1E] p-0.5 rounded-lg border border-white/[0.06] text-xs">
            <button
              type="button"
              onClick={() => onChangeViewMode('harmonized')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'harmonized'
                  ? 'bg-[#142344] text-amber-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Harmonized</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('raw')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'raw'
                  ? 'bg-rose-950/70 text-rose-300 font-semibold border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Raw (2012 Jump)</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('anomaly')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'anomaly'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Unusual</span>
            </button>
          </div>

          {/* Clean Style Toggle */}
          <div className="flex items-center bg-[#060D1E] p-0.5 rounded-lg border border-white/[0.06] text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setViewStyle('matrix')}
              className={`px-2 py-1 rounded-md transition-colors ${
                viewStyle === 'matrix' ? 'bg-[#142344] text-white font-medium' : 'hover:text-white'
              }`}
            >
              27-Yr Grid
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('cards')}
              className={`px-2 py-1 rounded-md transition-colors ${
                viewStyle === 'cards' ? 'bg-[#142344] text-white font-medium' : 'hover:text-white'
              }`}
            >
              Season Cards
            </button>
          </div>
        </div>
      </div>

      {/* Raw Sensor Warning */}
      {viewMode === 'raw' && (
        <div className="bg-rose-950/40 border border-rose-500/25 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>
            <strong>2012 Sensor Spike:</strong> Unscaled VIIRS addition causes a false +{dataset.metrics.rawArtificialJumpPct}% jump. Switch to <strong>Harmonized</strong> to remove sensor bias.
          </span>
        </div>
      )}

      {/* Quiet Single-Row Week Inspector */}
      <div className="bg-[#060D1E] border border-white/[0.05] rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-white">
            {activeRecord.year} · Week {activeRecord.week}{' '}
            <span className="text-slate-400 font-normal">({activeRecord.dateRangeLabel})</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            {activeRecord.sensorOrigin}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 mr-1.5 text-[11px]">Count:</span>
            <span className="text-amber-300 font-bold">
              {activeRecord.harmonizedCount}
            </span>
          </div>
          <div>
            <span className="text-slate-400 mr-1.5 text-[11px]">27-Yr Med:</span>
            <span className="text-slate-300">
              {activeRecord.weeklyHistoricalMedian}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 mr-1 text-[11px]">Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                activeRecord.anomalyStatus === 'critical'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : activeRecord.anomalyStatus === 'elevated'
                  ? 'bg-amber-500/10 text-amber-200'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeRecord.anomalyStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Main Calendar View: 27-Year Grid */}
      {viewStyle === 'matrix' ? (
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[680px]">
            {/* Month labels */}
            <div className="flex items-center mb-1 pl-10 pr-12">
              <div className="grid grid-cols-52 w-full gap-[2px] text-[9px] text-slate-400 font-mono">
                {MONTHS.map((m) => (
                  <div
                    key={m.label}
                    style={{ gridColumn: `span ${m.span} / span ${m.span}` }}
                    className="border-l border-white/[0.06] pl-0.5"
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Matrix rows */}
            <div className="space-y-[2px]">
              {rowsByYear.map(([year, weeks]) => {
                const yrSummary = dataset.yearlySummaries.find((y) => y.year === year)!;
                const isTransitionYear = year === 2012;

                return (
                  <React.Fragment key={year}>
                    {isTransitionYear && (
                      <div className="my-1 flex items-center gap-2">
                        <div className="h-[1px] flex-1 bg-white/[0.08]" />
                        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                          2012: VIIRS 375m Added · Cauchy Cross-Calibrated
                        </span>
                        <div className="h-[1px] flex-1 bg-white/[0.08]" />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="w-8 shrink-0 font-mono text-[10px] text-slate-400 text-right">
                        <span className={yrSummary.isAnomalyYear ? 'text-amber-300 font-semibold' : ''}>
                          {year}
                        </span>
                      </div>

                      <div className="grid grid-cols-52 flex-1 gap-[2px]">
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
                              className={`h-3 w-full rounded-[1px] transition-transform focus:outline-none ${
                                isSelected
                                  ? 'ring-1.5 ring-amber-300 scale-125 z-10'
                                  : 'hover:scale-125 hover:z-10'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div className="w-10 shrink-0 text-right font-mono text-[9px] text-slate-400">
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
      ) : (
        /* Tactile Season Cards View (Screenshot 3 style) */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              32-Week Fire Season Window for {selectedRecord.year}
            </span>
            <select
              aria-label="Inspect year"
              value={selectedRecord.year}
              onChange={(e) => {
                const yr = Number(e.target.value);
                const found = dataset.records.find(
                  (r) => r.year === yr && r.week === selectedRecord.week
                );
                if (found) onSelectRecord(found);
              }}
              className="bg-[#060D1E] text-amber-300 font-mono font-semibold px-2 py-0.5 rounded border border-white/10 text-xs"
            >
              {Array.from({ length: 27 }, (_, i) => 2000 + i).map((yr) => (
                <option key={yr} value={yr}>
                  {yr} {dataset.aoi.anomalyYears.includes(yr) ? '· Anomaly Year' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-8 gap-2">
            {BLOCK_HEADERS.map((hdr, idx) => (
              <div
                key={idx}
                className="text-center text-[10px] font-mono tracking-wider text-slate-400"
              >
                {hdr}
              </div>
            ))}
            {tactileYearCells.map((cell) => {
              const val = viewMode === 'raw' ? cell.rawCombined : cell.harmonizedCount;
              const norm = val / maxReferenceValue;
              const bg = getCellColor(norm, colorRamp, viewMode === 'anomaly', cell.sfai);
              const isSelected =
                selectedRecord.year === cell.year && selectedRecord.week === cell.week;

              return (
                <button
                  key={cell.week}
                  type="button"
                  onMouseEnter={() => setHoveredRecord(cell)}
                  onMouseLeave={() => setHoveredRecord(null)}
                  onClick={() => onSelectRecord(cell)}
                  style={{ backgroundColor: bg }}
                  className={`h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'ring-1.5 ring-amber-300 scale-105 z-10 shadow-sm'
                      : 'hover:scale-105 border border-white/[0.04]'
                  }`}
                >
                  <span className="font-mono text-[9px] font-medium text-slate-200">
                    W{cell.week}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">
                    {val}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
