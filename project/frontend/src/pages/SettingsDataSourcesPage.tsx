import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Database,
  Compass,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileCode,
  Key
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';

export const SettingsDataSourcesPage: React.FC = () => {
  const { isBackendConnected, resetToDemoData, selectedCityId, showToast } = useCrisis();
  const [isResetting, setIsResetting] = useState(false);

  const googleApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all operational records back to the default demonstration seed?')) {
      setIsResetting(true);
      await resetToDemoData();
      setIsResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-black text-white">Settings & Geodetic Data Sources</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System configuration, Google Photorealistic 3D Tiles credentials, FastAPI server status, and spatial datum integrity.
          </p>
        </div>

        <button
          onClick={handleResetData}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600/90 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition self-start sm:self-auto shrink-0"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>RESET DEMO DATA SEED</span>
        </button>
      </div>

      {/* Section 1: Google Photorealistic 3D Tiles Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Google Photorealistic 3D Tiles API</h2>
              <p className="text-xs text-slate-400">OGC 3D Tiles geospatial stream from Google Map Tiles API</p>
            </div>
          </div>

          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl ${
              googleApiKey
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {googleApiKey ? 'API KEY CONFIGURED' : 'SYNTHETIC FALLBACK ACTIVE'}
          </span>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            When <code className="text-amber-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> is set in the environment, the 3D viewport enables streaming of authentic 3D photorealistic mesh data under standard Google attribution guidelines (<strong>Map data © 2026 Google</strong>).
          </p>
          <p>
            In the absence of an API key, Crisis360 runs on its <strong>Deterministic Synthetic Digital Twin</strong> with bilinear elevation sampling, slope foundation plinths, and hierarchical road parcel setbacks.
          </p>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-500" />
              <span>Current Key:</span>
              <span className="text-slate-200">
                {googleApiKey ? `${googleApiKey.slice(0, 6)}••••••••••••${googleApiKey.slice(-4)}` : 'Not Set (Graceful Fallback Mode)'}
              </span>
            </div>
            <span className="text-slate-500 text-[10px]">Configured via .env or Vite environment</span>
          </div>
        </div>
      </div>

      {/* Section 2: Spatial Coordinate Reference System (CRS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Geodetic Datum & Spatial Projection</h2>
            <p className="text-xs text-slate-400">Cartographic parameters governing elevation, parcels, and coordinates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="font-mono text-[10px] text-slate-400 uppercase">HORIZONTAL COORDINATE SYSTEM</div>
            <div className="font-bold text-white">WGS84 / Web Mercator (EPSG:3857)</div>
            <div className="text-[11px] text-slate-400">Standard geographic projection aligned with municipal cadastre</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="font-mono text-[10px] text-slate-400 uppercase">VERTICAL HEIGHT DATUM</div>
            <div className="font-bold text-white">Mean Sea Level (MSL) Indian Geodetic Datum</div>
            <div className="text-[11px] text-slate-400">Bilinear interpolated topography with 0.45m foundation plinths</div>
          </div>
        </div>
      </div>

      {/* Section 3: Backend Core Engine & Database Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">FastAPI Core Simulation Engine & Database</h2>
              <p className="text-xs text-slate-400">Python 3 backend with SQLite persistence and NetworkX routing</p>
            </div>
          </div>

          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl ${
              isBackendConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {isBackendConnected ? 'FASTAPI ONLINE' : 'CLIENT DIGITAL TWIN'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">BACKEND HOST</span>
            <span className="text-white font-bold">http://127.0.0.1:8000</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">DATABASE ENGINE</span>
            <span className="text-white font-bold">SQLite 3 (simulation.db)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">GRAPH SOLVER</span>
            <span className="text-white font-bold">NetworkX 3.2.1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
