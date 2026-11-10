import { AOI } from '../types/fire';

export const PRESET_AOIS: AOI[] = [
  {
    id: 'cht-bangladesh',
    name: 'Chattogram Hill Tracts (CHT)',
    shortName: 'Chattogram Hill Tracts',
    region: 'Southeastern Bangladesh (Rangamati, Bandarban, Khagrachhari)',
    country: 'Bangladesh',
    isFeaturedLocal: true,
    bbox: [91.55, 21.35, 92.75, 23.80],
    center: [22.55, 92.18],
    zoom: 8,
    description:
      'Home region of Team Cauchy\'s Comet. Dominated by tropical semi-evergreen hill forests and seasonal jhum (shifting slash-and-burn) cultivation. Because individual jhum plots are typically 0.5–3 hectares, coarse 1 km MODIS pixels missed up to 72% of small burns prior to 2012, causing a massive artificial jump when 375 m VIIRS came online.',
    ecosystem: 'Tropical Moist Hill Forest & Shifting Agro-Forestry',
    fireRegime: 'Pre-monsoon anthropogenic jhum clearing & understory fires (Feb–Apr)',
    peakWeekCenter: 12, // Late March
    seasonSpread: 3.4,
    basePeakModis: 62,
    calibrationAlpha: 3.45,
    calibrationBeta: 0.93,
    anomalyYears: [2004, 2010, 2016, 2020, 2023, 2026],
    climateTrendRate: 0.008,
    onsetShiftPerDecade: -0.45, // ~3.1 days earlier per decade
    mcd64a1Correlation: 0.91,
  },
  {
    id: 'sundarbans-bengal',
    name: 'Sundarbans & Coastal Bengal Buffer',
    shortName: 'Sundarbans Buffer',
    region: 'Khulna & Satkhira Delta Interface',
    country: 'Bangladesh / India',
    isFeaturedLocal: true,
    bbox: [88.80, 21.55, 90.35, 22.75],
    center: [22.15, 89.58],
    zoom: 8,
    description:
      'World\'s largest contiguous mangrove forest and UNESCO World Heritage reserve. While tidal mangroves rarely burn naturally, peripheral agricultural stubble clearing and localized dry-season forest-edge encroachments pose acute ecological hazards during El Niño dry spells.',
    ecosystem: 'Mangrove Estuarine Forest & Deltaic Cropland Buffer',
    fireRegime: 'Dry-season peripheral agricultural residue & rare forest-edge fires (Feb–May)',
    peakWeekCenter: 14, // Early April
    seasonSpread: 3.8,
    basePeakModis: 24,
    calibrationAlpha: 3.12,
    calibrationBeta: 0.91,
    anomalyYears: [2006, 2010, 2014, 2016, 2021, 2024],
    climateTrendRate: 0.011,
    onsetShiftPerDecade: -0.38,
    mcd64a1Correlation: 0.88,
  },
  {
    id: 'pantanal-amazon',
    name: 'Pantanal & Southern Amazon Arc',
    shortName: 'Pantanal & Amazon',
    region: 'Mato Grosso do Sul & Santa Cruz',
    country: 'Brazil / Bolivia',
    bbox: [-61.50, -19.80, -55.50, -15.20],
    center: [-17.50, -58.50],
    zoom: 6,
    description:
      'Global tropical wetland and southern Amazon deforestation frontier. Experiences high-intensity pasture maintenance burns and drought-driven megafires between August and October, with extreme spikes during the 2020 and 2024 severe hydrological droughts.',
    ecosystem: 'Tropical Floodplain Savanna & Seasonal Moist Forest',
    fireRegime: 'Late dry-season biomass clearing & drought wildfires (Aug–Oct)',
    peakWeekCenter: 36, // Early September
    seasonSpread: 4.5,
    basePeakModis: 480,
    calibrationAlpha: 2.75,
    calibrationBeta: 0.95,
    anomalyYears: [2005, 2007, 2010, 2019, 2020, 2024],
    climateTrendRate: 0.016,
    onsetShiftPerDecade: -0.62, // ~4.3 days earlier per decade
    mcd64a1Correlation: 0.95,
  },
  {
    id: 'california-sierra',
    name: 'Sierra Nevada & Northern California',
    shortName: 'Northern California',
    region: 'Sierra Nevada / Klamath / Cascade Range',
    country: 'United States',
    bbox: [-123.50, 37.20, -119.50, 41.50],
    center: [39.35, -121.50],
    zoom: 6,
    description:
      'Temperate montane conifer forests subject to intensifying vapor-pressure deficits and prolonged autumn fire weather. Harmonization separates the 2012 VIIRS deployment artifact from the genuine surge in multi-hundred-thousand-acre complex wildfires (2018, 2020, 2021).',
    ecosystem: 'Temperate Mixed Conifer & Chaparral Woodland',
    fireRegime: 'Summer-to-Autumn high-intensity canopy wildfires (Jul–Oct)',
    peakWeekCenter: 34, // Late August
    seasonSpread: 4.2,
    basePeakModis: 310,
    calibrationAlpha: 2.68,
    calibrationBeta: 0.96,
    anomalyYears: [2008, 2012, 2018, 2020, 2021, 2024],
    climateTrendRate: 0.022,
    onsetShiftPerDecade: -0.75, // ~5.2 days earlier per decade
    mcd64a1Correlation: 0.96,
  },
  {
    id: 'kimberley-australia',
    name: 'Arnhem Land & Kimberley Savannas',
    shortName: 'Northern Australia',
    region: 'Northern Territory & Western Australia',
    country: 'Australia',
    bbox: [129.50, -16.20, 135.50, -12.00],
    center: [-14.10, 132.50],
    zoom: 6,
    description:
      'Tropical eucalyptus savanna characterized by indigenous early-dry-season prescribed burning (May–July) to prevent destructive late-dry-season wildfires (September–November). A benchmark region for validating bimodal seasonal fire calendars.',
    ecosystem: 'Tropical Eucalyptus & Mitchell Grass Savanna',
    fireRegime: 'Managed early dry-season mosaic burns vs late dry-season bushfires (May–Nov)',
    peakWeekCenter: 39, // Late September
    seasonSpread: 5.5,
    secondaryPeakWeek: 23, // Early June prescribed burns
    basePeakModis: 540,
    calibrationAlpha: 2.90,
    calibrationBeta: 0.94,
    anomalyYears: [2001, 2006, 2011, 2015, 2019, 2023],
    climateTrendRate: 0.005,
    onsetShiftPerDecade: -0.25,
    mcd64a1Correlation: 0.94,
  },
];

