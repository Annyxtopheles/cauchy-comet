import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  HardHat,
  MapPin,
  Microscope,
  ShieldCheck,
  Trees,
  Users,
  X,
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
  {
    name: 'NASER AL NOMAN',
    handle: '@nasernoman277',
    avatar: '/team/naser.png',
    role: 'Team Lead & Earth Observation Architecture',
  },
  {
    name: 'ZAID REHMAN',
    handle: '@zaidrehmann',
    avatar: '/team/zaid.png',
    role: 'Design, Visual Storytelling & Harmonization UX',
  },
  {
    name: 'SADMAN ZAMAN KHAN',
    handle: '@sadmanzamankhan',
    avatar: '/team/sadman.png',
    role: 'Sensor Calibration & Data Systems',
  },
  {
    name: 'MUHAMMAD JUNAYED',
    handle: '@junayedoo7',
    avatar: '/team/junayed.png',
    role: 'Geospatial Analytics & FIRMS Integration',
  },
  {
    name: 'ISRAT JAHAN LAMIA',
    handle: '@israt11',
    avatar: '/team/israt.png',
    role: 'Environmental Science & Fire Regime Research',
  },
  {
    name: 'MD. MEHERAJ HOSSAIN',
    handle: '@mhmahir7',
    avatar: '/team/meheraj.png',
    role: 'Statistical Verification & Web Engineering',
  },
];

