# Cauchy's Comet: The Harmonized Burning Activity Calendar

**2026 NASA International Space Apps Challenge — Chattogram, Bangladesh**  
**Challenge:** Harmonization of MODIS and VIIRS Hot Spots

---

## Overview

Satellites have tracked active fire hotspots across Earth for over 25 years, beginning with **MODIS** (Terra & Aqua, 1 km pixel resolution) in 2000 and expanding with **VIIRS** (Suomi-NPP & NOAA-20/21, 375 m pixel resolution) in 2012. Because VIIRS has a sharper spatial footprint and ~10x higher sensitivity to smaller, cooler fires, naive unharmonized time series exhibit a dramatic **+200% to +350% artificial jump in 2012**.

**Cauchy's Comet** solves this sensor discontinuity by:
1. **Spatio-Temporal Common Grid Binning**: Aggregating scattered MODIS and VIIRS thermal anomalies into standardized 52-week regional bins.
2. **Overlap Transfer Calibration (2012–2024)**: Leveraging 13 years of concurrent Aqua-MODIS and S-NPP VIIRS afternoon (~13:30 local time) overpasses to fit a regional power-law transfer function ($N_{\text{VIIRS-eq}} = \alpha \cdot N_{\text{MODIS}}^\beta$) and inverse-variance overlap fusion.
3. **Standardized Fire Anomaly Index (SFAI)**: Computing interquartile-normalized anomalies ($\text{SFAI} = (N - \text{Median}_w)/\text{IQR}_w$) so a week or year is only flagged as unusual when the **fire** is unusual—not the satellite.
4. **Independent Ground-Truthing**: Cross-checking harmonized trends against NASA's independent **MCD64A1 Burned Area** product and openly stating physical sensor limits (cloud cover, canopy smoke attenuation, and orbital sampling windows).

---

## Key Features

- **27-Year Burning Activity Calendar Heatmap (2000–2026)**: Interactive 52-week $\times$ 27-year matrix with instant toggle between **Cauchy's Harmonized Record**, **Raw Unharmonized Data (exposing the 2012 jump)**, and **SFAI Anomaly Index**.
- **Accessible Color Ramps**: Includes colorblind-safe, perceptually uniform palettes (`Fire-Amber`, `Viridis`, `Inferno`, `Cividis`).
- **Interactive Leaflet AOI Map**: Draw any custom bounding box on the map, enter Latitude/Longitude coordinates directly, or explore 5 benchmark regions (*Chattogram Hill Tracts*, *Sundarbans Buffer*, *Pantanal & Amazon*, *Northern California*, and *Northern Australia*).
- **Live NASA FIRMS API Integration**: Fetches Near Real-Time (NRT) VIIRS and MODIS active fire hotspots directly from NASA Earthdata FIRMS.
- **One-Click CSV & GeoJSON Export**: Download harmonized weekly time series and GIS-ready polygon/hotspot features.

---

## Team Cauchy's Comet (Chattogram, Bangladesh)

- **Naser-Al-Noman** (`@nasernoman277`)
- **Zaid Rehman** (`@zaidrehmann`)
- **Sadman Zaman Khan** (`@sadmanzamankhan`)
- **Muhammad Junayed** (`@junayedoo7`)
- **Israt Jahan Lamia** (`@israt11`)
- **Md. Meheraj Hossain** (`@mhmahir7`)

---

## Local Development

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```