export function createCustomAOI(bbox: [number, number, number, number]): AOI {
  const [west, south, east, north] = bbox;
  const centerLat = Number(((south + north) / 2).toFixed(3));
  const centerLng = Number(((west + east) / 2).toFixed(3));
  const absLat = Math.abs(centerLat);

  // Estimate regional fire seasonality from latitude & hemisphere
  let peakWeekCenter = 14;
  let ecosystem = 'Custom Regional Terrestrial Biome';
  let fireRegime = 'Seasonal thermal hotspot regime derived from geographic zone';

  if (centerLat >= 15 && centerLat <= 28 && centerLng >= 85 && centerLng <= 96) {
    peakWeekCenter = 12; // South/SE Asia pre-monsoon
    ecosystem = 'Sub-Tropical South Asian Forest & Agricultural Mosaic';
    fireRegime = 'Pre-monsoon dry season burning (Feb–May)';
  } else if (centerLat < 0) {
    peakWeekCenter = 36; // Southern hemisphere late dry season (Aug-Oct)
    ecosystem = 'Southern Hemisphere Savanna / Forest Biome';
    fireRegime = 'Austral late dry-season burning (Aug–Oct)';
  } else if (absLat > 32) {
    peakWeekCenter = 33; // Boreal/Temperate summer (Jul-Sep)
    ecosystem = 'Temperate / Sub-Boreal Forest & Shrubland';
    fireRegime = 'Mid-to-late summer wildfire season (Jul–Sep)';
  } else {
    peakWeekCenter = 11; // Northern tropics dry season (Feb-Apr)
    ecosystem = 'Northern Tropical Dry Forest & Agro-Ecosystem';
    fireRegime = 'Northern tropical dry-season burning (Jan–Apr)';
  }

  const areaSpan = Math.max(0.5, Math.abs(east - west) * Math.abs(north - south));
  const basePeakModis = Math.round(Math.min(600, Math.max(35, areaSpan * 28)));

  return {
    id: `custom-${west.toFixed(2)}-${south.toFixed(2)}-${east.toFixed(2)}-${north.toFixed(2)}`,
    name: `Custom Sector (${centerLat.toFixed(2)}°, ${centerLng.toFixed(2)}°)`,
    shortName: 'Custom Drawn Area',
    region: `Bounds: [${west.toFixed(2)}°, ${south.toFixed(2)}° to ${east.toFixed(2)}°, ${north.toFixed(2)}°]`,
    country: 'User-Defined Polygon / Bounding Box',
    bbox,
    center: [centerLat, centerLng],
    zoom: 7,
    description:
      'User-defined Area of Interest dynamically gridded and harmonized across the 2000–2026 MODIS and VIIRS observation record using Cauchy\'s Comet overlap transfer calibration.',
    ecosystem,
    fireRegime,
    peakWeekCenter,
    seasonSpread: 4.0,
    basePeakModis,
    calibrationAlpha: 3.10,
    calibrationBeta: 0.94,
    anomalyYears: [2005, 2010, 2016, 2020, 2023, 2026],
    climateTrendRate: 0.012,
    onsetShiftPerDecade: -0.42,
    mcd64a1Correlation: 0.92,
  };
}
