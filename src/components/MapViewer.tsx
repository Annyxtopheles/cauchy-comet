import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Crop,
  Layers,
  MapPin,
  RefreshCw,
  Satellite,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { AOI, LiveHotspot, WeeklyFireRecord } from '../types/fire';
import { createCustomAOI } from '../data/aois';

interface MapViewerProps {
  aoi: AOI;
  selectedWeekRecord: WeeklyFireRecord;
  liveHotspots: LiveHotspot[];
  isLoadingLive: boolean;
  liveSourceLabel: string;
  onSelectCustomAoi: (aoi: AOI) => void;
  onRefreshLive: () => void;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  aoi,
  selectedWeekRecord,
  liveHotspots,
  isLoadingLive,
  liveSourceLabel,
  onSelectCustomAoi,
  onRefreshLive,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [basemap, setBasemap] = useState<'dark' | 'satellite'>('dark');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawStartLatLng, setDrawStartLatLng] = useState<L.LatLng | null>(null);
  const [showCoordForm, setShowCoordForm] = useState(false);
  const [sensorFootprintOverlay, setSensorFootprintOverlay] = useState<'both' | 'modis' | 'viirs'>('both');

  // Coordinate inputs for manual entry
  const [westInput, setWestInput] = useState(String(aoi.bbox[0]));
  const [southInput, setSouthInput] = useState(String(aoi.bbox[1]));
  const [eastInput, setEastInput] = useState(String(aoi.bbox[2]));
  const [northInput, setNorthInput] = useState(String(aoi.bbox[3]));

  useEffect(() => {
    setWestInput(String(aoi.bbox[0]));
    setSouthInput(String(aoi.bbox[1]));
    setEastInput(String(aoi.bbox[2]));
    setNorthInput(String(aoi.bbox[3]));
  }, [aoi]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: aoi.center,
      zoom: aoi.zoom,
      zoomControl: true,
      attributionControl: true,
    });

    const darkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO | NASA FIRMS',
        subdomains: 'abcd',
        maxZoom: 18,
      }
    ).addTo(map);

    tileLayerRef.current = darkTiles;
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch basemap tiles (Dark Tactical vs Satellite Imagery)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (basemap === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, NASA',
          maxZoom: 18,
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap &copy; CARTO | NASA FIRMS',
          subdomains: 'abcd',
          maxZoom: 18,
        }
      ).addTo(map);
    }
  }, [basemap]);

  // Handle interactive 2-click bounding-box drawing on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingMode) return;

      if (!drawStartLatLng) {
        setDrawStartLatLng(e.latlng);
      } else {
        const west = Number(Math.min(drawStartLatLng.lng, e.latlng.lng).toFixed(2));
        const east = Number(Math.max(drawStartLatLng.lng, e.latlng.lng).toFixed(2));
        const south = Number(Math.min(drawStartLatLng.lat, e.latlng.lat).toFixed(2));
        const north = Number(Math.max(drawStartLatLng.lat, e.latlng.lat).toFixed(2));

        if (Math.abs(east - west) > 0.08 && Math.abs(north - south) > 0.08) {
          const custom = createCustomAOI([west, south, east, north]);
          onSelectCustomAoi(custom);
        }
        setDrawStartLatLng(null);
        setIsDrawingMode(false);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawingMode, drawStartLatLng, onSelectCustomAoi]);

  // Render AOI bounding box + simulated sensor footprints & live FIRMS hotspots
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const [west, south, east, north] = aoi.bbox;
    const bounds: L.LatLngBoundsExpression = [
      [south, west],
      [north, east],
    ];

    // AOI Polygon Boundary
    L.rectangle(bounds, {
      color: '#FF7A00',
      weight: 2.5,
      fillColor: '#FF7A00',
      fillOpacity: 0.09,
      dashArray: '6, 6',
    })
      .bindPopup(
        `<div class="text-xs">
          <div class="font-bold text-amber-400 mb-0.5">${aoi.name}</div>
          <div>${aoi.ecosystem}</div>
          <div class="text-slate-300 mt-1">Calibration: α=${aoi.calibrationAlpha}, β=${aoi.calibrationBeta}</div>
        </div>`
      )
      .addTo(group);

    // Fit bounds smoothly when AOI changes
    map.flyToBounds(bounds, { padding: [24, 24], duration: 0.85 });

    // Plot active hotspots (either real live FIRMS points or representative weekly detections)
    const latSpan = north - south;
    const lngSpan = east - west;

    if (liveHotspots.length > 0) {
      liveHotspots.slice(0, 180).forEach((pt) => {
        const isViirs = pt.instrument === 'VIIRS';
        if (sensorFootprintOverlay === 'modis' && isViirs) return;
        if (sensorFootprintOverlay === 'viirs' && !isViirs) return;

        L.circleMarker([pt.latitude, pt.longitude], {
          radius: isViirs ? 4.5 : 7.5,
          color: isViirs ? '#FFD54F' : '#FF4500',
          fillColor: isViirs ? '#FFA000' : '#E65100',
          fillOpacity: 0.85,
          weight: 1.2,
        })
          .bindPopup(
            `<div class="text-xs font-sans">
              <div class="font-bold text-amber-400">${pt.instrument} (${pt.satellite})</div>
              <div>Date: ${pt.acq_date} ${pt.acq_time} UTC</div>
              <div>FRP: <b>${pt.frp} MW</b> | Brightness: ${pt.brightness} K</div>
              <div>Harmonized Weight: <b>${pt.harmonizedEquivalentWeight.toFixed(2)} eq</b></div>
            </div>`
          )
          .addTo(group);
      });
    } else {
      // Render spatial distribution for the currently inspected week
      const displayCount = Math.min(85, Math.max(8, Math.round(selectedWeekRecord.harmonizedCount / 4)));
      for (let i = 0; i < displayCount; i++) {
        // Deterministic spatial clustering inside AOI
        const h1 = ((i * 2654435761 + selectedWeekRecord.year * 97 + selectedWeekRecord.week * 31) >>> 0) % 1000;
        const h2 = ((i * 1597334677 + selectedWeekRecord.year * 53 + selectedWeekRecord.week * 89) >>> 0) % 1000;
        const lat = south + (0.12 + 0.76 * (h1 / 1000)) * latSpan;
        const lng = west + (0.12 + 0.76 * (h2 / 1000)) * lngSpan;
        const isModisPoint = i % 3 === 0;

        if (sensorFootprintOverlay === 'modis' && !isModisPoint) continue;
        if (sensorFootprintOverlay === 'viirs' && isModisPoint) continue;

        L.circleMarker([lat, lng], {
          radius: isModisPoint ? 7.5 : 4,
          color: isModisPoint ? '#FF4500' : '#FFD54F',
          fillColor: isModisPoint ? '#E65100' : '#FF7A00',
          fillOpacity: isModisPoint ? 0.55 : 0.9,
          weight: 1.2,
        })
          .bindPopup(
            `<div class="text-xs">
              <div class="font-bold text-amber-400">${
                isModisPoint ? 'MODIS 1 km Coarse Grid Cell' : 'VIIRS 375 m High-Res Detection'
              }</div>
              <div>Week ${selectedWeekRecord.week}, ${selectedWeekRecord.year} (${selectedWeekRecord.dateRangeLabel})</div>
              <div>Harmonized Weekly Total: <b>${selectedWeekRecord.harmonizedCount}</b> hotspots</div>
            </div>`
          )
          .addTo(group);
      }
    }
  }, [aoi, selectedWeekRecord, liveHotspots, sensorFootprintOverlay]);

  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(westInput);
    const s = parseFloat(southInput);
    const eVal = parseFloat(eastInput);
    const n = parseFloat(northInput);
    if (
      !Number.isNaN(w) &&
      !Number.isNaN(s) &&
      !Number.isNaN(eVal) &&
      !Number.isNaN(n) &&
      eVal > w &&
      n > s
    ) {
      const custom = createCustomAOI([w, s, eVal, n]);
      onSelectCustomAoi(custom);
      setShowCoordForm(false);
    }
  };

  return (
    <div className="bg-space-900/80 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl">
      {/* Top Map Toolbar */}
      <div className="p-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-space-950/50">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-fire shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">{aoi.name}</h2>
            <p className="text-[11px] text-slate-300">{aoi.region}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsDrawingMode(!isDrawingMode);
              setDrawStartLatLng(null);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              isDrawingMode
                ? 'bg-amber-fire text-space-950 border-amber-solar animate-pulse'
                : 'bg-space-800 hover:bg-space-700 text-slate-200 border-white/10'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>{isDrawingMode ? 'Click 2 Corners on Map...' : 'Draw Custom AOI'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCoordForm(!showCoordForm)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-space-800 hover:bg-space-700 text-slate-200 border border-white/10 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-solar" />
            <span>Lat/Lon</span>
          </button>

          <button
            type="button"
            onClick={() => setBasemap(basemap === 'dark' ? 'satellite' : 'dark')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-space-800 hover:bg-space-700 text-slate-200 border border-white/10 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{basemap === 'dark' ? 'Satellite View' : 'Dark Vector'}</span>
          </button>
        </div>
      </div>

      {/* Optional Lat/Lon Bounding Box Input Drawer */}
      {showCoordForm && (
        <form
          onSubmit={handleCoordinateSubmit}
          className="p-3 bg-space-950/90 border-b border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end"
        >
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-300 mb-1">
              West Lon (°)
            </label>
            <input
              type="number"
              step="0.01"
              value={westInput}
              onChange={(e) => setWestInput(e.target.value)}
              className="w-full px-2 py-1 rounded bg-space-800 border border-white/15 text-xs text-white font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-300 mb-1">
              South Lat (°)
            </label>
            <input
              type="number"
              step="0.01"
              value={southInput}
              onChange={(e) => setSouthInput(e.target.value)}
              className="w-full px-2 py-1 rounded bg-space-800 border border-white/15 text-xs text-white font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-300 mb-1">
              East Lon (°)
            </label>
            <input
              type="number"
              step="0.01"
              value={eastInput}
              onChange={(e) => setEastInput(e.target.value)}
              className="w-full px-2 py-1 rounded bg-space-800 border border-white/15 text-xs text-white font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-300 mb-1">
              North Lat (°)
            </label>
            <input
              type="number"
              step="0.01"
              value={northInput}
              onChange={(e) => setNorthInput(e.target.value)}
              className="w-full px-2 py-1 rounded bg-space-800 border border-white/15 text-xs text-white font-mono"
              required
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-amber-fire hover:bg-amber-glow text-space-950 font-bold text-xs flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Apply Box
          </button>
        </form>
      )}

      {/* Map Canvas */}
      <div className="relative h-[320px] sm:h-[360px] w-full">
        <div ref={mapContainerRef} className="h-full w-full z-10" />

        {/* Sensor Footprint Overlay Filter Pill */}
        <div className="absolute bottom-3 left-3 z-20 bg-space-950/90 backdrop-blur-md p-1.5 rounded-xl border border-white/15 flex items-center gap-1 text-[11px]">
          <span className="px-2 text-slate-300 font-medium">Sensor Grid:</span>
          {(['both', 'modis', 'viirs'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSensorFootprintOverlay(mode)}
              className={`px-2 py-0.5 rounded-lg font-semibold uppercase transition-colors ${
                sensorFootprintOverlay === mode
                  ? 'bg-amber-fire text-space-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {mode === 'both' ? 'Harmonized' : mode === 'modis' ? 'MODIS 1km' : 'VIIRS 375m'}
            </button>
          ))}
        </div>

        {/* Live FIRMS Sync Button */}
        <button
          type="button"
          onClick={onRefreshLive}
          disabled={isLoadingLive}
          className="absolute top-3 right-3 z-20 bg-space-950/90 hover:bg-space-800 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-amber-fire/40 text-xs font-semibold text-amber-solar flex items-center gap-1.5 shadow-lg"
          title="Query NASA FIRMS Live NRT API for this Bounding Box"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
          <span>{isLoadingLive ? 'Querying NASA FIRMS...' : 'Sync Live FIRMS'}</span>
        </button>
      </div>

      {/* Bottom AOI Context Strip */}
      <div className="p-3.5 bg-space-950/70 border-t border-white/10 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#E65100] border border-[#FF4500] inline-block" />
              MODIS (1 km pixel)
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#FFA000] border border-[#FFD54F] inline-block" />
              VIIRS (375 m pixel)
            </span>
          </div>
          <span className="font-mono text-[11px] text-amber-solar flex items-center gap-1">
            <Satellite className="w-3.5 h-3.5" />
            {liveSourceLabel}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{aoi.description}</p>
      </div>
    </div>
  );
};
