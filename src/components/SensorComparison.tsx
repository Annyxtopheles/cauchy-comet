import React, { useState } from 'react';
import {
  Layers,
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

  const svgW = 720;
  const svgH = 110;
  const padL = 40;
  const padR = 16;
  const padT = 14;
  const padB = 20;
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

  const x2012 = xForIndex(12);

  return (
    <div className="bg-[#081226] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
      {/* Clean Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
            Sensor Alignment &amp; Discontinuity Removal
          </h3>
          <p className="text-[11px] text-slate-400">
            2012–2024 co-flight overlap calibration flattens the artificial VIIRS jump
          </p>
        </div>

        <div className="flex items-center bg-[#060D1E] p-0.5 rounded-lg border border-white/[0.06] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('stacked-monitors')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'stacked-monitors'
                ? 'bg-[#142344] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Trends
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('two-eyes')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'two-eyes'
                ? 'bg-[#142344] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 inline mr-1" />
            Sensors
          </button>
        </div>
      </div>

      {activeTab === 'stacked-monitors' ? (
        <div className="space-y-2.5">
          {/* Top: Raw 2012 Jump Monitor (Cyan) */}
          <div className="bg-[#060D1E] border border-white/[0.04] rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[10px] mb-1 px-1">
              <span className="font-mono text-sky-400 font-semibold uppercase">
                Raw Unharmonized Data (Spikes +{dataset.metrics.rawArtificialJumpPct}% in 2012)
              </span>
              <span className="font-mono text-slate-400">MODIS 1km + VIIRS 375m unscaled</span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-24 overflow-visible"
              role="img"
              aria-label="Raw unharmonized fire detections"
            >
              <defs>
                <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line
                x1={x2012}
                y1={padT}
                x2={x2012}
                y2={padT + plotH}
                stroke="#F43F5E"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.6"
              />

              <polygon points={rawAreaPoints} fill="url(#cyanArea)" />
              <polyline
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.8"
                points={rawPoints}
              />

              {summaries.map((s, idx) => (
                <circle
                  key={s.year}
                  cx={xForIndex(idx)}
                  cy={yForValue(s.rawTotal, maxRawVal)}
                  r={s.year === selectedRecord.year ? 3.5 : 1.8}
                  fill={s.year === selectedRecord.year ? '#FFFFFF' : '#38BDF8'}
                  className="cursor-pointer"
                  onClick={() => onSelectYear(s.year)}
                />
              ))}
            </svg>
          </div>

          {/* Bottom: Cauchy's Harmonized Record Monitor (Amber) */}
          <div className="bg-[#060D1E] border border-white/[0.04] rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[10px] mb-1 px-1">
              <span className="font-mono text-amber-400 font-semibold uppercase">
                Cauchy&apos;s Comet Harmonized (Continuous 2000–2026)
              </span>
              <span className="font-mono text-slate-400">
                Overlap R² = {dataset.metrics.overlapRSquared} · MCD64A1 r = {dataset.metrics.mcd64a1Correlation}
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-24 overflow-visible"
              role="img"
              aria-label="Harmonized fire record"
            >
              <defs>
                <linearGradient id="amberArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <polygon points={harmAreaPoints} fill="url(#amberArea)" />
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                points={harmPoints}
              />

              {summaries.map((s, idx) => {
                const isSelected = s.year === selectedRecord.year;
                return (
                  <g key={s.year} className="cursor-pointer" onClick={() => onSelectYear(s.year)}>
                    <circle
                      cx={xForIndex(idx)}
                      cy={yForValue(s.harmonizedTotal, maxHarmVal)}
                      r={isSelected ? 4 : s.isAnomalyYear ? 2.5 : 1.8}
                      fill={isSelected ? '#FFFFFF' : s.isAnomalyYear ? '#FDE047' : '#F59E0B'}
                    />
                    {(idx % 5 === 0 || idx === summaries.length - 1) && (
                      <text
                        x={xForIndex(idx)}
                        y={svgH - 2}
                        textAnchor="middle"
                        fill={isSelected ? '#FBBF24' : '#64748B'}
                        fontSize="8.5"
                        fontFamily="monospace"
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
        /* Refined Sensor Optics Overview */
        <div className="bg-[#060D1E] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-[#0A1428] border border-white/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">MODIS Instrument</span>
              <span className="font-mono text-[10px] text-sky-400">Terra &amp; Aqua</span>
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              1,000 m pixel footprint (2000–Present)
            </div>
            <p className="text-[11px] text-slate-400">
              Provides the long-term 25-year historical baseline, but misses small or low-intensity understory and agricultural fires.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0A1428] border border-white/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">VIIRS Instrument</span>
              <span className="font-mono text-[10px] text-amber-400">S-NPP &amp; NOAA-20</span>
            </div>
            <div className="font-mono text-[11px] text-amber-300">
              375 m pixel footprint (2012–Present)
            </div>
            <p className="text-[11px] text-slate-400">
              Detects fires down to ~1/10th the radiative power. Cauchy&apos;s Comet scales MODIS into VIIRS-equivalent units for a seamless time series.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
