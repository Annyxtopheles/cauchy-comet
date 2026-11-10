import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Crop,
  Grid,
  Layers,
  MapPin,
  RefreshCw,
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
  onSelectWeekNumber?: (week: number) => void;
  onRefreshLive: () => void;
}

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
  const steps = 32;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wave1 = Math.sin(angle * 3 + seed) * 0.14;
    const wave2 = Math.cos(angle * 5 - seed * 0.5) * 0.08;
    const radiusFactor = 0.8 + wave1 + wave2;
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
  onSelectCustomAoi,
  onSelectWeekNumber,
  onRefreshLive,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [basemap, setBasemap] = useState<'topo-navy' | 'satellite'>('topo-navy');
  const [showGrid, setShowGrid] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawStartLatLng, setDrawStartLatLng] = useState<L.LatLng | null>(null);
  const [showCoordForm, setShowCoordForm] = useState(false);
  const [sensorFilter, setSensorFilter] = useState<'both' | 'modis' | 'viirs'>('both');

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

  // Leaflet map initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: aoi.center,
      zoom: aoi.zoom,
      zoomControl: false,
      attributionControl: false,
    });

    const initialTiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
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

  // Basemap switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        className: basemap === 'satellite' ? 'cauchy-satellite-tiles' : 'cauchy-navy-tiles',
      }
    ).addTo(map);
  }, [basemap]);

  // Click-to-draw custom bounding box
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

  // Render organic AOI contour line & quiet fire markers
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

    // Subtle soft glow halo
    L.polygon(organicPolygonCoords, {
      color: '#F59E0B',
      weight: 4,
      opacity: 0.22,
      fillColor: '#F59E0B',
      fillOpacity: 0.04,
      smoothFactor: 1.5,
    }).addTo(group);

    // Clean glowing organic amber contour line (Screenshot 3 style)
    L.polygon(organicPolygonCoords, {
      color: '#F59E0B',
      weight: 1.8,
      opacity: 0.9,
      fillOpacity: 0.02,
      smoothFactor: 1.5,
    }).addTo(group);

    map.flyToBounds(bounds, { padding: [30, 30], duration: 0.75 });

    const latSpan = north - south;
    const lngSpan = east - west;
    const cellLatSize = latSpan * 0.04;
    const cellLngSize = lngSpan * 0.04;

    const pointsToPlot =
      liveHotspots.length > 0
        ? liveHotspots.slice(0, 100).map((pt) => ({
            lat: pt.latitude,
            lng: pt.longitude,
            isModis: pt.instrument === 'MODIS',
            label: `${pt.instrument} · FRP ${pt.frp} MW`,
          }))
        : Array.from(
            {
              length: Math.min(
                45,
                Math.max(8, Math.round(selectedWeekRecord.harmonizedCount / 6))
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
              const r = Math.sqrt(h2 / 1000) * 0.3;
              const lat = aoi.center[0] + Math.sin(angle) * latSpan * r;
              const lng = aoi.center[1] + Math.cos(angle) * lngSpan * r;
              const isModis = i % 3 === 0;
              return {
                lat,
                lng,
                isModis,
                label: isModis ? 'MODIS 1 km' : 'VIIRS 375 m',
              };
            }
          );

    pointsToPlot.forEach((pt) => {
      if (sensorFilter === 'modis' && !pt.isModis) return;
      if (sensorFilter === 'viirs' && pt.isModis) return;

      if (pt.isModis) {
        // Soft cyan 1 km square
        const sqBounds: L.LatLngBoundsExpression = [
          [pt.lat - cellLatSize, pt.lng - cellLngSize],
          [pt.lat + cellLatSize, pt.lng + cellLngSize],
        ];
        L.rectangle(sqBounds, {
          color: '#38BDF8',
          weight: 1,
          opacity: 0.65,
          fillColor: '#0EA5E9',
          fillOpacity: 0.3,
        }).addTo(group);
      } else {
        // Warm amber 375m pinpoint dot
        L.circleMarker([pt.lat, pt.lng], {
          radius: 3,
          color: '#FEF08A',
          weight: 0.8,
          fillColor: '#F59E0B',
          fillOpacity: 0.9,
        }).addTo(group);
      }
    });
  }, [aoi, selectedWeekRecord, liveHotspots, sensorFilter]);

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
    <div className="bg-[#081226] border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Clean Top Bar: Area Identity & Minimal Controls */}
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-[#060D1D]">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-xs text-white truncate">
            {aoi.name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            [{aoi.bbox[0].toFixed(1)}°, {aoi.bbox[1].toFixed(1)}° to {aoi.bbox[2].toFixed(1)}°, {aoi.bbox[3].toFixed(1)}°]
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              showGrid
                ? 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                : 'bg-[#0A1630] text-slate-400 border-white/[0.06] hover:text-white'
            }`}
          >
            <Grid className="w-3 h-3 inline mr-1" />
            Grid
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDrawingMode(!isDrawingMode);
              setDrawStartLatLng(null);
            }}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              isDrawingMode
                ? 'bg-amber-500 text-[#060D1E] font-semibold border-amber-400'
                : 'bg-[#0A1630] text-slate-400 border-white/[0.06] hover:text-white'
            }`}
          >
            <Crop className="w-3 h-3 inline mr-1" />
            {isDrawingMode ? 'Click 2 Points...' : 'Draw'}
          </button>

          <button
            type="button"
            onClick={() => setShowCoordForm(!showCoordForm)}
            className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#0A1630] text-slate-400 hover:text-white border border-white/[0.06] transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3 inline mr-1" />
            Coords
          </button>

          <button
            type="button"
            onClick={() => setBasemap(basemap === 'topo-navy' ? 'satellite' : 'topo-navy')}
            className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#0A1630] text-slate-400 hover:text-white border border-white/[0.06] transition-colors"
          >
            <Layers className="w-3 h-3 inline mr-1" />
            {basemap === 'topo-navy' ? 'Satellite' : 'Navy'}
          </button>
        </div>
      </div>

      {/* Lat/Lon form drawer */}
      {showCoordForm && (
        <form
          onSubmit={handleCoordinateSubmit}
          className="p-3 bg-[#060D1E] border-b border-white/[0.06] grid grid-cols-2 sm:grid-cols-5 gap-2 items-end text-xs"
        >
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">
              West Lon
            </label>
            <input
              type="number"
              step="0.01"
              value={westInput}
              onChange={(e) => setWestInput(e.target.value)}
              className="w-full px-2 py-1 rounded bg-[#09152C] border border-white/10 text-white font-mono text-[11px]"
              required
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">
              South Lat
            </label>
            <input
              type="number"
              step="0.01"
              value={southInput}
              onChange={(e) => setSouthInput(e.target.value)}
              className="w-full px-2 py-1 rounded bg-[#09152C] border border-white/10 text-white font-mono text-[11px]"
              required
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">
              East Lon
            </label>
            <input
              type="number"
              step="0.01"
              value={eastInput}
              onChange={(e) => setEastInput(e.target.value)}
              className="w-full px-2 py-1 rounded bg-[#09152C] border border-white/10 text-white font-mono text-[11px]"
              required
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">
              North Lat
            </label>
            <input
              type="number"
              step="0.01"
              value={northInput}
              onChange={(e) => setNorthInput(e.target.value)}
              className="w-full px-2 py-1 rounded bg-[#09152C] border border-white/10 text-white font-mono text-[11px]"
              required
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-[#060D1E] font-semibold text-xs flex items-center justify-center gap-1"
          >
            <Check className="w-3 h-3" /> Set
          </button>
        </form>
      )}

      {/* Map Canvas */}
      <div className="relative h-[340px] sm:h-[370px] w-full select-none bg-[#071126]">
        <div ref={mapContainerRef} className="h-full w-full z-10" />

        {/* Optional subtle grid lines (clean, without noisy text overlay) */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-6 grid-rows-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="border border-sky-300/[0.08]"
              />
            ))}
          </div>
        )}

        {/* Clean top-left sensor filter buttons */}
        <div className="absolute top-2.5 left-2.5 z-20 bg-[#060D1E]/90 backdrop-blur-sm px-1 py-0.5 rounded-lg border border-white/[0.08] flex items-center gap-0.5 text-[10px]">
          {(['both', 'modis', 'viirs'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSensorFilter(mode)}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                sensorFilter === mode
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'both' ? 'All' : mode === 'modis' ? 'MODIS 1km' : 'VIIRS 375m'}
            </button>
          ))}
        </div>

        {/* Top-right compact live sync button */}
        <button
          type="button"
          onClick={onRefreshLive}
          disabled={isLoadingLive}
          className="absolute top-2.5 right-2.5 z-20 bg-[#060D1E]/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/[0.08] text-[10px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-2.5 h-2.5 text-amber-400 ${isLoadingLive ? 'animate-spin' : ''}`} />
          <span>{isLoadingLive ? 'Syncing...' : 'Sync FIRMS'}</span>
        </button>

        {/* Quiet Scale Bar in bottom left */}
        <div className="absolute bottom-2.5 left-3 z-20 pointer-events-none text-[9px] font-mono text-slate-400">
          <div className="flex justify-between w-24 mb-0.5 opacity-70">
            <span>0</span>
            <span>200</span>
            <span>500 km</span>
          </div>
          <div className="w-24 h-1 border-b border-l border-r border-slate-400/60" />
        </div>
      </div>

      {/* Quiet Bottom Week Slider */}
      <div className="px-4 py-2.5 bg-[#060D1D] border-t border-white/[0.06] space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono text-[10px]">
            TIMELINE
          </span>
          <span className="font-semibold text-white">
            Week {selectedWeekRecord.week} ·{' '}
            <span className="text-slate-400 font-normal">
              {selectedWeekRecord.dateRangeLabel}, {selectedWeekRecord.year}
            </span>
          </span>
          <span className="font-mono text-[11px] text-amber-300 font-semibold">
            {selectedWeekRecord.harmonizedCount} hotspots
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={52}
          value={selectedWeekRecord.week}
          onChange={(e) => onSelectWeekNumber?.(Number(e.target.value))}
          aria-label="Timeline week scrubber"
          className="w-full h-1 bg-[#101F3D] rounded cursor-pointer accent-amber-400"
        />

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-[1px] bg-sky-400/60 inline-block" />
              MODIS
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              VIIRS
            </span>
          </div>
          <span className="font-mono">{liveHotspots.length} live hotspots</span>
        </div>
      </div>
    </div>
  );
};