export function App() {
  const [selectedAoi, setSelectedAoi] = useState<AOI>(PRESET_AOIS[0]);
  const [viewMode, setViewMode] = useState<DataViewMode>('harmonized');
  const [colorRamp, setColorRamp] = useState<ColorRamp>('fire-amber');

  const dataset = useMemo(() => buildHarmonizedDataset(selectedAoi), [selectedAoi]);

  const [selectedRecord, setSelectedRecord] = useState<WeeklyFireRecord>(
    dataset.metrics.currentWeekRecord
  );

  useEffect(() => {
    setSelectedRecord(dataset.metrics.currentWeekRecord);
  }, [dataset]);

  const [liveHotspots, setLiveHotspots] = useState<LiveHotspot[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [liveSourceLabel, setLiveSourceLabel] = useState<string>(
    'NASA FIRMS Verified'
  );

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

  const handleSelectWeekNumber = (week: number) => {
    const match = dataset.records.find(
      (r) => r.year === selectedRecord.year && r.week === week
    );
    if (match) setSelectedRecord(match);
  };

  const handleSelectAnomalyYearWeek = (year: number, week: number) => {
    const match = dataset.records.find((r) => r.year === year && r.week === week);
    if (match) setSelectedRecord(match);
  };

  return (
    <div className="min-h-screen text-white flex flex-col">
      {/* Top Cosmic Navigation Bar */}
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
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Hero Subtitle Banner (Matches "Build a web app that brings MODIS and VIIRS fire detections together into a burning activity calendar.") */}
        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-400">
              THE CHALLENGE · HARMONIZED EARTH OBSERVATION
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-1">
              Bring <span className="text-amber-400">MODIS</span> and{' '}
              <span className="text-amber-400">VIIRS</span> fire detections together into a{' '}
              <span className="text-amber-400">burning activity calendar.</span>
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Explore past fire patterns, unusual conditions, and critical periods in any area—calibrated across the 2012–2024 overlap so sensor jumps disappear.
          </p>
        </section>

        {/* PRIMARY SPLIT WORKSPACE (Exact Visual Layout from Video Screenshot 3 & 5) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (6 cols): #0B1B3A Topographic Map + Common Grid + Dual Stacked Line Charts */}
          <div className="xl:col-span-6 space-y-6">
            <MapViewer
              aoi={selectedAoi}
              selectedWeekRecord={selectedRecord}
              liveHotspots={liveHotspots}
              isLoadingLive={isLoadingLive}
              liveSourceLabel={liveSourceLabel}
              onSelectCustomAoi={setSelectedAoi}
              onSelectWeekNumber={handleSelectWeekNumber}
              onRefreshLive={() => syncLiveFirms(selectedAoi)}
            />

            <SensorComparison
              dataset={dataset}
              selectedRecord={selectedRecord}
              onSelectYear={handleSelectYear}
            />
          </div>

          {/* RIGHT COLUMN (6 cols): Tactile Calendar Heatmap + Golden Matrix + CRITICAL PERIODS Card (Exact Screenshot 3 Right Stack) */}
          <div className="xl:col-span-6 space-y-6">
            <BurningCalendar
              dataset={dataset}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              colorRamp={colorRamp}
              onChangeColorRamp={setColorRamp}
              selectedRecord={selectedRecord}
              onSelectRecord={setSelectedRecord}
            />

            <CriticalPeriods
              dataset={dataset}
              selectedRecord={selectedRecord}
              onSelectAnomalyYearWeek={handleSelectAnomalyYearWeek}
            />
          </div>
        </div>

        {/* SCENE 4 REPLICA: "This matters to real people." (Responders, Scientists, Land Managers Cards) */}
        <section className="bg-[#09152E]/90 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                This matters to real people.
              </h2>
              <p className="text-xs text-slate-300">
                One comparable 27-year record that responders, scientists, and land managers can trust for {selectedAoi.name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsValidationOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#102246] hover:bg-[#172F5E] text-white border border-white/15 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Check Transition &amp; MCD64A1 Validation</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-space-950 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Harmonized CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Responders */}
            <div className="bg-[#0B1C3D]/80 border border-sky-400/20 rounded-2xl p-5 flex flex-col items-center text-center space-y-2.5">
              <HardHat className="w-9 h-9 text-white stroke-[1.6]" />
              <div className="w-8 h-8 rounded-lg border border-white/60 flex items-center justify-center font-bold text-amber-400 text-sm">
                ?
              </div>
              <h3 className="text-base font-bold text-white">Responders</h3>
              <p className="text-xs text-sky-300 font-medium">
                When does fire season really start, and is this week unusual?
              </p>
              <div className="w-full pt-2 border-t border-white/10 text-xs text-slate-200 font-mono">
                Onset: <strong>{dataset.metrics.onsetMonthLabel}</strong> · Current W{selectedRecord.week}:{' '}
                <strong className="text-amber-300 uppercase">{selectedRecord.anomalyStatus}</strong>
              </div>
            </div>

            {/* Card 2: Scientists */}
            <div className="bg-[#0B1C3D]/80 border border-sky-400/20 rounded-2xl p-5 flex flex-col items-center text-center space-y-2.5">
              <Microscope className="w-9 h-9 text-white stroke-[1.6]" />
              <div className="w-8 h-8 rounded-lg border border-white/60 flex items-center justify-center font-bold text-amber-400 text-sm">
                ?
              </div>
              <h3 className="text-base font-bold text-white">Scientists</h3>
              <p className="text-xs text-sky-300 font-medium">
                How is the fire regime changing over time without sensor bias?
              </p>
              <div className="w-full pt-2 border-t border-white/10 text-xs text-slate-200 font-mono">
                Real Trend:{' '}
                <strong className="text-amber-300">
                  {dataset.metrics.harmonizedRealChangePct >= 0
                    ? `+${dataset.metrics.harmonizedRealChangePct}%`
                    : `${dataset.metrics.harmonizedRealChangePct}%`}
                </strong>{' '}
                (Raw artifact was +{dataset.metrics.rawArtificialJumpPct}%)
              </div>
            </div>

            {/* Card 3: Land Managers */}
            <div className="bg-[#0B1C3D]/80 border border-sky-400/20 rounded-2xl p-5 flex flex-col items-center text-center space-y-2.5">
              <Trees className="w-9 h-9 text-white stroke-[1.6]" />
              <div className="w-8 h-8 rounded-lg border border-white/60 flex items-center justify-center font-bold text-amber-400 text-sm">
                ?
              </div>
              <h3 className="text-base font-bold text-white">Land managers</h3>
              <p className="text-xs text-sky-300 font-medium">
                Which critical weeks require pre-positioned crews and resources?
              </p>
              <div className="w-full pt-2 border-t border-white/10 text-xs text-slate-200 font-mono">
                Peak Readiness: <strong className="text-amber-300">{dataset.metrics.peakPeriodLabel}</strong>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/10 bg-[#060F22] py-4 px-4 sm:px-6 text-xs text-slate-300">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/logo-icon.svg"
              alt="Cauchy's Comet"
              className="w-4 h-4 object-contain"
            />
            <span className="font-bold text-white tracking-wider">CAUCHY&apos;S COMET</span>
            <span>· 2026 NASA International Space Apps Challenge (Chattogram, Bangladesh)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Harmonization of MODIS &amp; VIIRS Hot Spots</span>
            <button
              type="button"
              onClick={() => setIsTeamOpen(true)}
              className="text-amber-300 hover:underline font-semibold"
            >
              Meet Team Cauchy&apos;s Comet
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

      {/* Team Cauchy's Comet Modal with Official Comet-Ring Portraits from Video Scene 2 */}
      <dialog
        ref={teamDialogRef}
        {...({ closedby: 'any' } as any)}
        aria-labelledby={teamTitleId}
        onClose={() => setIsTeamOpen(false)}
        className="w-full max-w-3xl rounded-3xl bg-[#08152E] text-white border border-white/15 shadow-2xl p-0 overflow-hidden"
      >
        <div className="p-5 bg-[#060F22] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/brand/logo-icon.svg"
              alt="Cauchy's Comet"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h2 id={teamTitleId} className="text-base font-extrabold tracking-wider text-white">
                CAUCHY&apos;S COMET · BANGLADESH
              </h2>
              <p className="text-xs text-slate-300">
                2026 NASA Space Apps Challenge (Chattogram) · Harmonization of MODIS &amp; VIIRS Hot Spots
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

        <div className="p-6 space-y-5 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.handle}
                className="bg-[#0B1C3D]/75 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center"
              >
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-24 h-24 object-contain mb-2.5"
                />
                <div className="font-bold text-white text-xs tracking-wider">
                  {member.name}
                </div>
                <div className="text-[10px] font-mono text-amber-300 mt-0.5">
                  {member.handle}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">{member.role}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#060F22] border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Local Event: Chattogram, Bangladesh
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              We believe Earth data should be usable by the people who protect land and lives.
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#060F22] border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={() => teamDialogRef.current?.close()}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-space-950 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}

export default App;
