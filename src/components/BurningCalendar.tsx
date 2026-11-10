import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Eye,
  Flame,
  Info,
  Palette,
  Sparkles,
  AlertTriangle,
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

const RAMP_STOPS: Record<ColorRamp, string[]> = {
  'fire-amber': [
    '#0E2044', // 0 - Deep Space Navy
    '#1E3A6D', // 1 - Low Slate Blue
    '#6B2D3E', // 2 - Smolder Plum
    '#B8391E', // 3 - Ember Red
    '#E65100', // 4 - Blaze Orange
    '#FF8F00', // 5 - Electric Amber
    '#FFD54F', // 6 - Solar Flame Yellow
    '#FFF8E1', // 7 - White-Hot Core
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
    // Diverging scale for SFAI Anomaly
    if (sfai <= -0.6) return '#1E3A8A'; // Cooler/Below Normal
    if (sfai < 0.35) return '#152A55'; // Normal Baseline
    if (sfai < 0.85) return '#78350F'; // Slightly Elevated
    if (sfai < 1.35) return '#D97706'; // Elevated Anomaly
    if (sfai < 1.95) return '#EA580C'; // High Anomaly
    return '#EF4444'; // Extreme Critical Anomaly
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
  const [highlightPeakWindow, setHighlightPeakWindow] = useState(true);

  const activeRecord = hoveredRecord || selectedRecord;

  // Group records by year (2000..2026) and compute 98th percentile max for color normalization
  const { rowsByYear, maxReferenceValue } = useMemo(() => {
    const map = new Map<number, WeeklyFireRecord[]>();
    const values: number[] = [];

    for (const r of dataset.records) {
      if (!map.has(r.year)) map.set(r.year, []);
      map.get(r.year)!.push(r);
      const val =
        viewMode === 'raw' ? r.rawCombined : r.harmonizedCount;
      values.push(val);
    }

    values.sort((a, b) => a - b);
    const p98 = values[Math.floor(values.length * 0.985)] || 100;

    return {
      rowsByYear: Array.from(map.entries()).sort((a, b) => a[0] - b[0]),
      maxReferenceValue: Math.max(10, p98),
    };
  }, [dataset, viewMode]);

  const { onsetWeek, peakWeekStart, peakWeekEnd, cessationWeek } = dataset.metrics;

  return (
    <div className="bg-space-900/85 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Top Header & Mode Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-fire" />
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              27-Year Burning Activity Calendar (2000–2026)
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Each cell represents 1 calendar week ({dataset.records.length.toLocaleString()} harmonized satellite observations across MODIS &amp; VIIRS).
          </p>
        </div>

        {/* 3-Way Data View Switcher (Scene 1 & Scene 6 of Video) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-space-950 p-1 rounded-xl border border-white/15">
            <button
              type="button"
              onClick={() => onChangeViewMode('harmonized')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'harmonized'
                  ? 'bg-amber-fire text-space-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Harmonized Record</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('raw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'raw'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Raw Unharmonized (2012 Jump)</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('anomaly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'anomaly'
                  ? 'bg-amber-solar text-space-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Anomaly Index (SFAI)</span>
            </button>
          </div>

          {/* Accessible Color Ramp Selector */}
          <div className="flex items-center gap-1.5 bg-space-950 px-2.5 py-1.5 rounded-xl border border-white/15 text-xs">
            <Palette className="w-3.5 h-3.5 text-amber-solar" />
            <label htmlFor="color-ramp-select" className="text-slate-300 font-medium">
              Ramp:
            </label>
            <select
              id="color-ramp-select"
              value={colorRamp}
              onChange={(e) => onChangeColorRamp(e.target.value as ColorRamp)}
              className="bg-space-900 text-white font-semibold rounded px-1.5 py-0.5 border border-white/10 focus:outline-none focus:border-amber-fire"
            >
              <option value="fire-amber">Fire-Amber (Brand)</option>
              <option value="viridis">Viridis (Colorblind Safe)</option>
              <option value="inferno">Inferno (High Contrast)</option>
              <option value="cividis">Cividis (CVD Uniform)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contextual Notice when viewing Raw Unharmonized Data */}
      {viewMode === 'raw' && (
        <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Warning — Artificial Sensor Jump Visible:</strong> In 2012, Suomi-NPP VIIRS (375 m) joined MODIS (1 km). Raw counts jump by{' '}
              <strong className="text-white">+{dataset.metrics.rawArtificialJumpPct}%</strong> overnight. Switch back to{' '}
              <button
                type="button"
                onClick={() => onChangeViewMode('harmonized')}
                className="underline font-bold text-amber-solar hover:text-white"
              >
                Harmonized Record
              </button>{' '}
              to remove the satellite bias.
            </span>
          </div>
        </div>
      )}

      {/* Live Cell Inspector Banner */}
      <div className="bg-space-950/90 border border-white/10 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-6 gap-3 items-center text-xs">
        <div className="col-span-2 sm:col-span-2 flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs border border-white/20 shrink-0"
            style={{
              backgroundColor: getCellColor(
                (viewMode === 'raw'
                  ? activeRecord.rawCombined
                  : activeRecord.harmonizedCount) / maxReferenceValue,
                colorRamp,
                viewMode === 'anomaly',
                activeRecord.sfai
              ),
              color: activeRecord.percentile > 75 ? '#0B1B3A' : '#FFFFFF',
            }}
          >
            W{activeRecord.week}
          </div>
          <div>
            <div className="font-bold text-white text-sm">
              {activeRecord.year} · Week {activeRecord.week} ({activeRecord.dateRangeLabel})
            </div>
            <div className="text-[11px] text-slate-300">{activeRecord.sensorOrigin}</div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-300">
            Harmonized Count
          </div>
          <div className="font-mono font-bold text-sm text-amber-solar">
            {activeRecord.harmonizedCount.toLocaleString()}{' '}
            <span className="text-[10px] font-normal text-slate-300">VIIRS-eq</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-300">
            Raw MODIS / VIIRS
          </div>
          <div className="font-mono font-semibold text-sm text-slate-200">
            {activeRecord.modisRaw} / {activeRecord.viirsRaw ?? '—'}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-300">
            27-Yr Week Median
          </div>
          <div className="font-mono font-semibold text-sm text-slate-200">
            {activeRecord.weeklyHistoricalMedian} (IQR {activeRecord.weeklyHistoricalIqr})
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-300">
            Anomaly Status (SFAI)
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                activeRecord.anomalyStatus === 'critical'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                  : activeRecord.anomalyStatus === 'elevated'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : activeRecord.anomalyStatus === 'low'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {activeRecord.anomalyStatus} ({activeRecord.sfai >= 0 ? `+${activeRecord.sfai}` : activeRecord.sfai}σ)
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Heatmap Matrix */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[780px]">
          {/* Month Headers & Critical Window Markers */}
          <div className="flex items-center mb-1.5 pl-14 pr-16">
            <div className="grid grid-cols-52 w-full gap-[2px] text-[10px] text-slate-300 font-semibold">
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

          {/* Critical Period Bracket Bar */}
          {highlightPeakWindow && (
            <div className="flex items-center mb-1.5 pl-14 pr-16">
              <div className="grid grid-cols-52 w-full gap-[2px] h-2">
                {Array.from({ length: 52 }, (_, i) => {
                  const w = i + 1;
                  const isPeak = w >= peakWeekStart && w <= peakWeekEnd;
                  const isSeason = w >= onsetWeek && w <= cessationWeek;
                  return (
                    <div
                      key={w}
                      className={`rounded-sm ${
                        isPeak
                          ? 'bg-amber-fire'
                          : isSeason
                          ? 'bg-amber-fire/35'
                          : 'bg-transparent'
                      }`}
                      title={
                        isPeak
                          ? `Critical Peak Burning Window (Week ${w})`
                          : isSeason
                          ? `Active Fire Season (Week ${w})`
                          : ''
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Year Rows (2000 -> 2026) */}
          <div className="space-y-[2px]">
            {rowsByYear.map(([year, weeks]) => {
              const yrSummary = dataset.yearlySummaries.find((y) => y.year === year)!;
              const isTransitionYear = year === 2012;

              return (
                <React.Fragment key={year}>
                  {isTransitionYear && (
                    <div className="my-1.5 flex items-center gap-2 py-0.5">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-fire/60 to-transparent" />
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-fire/15 text-amber-solar border border-amber-fire/30">
                        2012 Suomi-NPP VIIRS (375 m) Sensor Launch —{' '}
                        {viewMode === 'raw'
                          ? 'Unharmonized Discontinuity'
                          : 'Cauchy Cross-Calibrated Continuity'}
                      </span>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-fire/60 to-transparent" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 group">
                    {/* Year Label */}
                    <div className="w-12 shrink-0 flex items-center justify-between text-[11px] font-mono text-slate-300 group-hover:text-white">
                      <span className={yrSummary.isAnomalyYear ? 'font-bold text-amber-solar' : ''}>
                        {year}
                      </span>
                      {yrSummary.isAnomalyYear && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-rose-500"
                          title="Known Drought / Fire Anomaly Year"
                        />
                      )}
                    </div>

                    {/* 52 Weekly Cells */}
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
                            aria-label={`Year ${cell.year} Week ${cell.week}: ${cell.harmonizedCount} harmonized hotspots`}
                            style={{ backgroundColor: bg }}
                            className={`h-3.5 sm:h-4 w-full rounded-[2px] transition-transform focus:outline-none ${
                              isSelected
                                ? 'ring-2 ring-white scale-125 z-10'
                                : 'hover:scale-125 hover:z-10 hover:ring-1 hover:ring-amber-solar'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Right Annual Total Bar */}
                    <div className="w-14 shrink-0 text-right font-mono text-[10px] text-slate-300">
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

          {/* Bottom 27-Year Historical Weekly Median Baseline Strip */}
          <div className="mt-3 pt-2 border-t border-white/15 flex items-center gap-2">
            <div className="w-12 shrink-0 text-[10px] font-mono font-bold text-amber-solar uppercase">
              Median
            </div>
            <div className="grid grid-cols-52 flex-1 gap-[2px]">
              {dataset.weeklyMedians.map((med, idx) => {
                const bg = getCellColor(
                  med / maxReferenceValue,
                  colorRamp,
                  false,
                  0
                );
                return (
                  <div
                    key={idx}
                    style={{ backgroundColor: bg }}
                    title={`Week ${idx + 1} Historical 27-Year Median: ${med} hotspots`}
                    className="h-4 w-full rounded-[2px] border border-white/10"
                  />
                );
              })}
            </div>
            <div className="w-14 shrink-0 text-right font-mono text-[10px] text-amber-solar font-semibold">
              Baseline
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Controls Footer */}
      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium">
            {viewMode === 'anomaly' ? 'Anomaly Index (SFAI):' : 'Hotspot Intensity:'}
          </span>
          {viewMode === 'anomaly' ? (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="px-1.5 py-0.5 rounded bg-[#1E3A8A] text-white">&lt; -0.6σ Low</span>
              <span className="px-1.5 py-0.5 rounded bg-[#152A55] text-slate-200">Normal</span>
              <span className="px-1.5 py-0.5 rounded bg-[#D97706] text-space-950 font-semibold">+1.0σ Elevated</span>
              <span className="px-1.5 py-0.5 rounded bg-[#EF4444] text-white font-bold">&gt; +1.8σ Critical</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono">0</span>
              {RAMP_STOPS[colorRamp].map((hex, i) => (
                <span
                  key={hex + i}
                  style={{ backgroundColor: hex }}
                  className="w-5 h-3 rounded-sm border border-white/10"
                />
              ))}
              <span className="text-[10px] font-mono">&ge;{maxReferenceValue} / wk</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={highlightPeakWindow}
              onChange={(e) => setHighlightPeakWindow(e.target.checked)}
              className="rounded border-white/20"
            />
            <Eye className="w-3.5 h-3.5 text-amber-fire" />
            <span>Show Season Onset (W{onsetWeek}) &amp; Peak (W{peakWeekStart}–W{peakWeekEnd})</span>
          </label>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-300">
            <Info className="w-3.5 h-3.5 text-amber-solar" /> Click any cell to inspect week on map
          </span>
        </div>
      </div>
    </div>
  );
};
