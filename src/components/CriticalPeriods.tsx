import React from 'react';
import {
  AlertOctagon,
  CalendarClock,
  Compass,
  Flame,
  TrendingUp,
  Zap,
} from 'lucide-react';
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
  const diffFromMedian =
    selectedRecord.harmonizedCount - selectedRecord.weeklyHistoricalMedian;
  const pctOfMedian =
    selectedRecord.weeklyHistoricalMedian > 0
      ? Math.round(
          (selectedRecord.harmonizedCount / selectedRecord.weeklyHistoricalMedian) * 100
        )
      : 100;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-fire" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Decision Intelligence: Three Responder Answers
          </h3>
        </div>
        <span className="text-[11px] text-amber-solar font-mono">
          Baseline: 2000–2026 (27 Yrs)
        </span>
      </div>

      {/* 3 Responder Cards Grid (Scene 7 of Prescreening Video) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: When Does It Normally Burn? */}
        <div className="bg-space-900/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-solar flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-amber-fire" />
                1. When Does It Normally Burn?
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-200">
                {metrics.seasonDurationWeeks} Wks Active
              </span>
            </div>

            <div className="mt-2 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-slate-300">Season Onset (10%):</span>
                <span className="font-mono font-bold text-white">
                  {metrics.onsetMonthLabel}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-slate-300">Critical Peak Window:</span>
                <span className="font-mono font-bold text-amber-solar">
                  {metrics.peakPeriodLabel}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-300">Season Cessation (90%):</span>
                <span className="font-mono font-semibold text-slate-200">
                  {metrics.cessationMonthLabel}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 mt-3 pt-2 border-t border-white/10">
            <strong>Regime:</strong> {aoi.fireRegime}
          </p>
        </div>

        {/* Card 2: Is This Week Unusual Compared With Past Years? */}
        <div
          className={`rounded-2xl p-4 flex flex-col justify-between shadow-lg border ${
            selectedRecord.anomalyStatus === 'critical'
              ? 'bg-rose-950/40 border-rose-500/50'
              : selectedRecord.anomalyStatus === 'elevated'
              ? 'bg-amber-950/35 border-amber-500/40'
              : 'bg-space-900/90 border-white/10'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-solar flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-fire" />
                2. Is Selected Week Unusual?
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  selectedRecord.anomalyStatus === 'critical'
                    ? 'bg-rose-500 text-white'
                    : selectedRecord.anomalyStatus === 'elevated'
                    ? 'bg-amber-fire text-space-950'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {selectedRecord.anomalyStatus}
              </span>
            </div>

            <div className="my-2 flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-mono font-extrabold text-white">
                  {selectedRecord.harmonizedCount.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-300">hotspots</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  in {selectedRecord.year} · Week {selectedRecord.week} (
                  {selectedRecord.dateRangeLabel})
                </div>
              </div>
              <div className="text-right font-mono">
                <div
                  className={`text-sm font-bold ${
                    diffFromMedian > 0 ? 'text-amber-solar' : 'text-emerald-300'
                  }`}
                >
                  {diffFromMedian >= 0 ? `+${diffFromMedian}` : diffFromMedian} vs Med
                </div>
                <div className="text-[11px] text-slate-300">
                  ({pctOfMedian}% of normal)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-300 block text-[10px]">Percentile Rank</span>
                <span className="font-mono font-bold text-white">
                  {selectedRecord.percentile}th percentile
                </span>
              </div>
              <div>
                <span className="text-slate-300 block text-[10px]">Radiative Power</span>
                <span className="font-mono font-bold text-amber-solar">
                  {selectedRecord.totalFrpMw.toLocaleString()} MW
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 mt-3 pt-2 border-t border-white/10">
            <Zap className="w-3 h-3 inline text-amber-solar mr-1" />
            Flagged unusual <strong>only when fire is unusual</strong>, not the satellite.
          </p>
        </div>

        {/* Card 3: Which Periods Are Critical & Shifting? */}
        <div className="bg-space-900/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-solar flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-fire" />
                3. Are Critical Periods Shifting?
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-fire/20 text-amber-solar border border-amber-fire/30">
                {metrics.shiftDays < 0
                  ? `${Math.abs(metrics.shiftDays)}d Earlier`
                  : metrics.shiftDays > 0
                  ? `${metrics.shiftDays}d Later`
                  : 'Stable Onset'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs mt-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">2000–2010 Mean Onset:</span>
                <span className="font-mono text-slate-200">
                  Week {metrics.earlyDecadeOnsetWeek}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">2016–2026 Mean Onset:</span>
                <span className="font-mono font-bold text-amber-solar">
                  Week {metrics.recentDecadeOnsetWeek}
                </span>
              </div>
            </div>

            {/* Quick-jump badges to historical extreme fire years */}
            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1.5">
                Inspect Verified Extreme Fire Years (Peak W{aoi.peakWeekCenter}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {aoi.anomalyYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => onSelectAnomalyYearWeek(yr, aoi.peakWeekCenter)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-all ${
                      selectedRecord.year === yr
                        ? 'bg-amber-fire text-space-950 border-amber-solar'
                        : 'bg-space-800 hover:bg-space-700 text-amber-solar border-white/10'
                    }`}
                  >
                    <Flame className="w-2.5 h-2.5 inline mr-0.5" />
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 mt-3 pt-2 border-t border-white/10">
            Pre-monsoon/dry-season readiness window moved{' '}
            <strong>{Math.abs(metrics.shiftDays)} days {metrics.shiftDirection}</strong> over 25 years.
          </p>
        </div>
      </div>
    </div>
  );
};
