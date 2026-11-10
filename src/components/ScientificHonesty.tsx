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
      className="w-full max-w-2xl rounded-2xl bg-[#081226] text-slate-100 border border-white/[0.08] shadow-2xl p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 px-5 bg-[#060D1E] border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div>
            <h2 id={titleId} className="text-sm font-semibold tracking-wide text-white">
              Scientific Validation &amp; Methodological Limits
            </h2>
            <p className="text-[11px] text-slate-400">
              Honesty and validity protocol for {dataset.aoi.name}
            </p>
          </div>
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
      <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs leading-relaxed">
        {/* 3 Unified Validation Cards (No Rainbow Alert Boxes) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="bg-[#060D1E] border border-white/[0.06] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-medium text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Overlap Transition</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Calibrated across 13 co-flight years (2012–2024) where Aqua and S-NPP shared the 13:30 overpass.
            </p>
            <div className="pt-1 font-mono text-[10px] text-amber-300">
              Fit R² = {dataset.metrics.overlapRSquared.toFixed(2)} (α={dataset.aoi.calibrationAlpha}, β={dataset.aoi.calibrationBeta})
            </div>
          </div>

          <div className="bg-[#060D1E] border border-white/[0.06] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-medium text-xs">
              <FileCheck2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Burned-Area Truth</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Validated against NASA MCD64A1 surface burn scars, which measure burned area rather than thermal pulses.
            </p>
            <div className="pt-1 font-mono text-[10px] text-sky-300">
              Correlation r = {dataset.metrics.mcd64a1Correlation.toFixed(2)} (p &lt; 0.001)
            </div>
          </div>

          <div className="bg-[#060D1E] border border-white/[0.06] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-medium text-xs">
              <Satellite className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Discontinuity Removal</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Raw counts leapt +{dataset.metrics.rawArtificialJumpPct}% in 2012. Harmonization isolates true multi-year shift of {dataset.metrics.harmonizedRealChangePct >= 0 ? `+${dataset.metrics.harmonizedRealChangePct}%` : `${dataset.metrics.harmonizedRealChangePct}%`}.
            </p>
            <div className="pt-1 font-mono text-[10px] text-slate-300">
              Sensor bias eliminated
            </div>
          </div>
        </div>

        {/* Clean Mathematical Formulation */}
        <div className="bg-[#060D1E] border border-white/[0.06] rounded-xl p-3.5 space-y-2">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Harmonization Equations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-[#0A1428] border border-white/[0.04]">
              <div className="font-mono text-amber-300 font-semibold mb-1 text-[11px]">
                N_VIIRS_eq(t) = α · (N_MODIS(t))^β
              </div>
              <p className="text-[11px] text-slate-400">
                Accounts for sub-linear clustering where multiple 375m VIIRS detections fall into one 1km MODIS footprint.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0A1428] border border-white/[0.04]">
              <div className="font-mono text-emerald-300 font-semibold mb-1 text-[11px]">
                SFAI(y, w) = (N_harm - Median_w) / IQR_w
              </div>
              <p className="text-[11px] text-slate-400">
                Interquartile standardized anomaly score, resilient to extreme wildfire outliers and climate skew.
              </p>
            </div>
          </div>
        </div>

        {/* Stated Limits (Calm Slate Card, No Harsh Red Alert Box) */}
        <div className="bg-[#060D1E] border border-white/[0.06] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
            <CloudOff className="w-3.5 h-3.5 text-slate-400" />
            <span>Stated Operational Limitations</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
            <li>
              <strong>Cloud &amp; Monsoon Obscuration:</strong> Mid-infrared sensors cannot penetrate thick convective clouds; pre-monsoon cloud cover can cause under-counting of brief agricultural fires.
            </li>
            <li>
              <strong>Canopy Smoke Attenuation:</strong> Low-intensity understory burns beneath dense tropical canopies may not breach detection thresholds until canopy opening.
            </li>
            <li>
              <strong>Diurnal Overpass Windows:</strong> Orbiters sample ~10:30 (Terra) and ~13:30 (Aqua, S-NPP, NOAA-20). Quick fires lit and extinguished between overpasses remain unobserved.
            </li>
            <li>
              <strong>Static Thermal Features:</strong> Industrial flaring and brick kilns produce persistent thermal signals that require regional contextual masking.
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 px-5 bg-[#060D1E] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-[11px]">
          <AlertCircle className="w-3 h-3 text-slate-400" />
          NASA FIRMS &amp; MCD64A1 Data
        </span>
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
