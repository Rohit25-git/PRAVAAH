import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Map as MapIcon, Globe, Moon } from 'lucide-react';
import { Hotspot, ATM, Transaction, Complaint } from '../types';

interface LeafletMapProps {
  hotspots: Hotspot[];
  atms?: ATM[];
  withdrawals?: Transaction[];
  complaints?: Complaint[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
  onOpenInvestigation?: (hotspot: Hotspot) => void;
  showATMs?: boolean;
  showWithdrawals?: boolean;
  showComplaints?: boolean;
  height?: string;
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  hotspots,
  atms = [],
  withdrawals = [],
  complaints = [],
  selectedHotspot,
  onSelectHotspot,
  onOpenInvestigation,
  showATMs = false,
  showWithdrawals = false,
  showComplaints = false,
  height = '500px',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  // Basemap options: 'streets' (OSM, 100% free), 'satellite' (ESRI World Imagery), 'dark' (ESRI Dark Gray)
  const [mapTheme, setMapTheme] = useState<'streets' | 'satellite' | 'dark'>('streets');

  // Tile URL definitions - completely free, high-performance, no watermark
  const getTileConfig = (theme: 'streets' | 'satellite' | 'dark') => {
    switch (theme) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          options: {
            maxZoom: 19,
            attribution: '© Esri World Imagery',
          },
          labelsUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        };
      case 'dark':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          options: {
            maxZoom: 16,
            attribution: '© Esri Dark Canvas',
          },
          labelsUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        };
      case 'streets':
      default:
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          options: {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
          },
          labelsUrl: null,
        };
    }
  };

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on India
    const map = L.map(mapContainerRef.current, {
      center: [22.5, 78.9],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    const config = getTileConfig('streets');
    const baseTile = L.tileLayer(config.url, config.options).addTo(map);
    tileLayerRef.current = baseTile;

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Trigger invalidateSize after initial render
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap when mapTheme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    const config = getTileConfig(mapTheme);
    const newBase = L.tileLayer(config.url, config.options).addTo(map);
    tileLayerRef.current = newBase;

    // Bring markers to front
    if (layersGroupRef.current) {
      map.removeLayer(layersGroupRef.current);
      layersGroupRef.current.addTo(map);
    }

    if (config.labelsUrl) {
      const labels = L.tileLayer(config.labelsUrl, { maxZoom: 19 }).addTo(map);
      labelsLayerRef.current = labels;
    }
  }, [mapTheme]);

  // Update Markers when data or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render ATMs if layer enabled
    if (showATMs && atms.length > 0) {
      atms.slice(0, 150).forEach((atm) => {
        const atmIcon = L.divIcon({
          className: 'custom-atm-marker',
          html: `<div style="background-color: #00e5ff; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid #000; box-shadow: 0 0 6px #00e5ff;"></div>`,
          iconSize: [8, 8],
        });
        L.marker([atm.latitude, atm.longitude], { icon: atmIcon })
          .bindTooltip(`ATM: ${atm.atm_reference} (${atm.bank})`, { className: 'text-xs' })
          .addTo(layerGroup);
      });
    }

    // 2. Render Suspicious Withdrawals if layer enabled
    if (showWithdrawals && withdrawals.length > 0) {
      withdrawals.slice(0, 100).forEach((w) => {
        const wIcon = L.divIcon({
          className: 'custom-w-marker',
          html: `<div style="background-color: #f97316; width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid #fff; box-shadow: 0 0 8px #f97316;"></div>`,
          iconSize: [9, 9],
        });
        L.marker([w.latitude, w.longitude], { icon: wIcon })
          .bindTooltip(`Withdrawal: ₹${w.amount.toLocaleString()} (Risk: ${w.risk_indicator})`, { className: 'text-xs' })
          .addTo(layerGroup);
      });
    }

    // 3. Render Complaints if layer enabled
    if (showComplaints && complaints.length > 0) {
      complaints.slice(0, 100).forEach((c) => {
        const cIcon = L.divIcon({
          className: 'custom-c-marker',
          html: `<div style="background-color: #a855f7; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid #fff; box-shadow: 0 0 6px #a855f7;"></div>`,
          iconSize: [8, 8],
        });
        L.marker([c.latitude, c.longitude], { icon: cIcon })
          .bindTooltip(`Complaint: ${c.category} (₹${c.amount.toLocaleString()})`, { className: 'text-xs' })
          .addTo(layerGroup);
      });
    }

    // 4. Render Predicted Risk Hotspots & Radiant Heatmap Dispersion Surface
    hotspots.forEach((h) => {
      let color = '#22c55e';   // LOW
      if (h.risk_level === 'CRITICAL') color = '#dc2626';
      else if (h.risk_level === 'HIGH') color = '#ea580c';
      else if (h.risk_level === 'MEDIUM') color = '#eab308';

      // Radiant Spatial Heatmap Buffer Rings
      let outerRadius = 2400;
      let coreRadius = 1100;
      let outerOpacity = 0.16;
      let coreOpacity = 0.35;

      if (h.risk_level === 'CRITICAL') {
        outerRadius = 3500;
        coreRadius = 1600;
        outerOpacity = 0.22;
        coreOpacity = 0.45;
        // Wide outer ambient risk halo
        L.circle([h.latitude, h.longitude], {
          radius: 5500,
          color: color,
          weight: 1,
          dashArray: '4, 8',
          fillColor: color,
          fillOpacity: 0.08,
          interactive: false,
        }).addTo(layerGroup);
      } else if (h.risk_level === 'HIGH') {
        outerRadius = 2800;
        coreRadius = 1300;
        outerOpacity = 0.18;
        coreOpacity = 0.38;
      }

      // Outer heat dispersion ring
      L.circle([h.latitude, h.longitude], {
        radius: outerRadius,
        color: color,
        weight: 1.5,
        dashArray: '3, 4',
        fillColor: color,
        fillOpacity: outerOpacity,
        interactive: false,
      }).addTo(layerGroup);

      // Core density heat ring
      L.circle([h.latitude, h.longitude], {
        radius: coreRadius,
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: coreOpacity,
        interactive: false,
      }).addTo(layerGroup);

      const isSelected = selectedHotspot?.id === h.id;
      const size = isSelected ? 36 : 28;

      const markerHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${size}px;
          height: ${size}px;
          cursor: pointer;
        ">
          ${h.risk_level === 'CRITICAL' ? `
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              background-color: ${color};
              opacity: 0.55;
              animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          ` : ''}
          <div style="
            position: relative;
            background-color: ${color};
            border: 2.5px solid #ffffff;
            box-shadow: 0 2px 12px rgba(0,0,0,0.6), 0 0 16px ${color};
            width: ${size - 6}px;
            height: ${size - 6}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: 900;
          ">
            ${Math.round(h.risk_score)}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-hotspot-pin',
        html: markerHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([h.latitude, h.longitude], { icon: customIcon }).addTo(layerGroup);

      // Popup Content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 text-slate-800 min-w-[250px] font-sans';
      popupDiv.innerHTML = `
        <div class="border-b border-slate-200 pb-2 mb-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-black text-slate-900">${h.location}</span>
            <span class="text-[10px] font-black px-1.5 py-0.5 rounded-md" style="background-color: ${color}20; color: ${color}; border: 1.5px solid ${color};">
              ${h.risk_level}
            </span>
          </div>
          <p class="text-[10px] text-slate-500 font-semibold mt-0.5">${h.district}, ${h.state}</p>
        </div>
        <div class="space-y-1 text-xs mb-3">
          <div class="flex justify-between text-slate-600">
            <span>Risk Score:</span>
            <span class="font-extrabold text-slate-900">${h.risk_score} / 100</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Predicted Window:</span>
            <span class="font-bold text-blue-600">${h.predicted_time_window}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Related Cases:</span>
            <span class="font-semibold text-slate-800">${h.related_cases}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Suspicious Withdrawals:</span>
            <span class="font-semibold text-slate-800">${h.suspicious_transactions}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 pt-1">
          <button id="btn-intel-${h.id}" class="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-center transition">
            VIEW INTEL
          </button>
          <button id="btn-inv-${h.id}" class="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-center transition shadow-sm">
            INVESTIGATE
          </button>
        </div>
      `;

      marker.bindPopup(popupDiv);

      marker.on('popupopen', () => {
        const intelBtn = document.getElementById(`btn-intel-${h.id}`);
        if (intelBtn) {
          intelBtn.onclick = () => onSelectHotspot(h);
        }
        const invBtn = document.getElementById(`btn-inv-${h.id}`);
        if (invBtn && onOpenInvestigation) {
          invBtn.onclick = () => onOpenInvestigation(h);
        }
      });

      marker.on('click', () => {
        onSelectHotspot(h);
      });
    });

    // Auto fit map bounds if hotspots are loaded and none is explicitly selected
    if (hotspots.length > 0 && !selectedHotspot) {
      const coords = hotspots.map((h) => [h.latitude, h.longitude] as [number, number]);
      const bounds = L.latLngBounds(coords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
      }
    }
  }, [hotspots, atms, withdrawals, complaints, selectedHotspot, showATMs, showWithdrawals, showComplaints]);

  // Center on selected hotspot
  useEffect(() => {
    if (selectedHotspot && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedHotspot.latitude, selectedHotspot.longitude], 11, {
        duration: 1.2,
      });
    }
  }, [selectedHotspot]);

  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden flex flex-col isolate z-0 ${className}`}
      style={{ height: height || '100%' }}
    >
      <div
        ref={mapContainerRef}
        className="w-full h-full flex-1 relative z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Top Right Basemap Selector: Real Streets / Satellite / Tactical Dark */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 flex items-center gap-1 shadow-md text-xs">
        <button
          onClick={() => setMapTheme('streets')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-[11px] ${
            mapTheme === 'streets'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="OpenStreetMap with all real roads, districts and landmark labels"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Real Street Map</span>
        </button>

        <button
          onClick={() => setMapTheme('satellite')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-[11px] ${
            mapTheme === 'satellite'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Real High-Resolution Satellite Aerial View"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          onClick={() => setMapTheme('dark')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-[11px] ${
            mapTheme === 'dark'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="ESRI Tactical Dark Canvas"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Tactical Dark</span>
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 text-[11px] flex items-center gap-4 text-slate-700 shadow-md">
        <span className="font-extrabold text-slate-900 text-xs">Forecast Risk:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="font-semibold text-slate-700">LOW (&lt;30)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
          <span className="font-semibold text-slate-700">MED (30–49)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
          <span className="font-semibold text-slate-700">HIGH (50–69)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div>
          <span className="text-red-700 font-extrabold">CRITICAL (70+)</span>
        </div>
      </div>
    </div>
  );
};
