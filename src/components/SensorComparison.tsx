import React, { useState } from 'react';
import {
  Eye,
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
  const [activeTab, setActiveTab] = useState<'stacked-monitors' | 'two-eyes'>('stacked-monitors');

  const summaries = dataset.yearlySummaries;
  const maxRawVal = Math.max(...summaries.map((s) => s.rawTotal), 100);
  const maxHarmVal = Math.max(...summaries.map((s) => s.harmonizedTotal), 100);

  // Dimensions for each of the two stacked dark-grid monitor charts (Screenshot 5 right monitor)
  const svgW = 720;
  const svgH = 135;
  const padL = 44;
  const padR = 18;
  const padT = 16;
  const padB = 24;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const xForIndex = (i: number) =>
    padL + (i / Math.max(1, summaries.length - 1)) * plotW;
  const yForValue = (val: number, maxVal: number) =>
    padT + plotH - (Math.min(val, maxVal) / maxVal) * plotH;

  const rawPoints = summaries
    .map((s, idx) => `${xForIndex(idx)},${yForValue(s.rawTotal, maxRawVal)}`)
    .join(' ');
  const rawAreaPoints = `${xForIndex(0)},${padT + plotH} ${rawPoints} ${xForIndex(
    summaries.length - 1
  )},${padT + plotH}`;

  const harmPoints = summaries
    .map((s, idx) => `${xForIndex(idx)},${yForValue(s.harmonizedTotal, maxHarmVal)}`)
    .join(' ');
  const harmAreaPoints = `${xForIndex(0)},${padT + plotH} ${harmPoints} ${xForIndex(
    summaries.length - 1
  )},${padT + plotH}`;

  const x2012 = xForIndex(12); // Year 2012 index

  return (
    <div className="bg-[#09142B]/95 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Header & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Sensor Calibration &amp; Overlap Alignment (2000–2026)
            </h3>
            <p className="text-[11px] text-slate-300">
              We use the years when both satellites flew together to calibrate one against the other
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#061024] p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('stacked-monitors')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'stacked-monitors'
                ? 'bg-amber-500 text-space-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dual Sensor Curves</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('two-eyes')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'two-eyes'
                ? 'bg-amber-500 text-space-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>1 km vs 375 m Grid</span>
          </button>
        </div>
      </div>

      {activeTab === 'stacked-monitors' ? (
        <div className="space-y-3">
          {/* TOP CHART (Screenshot 5 Top Cyan Monitor): Raw Unharmonized Record with 2012 Sensor Jump */}
          <div className="bg-[#060F22] border border-sky-400/20 rounded-2xl p-3">
            <div className="flex items-center justify-between text-[11px] mb-1 px-1">
              <span className="font-mono font-bold text-sky-400 uppercase tracking-wider">
                01 · RAW SENSOR RECORD (MODIS 1KM + UNSCALED VIIRS 375M)
              </span>
              <span className="font-mono text-rose-300 font-semibold">
                2012 Sensor Jump: +{dataset.metrics.rawArtificialJumpPct}%
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-32 overflow-visible"
              role="img"
              aria-label="Top monitor chart showing raw unharmonized fire detections with the 2012 sensor jump"
            >
              <defs>
                <linearGradient id="cyanAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Tactical Grid */}
              {[0, 0.5, 1].map((frac) => {
                const y = padT + plotH * (1 - frac);
                return (
                  <g key={frac}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={svgW - padR}
                      y2={y}
                      stroke="rgba(56, 189, 248, 0.12)"
                    />
                    <text
                      x={padL - 6}
                      y={y + 3}
                      textAnchor="end"
                      fill="#64748B"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {Math.round(maxRawVal * frac)}
                    </text>
                  </g>
                );
              })}

              {/* 2012 Transition Line */}
              <line
                x1={x2012}
                y1={padT}
                x2={x2012}
                y2={padT + plotH}
                stroke="#F43F5E"
                strokeWidth="1.4"
                strokeDasharray="3,3"
              />
              <text
                x={x2012 + 5}
                y={padT + 10}
                fill="#FDA4AF"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                2012: NEW SENSOR (VIIRS)
              </text>

              <polygon points={rawAreaPoints} fill="url(#cyanAreaGrad)" />
              <polyline
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.4"
                points={rawPoints}
              />

              {summaries.map((s, idx) => {
                const cx = xForIndex(idx);
                const cy = yForValue(s.rawTotal, maxRawVal);
                const isSelected = s.year === selectedRecord.year;
                return (
                  <circle
                    key={s.year}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 4.5 : 2.5}
                    fill={isSelected ? '#FFFFFF' : '#38BDF8'}
                    stroke="#060F22"
                    strokeWidth="1.2"
                    className="cursor-pointer"
                    onClick={() => onSelectYear(s.year)}
                  />
                );
              })}
            </svg>
          </div>

          {/* BOTTOM CHART (Screenshot 5 Bottom Amber Monitor): Cauchy's Comet Harmonized Record */}
          <div className="bg-[#060F22] border border-amber-400/25 rounded-2xl p-3">
            <div className="flex items-center justify-between text-[11px] mb-1 px-1">
              <span className="font-mono font-bold text-amber-400 uppercase tracking-wider">
                02 · CAUCHY&apos;S COMET HARMONIZED RECORD (2000–2026 CONTINUOUS)
              </span>
              <span className="font-mono text-emerald-300 font-semibold">
                Overlap Fit R² = {dataset.metrics.overlapRSquared} · MCD64A1 r = {dataset.metrics.mcd64a1Correlation}
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-32 overflow-visible"
              role="img"
              aria-label="Bottom monitor chart showing Cauchy's Comet harmonized continuous fire record"
            >
              <defs>
                <linearGradient id="amberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[0, 0.5, 1].map((frac) => {
                const y = padT + plotH * (1 - frac);
                return (
                  <g key={frac}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={svgW - padR}
                      y2={y}
                      stroke="rgba(245, 158, 11, 0.12)"
                    />
                    <text
                      x={padL - 6}
                      y={y + 3}
                      textAnchor="end"
                      fill="#64748B"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {Math.round(maxHarmVal * frac)}
                    </text>
                  </g>
                );
              })}

              <polygon points={harmAreaPoints} fill="url(#amberAreaGrad)" />
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.6"
                points={harmPoints}
              />

              {summaries.map((s, idx) => {
                const cx = xForIndex(idx);
                const cy = yForValue(s.harmonizedTotal, maxHarmVal);
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
                      r={isSelected ? 5 : s.isAnomalyYear ? 3.5 : 2.5}
                      fill={isSelected ? '#FFFFFF' : s.isAnomalyYear ? '#FDE047' : '#F59E0B'}
                      stroke="#060F22"
                      strokeWidth="1.2"
                    />
                    {(idx % 4 === 0 || idx === summaries.length - 1) && (
                      <text
                        x={cx}
                        y={svgH - 4}
                        textAnchor="middle"
                        fill={isSelected ? '#FBBF24' : '#94A3B8'}
                        fontSize="9.5"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {s.year}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* SCENE 3 SLIDE REPLICA: "Two sensors. Different eyes. Is it the fire, or the sensor?" */
        <div className="bg-[#061024] border border-white/10 rounded-2xl p-5 space-y-5">
          <div className="text-center">
            <h4 className="text-base font-bold text-white">
              Two sensors. Different eyes.
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              VIIRS has sharper eyes and sees many small fires that coarse 1 km MODIS pixels miss.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Left: MODIS 3x3 Coarse 1 km Grid */}
            <div className="flex flex-col items-center">
              <div className="w-44 h-44 grid grid-cols-3 grid-rows-3 border border-sky-400/70">
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={i}
                    className="border border-sky-400/50 flex items-center justify-center"
                  >
                    {(i === 1 || i === 8) && (
                      <span className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_10px_#F59E0B]" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs font-mono tracking-wider text-slate-200">
                MODIS · since 2000 · 1 km pixels
              </div>
            </div>

            {/* Right: VIIRS 6x6 Fine 375 m Grid */}
            <div className="flex flex-col items-center">
              <div className="w-44 h-44 grid grid-cols-6 grid-rows-6 border border-amber-400/80">
                {Array.from({ length: 36 }, (_, i) => {
                  const hasFire = [7, 10, 13, 15, 17, 18, 20, 22, 28, 31, 34].includes(i);
                  return (
                    <div
                      key={i}
                      className="border border-amber-400/45 flex items-center justify-center"
                    >
                      {hasFire && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs font-mono tracking-wider text-amber-300">
                VIIRS · since 2012 · 375 m pixels
              </div>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-white/10 text-xs text-slate-200 font-medium">
            Power-Law Scaling (<span className="font-mono text-amber-300">N_eq = {dataset.aoi.calibrationAlpha} · N_MODIS^{dataset.aoi.calibrationBeta}</span>) harmonizes both grids onto one comparable baseline.
          </div>
        </div>
      )}
    </div>
  );
};
