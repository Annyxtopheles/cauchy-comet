import React from 'react';
import {
  ShieldCheck,
  Download,
  Satellite,
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
    <header className="sticky top-0 z-30 bg-[#071126]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Official Cauchy's Comet Logo & NASA Space Apps 2026 Header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/logo-icon.svg"
              alt="Cauchy's Comet Orbital Icon"
              className="w-8 h-8 object-contain"
            />
            <div>
              <img
                src="/brand/logo-horizontal.svg"
                alt="Cauchy's Comet"
                className="h-4 sm:h-4.5 object-contain"
              />
              <div className="flex items-center gap-2 mt-1 text-[10px] tracking-[0.22em] uppercase text-slate-300 font-semibold">
                <span>NASA SPACE APPS 2026</span>
                <span className="text-amber-400">·</span>
                <span className="text-amber-300">BANGLADESH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Curated AOI Switcher */}
        <div className="flex items-center gap-1 bg-[#0A1732] p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          {PRESET_AOIS.map((aoi) => {
            const active = selectedAoi.id === aoi.id;
            return (
              <button
                key={aoi.id}
                type="button"
                onClick={() => onSelectAoi(aoi)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-space-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {aoi.isFeaturedLocal && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? 'bg-space-950' : 'bg-amber-400'
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
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A1732] border border-white/10 text-xs text-slate-300"
            title="Live NASA FIRMS Satellite Feed Status (Map Key Verified)"
          >
            <Satellite
              className={`w-3.5 h-3.5 text-amber-400 ${
                isLoadingLive ? 'animate-spin' : ''
              }`}
            />
            <span>FIRMS Key Active:</span>
            <span className="font-mono font-semibold text-amber-300">
              {isLoadingLive ? 'Syncing...' : `${liveCount} NRT pts`}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenValidation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#102246] hover:bg-[#172F5E] text-slate-100 border border-white/15 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Validation &amp; Limits</span>
          </button>

          <button
            type="button"
            onClick={onOpenTeam}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#102246] hover:bg-[#172F5E] text-slate-100 border border-white/15 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Team</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-space-950 shadow-md shadow-amber-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
