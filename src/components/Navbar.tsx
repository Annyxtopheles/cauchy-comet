import React from 'react';
import {
  ShieldCheck,
  Download,
  Users,
} from 'lucide-react';
import { AOI } from '../types/fire';
import { PRESET_AOIS } from '../data/aois';

interface NavbarProps {
  selectedAoi: AOI;
  onSelectAoi: (aoi: AOI) => void;
  onOpenValidation: () => void;
  onOpenExport: () => void;
  onOpenTeam: () => void;
  liveCount: number;
  isLoadingLive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedAoi,
  onSelectAoi,
  onOpenValidation,
  onOpenExport,
  onOpenTeam,
  liveCount,
  isLoadingLive,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#060D1E]/95 backdrop-blur-md border-b border-white/[0.07]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Clean Brand Wordmark */}
        <div className="flex items-center gap-3">
          <img
            src="/brand/logo-icon.svg"
            alt="Cauchy's Comet"
            className="w-7 h-7 object-contain opacity-90"
          />
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold tracking-wider text-sm text-white">
              CAUCHY&apos;S COMET
            </span>
            <span className="hidden sm:inline text-[10px] tracking-widest text-slate-400 font-mono uppercase">
              NASA Space Apps 2026 · Chattogram
            </span>
          </div>
        </div>

        {/* Center: Understated Segmented Region Selector */}
        <div className="flex items-center gap-1 bg-[#09142B] p-1 rounded-xl border border-white/[0.06] overflow-x-auto max-w-[620px]">
          {PRESET_AOIS.map((aoi) => {
            const active = selectedAoi.id === aoi.id;
            return (
              <button
                key={aoi.id}
                type="button"
                onClick={() => onSelectAoi(aoi)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#16274D] text-amber-300 font-semibold shadow-sm border border-amber-400/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                {aoi.isFeaturedLocal && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? 'bg-amber-400 shadow-[0_0_6px_#F59E0B]' : 'bg-slate-500'
                    }`}
                  />
                )}
                {aoi.shortName}
              </button>
            );
          })}
        </div>

        {/* Right: Understated Actions */}
        <div className="flex items-center gap-2">
          {/* Live telemetry indicator (quiet) */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#09142B] border border-white/[0.06] text-[11px] text-slate-400 font-mono"
            title="NASA FIRMS Near Real-Time Active Fire Connection"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLoadingLive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span>FIRMS NRT</span>
            <span className="text-slate-300 font-semibold">({liveCount})</span>
          </div>

          <button
            type="button"
            onClick={onOpenValidation}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#09142B] hover:bg-[#112040] text-slate-300 hover:text-white border border-white/[0.06] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Validation</span>
          </button>

          <button
            type="button"
            onClick={onOpenTeam}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#09142B] hover:bg-[#112040] text-slate-300 hover:text-white border border-white/[0.06] transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Team</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-[#060D1E] shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
