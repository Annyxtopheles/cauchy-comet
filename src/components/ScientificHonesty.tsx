import React, { useEffect, useId, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CloudOff,
  FileCheck2,
  Satellite,
  ShieldCheck,
  X,
} from 'lucide-react';
import { HarmonizedDataset } from '../types/fire';

interface ScientificHonestyProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: HarmonizedDataset;
}

export const ScientificHonesty: React.FC<ScientificHonestyProps> = ({
  isOpen,
  onClose,
  dataset,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

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

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      onClose={onClose}
      className="w-full max-w-3xl rounded-2xl bg-space-900 text-white border border-white/15 shadow-2xl p-0 overflow-hidden"
    >
      {/* Modal Header */}
      <div className="p-5 bg-space-950 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 id={titleId} className="text-base font-extrabold text-white">
              Scientific Validation, Ground-Truthing &amp; Sensor Limitations
            </h2>
            <p className="text-xs text-slate-300">
              Cauchy&apos;s Comet Methodological Transparency Checklist (Scene 8)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close validation modal"
          className="p-1.5 rounded-lg bg-space-800 hover:bg-space-700 text-slate-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs leading-relaxed">
        {/* 3 Verification Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-space-950/80 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>1. Overlap Transition Check</span>
            </div>
            <p className="text-slate-300">
              Calibrated across <strong>13 concurrent overlap years (2012–2024)</strong> where Aqua-MODIS and S-NPP VIIRS shared the ~13:30 local equatorial crossing time.
            </p>
            <div className="pt-1 font-mono text-[11px] text-amber-solar">
              Fit R² = {dataset.metrics.overlapRSquared.toFixed(2)} | α={dataset.aoi.calibrationAlpha}, β={dataset.aoi.calibrationBeta}
            </div>
          </div>

          <div className="bg-space-950/80 border border-sky-500/30 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-sky-400">
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span>2. Burned-Area Ground Truth</span>
            </div>
            <p className="text-slate-300">
              Validated against NASA&apos;s independent <strong>MCD64A1 Burned Area</strong> reflectance product, which measures post-fire char scar area rather than instantaneous thermal pulses.
            </p>
            <div className="pt-1 font-mono text-[11px] text-sky-300">
              Correlation r = {dataset.metrics.mcd64a1Correlation.toFixed(2)} (p &lt; 0.001)
            </div>
          </div>

          <div className="bg-space-950/80 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-solar">
              <Satellite className="w-4 h-4 shrink-0" />
              <span>3. Discontinuity Removal</span>
            </div>
            <p className="text-slate-300">
              Raw unharmonized counts jumped <strong>+{dataset.metrics.rawArtificialJumpPct}%</strong> in 2012. Harmonization isolates the true multi-decadal ecological shift of{' '}
              <strong>{dataset.metrics.harmonizedRealChangePct >= 0 ? `+${dataset.metrics.harmonizedRealChangePct}%` : `${dataset.metrics.harmonizedRealChangePct}%`}</strong>.
            </p>
          </div>
        </div>

        {/* Mathematical Formulation */}
        <div className="bg-space-950/90 border border-white/10 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-solar">
            Harmonization Transfer Function &amp; Anomaly Indexing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px] bg-space-900 p-3 rounded-lg border border-white/10">
            <div>
              <div className="text-slate-300 mb-1">// Step 1: Power-Law Sensor Calibration</div>
              <div className="text-amber-solar font-bold">
                N_VIIRS_eq(t) = α · (N_MODIS(t))^β
              </div>
              <div className="text-slate-300 mt-1">
                Accounts for sub-linear clustering of multiple 375m VIIRS active fire pixels inside a single 1km MODIS thermal footprint.
              </div>
            </div>
            <div>
              <div className="text-slate-300 mb-1">// Step 2: Standardized Fire Anomaly Index</div>
              <div className="text-emerald-300 font-bold">
                SFAI(y, w) = (N_harm(y, w) - Median(w)) / IQR(w)
              </div>
              <div className="text-slate-300 mt-1">
                Non-parametric interquartile standardization resilient to extreme megafire outliers.
              </div>
            </div>
          </div>
        </div>

        {/* Openly Stated Sensor & Physical Limits */}
        <div className="bg-space-950/90 border border-rose-500/30 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-rose-300 text-xs uppercase tracking-wider">
            <CloudOff className="w-4 h-4 text-rose-400" />
            <span>Stated Operational Limitations (Communicated to Responders)</span>
          </div>
          <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
            <li>
              <strong>Cloud &amp; Heavy Monsoon Obscuration:</strong> Thermal infrared (MIR/TIR) sensors cannot penetrate optically thick convective clouds; pre-monsoon cloud cover in South Asia can under-count short-lived agricultural burns.
            </li>
            <li>
              <strong>Thick Smoke Plumes &amp; Canopy Attenuation:</strong> Low-intensity surface/understory fires beneath closed tropical canopies (such as dense Chattogram hill forest) may not reach detection threshold until canopy breach.
            </li>
            <li>
              <strong>Diurnal Overpass Sampling Windows:</strong> Sun-synchronous polar orbiters sample ~10:30 (Terra) and ~13:30 (Aqua, S-NPP, NOAA-20/21). Fast-burning flash agricultural fires ignited and extinguished between overpasses may go undetected.
            </li>
            <li>
              <strong>Static Industrial Thermal Sources:</strong> Gas flares, brick kilns, and steel plants emit persistent TIR anomalies; regional interpretation should account for stationary industrial heat sources.
            </li>
          </ul>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-space-950 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-slate-300 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-solar" />
          Data Sources: NASA Earthdata FIRMS (MODIS C6.1, VIIRS S-NPP/NOAA-20) &amp; MCD64A1
        </span>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="px-4 py-1.5 rounded-lg bg-amber-fire hover:bg-amber-glow text-space-950 font-bold"
        >
          Close Inspector
        </button>
      </div>
    </dialog>
  );
};
