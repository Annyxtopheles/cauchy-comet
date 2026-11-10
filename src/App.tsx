import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Flame,
  MapPin,
  Sparkles,
  Users,
  X,
  CheckCircle2,
  ShieldCheck,
  Download,
} from 'lucide-react';
import {
  AOI,
  ColorRamp,
  DataViewMode,
  LiveHotspot,
  WeeklyFireRecord,
} from './types/fire';
import { PRESET_AOIS } from './data/aois';
import { buildHarmonizedDataset } from './services/harmonization';
import { fetchLiveFirmsHotspots } from './services/firmsApi';
import { Navbar } from './components/Navbar';
import { MapViewer } from './components/MapViewer';
import { BurningCalendar } from './components/BurningCalendar';
import { CriticalPeriods } from './components/CriticalPeriods';
import { SensorComparison } from './components/SensorComparison';
import { ScientificHonesty } from './components/ScientificHonesty';
import { ExportModal } from './components/ExportModal';

const TEAM_MEMBERS = [
  { name: 'Naser-Al-Noman', handle: '@nasernoman277', role: 'Team Lead & Earth Observation Architecture' },
  { name: 'Zaid Rehman', handle: '@zaidrehmann', role: 'Design, Visual Storytelling & Harmonization UX' },
  { name: 'Sadman Zaman Khan', handle: '@sadmanzamankhan', role: 'Sensor Calibration & Data Systems' },
  { name: 'Muhammad Junayed', handle: '@junayedoo7', role: 'Geospatial Analytics & FIRMS Integration' },
  { name: 'Israt Jahan Lamia', handle: '@israt11', role: 'Environmental Science & Fire Regime Research' },
  { name: 'Md. Meheraj Hossain', handle: '@mhmahir7', role: 'Statistical Verification & Web Engineering' },
];

