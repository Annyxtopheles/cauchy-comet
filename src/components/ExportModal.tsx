import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Check,
  Download,
  FileSpreadsheet,
  FileJson,
  X,
} from 'lucide-react';
import { HarmonizedDataset, LiveHotspot } from '../types/fire';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: HarmonizedDataset;
  liveHotspots: LiveHotspot[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  dataset,
  liveHotspots,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2026);
  const [downloadedMessage, setDownloadedMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
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

  const triggerFileDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedMessage(`Saved ${filename}`);
    setTimeout(() => setDownloadedMessage(null), 3500);
  };

  const handleDownloadWeeklyCsv = () => {
    const filtered = dataset.records.filter(
      (r) => r.year >= startYear && r.year <= endYear
    );
    const header = [
      'aoi_id',
      'aoi_name',
      'year',
      'week',
      'iso_date_start',
      'date_range_label',
      'modis_raw_1km',
      'viirs_raw_375m',
      'unharmonized_raw_combined',
      'cauchy_harmonized_viirs_eq',
      'weekly_historical_median',
      'weekly_historical_iqr',
      'sfai_anomaly_score',
      'percentile_rank',
      'anomaly_status',
      'total_frp_mw',
      'mcd64a1_burned_area_ha',
      'sensor_origin',
    ].join(',');

    const rows = filtered.map((r) =>
      [
        dataset.aoi.id,
        `"${dataset.aoi.name}"`,
        r.year,
        r.week,
        r.isoDateStart,
        `"${r.dateRangeLabel}"`,
        r.modisRaw,
        r.viirsRaw ?? '',
        r.rawCombined,
        r.harmonizedCount,
        r.weeklyHistoricalMedian,
        r.weeklyHistoricalIqr,
        r.sfai,
        r.percentile,
        r.anomalyStatus,
        r.totalFrpMw,
        r.burnedAreaHa,
        `"${r.sensorOrigin}"`,
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');
    triggerFileDownload(
      csv,
      `cauchy_comet_${dataset.aoi.id}_harmonized_${startYear}_${endYear}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleDownloadGeoJson = () => {
    const [west, south, east, north] = dataset.aoi.bbox;
    const features: unknown[] = [
      {
        type: 'Feature',
        properties: {
          feature_type: 'AOI_Bounding_Box',
          id: dataset.aoi.id,
          name: dataset.aoi.name,
          region: dataset.aoi.region,
          ecosystem: dataset.aoi.ecosystem,
          calibration_alpha: dataset.aoi.calibrationAlpha,
          calibration_beta: dataset.aoi.calibrationBeta,
          season_onset_week: dataset.metrics.onsetWeek,
          peak_window: dataset.metrics.peakPeriodLabel,
          mcd64a1_correlation: dataset.metrics.mcd64a1Correlation,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      },
      ...liveHotspots.map((pt) => ({
        type: 'Feature',
        properties: {
          feature_type: 'Active_Fire_Hotspot',
          instrument: pt.instrument,
          satellite: pt.satellite,
          acq_date: pt.acq_date,
          acq_time: pt.acq_time,
          frp_mw: pt.frp,
          brightness_k: pt.brightness,
          harmonized_weight: pt.harmonizedEquivalentWeight,
        },
        geometry: {
          type: 'Point',
          coordinates: [pt.longitude, pt.latitude],
        },
      })),
    ];

    const geojson = JSON.stringify(
      {
        type: 'FeatureCollection',
        metadata: {
          generator: "Cauchy's Comet — NASA Space Apps Challenge 2026",
          aoi: dataset.aoi.name,
          exported_at: new Date().toISOString(),
        },
        features,
      },
      null,
      2
    );

    triggerFileDownload(
      geojson,
      `cauchy_comet_${dataset.aoi.id}_aoi_hotspots.geojson`,
      'application/geo+json;charset=utf-8;'
    );
  };

  const filteredRecordCount = dataset.records.filter(
    (r) => r.year >= startYear && r.year <= endYear
  ).length;

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      onClose={onClose}
      className="w-full max-w-lg rounded-2xl bg-[#081226] text-slate-100 border border-white/[0.08] shadow-2xl p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 px-5 bg-[#060D1E] border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h2 id={titleId} className="text-sm font-semibold tracking-wide text-white">
            Export Harmonized Data &amp; Analytics
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {dataset.aoi.name} · 2000–2026 series
          </p>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close dialog"
          className="p-1 rounded-md bg-[#0D182E] text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 text-xs">
        {/* Date Range Selector */}
        <div className="bg-[#060D1E] border border-white/[0.05] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">
              Temporal Window
            </span>
            <span className="font-mono text-amber-300">
              {filteredRecordCount.toLocaleString()} weekly observations
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">
                From Year
              </label>
              <select
                aria-label="Start year"
                value={startYear}
                onChange={(e) => setStartYear(Math.min(endYear, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0C172E] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-amber-400/40"
              >
                {Array.from({ length: 27 }, (_, i) => 2000 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">
                To Year
              </label>
              <select
                aria-label="End year"
                value={endYear}
                onChange={(e) => setEndYear(Math.max(startYear, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0C172E] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-amber-400/40"
              >
                {Array.from({ length: 27 }, (_, i) => 2000 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Clean Export Cards (No loud neon orange) */}
        <div className="space-y-2">
          {/* Primary CSV Export */}
          <button
            type="button"
            onClick={handleDownloadWeeklyCsv}
            className="w-full p-3 rounded-xl bg-[#0C172E] hover:bg-[#122142] border border-amber-400/25 hover:border-amber-400/50 text-left transition-all group flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors flex items-center gap-1.5">
                  <span>Weekly Burning Calendar</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300">
                    .CSV
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Raw MODIS &amp; VIIRS counts, Cauchy harmonized series, SFAI anomalies &amp; FRP ({startYear}–{endYear})
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-300 shrink-0 ml-2 transition-colors" />
          </button>

          {/* GeoJSON Export */}
          <button
            type="button"
            onClick={handleDownloadGeoJson}
            className="w-full p-3 rounded-xl bg-[#0C172E] hover:bg-[#122142] border border-white/[0.07] hover:border-white/[0.15] text-left transition-all group flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileJson className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-sky-200 transition-colors flex items-center gap-1.5">
                  <span>AOI Geometry &amp; Active Hotspots</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-sky-400/15 text-sky-300">
                    .GeoJSON
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  GIS-compatible polygon bounding box and live NRT satellite hotspot coordinates
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-300 shrink-0 ml-2 transition-colors" />
          </button>
        </div>

        {downloadedMessage && (
          <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium text-xs flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{downloadedMessage}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 px-5 bg-[#060D1E] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
        <span>Ready for QGIS, Python, or spreadsheet analysis</span>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="px-3 py-1 rounded-md bg-[#102040] hover:bg-[#162B54] text-white font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </dialog>
  );
};
