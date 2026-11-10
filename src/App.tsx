import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  HardHat,
  MapPin,
  Microscope,
  Trees,
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
    <div className="min-h-screen text-slate-100 flex flex-col">
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Sleek Context Sub-Header */}
        <section className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {selectedAoi.name}
            </h1>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">{selectedAoi.ecosystem}</span>
          </div>

          <p className="text-xs text-slate-400">
            Harmonized 2000–2026 MODIS &amp; VIIRS fire records into a continuous burning activity calendar.
          </p>
        </section>

        {/* 2-Column Split Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Left Column (5 cols): Map & Sensor Calibration */}
          <div className="xl:col-span-5 space-y-4">
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

          {/* Right Column (7 cols): The 27-Year Calendar & Critical Periods */}
          <div className="xl:col-span-7 space-y-4">
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

        {/* Real-World Responder Decision Context (Quiet) */}
        <section className="bg-[#081226] border border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Decision Context for {selectedAoi.shortName}
              </h2>
              <p className="text-[11px] text-slate-400">
                One comparable 27-year baseline without sensor distortion
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsValidationOpen(true)}
              className="text-xs text-amber-300 hover:underline"
            >
              Methodology &amp; Verification →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#060D1E] rounded-xl p-3 space-y-1 border border-white/[0.04]">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <HardHat className="w-3.5 h-3.5 text-slate-400" />
                <span>Responders</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Season Onset: <strong className="text-slate-200">{dataset.metrics.onsetMonthLabel}</strong> · Week {selectedRecord.week}:{' '}
                <strong className="text-amber-300 uppercase">{selectedRecord.anomalyStatus}</strong>
              </p>
            </div>

            <div className="bg-[#060D1E] rounded-xl p-3 space-y-1 border border-white/[0.04]">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Microscope className="w-3.5 h-3.5 text-slate-400" />
                <span>Scientists</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Real Shift: <strong className="text-slate-200">{dataset.metrics.harmonizedRealChangePct >= 0 ? `+${dataset.metrics.harmonizedRealChangePct}%` : `${dataset.metrics.harmonizedRealChangePct}%`}</strong> (unharmonized was +{dataset.metrics.rawArtificialJumpPct}%)
              </p>
            </div>

            <div className="bg-[#060D1E] rounded-xl p-3 space-y-1 border border-white/[0.04]">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Trees className="w-3.5 h-3.5 text-slate-400" />
                <span>Land Managers</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Peak Window: <strong className="text-slate-200">{dataset.metrics.peakPeriodLabel}</strong>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="mt-6 border-t border-white/[0.06] bg-[#060D1E] py-3.5 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-[1560px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Cauchy&apos;s Comet</span>
            <span>· 2026 NASA International Space Apps Challenge (Chattogram, Bangladesh)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsTeamOpen(true)}
            className="text-amber-300 hover:underline"
          >
            Team Cauchy&apos;s Comet
          </button>
        </div>
      </footer>

      {/* Validation & Limits Modal */}
      <ScientificHonesty
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        dataset={dataset}
      />

      {/* Export CSV / GeoJSON Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        dataset={dataset}
        liveHotspots={liveHotspots}
      />

      {/* Team Roster Modal */}
      <dialog
        ref={teamDialogRef}
        {...({ closedby: 'any' } as any)}
        aria-labelledby={teamTitleId}
        onClose={() => setIsTeamOpen(false)}
        className="w-full max-w-2xl rounded-2xl bg-[#081226] text-white border border-white/10 shadow-2xl p-0 overflow-hidden"
      >
        <div className="p-4 bg-[#060D1E] border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/logo-icon.svg"
              alt="Cauchy's Comet"
              className="w-6 h-6 object-contain"
            />
            <h2 id={teamTitleId} className="text-sm font-bold tracking-wider text-white">
              TEAM CAUCHY&apos;S COMET · CHATTOGRAM
            </h2>
          </div>
          <button
            type="button"
            onClick={() => teamDialogRef.current?.close()}
            aria-label="Close team modal"
            className="p-1 rounded-md bg-[#0D182E] text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.handle}
                className="bg-[#060D1E] border border-white/[0.04] rounded-xl p-3 flex flex-col items-center text-center"
              >
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-18 h-18 object-contain mb-2 rounded-full"
                />
                <div className="font-semibold text-white text-[11px]">
                  {member.name}
                </div>
                <div className="text-[10px] font-mono text-amber-300 mt-0.5">
                  {member.handle}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{member.role}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#060D1E] border border-white/[0.04] rounded-lg p-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-amber-400" />
              Chattogram, Bangladesh
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Harmonization of MODIS &amp; VIIRS Hot Spots
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#060D1E] border-t border-white/[0.06] flex justify-end">
          <button
            type="button"
            onClick={() => teamDialogRef.current?.close()}
            className="px-3 py-1 rounded bg-[#102040] hover:bg-[#162B54] text-white font-medium text-xs"
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}

export default App;
