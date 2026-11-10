import React from 'react';
import { Flame } from 'lucide-react';
import { HarmonizedDataset, WeeklyFireRecord } from '../types/fire';

interface CriticalPeriodsProps {
  dataset: HarmonizedDataset;
  selectedRecord: WeeklyFireRecord;
  onSelectAnomalyYearWeek: (year: number, week: number) => void;
}

export const CriticalPeriods: React.FC<CriticalPeriodsProps> = ({
  dataset,
  selectedRecord,
  onSelectAnomalyYearWeek,
}) => {
  const { metrics, aoi } = dataset;

  // Convert weeks (1..52) into percentage positions along the horizontal bars (Screenshot 3 style)
  const onsetLeftPct = Math.max(4, Math.round(((metrics.onsetWeek - 1) / 52) * 100));
  const seasonWidthPct = Math.min(
    90 - onsetLeftPct,
    Math.max(18, Math.round((metrics.seasonDurationWeeks / 52) * 100))
  );

  const peakLeftPct = Math.max(6, Math.round(((metrics.peakWeekStart - 1) / 52) * 100));
  const peakWidthPct = Math.max(
    14,
    Math.round(((metrics.peakWeekEnd - metrics.peakWeekStart + 4) / 52) * 100)
  );

  const currentIntensityPct = Math.min(
    96,
    Math.max(24, selectedRecord.percentile)
  );

  return (
    <div className="bg-[#0A1730]/95 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
      {/* Exact Uppercase Header from Video Screenshot 3 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-[0.14em] text-slate-100">
            CRITICAL PERIODS
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Only when the fire is unusual — not the satellite ({aoi.fireRegime})
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold">
            Onset Shift: {Math.abs(metrics.shiftDays)}d {metrics.shiftDirection}
          </span>
        </div>
      </div>

      {/* Horizontal Progress / Timeline Bars (Exact Visual Match to Video Screenshot 3 Bottom-Right Card) */}
      <div className="space-y-3.5 pt-1">
        {/* Bar 0: Quiet Baseline Reference Pill (Screenshot 3 top short slate bar) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>1. Historical Baseline Window ({metrics.onsetMonthLabel} → {metrics.cessationMonthLabel})</span>
            <span className="font-mono text-slate-300">{metrics.seasonDurationWeeks} weeks active</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#142342] relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#31466E] to-[#4A6596]"
              style={{
                marginLeft: `${onsetLeftPct}%`,
                width: `${seasonWidthPct}%`,
              }}
            />
          </div>
        </div>

        {/* Bar 1: Glowing Golden-Amber Critical Peak Bar (Screenshot 3 middle bright amber bar) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-200 font-medium">
            <span>2. Critical Peak Burning Period ({metrics.peakPeriodLabel})</span>
            <span className="font-mono text-amber-300 font-bold">
              27-Yr Median: {selectedRecord.weeklyHistoricalMedian} / wk
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-[#142342] relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C87A19] via-[#E59824] to-[#F3B94D] shadow-[0_0_18px_rgba(245,158,11,0.55)] transition-all duration-500"
              style={{
                marginLeft: `${peakLeftPct}%`,
                width: `${Math.min(100 - peakLeftPct, peakWidthPct + 28)}%`,
              }}
            />
          </div>
        </div>

        {/* Bar 2: Selected Week Anomaly Evaluation Bar (Screenshot 3 bottom glowing amber bar) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-200 font-medium">
            <span>
              3. Inspected Week {selectedRecord.week}, {selectedRecord.year} ({selectedRecord.dateRangeLabel})
            </span>
            <span className="font-mono text-amber-300 font-bold">
              {selectedRecord.harmonizedCount} hotspots · {selectedRecord.percentile}th pct ({selectedRecord.sfai >= 0 ? `+${selectedRecord.sfai}` : selectedRecord.sfai}σ)
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-[#142342] relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#B86814] via-[#E59824] to-[#F7C868] shadow-[0_0_18px_rgba(245,158,11,0.5)] transition-all duration-500"
              style={{ width: `${currentIntensityPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Verified Unusual Fire Years Quick Selector */}
      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-300 font-medium">
          Jump to Verified Unusual Fire Years (Peak W{aoi.peakWeekCenter}):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {aoi.anomalyYears.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => onSelectAnomalyYearWeek(yr, aoi.peakWeekCenter)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all ${
                selectedRecord.year === yr
                  ? 'bg-amber-400 text-space-950 border-amber-200 shadow-md shadow-amber-500/25'
                  : 'bg-[#122244] hover:bg-[#1B315E] text-amber-300 border-white/10'
              }`}
            >
              <Flame className="w-3 h-3 inline mr-0.5" />
              {yr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