export function App() {
  const [selectedAoi, setSelectedAoi] = useState<AOI>(PRESET_AOIS[0]);
  const [viewMode, setViewMode] = useState<DataViewMode>('harmonized');
  const [colorRamp, setColorRamp] = useState<ColorRamp>('fire-amber');

  const dataset = useMemo(() => buildHarmonizedDataset(selectedAoi), [selectedAoi]);

  const [selectedRecord, setSelectedRecord] = useState<WeeklyFireRecord>(
    dataset.metrics.currentWeekRecord
  );

  // Sync selectedRecord when AOI changes
  useEffect(() => {
    setSelectedRecord(dataset.metrics.currentWeekRecord);
  }, [dataset]);

  // Live NASA FIRMS Hotspots state
  const [liveHotspots, setLiveHotspots] = useState<LiveHotspot[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [liveSourceLabel, setLiveSourceLabel] = useState<string>(
    'NASA FIRMS API Ready'
  );

  // Modal states
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);

  const teamDialogRef = useRef<HTMLDialogElement | null>(null);
  const teamTitleId = useId();

  useEffect(() => {
    const dialog = teamDialogRef.current;
    if (!dialog) return;
    if (isTeamOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isTeamOpen && dialog.open) {
      dialog.close();
    }
  }, [isTeamOpen]);

  // Mandatory light-dismiss fallback for Team dialog
  useEffect(() => {
    const dialog = teamDialogRef.current;
    if (!dialog) return;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener('click', handleBackdropClick);
      return () => dialog.removeEventListener('click', handleBackdropClick);
    }
  }, []);

  const syncLiveFirms = useCallback(async (targetAoi: AOI) => {
    setIsLoadingLive(true);
    const res = await fetchLiveFirmsHotspots(targetAoi);
    setLiveHotspots(res.hotspots);
    setLiveSourceLabel(res.sourceLabel);
    setIsLoadingLive(false);
  }, []);

  useEffect(() => {
    syncLiveFirms(selectedAoi);
  }, [selectedAoi, syncLiveFirms]);

  const handleSelectYear = (year: number) => {
    const match = dataset.records.find(
      (r) => r.year === year && r.week === selectedRecord.week
    );
    if (match) setSelectedRecord(match);
  };

  const handleSelectAnomalyYearWeek = (year: number, week: number) => {
    const match = dataset.records.find((r) => r.year === year && r.week === week);
    if (match) setSelectedRecord(match);
  };

  return (
    <div className="min-h-screen bg-space-950 text-white flex flex-col">
      {/* Top Navigation */}
      <Navbar
        selectedAoi={selectedAoi}
        onSelectAoi={setSelectedAoi}
        onOpenValidation={() => setIsValidationOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTeam={() => setIsTeamOpen(true)}
        liveCount={liveHotspots.length}
        isLoadingLive={isLoadingLive}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Top 3-Step Harmonization Explainer Banner (Scene 6 of Video) */}
        <section className="bg-gradient-to-r from-space-900 via-space-800/90 to-space-900 border border-white/10 rounded-2xl p-4 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-4 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-solar">
                <Sparkles className="w-3.5 h-3.5 text-amber-fire" />
                Why Harmonization Matters
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                25+ Years of Satellite Fire Records, One Comparable Calendar
              </h1>
              <p className="text-xs text-slate-300">
                In 2012, sharper 375 m VIIRS sensors joined 1 km MODIS—causing raw fire counts to jump artificially. Cauchy&apos;s Comet aligns both instruments so a year is only called unusual when the fire is unusual, not the satellite.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-space-950/75 border border-white/10 rounded-xl p-3">
                <div className="font-mono text-[10px] font-bold text-amber-solar uppercase">
                  Step 01 · Spatio-Temporal Grid
                </div>
                <div className="font-bold text-white mt-0.5">
                  Weekly Common-Grid Binning
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Snap scattered MODIS (1 km) &amp; VIIRS (375 m) thermal detections onto a unified 52-week regional grid.
                </p>
              </div>

              <div className="bg-space-950/75 border border-amber-fire/30 rounded-xl p-3">
                <div className="font-mono text-[10px] font-bold text-amber-solar uppercase">
                  Step 02 · Overlap Calibration
                </div>
                <div className="font-bold text-white mt-0.5">
                  2012–2024 Co-Flight Scaling
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Calibrate MODIS to VIIRS-equivalent (<span className="font-mono text-amber-solar">N_eq = {selectedAoi.calibrationAlpha}·N^{selectedAoi.calibrationBeta}</span>) using 13 years of simultaneous 13:30 overpasses.
                </p>
              </div>

              <div className="bg-space-950/75 border border-emerald-500/30 rounded-xl p-3">
                <div className="font-mono text-[10px] font-bold text-emerald-300 uppercase">
                  Step 03 · Actionable Calendar
                </div>
                <div className="font-bold text-white mt-0.5">
                  Anomaly &amp; Seasonality Alerts
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Identify normal burning windows, flag unusual weeks via SFAI, and validate against NASA MCD64A1 Burned Area.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Responder Decision Intelligence Cards (Scene 7: Three Questions) */}
        <CriticalPeriods
          dataset={dataset}
          selectedRecord={selectedRecord}
          onSelectAnomalyYearWeek={handleSelectAnomalyYearWeek}
        />

        {/* Primary Split Workspace: Left AOI Map + Right 27-Year Burning Calendar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left Column (5 cols): Interactive Map & Sensor Comparison Chart */}
          <div className="xl:col-span-5 space-y-5">
            <MapViewer
              aoi={selectedAoi}
              selectedWeekRecord={selectedRecord}
              liveHotspots={liveHotspots}
              isLoadingLive={isLoadingLive}
              liveSourceLabel={liveSourceLabel}
              onSelectCustomAoi={setSelectedAoi}
              onRefreshLive={() => syncLiveFirms(selectedAoi)}
            />

            <SensorComparison
              dataset={dataset}
              selectedRecord={selectedRecord}
              onSelectYear={handleSelectYear}
            />
          </div>

          {/* Right Column (7 cols): The 27-Year Burning Activity Calendar Heatmap */}
          <div className="xl:col-span-7 space-y-5">
            <BurningCalendar
              dataset={dataset}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              colorRamp={colorRamp}
              onChangeColorRamp={setColorRamp}
              selectedRecord={selectedRecord}
              onSelectRecord={setSelectedRecord}
            />

            {/* Inline Honesty & Validation Summary Card (Scene 8) */}
            <div className="bg-space-900/85 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3 max-w-2xl">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Scientific Honesty &amp; Ground-Truth Verification</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-300">
                      MCD64A1 r = {dataset.metrics.mcd64a1Correlation}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Checked across the 2012 sensor transition years, cross-verified with NASA&apos;s independent burned-area product, with cloud cover, thick canopy smoke, and diurnal overpass limits stated openly.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsValidationOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-space-800 hover:bg-space-700 text-white border border-white/15 transition-colors"
                >
                  Inspect Full Validation
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-fire hover:bg-amber-glow text-space-950 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/10 bg-space-950/90 py-4 px-4 sm:px-6 text-xs text-slate-300">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-fire" />
            <span className="font-bold text-white">Team Cauchy&apos;s Comet</span>
            <span>· 2026 NASA International Space Apps Challenge (Chattogram, Bangladesh)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Challenge: Harmonization of MODIS &amp; VIIRS Hot Spots</span>
            <button
              type="button"
              onClick={() => setIsTeamOpen(true)}
              className="text-amber-solar hover:underline font-semibold"
            >
              View Team Roster (6 Members)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ScientificHonesty
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        dataset={dataset}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        dataset={dataset}
        liveHotspots={liveHotspots}
      />

      {/* Team Cauchy's Comet Modal (Scene 2 of Video) */}
      <dialog
        ref={teamDialogRef}
        {...({ closedby: 'any' } as any)}
        aria-labelledby={teamTitleId}
        onClose={() => setIsTeamOpen(false)}
        className="w-full max-w-2xl rounded-2xl bg-space-900 text-white border border-white/15 shadow-2xl p-0 overflow-hidden"
      >
        <div className="p-5 bg-space-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-fire/20 border border-amber-fire/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-solar" />
            </div>
            <div>
              <h2 id={teamTitleId} className="text-base font-extrabold text-white">
                Team Cauchy&apos;s Comet — Chattogram, Bangladesh
              </h2>
              <p className="text-xs text-slate-300">
                2026 NASA Space Apps Challenge · Harmonization of MODIS and VIIRS Hot Spots
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => teamDialogRef.current?.close()}
            aria-label="Close team modal"
            className="p-1.5 rounded-lg bg-space-800 hover:bg-space-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-200 leading-relaxed">
            &ldquo;We are a team of builders who believe that Earth observation data should be directly usable by the emergency responders, scientists, and land managers who protect land and lives.&rdquo;
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.handle}
                className="bg-space-950/85 border border-white/10 rounded-xl p-3 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-fire/15 border border-amber-fire/35 flex items-center justify-center text-amber-solar font-bold shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{member.name}</div>
                  <div className="text-[11px] font-mono text-amber-solar">{member.handle} · Bangladesh</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{member.role}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-space-950/90 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-fire" />
              Local Event: Chattogram, Bangladesh
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Prescreening Video &amp; Harmonized Web Application Aligned
            </span>
          </div>
        </div>

        <div className="p-4 bg-space-950 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={() => teamDialogRef.current?.close()}
            className="px-4 py-1.5 rounded-lg bg-amber-fire hover:bg-amber-glow text-space-950 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}

export default App;
