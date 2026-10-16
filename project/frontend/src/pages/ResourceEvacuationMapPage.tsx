import React, { useRef, useEffect, useState } from 'react';
import {
  Map,
  Layers,
  Search,
  Filter,
  AlertTriangle,
  Hospital,
  Building2,
  Ambulance,
  Flame,
  Droplets,
  Navigation,
  Compass,
  CheckCircle2,
  X,
  MapPin
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { CITIES_CATALOG } from '../services/cityData';

export const ResourceEvacuationMapPage: React.FC = () => {
  const {
    selectedCityId,
    incidents,
    emergencyUnits,
    facilities,
    reliefRequests
  } = useCrisis();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentCityMeta = CITIES_CATALOG.find(c => c.id === selectedCityId) || CITIES_CATALOG[0];

  // Layer Toggles
  const [layers, setLayers] = useState({
    incidents: true,
    hazardPerimeter: true,
    hospitals: true,
    shelters: true,
    emergencyUnits: true,
    evacRoutes: true,
    roadClosures: true
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  const cityIncidents = incidents.filter(i => i.city_id === selectedCityId);
  const cityFacilities = facilities.filter(f => f.city_id === selectedCityId);
  const cityUnits = emergencyUnits.filter(u => u.city_id === selectedCityId);

  // Render 2D GIS Tactical Map Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Dark Map Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Cadastral GIS Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Waterway / River Path
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.48);
    ctx.bezierCurveTo(w * 0.35, h * 0.42, w * 0.65, h * 0.58, w, h * 0.52);
    ctx.stroke();

    // Road Network Arterials
    const roadSegments = [
      { y: h * 0.22, name: 'Outer Ring Road North' },
      { y: h * 0.38, name: 'Cyber Towers Tech Spine' },
      { y: h * 0.62, name: 'Nayapul Heritage Corridor', isBlocked: true },
      { y: h * 0.82, name: 'Airport Expressway South' }
    ];

    roadSegments.forEach(road => {
      ctx.lineWidth = 7;
      if (layers.roadClosures && road.isBlocked) {
        ctx.strokeStyle = '#ef4444'; // Red blocked arterial
      } else {
        ctx.strokeStyle = '#334155'; // Normal dark gray arterial
      }
      ctx.beginPath();
      ctx.moveTo(0, road.y);
      ctx.lineTo(w, road.y);
      ctx.stroke();
    });

    // Vertical Crossings
    [w * 0.2, w * 0.45, w * 0.75].forEach((vx, idx) => {
      ctx.lineWidth = 6;
      ctx.strokeStyle = idx === 1 && layers.roadClosures ? '#ef4444' : '#334155';
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx, h);
      ctx.stroke();
    });

    // Evacuation Corridors Layer (Green arrows / lines)
    if (layers.evacRoutes) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);

      // Route 1 to East Shelter
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.4);
      ctx.lineTo(w * 0.45, h * 0.22);
      ctx.lineTo(w * 0.8, h * 0.22);
      ctx.stroke();

      // Route 2 to South Shelter
      ctx.beginPath();
      ctx.moveTo(w * 0.4, h * 0.7);
      ctx.lineTo(w * 0.45, h * 0.82);
      ctx.lineTo(w * 0.6, h * 0.82);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Hazard Footprint Inundation Layer
    if (layers.hazardPerimeter) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Hospitals Layer
    if (layers.hospitals) {
      cityFacilities.filter(f => f.type === 'hospital').forEach(hosp => {
        const px = ((hosp.x + 36) / 72) * w;
        const py = ((hosp.z + 36) / 72) * h;

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#93c5fd';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(hosp.name.slice(0, 16), px + 10, py + 3);
      });
    }

    // Shelters Layer
    if (layers.shelters) {
      cityFacilities.filter(f => f.type === 'shelter').forEach(sh => {
        const px = ((sh.x + 36) / 72) * w;
        const py = ((sh.z + 36) / 72) * h;

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(sh.name.slice(0, 16), px + 10, py + 3);
      });
    }

    // Emergency Units Layer
    if (layers.emergencyUnits) {
      cityUnits.forEach(u => {
        const px = ((u.lon - currentCityMeta.coordinates.lng) * 400 + 36) / 72 * w;
        const py = ((currentCityMeta.coordinates.lat - u.lat) * 400 + 36) / 72 * h;
        const safePx = Math.max(20, Math.min(w - 20, px));
        const safePy = Math.max(20, Math.min(h - 20, py));

        ctx.fillStyle = u.type === 'ambulance' ? '#06b6d4' : '#f59e0b';
        ctx.beginPath();
        ctx.rect(safePx - 5, safePy - 5, 10, 10);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // Incidents Layer (Pulsing Red Beacons)
    if (layers.incidents) {
      cityIncidents.forEach(inc => {
        const px = ((inc.x + 36) / 72) * w;
        const py = ((inc.z + 36) / 72) * h;

        ctx.fillStyle = inc.priority === 'Critical' ? '#ef4444' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = inc.priority === 'Critical' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
  }, [layers, selectedCityId, cityIncidents, cityFacilities, cityUnits, currentCityMeta]);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-black text-white">Resource & Evacuation Tactical GIS Map</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            2D Orthographic cadastre for {currentCityMeta.name} displaying critical lifeline halos, road closures, designated evacuation corridors, and mobile fleet vectors.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
          <Compass className="w-3.5 h-3.5 text-blue-400" />
          <span>EPSG:3857 · MSL INDIAN GEODETIC DATUM</span>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (1 Col): Layer Toggles & Search */}
        <div className="space-y-4">
          {/* Layer Filter Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>GIS Layer Controls</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Active Incidents ({cityIncidents.length})
                </span>
                <input
                  type="checkbox"
                  checked={layers.incidents}
                  onChange={(e) => setLayers({ ...layers, incidents: e.target.checked })}
                  className="accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400/40 ring-1 ring-rose-400" />
                  Hazard Inundation Zone
                </span>
                <input
                  type="checkbox"
                  checked={layers.hazardPerimeter}
                  onChange={(e) => setLayers({ ...layers, hazardPerimeter: e.target.checked })}
                  className="accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Hospitals & Trauma Hubs
                </span>
                <input
                  type="checkbox"
                  checked={layers.hospitals}
                  onChange={(e) => setLayers({ ...layers, hospitals: e.target.checked })}
                  className="accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Evacuation Shelters
                </span>
                <input
                  type="checkbox"
                  checked={layers.shelters}
                  onChange={(e) => setLayers({ ...layers, shelters: e.target.checked })}
                  className="accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Emergency Fleet Vehicles
                </span>
                <input
                  type="checkbox"
                  checked={layers.emergencyUnits}
                  onChange={(e) => setLayers({ ...layers, emergencyUnits: e.target.checked })}
                  className="accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Safe Evacuation Corridors
                </span>
                <input
                  type="checkbox"
                  checked={layers.evacRoutes}
                  onChange={(e) => setLayers({ ...layers, evacRoutes: e.target.checked })}
                  className="accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  Impassable Road Barricades
                </span>
                <input
                  type="checkbox"
                  checked={layers.roadClosures}
                  onChange={(e) => setLayers({ ...layers, roadClosures: e.target.checked })}
                  className="accent-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Quick Selection / Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Explore Facilities & Units
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto text-xs pr-1">
              {cityFacilities.map(f => (
                <div
                  key={f.id}
                  onClick={() => setSelectedEntity(f)}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center justify-between"
                >
                  <span className="truncate max-w-[170px] font-semibold text-slate-300">{f.name}</span>
                  <span className="text-[9px] font-mono uppercase text-blue-400">{f.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (3 Cols): Interactive Canvas Viewport */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 h-[520px]">
            <canvas ref={canvasRef} width={900} height={520} className="w-full h-full block" />

            {/* Top Legend Overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl shadow text-[10px] text-slate-300 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Hazard Incursion
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Evacuation Corridors
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600" /> Impassable Road Slices
              </span>
            </div>

            {/* Selected Item Drawer */}
            {selectedEntity && (
              <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 max-w-sm w-full p-4 rounded-2xl shadow-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white truncate">{selectedEntity.name}</span>
                  <button onClick={() => setSelectedEntity(null)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[11px] text-slate-400">{selectedEntity.address}</div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Capacity: {selectedEntity.capacity}</span>
                  <span>Occupancy: {selectedEntity.current_occupancy}</span>
                  <span className="text-emerald-400 font-bold">{selectedEntity.status}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
