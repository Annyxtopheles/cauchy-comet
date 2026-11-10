import React from 'react';
import {
  Flame,
  ShieldCheck,
  Download,
  Satellite,
  Users,
  Sparkles,
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
    <header className="sticky top-0 z-30 bg-space-950/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Team Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-fire to-amber-crimson flex items-center justify-center shadow-lg shadow-amber-fire/25 border border-amber-solar/30">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                CAUCHY&apos;S COMET
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-amber-fire/15 text-amber-solar border border-amber-fire/30">
                <Sparkles className="w-3 h-3" /> NASA Space Apps 2026
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Harmonized MODIS (1 km) &amp; VIIRS (375 m) Burning Activity Calendar · Chattogram
            </p>
          </div>
        </div>

        {/* Center: Quick Region Switcher */}
        <div className="flex items-center gap-1.5 bg-space-900/90 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          {PRESET_AOIS.map((aoi) => {
            const active = selectedAoi.id === aoi.id;
            return (
              <button
                key={aoi.id}
                type="button"
                onClick={() => onSelectAoi(aoi)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-amber-fire text-space-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {aoi.isFeaturedLocal && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? 'bg-space-950' : 'bg-amber-fire'
                    }`}
                    title="Bangladesh Local Showcase"
                  />
                )}
                {aoi.shortName}
              </button>
            );
          })}
        </div>

        {/* Right: Actions & Live Telemetry Status */}
        <div className="flex items-center gap-2">
          <div
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-space-900 border border-white/10 text-xs text-slate-300"
            title="Live NASA FIRMS Satellite Feed Status"
          >
            <Satellite
              className={`w-3.5 h-3.5 text-amber-fire ${
                isLoadingLive ? 'animate-spin' : ''
              }`}
            />
            <span>FIRMS NRT:</span>
            <span className="font-mono font-semibold text-amber-solar">
              {isLoadingLive ? 'Syncing...' : `${liveCount} pts`}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenValidation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-space-800 hover:bg-space-700 text-slate-100 border border-white/15 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Validation &amp; Limits</span>
          </button>

          <button
            type="button"
            onClick={onOpenTeam}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-space-800 hover:bg-space-700 text-slate-100 border border-white/15 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-amber-solar" />
            <span className="hidden md:inline">Team</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-fire hover:bg-amber-glow text-space-950 shadow-md shadow-amber-fire/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV / GeoJSON</span>
          </button>
        </div>
      </div>
    </header>
  );
};
