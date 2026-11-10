import React from 'react';
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

  const onsetLeftPct = Math.max(3, Math.round(((metrics.onsetWeek - 1) / 52) * 100));
  const seasonWidthPct = Math.min(
    92 - onsetLeftPct,
    Math.max(16, Math.round((metrics.seasonDurationWeeks / 52) * 100))
  );

  const peakLeftPct = Math.max(4, Math.round(((metrics.peakWeekStart - 1) / 52) * 100));
  const peakWidthPct = Math.max(
    12,
    Math.round(((metrics.peakWeekEnd - metrics.peakWeekStart + 3) / 52) * 100)
  );

  const currentIntensityPct = Math.min(
    95,
    Math.max(15, selectedRecord.percentile)
  );

  return (
    <div className="bg-[#081226] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5">
      {/* Exact Minimal Header from Video Screenshot 3 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
            CRITICAL PERIODS
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Only when the fire is unusual · {aoi.fireRegime}
          </p>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          Shift: {Math.abs(metrics.shiftDays)}d {metrics.shiftDirection}
        </span>
      </div>

      {/* Clean Horizontal Timeline Bars from Screenshot 3 */}
      <div className="space-y-3 pt-1">
        {/* Baseline Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Historical Season Window ({metrics.onsetMonthLabel} → {metrics.cessationMonthLabel})</span>
            <span className="font-mono text-slate-300">{metrics.seasonDurationWeeks} wks</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#0D182E] relative overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-600/60"
              style={{
                marginLeft: `${onsetLeftPct}%`,
                width: `${seasonWidthPct}%`,
              }}
            />
          </div>
        </div>

        {/* Peak Window Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Critical Peak Window ({metrics.peakPeriodLabel})</span>
            <span className="font-mono text-amber-300 font-semibold">
              Median: {selectedRecord.weeklyHistoricalMedian} / wk
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#0D182E] relative overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500/80 transition-all duration-300"
              style={{
                marginLeft: `${peakLeftPct}%`,
                width: `${Math.min(100 - peakLeftPct, peakWidthPct + 24)}%`,
              }}
            />
          </div>
        </div>

        {/* Inspected Week Anomaly Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>
              Inspected Week {selectedRecord.week}, {selectedRecord.year} ({selectedRecord.dateRangeLabel})
            </span>
            <span className="font-mono text-amber-300 font-semibold">
              {selectedRecord.harmonizedCount} hotspots ({selectedRecord.percentile}th pct)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#0D182E] relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
              style={{ width: `${currentIntensityPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Extreme Fire Years Quick Links */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
        <span className="text-slate-400">
          Known Anomaly Years:
        </span>
        <div className="flex items-center gap-1">
          {aoi.anomalyYears.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => onSelectAnomalyYearWeek(yr, aoi.peakWeekCenter)}
              className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                selectedRecord.year === yr
                  ? 'bg-amber-400 text-[#060D1E] font-bold'
                  : 'bg-[#0D182E] text-slate-300 hover:text-white'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
