import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  GitCompare,
  TrendingUp,
} from 'lucide-react';
import { HarmonizedDataset, WeeklyFireRecord } from '../types/fire';

interface SensorComparisonProps {
  dataset: HarmonizedDataset;
  selectedRecord: WeeklyFireRecord;
  onSelectYear: (year: number) => void;
}

export const SensorComparison: React.FC<SensorComparisonProps> = ({
  dataset,
  selectedRecord,
  onSelectYear,
}) => {
  const [chartTab, setChartTab] = useState<'discontinuity' | 'seasonality'>('discontinuity');
  const [showBurnedAreaRef, setShowBurnedAreaRef] = useState(true);

  const summaries = dataset.yearlySummaries;
  const maxAnnualVal = Math.max(
    ...summaries.map((s) => Math.max(s.rawTotal, s.harmonizedTotal)),
    100
  );
  const maxBurnedArea = Math.max(...summaries.map((s) => s.burnedAreaTotalHa), 100);

  // SVG dimensions for 2000-2026 Annual Comparison
  const svgW = 760;
  const svgH = 235;
  const padL = 48;
  const padR = 24;
  const padT = 22;
  const padB = 32;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const xForIndex = (i: number, total: number) =>
    padL + (i / Math.max(1, total - 1)) * plotW;
  const yForValue = (val: number, maxVal: number) =>
    padT + plotH - (Math.min(val, maxVal) / maxVal) * plotH;

  // Build SVG polyline paths for Annual Discontinuity Chart
  const rawPoints = summaries
    .map((s, idx) => `${xForIndex(idx, summaries.length)},${yForValue(s.rawTotal, maxAnnualVal)}`)
    .join(' ');

  const harmonizedPoints = summaries
    .map(
      (s, idx) =>
        `${xForIndex(idx, summaries.length)},${yForValue(s.harmonizedTotal, maxAnnualVal)}`
    )
    .join(' ');

  const burnedAreaPoints = summaries
    .map(
      (s, idx) =>
        `${xForIndex(idx, summaries.length)},${yForValue(s.burnedAreaTotalHa, maxBurnedArea)}`
    )
    .join(' ');

  const x2012 = xForIndex(12, summaries.length); // 2012 is index 12 (2000 + 12)

  // Build Seasonal Climatology Profile (52 weeks) comparing Selected Year vs 27-Yr Median
  const selectedYearRecords = dataset.records.filter(
    (r) => r.year === selectedRecord.year
  );
  const maxWeeklyVal = Math.max(
    ...dataset.weeklyQ75,
    ...selectedYearRecords.map((r) => r.harmonizedCount),
    25
  );

  const medianWeekPoints = dataset.weeklyMedians
    .map((m, idx) => `${xForIndex(idx, 52)},${yForValue(m, maxWeeklyVal)}`)
    .join(' ');

  const selectedYearWeekPoints = selectedYearRecords
    .map((r, idx) => `${xForIndex(idx, 52)},${yForValue(r.harmonizedCount, maxWeeklyVal)}`)
    .join(' ');

  // IQR Polygon (Q75 top, baseline bottom)
  const q75Top = dataset.weeklyQ75
    .map((q, idx) => `${xForIndex(idx, 52)},${yForValue(q, maxWeeklyVal)}`)
    .join(' ');
  const q25Bottom = [...dataset.weeklyMedians]
    .map((m, idx) => {
      const q25 = Math.max(0, m - dataset.weeklyIqrs[idx] * 0.5);
      return { idx, q25 };
    })
    .reverse()
    .map((item) => `${xForIndex(item.idx, 52)},${yForValue(item.q25, maxWeeklyVal)}`)
    .join(' ');

  return (
    <div className="bg-space-900/85 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-3.5">
      {/* Header & Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-amber-fire" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {chartTab === 'discontinuity'
                ? 'Sensor Transition Calibration: Eliminating the 2012 VIIRS Jump'
                : `52-Week Seasonal Climatology: ${selectedRecord.year} vs 27-Year Historical Median`}
            </h3>
            <p className="text-[11px] text-slate-300">
              {chartTab === 'discontinuity'
                ? `Power-law transfer function N_eq = ${dataset.aoi.calibrationAlpha} · (N_MODIS)^${dataset.aoi.calibrationBeta} calibrated over 2012–2024 overlap`
                : 'Compares selected year weekly trajectory against multi-decadal median & interquartile envelope'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-space-950 p-1 rounded-xl border border-white/15">
          <button
            type="button"
            onClick={() => setChartTab('discontinuity')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              chartTab === 'discontinuity'
                ? 'bg-amber-fire text-space-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2000–2026 Sensor Alignment</span>
          </button>
          <button
            type="button"
            onClick={() => setChartTab('seasonality')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              chartTab === 'seasonality'
                ? 'bg-amber-fire text-space-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{selectedRecord.year} Seasonal Profile</span>
          </button>
        </div>
      </div>

      {/* KPI Callout Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-space-950/80 border border-rose-500/30 rounded-xl p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-rose-300 font-semibold">
            Raw Unharmonized 2012 Jump
          </div>
          <div className="text-base font-mono font-extrabold text-rose-400 mt-0.5">
            +{dataset.metrics.rawArtificialJumpPct}%{' '}
            <span className="text-[11px] font-normal text-slate-300">sensor bias</span>
          </div>
        </div>

        <div className="bg-space-950/80 border border-amber-fire/35 rounded-xl p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-amber-solar font-semibold">
            Harmonized True Shift
          </div>
          <div className="text-base font-mono font-extrabold text-amber-solar mt-0.5">
            {dataset.metrics.harmonizedRealChangePct >= 0
              ? `+${dataset.metrics.harmonizedRealChangePct}%`
              : `${dataset.metrics.harmonizedRealChangePct}%`}{' '}
            <span className="text-[11px] font-normal text-slate-300">real fire trend</span>
          </div>
        </div>

        <div className="bg-space-950/80 border border-emerald-500/30 rounded-xl p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
            2012–2024 Overlap Fit (R²)
          </div>
          <div className="text-base font-mono font-extrabold text-emerald-400 mt-0.5">
            {dataset.metrics.overlapRSquared.toFixed(2)}{' '}
            <span className="text-[11px] font-normal text-slate-300">Aqua / S-NPP</span>
          </div>
        </div>

        <div className="bg-space-950/80 border border-sky-500/30 rounded-xl p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-sky-300 font-semibold">
            MCD64A1 Burned Area r
          </div>
          <div className="text-base font-mono font-extrabold text-sky-400 mt-0.5">
            r = {dataset.metrics.mcd64a1Correlation.toFixed(2)}{' '}
            <span className="text-[11px] font-normal text-slate-300">verified</span>
          </div>
        </div>
      </div>

      {/* Main SVG Visualization */}
      {chartTab === 'discontinuity' ? (
        <div className="relative bg-space-950/70 rounded-xl border border-white/10 p-2">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-52 sm:h-60 overflow-visible"
            role="img"
            aria-label="Annual fire hotspot counts comparing raw sensor discontinuity against Cauchy's Comet harmonized record from 2000 to 2026"
          >
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = padT + plotH * (1 - frac);
              const labelVal = Math.round(maxAnnualVal * frac);
              return (
                <g key={frac}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={svgW - padR}
                    y2={y}
                    stroke="rgba(255,255,255,0.07)"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={padL - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* 2012 VIIRS Transition Vertical Marker */}
            <line
              x1={x2012}
              y1={padT}
              x2={x2012}
              y2={padT + plotH}
              stroke="#F43F5E"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <rect
              x={x2012 - 78}
              y={padT + 2}
              width="156"
              height="18"
              rx="4"
              fill="#4C0519"
              stroke="#F43F5E"
              strokeWidth="0.8"
            />
            <text
              x={x2012}
              y={padT + 14}
              textAnchor="middle"
              fill="#FDA4AF"
              fontSize="9.5"
              fontWeight="bold"
            >
              2012: VIIRS 375m Sensor Added
            </text>

            {/* Optional Independent Burned Area Reference Curve */}
            {showBurnedAreaRef && (
              <polyline
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.75"
                strokeDasharray="2,3"
                opacity="0.7"
                points={burnedAreaPoints}
              />
            )}

            {/* Raw Unharmonized Curve (Shows deceptive 2012 jump) */}
            <polyline
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2.2"
              strokeDasharray="6,4"
              points={rawPoints}
            />

            {/* Cauchy's Comet Harmonized Curve */}
            <polyline
              fill="none"
              stroke="#FF7A00"
              strokeWidth="3"
              points={harmonizedPoints}
            />

            {/* Interactive Year Nodes */}
            {summaries.map((s, idx) => {
              const cx = xForIndex(idx, summaries.length);
              const cy = yForValue(s.harmonizedTotal, maxAnnualVal);
              const isSelected = s.year === selectedRecord.year;
              return (
                <g
                  key={s.year}
                  className="cursor-pointer"
                  onClick={() => onSelectYear(s.year)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 5.5 : s.isAnomalyYear ? 4 : 2.8}
                    fill={isSelected ? '#FFFFFF' : s.isAnomalyYear ? '#FFD54F' : '#FF7A00'}
                    stroke="#0B1B3A"
                    strokeWidth="1.5"
                  />
                  {(idx % 3 === 0 || idx === summaries.length - 1) && (
                    <text
                      x={cx}
                      y={svgH - 8}
                      textAnchor="middle"
                      fill={isSelected ? '#FFD54F' : '#CBD5E1'}
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {s.year}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1 text-[11px] text-slate-300">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-solar">
                <span className="w-4 h-1 bg-amber-fire rounded-full inline-block" />
                Cauchy&apos;s Harmonized Record (2000–2026)
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-300">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-rose-500 inline-block" />
                Raw Unharmonized Count (MODIS + Raw VIIRS)
              </span>
              {showBurnedAreaRef && (
                <span className="inline-flex items-center gap-1.5 text-sky-300">
                  <span className="w-4 h-0.5 border-b-2 border-dotted border-sky-400 inline-block" />
                  NASA MCD64A1 Burned Area Reference
                </span>
              )}
            </div>

            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showBurnedAreaRef}
                onChange={(e) => setShowBurnedAreaRef(e.target.checked)}
              />
              <span>Overlay MCD64A1 Burned Area</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="relative bg-space-950/70 rounded-xl border border-white/10 p-2">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-52 sm:h-60 overflow-visible"
            role="img"
            aria-label={`Weekly fire activity profile for ${selectedRecord.year} compared against the 27-year historical median`}
          >
            {/* IQR Shaded Band */}
            <polygon
              points={`${q75Top} ${q25Bottom}`}
              fill="rgba(255, 122, 0, 0.14)"
              stroke="none"
            />

            {/* 27-Year Historical Median Curve */}
            <polyline
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeDasharray="4,4"
              points={medianWeekPoints}
            />

            {/* Selected Year Weekly Curve */}
            <polyline
              fill="none"
              stroke="#FF7A00"
              strokeWidth="2.8"
              points={selectedYearWeekPoints}
            />

            {/* Highlight Currently Selected Week */}
            <line
              x1={xForIndex(selectedRecord.week - 1, 52)}
              y1={padT}
              x2={xForIndex(selectedRecord.week - 1, 52)}
              y2={padT + plotH}
              stroke="#FFD54F"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />

            {/* X-axis week ticks */}
            {[1, 8, 16, 24, 32, 40, 48, 52].map((w) => (
              <text
                key={w}
                x={xForIndex(w - 1, 52)}
                y={svgH - 8}
                textAnchor="middle"
                fill="#CBD5E1"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                W{w}
              </text>
            ))}
          </svg>

          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-solar">
                <span className="w-4 h-1 bg-amber-fire rounded-full inline-block" />
                {selectedRecord.year} Harmonized Weekly Trajectory
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-slate-400 inline-block" />
                27-Year Historical Median (2000–2026)
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-200/80">
                <span className="w-3 h-2.5 bg-amber-fire/25 border border-amber-fire/40 inline-block rounded-sm" />
                Interquartile Normal Band (Q25–Q75)
              </span>
            </div>
            <span className="font-mono text-amber-solar">
              Inspecting: {selectedRecord.year} W{selectedRecord.week}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
