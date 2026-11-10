import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Check,
  Download,
  FileSpreadsheet,
  FileJson,
  Filter,
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

  // Mandatory light-dismiss fallback for browsers without native HTMLDialogElement.prototype.closedBy
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
    setDownloadedMessage(`Exported ${filename}`);
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
      className="w-full max-w-xl rounded-2xl bg-space-900 text-white border border-white/15 shadow-2xl p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 bg-space-950 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-fire/20 border border-amber-fire/40 flex items-center justify-center">
            <Download className="w-5 h-5 text-amber-solar" />
          </div>
          <div>
            <h2 id={titleId} className="text-base font-extrabold text-white">
              Download Harmonized Fire Calendar &amp; Analytics
            </h2>
            <p className="text-xs text-slate-300">
              Export ready-to-use CSV &amp; GeoJSON records for {dataset.aoi.name}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close export modal"
          className="p-1.5 rounded-lg bg-space-800 hover:bg-space-700 text-slate-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 text-xs">
        {/* Year Range Filter */}
        <div className="bg-space-950/80 border border-white/10 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-fire" />
              Select Date Range for CSV Export
            </span>
            <span className="font-mono text-amber-solar">
              {filteredRecordCount.toLocaleString()} weekly rows
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-300 mb-1">
                Start Year
              </label>
              <select
                value={startYear}
                onChange={(e) => setStartYear(Math.min(endYear, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-space-800 border border-white/15 text-white font-mono"
              >
                {Array.from({ length: 27 }, (_, i) => 2000 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-300 mb-1">
                End Year
              </label>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Math.max(startYear, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-space-800 border border-white/15 text-white font-mono"
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

        {/* Export Options */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleDownloadWeeklyCsv}
            className="w-full p-3.5 rounded-xl bg-amber-fire hover:bg-amber-glow text-space-950 font-bold flex items-center justify-between transition-all shadow-lg shadow-amber-fire/20"
          >
            <div className="flex items-center gap-3 text-left">
              <FileSpreadsheet className="w-5 h-5 shrink-0" />
              <div>
                <div className="text-sm font-extrabold">
                  Download Harmonized Weekly Calendar (.CSV)
                </div>
                <div className="text-[11px] font-medium opacity-85">
                  Includes raw MODIS, raw VIIRS, Cauchy harmonized counts, SFAI anomaly &amp; FRP ({startYear}–{endYear})
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleDownloadGeoJson}
            className="w-full p-3.5 rounded-xl bg-space-800 hover:bg-space-700 text-white border border-white/15 font-semibold flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3 text-left">
              <FileJson className="w-5 h-5 text-amber-solar shrink-0" />
              <div>
                <div className="text-sm font-bold">
                  Download AOI Polygon &amp; Active Hotspots (.GeoJSON)
                </div>
                <div className="text-[11px] text-slate-300">
                  GIS-ready polygon bounds, calibration parameters, and NRT satellite points
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-amber-solar shrink-0" />
          </button>
        </div>

        {downloadedMessage && (
          <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{downloadedMessage}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-space-950 border-t border-white/10 flex justify-end">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="px-4 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 text-slate-200 font-semibold text-xs"
        >
          Done
        </button>
      </div>
    </dialog>
  );
};
