import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Crop,
  Grid,
  Layers,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  User,
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
  onSelectWeekNumber?: (week: number) => void;
  onRefreshLive: () => void;
}

/**
 * Generates an organic multi-vertex geographic contour polygon inside the AOI bounding box
 * matching the glowing hand-drawn amber contour in Video Screenshot 3.
 */
function buildOrganicAoiPolygon(bbox: [number, number, number, number], seedId: string): [number, number][] {
  const [west, south, east, north] = bbox;
  const cLat = (south + north) / 2;
  const cLng = (west + east) / 2;
  const rLat = (north - south) * 0.38;
  const rLng = (east - west) * 0.38;

  let seed = 17;
  for (let i = 0; i < seedId.length; i++) {
    seed = (seed * 31 + seedId.charCodeAt(i)) % 997;
  }

  const pts: [number, number][] = [];
  const steps = 28;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wave1 = Math.sin(angle * 3 + seed) * 0.16;
    const wave2 = Math.cos(angle * 5 - seed * 0.5) * 0.09;
    const wave3 = Math.sin(angle * 8 + seed * 1.7) * 0.05;
    const radiusFactor = 0.78 + wave1 + wave2 + wave3;
    pts.push([
      cLat + Math.sin(angle) * rLat * radiusFactor,
      cLng + Math.cos(angle) * rLng * radiusFactor,
    ]);
  }
  return pts;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  aoi,
  selectedWeekRecord,
  liveHotspots,
  isLoadingLive,
  liveSourceLabel,
  onSelectCustomAoi,
  onSelectWeekNumber,
  onRefreshLive,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [basemap, setBasemap] = useState<'topo-navy' | 'satellite'>('topo-navy');
  const [showCommonGrid, setShowCommonGrid] = useState(true);
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

  // Initialize Leaflet Map with 100% Free Esri World Imagery / OSM Tiles (No CARTO API Key Watermark)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: aoi.center,
      zoom: aoi.zoom,
      zoomControl: false,
      attributionControl: true,
    });

    const initialTiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'NASA FIRMS · Esri Earthstar Geographics',
        maxZoom: 18,
        className: 'cauchy-navy-tiles',
      }
    ).addTo(map);

    tileLayerRef.current = initialTiles;
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch basemap tiles (Zero API-Key required)
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
          attribution: 'NASA FIRMS · Esri World Imagery',
          maxZoom: 18,
          className: 'cauchy-satellite-tiles',
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'NASA FIRMS · Topographic Dark Navy (#0B1B3A)',
          maxZoom: 18,
          className: 'cauchy-navy-tiles',
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

        if (Math.abs(east - west) > 0.05 && Math.abs(north - south) > 0.05) {
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

  // Render Glowing Organic Amber AOI Contour + MODIS Cyan Squares + VIIRS Amber Dots
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

    const organicPolygonCoords = buildOrganicAoiPolygon(aoi.bbox, aoi.id);

    // Outer Soft Glow Halo for Organic AOI Contour (Screenshot 3 style)
    L.polygon(organicPolygonCoords, {
      color: '#F59E0B',
      weight: 6,
      opacity: 0.28,
      fillColor: '#F59E0B',
      fillOpacity: 0.05,
      smoothFactor: 1.5,
    }).addTo(group);

    // Crisp Glowing Inner Amber Contour Line (Screenshot 3 exact look)
    L.polygon(organicPolygonCoords, {
      color: '#FBBF24',
      weight: 2.2,
      opacity: 0.95,
      fillOpacity: 0.03,
      smoothFactor: 1.5,
    })
      .bindPopup(
        `<div class="text-xs">
          <div class="font-bold text-amber-400 mb-0.5">${aoi.name}</div>
          <div>${aoi.ecosystem}</div>
          <div class="text-slate-300 mt-1">Calibration: α=${aoi.calibrationAlpha}, β=${aoi.calibrationBeta}</div>
        </div>`
      )
      .addTo(group);

    map.flyToBounds(bounds, { padding: [26, 26], duration: 0.75 });

    const latSpan = north - south;
    const lngSpan = east - west;
    const cellLatSize = latSpan * 0.045;
    const cellLngSize = lngSpan * 0.045;

    const pointsToPlot =
      liveHotspots.length > 0
        ? liveHotspots.slice(0, 150).map((pt) => ({
            lat: pt.latitude,
            lng: pt.longitude,
            isModis: pt.instrument === 'MODIS',
            label: `${pt.instrument} (${pt.satellite}) · FRP ${pt.frp} MW`,
          }))
        : Array.from(
            {
              length: Math.min(
                64,
                Math.max(10, Math.round(selectedWeekRecord.harmonizedCount / 4.5))
              ),
            },
            (_, i) => {
              const h1 =
                ((i * 2654435761 +
                  selectedWeekRecord.year * 97 +
                  selectedWeekRecord.week * 31) >>>
                  0) %
                1000;
              const h2 =
                ((i * 1597334677 +
                  selectedWeekRecord.year * 53 +
                  selectedWeekRecord.week * 89) >>>
                  0) %
                1000;
              const angle = (h1 / 1000) * Math.PI * 2;
              const r = Math.sqrt(h2 / 1000) * 0.32;
              const lat = aoi.center[0] + Math.sin(angle) * latSpan * r;
              const lng = aoi.center[1] + Math.cos(angle) * lngSpan * r;
              const isModis = i % 3 === 0;
              return {
                lat,
                lng,
                isModis,
                label: isModis
                  ? 'MODIS 1 km Coarse Grid Cell'
                  : 'VIIRS 375 m Sharp Detection',
              };
            }
          );

    pointsToPlot.forEach((pt) => {
      if (sensorFootprintOverlay === 'modis' && !pt.isModis) return;
      if (sensorFootprintOverlay === 'viirs' && pt.isModis) return;

      if (pt.isModis) {
        // Screenshot 2 Style: Glowing Cyan/Blue 1 km Coarse Square Footprint
        const sqBounds: L.LatLngBoundsExpression = [
          [pt.lat - cellLatSize, pt.lng - cellLngSize],
          [pt.lat + cellLatSize, pt.lng + cellLngSize],
        ];
        L.rectangle(sqBounds, {
          color: '#38BDF8',
          weight: 1.2,
          opacity: 0.85,
          fillColor: '#0EA5E9',
          fillOpacity: 0.48,
        })
          .bindPopup(
            `<div class="text-xs font-sans">
              <div class="font-bold text-sky-400">${pt.label}</div>
              <div>Week ${selectedWeekRecord.week}, ${selectedWeekRecord.year}</div>
            </div>`
          )
          .addTo(group);
      } else {
        // Screenshot 2 & 5 Style: Glowing Amber/Gold 375m Pinpoint Dot with Halo
        L.circleMarker([pt.lat, pt.lng], {
          radius: 6.5,
          color: 'transparent',
          fillColor: '#F59E0B',
          fillOpacity: 0.28,
        }).addTo(group);

        L.circleMarker([pt.lat, pt.lng], {
          radius: 3.2,
          color: '#FEF08A',
          weight: 1,
          fillColor: '#F59E0B',
          fillOpacity: 0.98,
        })
          .bindPopup(
            `<div class="text-xs font-sans">
              <div class="font-bold text-amber-400">${pt.label}</div>
              <div>Week ${selectedWeekRecord.week}, ${selectedWeekRecord.year}</div>
            </div>`
          )
          .addTo(group);
      }
    });
  }, [aoi, selectedWeekRecord, liveHotspots, sensorFootprintOverlay]);

  // Deterministic grid cell density readouts ("000.38", "000.33", "000.93" from Screenshot 2)
  const commonGridCells = useMemo(() => {
    const cells: { id: number; readout: string; activeCyan: boolean; activeAmber: boolean }[] = [];
    const base = selectedWeekRecord.harmonizedCount;
    for (let i = 0; i < 24; i++) {
      const hash = ((i * 73 + selectedWeekRecord.week * 19 + selectedWeekRecord.year * 7) % 100) / 100;
      const density = ((base / 400) * (0.15 + hash * 1.1)).toFixed(2).padStart(6, '0');
      cells.push({
        id: i,
        readout: hash > 0.35 ? density : '',
        activeCyan: hash > 0.68,
        activeAmber: hash > 0.52 && hash <= 0.78,
      });
    }
    return cells;
  }, [selectedWeekRecord]);

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
    <div className="bg-[#0B1B3A]/95 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
      {/* Screenshot 3 Header Bar: #0B1B3A + Amber Progress Bar + Controls + Responder Icon */}
      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#08152E]">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-wider text-slate-300">
                #0B1B3A
              </span>
              <span className="text-xs font-semibold text-white">· {aoi.name}</span>
            </div>
            {/* Screenshot 3 Amber Progress Pill */}
            <div className="mt-1.5 w-36 h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(22, selectedWeekRecord.percentile))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCommonGrid(!showCommonGrid)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              showCommonGrid
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                : 'bg-space-800 text-slate-300 border-white/10'
            }`}
            title="Toggle Common Spatial Grid & Cell Readouts (Screenshot 2 & 5)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Common Grid</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDrawingMode(!isDrawingMode);
              setDrawStartLatLng(null);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              isDrawingMode
                ? 'bg-amber-500 text-space-950 border-amber-300 animate-pulse'
                : 'bg-space-800 hover:bg-space-700 text-slate-200 border-white/10'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>{isDrawingMode ? 'Click 2 Corners...' : 'Draw Area'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCoordForm(!showCoordForm)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-space-800 hover:bg-space-700 text-slate-200 border border-white/10 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Lat/Lon</span>
          </button>

          <button
            type="button"
            onClick={() => setBasemap(basemap === 'topo-navy' ? 'satellite' : 'topo-navy')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-space-800 hover:bg-space-700 text-slate-200 border border-white/10 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{basemap === 'topo-navy' ? 'True Satellite' : '#0B1B3A Topo'}</span>
          </button>

          {/* Screenshot 3 Top-Right Responder Avatar Pill */}
          <div
            className="w-7 h-7 rounded-lg bg-slate-800/90 border border-white/10 flex items-center justify-center text-slate-400"
            title="Responder / Land Manager View"
          >
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Optional Lat/Lon Bounding Box Input Drawer */}
      {showCoordForm && (
        <form
          onSubmit={handleCoordinateSubmit}
          className="p-3 bg-space-950/95 border-b border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end"
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
            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-space-950 font-bold text-xs flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Apply Box
          </button>
        </form>
      )}

      {/* Map Canvas + Topographic Contours + Common Grid Overlay */}
      <div className="relative h-[390px] sm:h-[430px] w-full select-none">
        <div ref={mapContainerRef} className="h-full w-full z-10" />

        {/* Screenshot 3 Procedural Topographic Contour Vector Overlay */}
        <svg
          viewBox="0 0 600 420"
          className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-35"
          preserveAspectRatio="none"
        >
          <g fill="none" stroke="#3B6998" strokeWidth="1">
            <path d="M-20,60 Q140,20 260,90 T580,50" />
            <path d="M-30,130 Q180,75 310,150 T620,115" />
            <path d="M-10,220 Q130,175 280,245 T610,205" />
            <path d="M-20,310 Q190,260 350,330 T620,295" />
            <path d="M40,-10 Q110,160 65,290 T140,440" />
            <path d="M450,-10 Q380,140 440,280 T390,430" />
            <ellipse cx="300" cy="210" rx="195" ry="135" strokeOpacity="0.45" />
            <ellipse cx="300" cy="210" rx="145" ry="98" strokeOpacity="0.55" />
            <ellipse cx="305" cy="208" rx="96" ry="64" strokeOpacity="0.65" />
          </g>
        </svg>

        {/* Screenshot 2 & 5 Common Grid Overlay with "000.38" / "000.33" Cell Readouts */}
        {showCommonGrid && (
          <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-6 grid-rows-4">
            {commonGridCells.map((cell) => (
              <div
                key={cell.id}
                className="border border-sky-300/15 relative flex items-end p-1.5"
              >
                {cell.activeCyan && (
                  <div className="w-4 h-4 bg-sky-400/25 border border-sky-300/50 absolute top-2 right-3 rounded-[1px]" />
                )}
                {cell.readout && (
                  <span className="font-mono text-[9px] tracking-tight text-slate-200/80 drop-shadow">
                    {cell.readout}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Screenshot 5 Top-Right Tactical Telemetry Box ("00:06.38" + Sensor Readout) */}
        <div className="absolute top-3 right-3 z-20 bg-[#071226]/90 backdrop-blur-md border border-sky-400/30 rounded-xl p-2.5 text-right font-mono shadow-lg">
          <div className="text-sm font-bold text-sky-200 tracking-wider">
            {String(selectedWeekRecord.week).padStart(2, '0')}:
            {String(selectedWeekRecord.year).slice(-2)}.
            {String(selectedWeekRecord.percentile).padStart(2, '0')}
          </div>
          <div className="mt-1 space-y-0.5 text-[10px] text-slate-300 border-t border-white/10 pt-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sky-400">MODIS 1KM</span>
              <span>{selectedWeekRecord.modisRaw.toString().padStart(4, '0')}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-amber-400">VIIRS 375M</span>
              <span>
                {(selectedWeekRecord.viirsRaw ?? selectedWeekRecord.harmonizedCount)
                  .toString()
                  .padStart(4, '0')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 font-bold text-amber-300">
              <span>HARMONIZED</span>
              <span>{selectedWeekRecord.harmonizedCount.toString().padStart(4, '0')}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefreshLive}
            disabled={isLoadingLive}
            className="mt-1.5 w-full px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[10px] text-amber-300 flex items-center justify-center gap-1 pointer-events-auto"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
            <span>{isLoadingLive ? 'Syncing...' : 'Sync FIRMS'}</span>
          </button>
        </div>

        {/* Screenshot 2 Sensor Filter Pill (Top-Left of Map) */}
        <div className="absolute top-3 left-3 z-20 bg-[#071226]/90 backdrop-blur-md p-1 rounded-xl border border-white/15 flex items-center gap-1 text-[10px]">
          {(['both', 'modis', 'viirs'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSensorFootprintOverlay(mode)}
              className={`px-2 py-1 rounded-lg font-bold uppercase transition-colors ${
                sensorFootprintOverlay === mode
                  ? 'bg-amber-500 text-space-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {mode === 'both'
                ? 'Common Grid (Both)'
                : mode === 'modis'
                ? '■ MODIS 1km'
                : '● VIIRS 375m'}
            </button>
          ))}
        </div>

        {/* Screenshot 3 Exact Bottom-Left Map Pin + "0 — 200 — 500" Scale Bar */}
        <div className="absolute bottom-3 left-4 z-20 pointer-events-none flex flex-col gap-1.5">
          <MapPin className="w-5 h-5 text-slate-400/80" />
          <div className="w-36">
            <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-0.5">
              <span>0</span>
              <span>200</span>
              <span>500</span>
            </div>
            <div className="h-1.5 border-b border-l border-r border-slate-400/80 flex items-end">
              <div className="w-1/2 h-1 border-r border-slate-400/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot 5 Bottom "WEEK" Tick-Mark Timeline Scrubber */}
      <div className="px-4 py-3 bg-[#071226] border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
          <span>CELL GRID · {aoi.shortName.toUpperCase()}</span>
          <span className="text-amber-400 font-bold">
            WEEK {selectedWeekRecord.week} ({selectedWeekRecord.dateRangeLabel}, {selectedWeekRecord.year})
          </span>
          <span>52 WKS</span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min={1}
            max={52}
            value={selectedWeekRecord.week}
            onChange={(e) => onSelectWeekNumber?.(Number(e.target.value))}
            aria-label="Scrub calendar week on common grid"
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-amber-400 z-10"
          />
        </div>

        {/* Tick Marks from Screenshot 5 */}
        <div className="flex justify-between px-1">
          {Array.from({ length: 26 }, (_, i) => (
            <span
              key={i}
              className={`w-[1px] ${
                i % 5 === 0 ? 'h-2 bg-slate-400' : 'h-1 bg-slate-600'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-300 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[2px] bg-sky-500/60 border border-sky-300 inline-block" />
              MODIS (1 km coarse pixel)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-yellow-200 inline-block" />
              VIIRS (375 m pinpoint)
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">{liveSourceLabel}</span>
        </div>
      </div>
    </div>
  );
};
