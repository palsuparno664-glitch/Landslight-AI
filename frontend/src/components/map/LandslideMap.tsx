'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Navigation,
  Send,
  Camera,
  Droplets,
  Map,
  Moon,
  X
} from 'lucide-react';
import { MonitoringZone, CitizenReport, RiskLevel } from '@/types';
import { NER_STATES } from '@/lib/ner-data';
import { soundManager } from '@/lib/sound';

interface LandslideMapProps {
  zones: MonitoringZone[];
  citizenReports: CitizenReport[];
  selectedZone: MonitoringZone | null;
  onSelectZone: (zone: MonitoringZone | null) => void;
  onDispatchTrigger?: (zone: MonitoringZone) => void;
}

/* inline cartographic glyphs for divIcon markers (Leaflet renders raw HTML) */
const CAMERA_GLYPH = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`;
const DROPLET_GLYPH = `<svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;
const PERSON_GLYPH = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--ink-950)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function LandslideMap({
  zones,
  citizenReports,
  selectedZone,
  onSelectZone,
  onDispatchTrigger
}: LandslideMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const onSelectZoneRef = useRef(onSelectZone);
  const layerGroupsRef = useRef<{
    polygons: L.LayerGroup;
    pulses: L.LayerGroup;
    reports: L.LayerGroup;
    corridors: L.LayerGroup;
    gauges: L.LayerGroup;
    people: L.LayerGroup;
  } | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);

  const [activeLayers, setActiveLayers] = useState({
    riskPolygons: true,
    radarPulses: true,
    citizenReports: true,
    corridors: true,
    rainGauges: true
  });

  const [selectedRegionId, setSelectedRegionId] = useState('all');
  const [activeBasemap, setActiveBasemap] = useState<'street' | 'dark'>('street');

  const [locate, setLocate] = useState<'off' | 'locating' | 'active' | 'error'>('off');
  const [locateWatch, setLocateWatch] = useState(false);
  const [locAccuracy, setLocAccuracy] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  const drawerRiskHex = selectedZone
    ? selectedZone.risk_level === 'Critical'
      ? '#e0524d'
      : selectedZone.risk_level === 'High'
        ? '#d9804b'
        : '#d9a441'
    : '#d9a441';

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix default Leaflet icon paths
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      center: [26.2006, 92.9376],
      zoom: 7,
      minZoom: 6,
      maxZoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initialize layer groups
    const polygons = L.layerGroup().addTo(map);
    const pulses = L.layerGroup().addTo(map);
    const reports = L.layerGroup().addTo(map);
    const corridors = L.layerGroup().addTo(map);
    const gauges = L.layerGroup().addTo(map);
    const people = L.layerGroup().addTo(map);

    layerGroupsRef.current = {
      polygons,
      pulses,
      reports,
      corridors,
      gauges,
      people
    };

    mapInstanceRef.current = map;

    // Fix: Leaflet needs invalidateSize after mount to detect correct container dimensions.
    // Multiple calls at staggered intervals to handle cases where the container
    // resizes asynchronously (e.g. sidebar animation, font load layout shift).
    const timers = [
      setTimeout(() => map.invalidateSize(), 0),
      setTimeout(() => map.invalidateSize(), 150),
      setTimeout(() => map.invalidateSize(), 500),
    ];

    return () => {
      timers.forEach(clearTimeout);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Keep onSelectZone ref in sync without triggering layer rebuilds
  useEffect(() => {
    onSelectZoneRef.current = onSelectZone;
  }, [onSelectZone]);

  // Basemap Layer — street by default, dark GIS webmap toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const isStreet = activeBasemap === 'street';
    const url = isStreet
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const attribution = isStreet
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | LANDSIGHT AI NER'
      : '&copy; <a href="https://carto.com/">CARTO</a> | LANDSIGHT AI NER';

    // OSM uses subdomains a/b/c; CARTO uses a/b/c/d
    const subdomains = isStreet ? 'abc' : 'abcd';
    tileLayerRef.current = L.tileLayer(url, { attribution, subdomains, maxZoom: 19 }).addTo(map);

    // Fix: tiles may not render correctly after layer swap
    setTimeout(() => map.invalidateSize(), 100);
  }, [activeBasemap]);

  // Update Layers & Features
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupsRef.current;
    if (!map || !layers) return;

    // Clear existing layers
    layers.polygons.clearLayers();
    layers.pulses.clearLayers();
    layers.reports.clearLayers();
    layers.corridors.clearLayers();
    layers.gauges.clearLayers();

    // 1. Render Risk Polygons
    if (activeLayers.riskPolygons) {
      zones.forEach((zone) => {
        const colorMap = {
          Critical: '#e0524d',
          High: '#d9804b',
          Moderate: '#d9a441',
          Low: '#76b383'
        };
        const color = colorMap[zone.risk_level as RiskLevel] || '#76b383';

        const polygon = L.polygon(zone.polygon as L.LatLngExpression[], {
          color: color,
          weight: selectedZone?.id === zone.id ? 5 : 2.5,
          opacity: 1,
          fillColor: color,
          fillOpacity: selectedZone?.id === zone.id ? 0.50 : 0.30,
          dashArray: zone.risk_level === 'Critical' ? undefined : '6, 4',
          className: `risk-polygon risk-polygon--${zone.risk_level.toLowerCase()}`,
        });

        // Popup Content
        const popupHtml = `
          <div class="p-4 text-paper text-xs min-w-[240px]">
            <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-ink-700">
              <strong class="font-display text-sm font-semibold text-paper">${zone.name}</strong>
              <span class="px-1.5 py-0.5 rounded-sm text-[10px] font-bold font-mono border" style="background: ${color}1a; color: ${color}; border-color: ${color}40">
                ${zone.risk_level.toUpperCase()} (${zone.risk_score})
              </span>
            </div>
            <div class="space-y-1">
              <p class="text-paper-dim"><span class="text-paper-faint">State:</span> <strong class="text-paper">${zone.state}</strong></p>
              <p class="text-paper-dim"><span class="text-paper-faint">24h Rainfall:</span> <strong class="text-teal font-mono">${zone.rainfall_last_24h} mm</strong></p>
              <p class="text-paper-dim"><span class="text-paper-faint">Slope Gradient:</span> <strong class="text-ochre font-mono">${zone.slope_angle}°</strong></p>
              <p class="text-paper-dim"><span class="text-paper-faint">Soil Moisture:</span> <strong class="text-teal font-mono">${Math.round(zone.soil_moisture_index * 100)}%</strong></p>
              <p class="text-paper-dim"><span class="text-paper-faint">Status:</span> <span class="text-ember font-medium">${zone.active_alert}</span></p>
            </div>
            <div class="mt-3 pt-2 border-t border-ink-800 flex justify-end">
              <button id="btn-select-${zone.id}" class="w-full py-1.5 px-3 rounded-md bg-clay hover:bg-ochre text-ink-950 font-bold text-[11px] font-mono uppercase tracking-wider transition-colors">
                Open Telemetry & Dispatch →
              </button>
            </div>
          </div>
        `;

        polygon.bindPopup(popupHtml, { maxWidth: 300 });

        polygon.on('popupopen', () => {
          const btn = document.getElementById(`btn-select-${zone.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectZoneRef.current(zone);
              if (zone.risk_level === 'Critical') {
                soundManager.playCriticalSiren();
              }
            };
          }
        });

        polygon.on('click', () => {
          onSelectZoneRef.current(zone);
        });

        layers.polygons.addLayer(polygon);
      });
    }

    // 2. Render Pulsing Radar Rings on Critical / High Zones
    if (activeLayers.radarPulses) {
      zones.forEach((zone) => {
        if (zone.risk_level === 'Critical' || zone.risk_level === 'High') {
          const isCritical = zone.risk_level === 'Critical';
          const pulseHex = isCritical ? '#e0524d' : '#d9804b';

          const pulseIcon = L.divIcon({
            className: 'custom-radar-marker',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-8 h-8 rounded-full ${isCritical ? 'bg-ember/30' : 'bg-clay/25'} animate-ping"></div>
                <div class="absolute w-12 h-12 rounded-full animate-radar-pulse" style="border:2px solid ${pulseHex}55"></div>
                <div class="relative w-5 h-5 rounded-full bg-ink-950 flex items-center justify-center" style="border:1.5px solid ${pulseHex}; box-shadow:0 0 12px ${pulseHex}55">
                  <span class="absolute w-px h-3 rounded-full" style="background:${pulseHex}"></span>
                  <span class="absolute w-3 h-px rounded-full" style="background:${pulseHex}"></span>
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker(zone.coordinates, { icon: pulseIcon });
          marker.on('click', () => {
            onSelectZoneRef.current(zone);
            if (isCritical) soundManager.playCriticalSiren();
          });
          layers.pulses.addLayer(marker);
        }
      });
    }

    // 3. Render Citizen Ground Incident Markers
    if (activeLayers.citizenReports) {
      citizenReports.forEach((report) => {
        const isCritical = report.severity === 'Critical';
        const isHigh = report.severity === 'High';
        const pinHex = isCritical ? '#e0524d' : isHigh ? '#d9804b' : '#d9a441';
        const sevStyle = `background:${pinHex}1a; border-color:${pinHex}40; color:${pinHex}`;

        const reportIcon = L.divIcon({
          className: 'custom-citizen-marker',
          html: `
            <div class="relative group cursor-pointer">
              <div class="w-7 h-7 rounded-full flex items-center justify-center border border-ink-950/60 transition-transform hover:scale-125" style="background:${pinHex}; box-shadow:0 4px 12px ${pinHex}44">
                ${PERSON_GLYPH}
              </div>
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-ink-950" style="outline:1px solid ${pinHex}55"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const marker = L.marker([report.latitude, report.longitude], { icon: reportIcon });

        const popupContent = `
          <div class="p-4 text-paper text-xs min-w-[260px] space-y-2">
            <div class="flex items-center justify-between pb-2 border-b border-ink-700">
              <span class="font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                <span class="text-clay">${CAMERA_GLYPH}</span>
                <span class="text-clay">Field Ground Report</span>
              </span>
              <span class="px-1.5 py-0.5 rounded-sm text-[9px] font-bold font-mono border" style="${sevStyle}">
                ${report.severity}
              </span>
            </div>

            <div class="flex items-center justify-between text-[10px] text-paper-faint">
              <span>Reported by <strong class="text-paper">${escapeHtml(report.reporter_name)}</strong></span>
              <span class="font-mono text-clay">${escapeHtml(report.reporter_phone)}</span>
            </div>

            <p class="font-bold text-paper">${report.location_name}</p>
            <p class="text-paper-dim">${report.hazard_type}</p>
            <p class="text-[11px] text-paper-faint italic">"${report.description}"</p>

            ${report.media_url ? `
              <div class="mt-1 rounded-sm overflow-hidden border border-ink-800 h-28 w-full bg-ink-950">
                <img src="${report.media_url}" alt="Incident" class="w-full h-full object-cover" />
              </div>
            ` : ''}

            <div class="pt-2 border-t border-ink-800 flex justify-between items-center text-[10px] text-paper-faint">
              <span>AI Vision Score: <strong class="text-teal">${report.cv_verification_score}%</strong></span>
              <span class="font-mono text-clay">${report.status}</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });
        layers.reports.addLayer(marker);
      });
    }

    // 4. Render Highway & Strategic Lifelines
    if (activeLayers.corridors) {
      const corridorsData = [
        { name: 'NH-10 Sikkim Lifeline (Sevoke - Gangtok)', coords: [[26.88, 88.46], [27.05, 88.52], [27.33, 88.60]], color: '#58bca0' },
        { name: 'NH-29 Paglapahar Pass (Dimapur - Kohima)', coords: [[25.90, 93.73], [25.75, 93.92], [25.67, 94.10]], color: '#58bca0' },
        { name: 'NH-310A North Sikkim Highway', coords: [[27.33, 88.60], [27.50, 88.53], [27.60, 88.65]], color: '#e0524d' },
      ];

      corridorsData.forEach((c) => {
        const polyline = L.polyline(c.coords as L.LatLngExpression[], {
          color: c.color,
          weight: 3,
          opacity: 0.7,
          dashArray: '6, 6'
        });
        polyline.bindTooltip(c.name, { sticky: true, className: 'text-xs px-2 py-1' });
        layers.corridors.addLayer(polyline);
      });
    }

    // 5. Rain Gauges & Doppler Stations
    if (activeLayers.rainGauges) {
      zones.forEach((zone) => {
        const gaugeIcon = L.divIcon({
          className: 'custom-gauge-marker',
          html: `
            <div class="px-1.5 py-0.5 rounded-[3px] bg-ink-900/90 border border-teal/45 text-teal font-mono text-[9px] font-bold flex items-center gap-1 whitespace-nowrap" style="box-shadow:0 2px 8px rgba(0,0,0,0.5)">
              ${DROPLET_GLYPH}${zone.rainfall_last_24h}mm
            </div>
          `,
          iconSize: [60, 20],
          iconAnchor: [30, 10],
        });

        const gaugeMarker = L.marker([zone.coordinates[0] + 0.03, zone.coordinates[1] + 0.03], { icon: gaugeIcon });
        gaugeMarker.bindTooltip(`Telemetry Gauge: ${zone.name} (${zone.rainfall_last_24h} mm in last 24h)`);
        layers.gauges.addLayer(gaugeMarker);
      });
    }
  }, [zones, citizenReports, selectedZone, activeLayers]);

  // Viewer live location tracking ("You are here") — live GPS accuracy watch
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupsRef.current;
    if (!map || !layers || !locateWatch) return;

    const onLocationFound = (e: L.LocationEvent) => {
      if (!userMarkerRef.current || !userCircleRef.current) {
        const hereIcon = L.divIcon({
          className: 'custom-you-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-9 h-9 rounded-full bg-teal/15 animate-radar-pulse"></div>
              <div class="relative w-5 h-5 rounded-full bg-teal flex items-center justify-center border-2 border-white/90" style="box-shadow:0 0 0 2px #58bca066, 0 0 14px #58bca0aa">
                ${PERSON_GLYPH}
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker(e.latlng, { icon: hereIcon, zIndexOffset: 1000 });
        const circle = L.circle(e.latlng, {
          radius: e.accuracy,
          color: '#58bca0',
          weight: 1.5,
          opacity: 0.8,
          fillColor: '#58bca0',
          fillOpacity: 0.08,
        });

        layers.people.addLayer(marker);
        layers.people.addLayer(circle);
        userMarkerRef.current = marker;
        userCircleRef.current = circle;

        map.flyTo(e.latlng, 13, { duration: 1.2 });
      } else {
        userMarkerRef.current.setLatLng(e.latlng);
        userCircleRef.current.setRadius(e.accuracy);
      }

      setLocate('active');
      setLocAccuracy(Math.round(e.accuracy));
      setLocError(null);
    };

    const onLocationError = (e: L.ErrorEvent) => {
      const msg =
        e.code === 1
          ? 'Location permission denied'
          : e.code === 2
            ? 'Location unavailable'
            : e.code === 3
              ? 'Location request timed out'
              : 'Could not determine location';
      setLocError(msg);
      setLocAccuracy(null);
      setLocateWatch(false);
      setLocate('error');
    };

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    map.locate({ watch: true, setView: false, enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });

    return () => {
      map.off('locationfound', onLocationFound);
      map.off('locationerror', onLocationError);
      map.stopLocate();
      if (userMarkerRef.current) {
        layers.people.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userCircleRef.current) {
        layers.people.removeLayer(userCircleRef.current);
        userCircleRef.current = null;
      }
    };
  }, [locateWatch]);

  // Fly to Region Handler
  const handleFlyToRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
    const region = NER_STATES.find((r) => r.id === regionId);
    if (region && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(region.center, region.zoom, {
        duration: 1.5,
      });
    }
  };

  const handleLocateToggle = () => {
    if (locateWatch) {
      setLocateWatch(false);
    } else {
      setLocateWatch(true);
      setLocate('locating');
      setLocError(null);
      setLocAccuracy(null);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-lg overflow-hidden border border-ink-700 shadow-2xl bg-ink-950">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Region Filter Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] space-y-1.5 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 topo-panel p-1.5 pointer-events-auto">
          {NER_STATES.map((state) => (
            <button
              key={state.id}
              onClick={() => handleFlyToRegion(state.id)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedRegionId === state.id
                  ? 'bg-clay text-ink-950'
                  : 'text-paper-dim hover:text-paper hover:bg-ink-700'
              }`}
            >
              {state.name.split(' (')[0]}
            </button>
          ))}
        </div>

        {/* Quick Legend Badge */}
        <div className="hidden xl:inline-flex items-center gap-3 topo-panel px-3 py-1.5 text-xs font-medium pointer-events-auto w-fit">
          <span className="text-paper-faint text-[11px] font-mono uppercase tracking-widest">Risk Scale:</span>
          <span className="flex items-center gap-1.5 text-teal font-mono">
            <span className="w-2 h-2 rounded-full bg-teal"></span> Low (0-24)
          </span>
          <span className="flex items-center gap-1.5 text-ochre font-mono">
            <span className="w-2 h-2 rounded-full bg-ochre"></span> Moderate (25-49)
          </span>
          <span className="flex items-center gap-1.5 text-clay font-mono">
            <span className="w-2 h-2 rounded-full bg-clay"></span> High (50-74)
          </span>
          <span className="flex items-center gap-1.5 text-ember font-mono animate-pulse">
            <span className="w-2 h-2 rounded-full bg-ember"></span> Critical (75-100)
          </span>
        </div>
      </div>

      {/* Left Layer Switcher Widget */}
      <div className="absolute bottom-4 left-4 z-[400] topo-panel p-3 space-y-2 min-w-[200px]">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-paper-dim border-b border-ink-700 pb-2">
          <Layers className="w-3.5 h-3.5 text-clay" />
          <span>GIS Map Layers</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <label className="flex items-center justify-between text-paper-dim hover:text-paper cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-[2px] bg-clay"></span>
              Risk Polygons
            </span>
            <input
              type="checkbox"
              checked={activeLayers.riskPolygons}
              onChange={(e) => setActiveLayers((p) => ({ ...p, riskPolygons: e.target.checked }))}
              className="topo-check"
            />
          </label>
          <label className="flex items-center justify-between text-paper-dim hover:text-paper cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ember animate-ping"></span>
              Pulsing Radar Rings
            </span>
            <input
              type="checkbox"
              checked={activeLayers.radarPulses}
              onChange={(e) => setActiveLayers((p) => ({ ...p, radarPulses: e.target.checked }))}
              className="topo-check"
            />
          </label>
          <label className="flex items-center justify-between text-paper-dim hover:text-paper cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-clay" />
              Field Reporter Locations
            </span>
            <input
              type="checkbox"
              checked={activeLayers.citizenReports}
              onChange={(e) => setActiveLayers((p) => ({ ...p, citizenReports: e.target.checked }))}
              className="topo-check"
            />
          </label>
          <label className="flex items-center justify-between text-paper-dim hover:text-paper cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 bg-teal"></span>
              Lifeline Highways
            </span>
            <input
              type="checkbox"
              checked={activeLayers.corridors}
              onChange={(e) => setActiveLayers((p) => ({ ...p, corridors: e.target.checked }))}
              className="topo-check"
            />
          </label>
          <label className="flex items-center justify-between text-paper-dim hover:text-paper cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3 h-3 text-teal" />
              Rain Gauge Tags
            </span>
            <input
              type="checkbox"
              checked={activeLayers.rainGauges}
              onChange={(e) => setActiveLayers((p) => ({ ...p, rainGauges: e.target.checked }))}
              className="topo-check"
            />
          </label>

          {/* Basemap Style Toggle */}
          <div className="pt-2 border-t border-ink-700">
            <div className="flex items-center justify-between text-[10px] mb-1.5 font-mono uppercase tracking-widest">
              <span className="text-paper-faint">Basemap</span>
              <span className="text-paper-dim normal-case tracking-normal">{activeBasemap === 'street' ? 'Street (Google-style)' : 'Dark GIS'}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setActiveBasemap('street')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono uppercase border transition-all flex items-center justify-center gap-1 ${
                  activeBasemap === 'street'
                    ? 'bg-teal/15 text-teal border-teal/50'
                    : 'bg-ink-900 text-paper-dim border-ink-700 hover:text-paper'
                }`}
              >
                <Map className="w-3 h-3" /> Street
              </button>
              <button
                onClick={() => setActiveBasemap('dark')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono uppercase border transition-all flex items-center justify-center gap-1 ${
                  activeBasemap === 'dark'
                    ? 'bg-ochre/15 text-ochre border-ochre/50'
                    : 'bg-ink-900 text-paper-dim border-ink-700 hover:text-paper'
                }`}
              >
                <Moon className="w-3 h-3" /> Dark GIS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* My Location Control (bottom-right, above the Leaflet zoom control) */}
      <div className="absolute bottom-[5.5rem] right-4 z-[400] flex flex-col items-end gap-1.5 pointer-events-none">
        {locate === 'active' && locAccuracy != null && (
          <div className="pointer-events-auto topo-panel px-2 py-1 rounded-md text-[10px] font-mono text-teal flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"></span>
            GPS ±{locAccuracy}m
          </div>
        )}
        {locate === 'error' && locError && (
          <div className="pointer-events-auto topo-panel px-2 py-1 rounded-md text-[10px] font-mono text-ember flex items-center gap-1.5 max-w-[220px]">
            <X className="w-3 h-3 shrink-0" />
            <span className="truncate">{locError}</span>
          </div>
        )}
        <button
          onClick={handleLocateToggle}
          title={locateWatch ? 'Stop tracking my location' : 'Show my current location'}
          className={`pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-mono uppercase tracking-wider topo-panel border transition-all ${
            locateWatch
              ? 'border-teal/60 text-teal'
              : 'border-ink-700 text-paper-dim hover:text-paper'
          }`}
        >
          <Navigation className={`w-3.5 h-3.5 ${locate === 'locating' ? 'animate-spin' : ''}`} />
          {locate === 'locating' ? 'Locating…' : locateWatch ? 'Tracking Live' : 'My Location'}
        </button>
      </div>

      {/* Selected Zone Drawer / Overlay Card */}
      {selectedZone && (
        <div className="absolute top-16 right-4 z-[400] w-80 topo-panel p-4 text-xs space-y-3 animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-ink-700 pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-clay font-bold text-[10px] uppercase font-mono tracking-widest">
                <Navigation className="w-3 h-3" />
                {selectedZone.state} Monitoring Sector
              </div>
              <h3 className="font-display font-bold text-sm text-paper mt-0.5">{selectedZone.name}</h3>
            </div>
            <button
              onClick={() => onSelectZone(null)}
              aria-label="Close"
              className="p-1 rounded-md bg-ink-900 border border-ink-700 text-paper-dim hover:text-paper hover:border-ink-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-md bg-ink-900 border border-ink-700">
              <span className="text-[10px] text-paper-faint font-mono uppercase tracking-widest">Risk Score</span>
              <p className="text-lg font-black font-mono" style={{ color: drawerRiskHex }}>
                {selectedZone.risk_score} <span className="text-xs font-normal text-paper-faint">/100</span>
              </p>
              <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-sm border mt-1 inline-block" style={{ background: `${drawerRiskHex}1a`, borderColor: `${drawerRiskHex}40`, color: drawerRiskHex }}>
                {selectedZone.risk_level}
              </span>
            </div>

            <div className="p-2 rounded-md bg-ink-900 border border-ink-700">
              <span className="text-[10px] text-paper-faint font-mono uppercase tracking-widest">24h Rainfall</span>
              <p className="text-lg font-black font-mono text-teal">
                {selectedZone.rainfall_last_24h} <span className="text-xs font-normal text-paper-faint">mm</span>
              </p>
              <span className="text-[9px] text-teal font-mono">IMD Live Doppler</span>
            </div>
          </div>

          <div className="space-y-1 bg-ink-900/60 p-2.5 rounded-md border border-ink-700/80">
            <div className="flex justify-between">
              <span className="text-paper-faint">Slope Gradient:</span>
              <strong className="text-ochre font-mono">{selectedZone.slope_angle}°</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-paper-faint">Soil Saturation:</span>
              <strong className="text-teal font-mono">{Math.round(selectedZone.soil_moisture_index * 100)}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-paper-faint">At-Risk Pop.:</span>
              <strong className="text-paper font-mono">{selectedZone.estimated_population_at_risk?.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-paper-faint">Nearest Shelter:</span>
              <strong className="text-paper-dim text-right truncate max-w-[140px] font-mono">{selectedZone.nearest_shelter}</strong>
            </div>
          </div>

          <div className="pt-1 flex gap-2">
            {onDispatchTrigger && (
              <button
                onClick={() => onDispatchTrigger(selectedZone)}
                className="flex-1 py-2 px-3 rounded-md bg-gradient-to-r from-ember to-clay text-ink-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Alert Hub
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}