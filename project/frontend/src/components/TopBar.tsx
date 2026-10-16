import React from 'react';
import {
  Activity,
  Server,
  RefreshCw,
  Flame,
  Droplets,
  Zap,
  ShieldAlert,
  MapPin,
  ChevronDown,
  FileText
} from 'lucide-react';
import type { HazardType, CityId } from '../types/simulation';
import { CITIES_CATALOG } from '../services/cityData';

interface TopBarProps {
  cityId: CityId;
  hazardType: HazardType;
  simStatus: 'READY' | 'RUNNING' | 'PAUSED' | 'FORKED';
  timestampStr: string;
  isBackendConnected: boolean;
  onSelectCity: (cityId: CityId) => void;
  onApplyPreset: (presetKey: string) => void;
  onResetView: () => void;
  onOpenReportModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  cityId,
  hazardType,
  simStatus,
  timestampStr,
  isBackendConnected,
  onSelectCity,
  onApplyPreset,
  onResetView,
  onOpenReportModal
}) => {
  const activeCity = CITIES_CATALOG.find(c => c.id === cityId) || CITIES_CATALOG[0];

  const getHazardIcon = () => {
    switch (hazardType) {
      case 'flood':
        return <Droplets className="w-4 h-4 text-sky-200" />;
      case 'fire':
        return <Flame className="w-4 h-4 text-orange-200" />;
      case 'quake':
        return <Zap className="w-4 h-4 text-amber-200" />;
    }
  };

  const getHazardLabel = () => {
    switch (hazardType) {
      case 'flood':
        return 'HYDROLOGICAL FLOOD';
      case 'fire':
        return 'WILDFIRE INTERFACE';
      case 'quake':
        return 'SEISMIC FAULT RUPTURE';
    }
  };

  return (
    <header className="h-18 px-6 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 text-white flex items-center justify-between sticky top-0 z-50 shadow-md shadow-blue-900/10 backdrop-blur-md">
      {/* Consistent Crisis360 Branding */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center font-black text-white text-xl shadow-inner">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-black tracking-wide text-white uppercase drop-shadow-sm">
              CRISIS360 <span className="font-light text-blue-100">// INTELLIGENT DISASTER SIMULATION & RESPONSE</span>
            </h1>
            <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white backdrop-blur-sm">
              INDIAN METRO TWINS
            </span>
          </div>
          <p className="text-[11px] font-medium tracking-wider text-blue-100/90">
            {activeCity.title} · Multi-Branch Decision Intelligence Platform
          </p>
        </div>
      </div>

      {/* City Switcher & Status Indicators */}
      <div className="hidden lg:flex items-center gap-3">
        {/* City Switcher Pill */}
        <div className="relative flex items-center bg-white/20 border border-white/30 rounded-full px-3 py-1.5 backdrop-blur-md">
          <MapPin className="w-4 h-4 text-yellow-300 mr-1.5 shrink-0" />
          <select
            value={cityId}
            onChange={(e) => onSelectCity(e.target.value as CityId)}
            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-4"
          >
            <option value="hyderabad" className="text-slate-800">🇮🇳 Hyderabad (Musi River)</option>
            <option value="chennai" className="text-slate-800">🇮🇳 Chennai (Marina & Cooum)</option>
            <option value="mumbai" className="text-slate-800">🇮🇳 Mumbai (Mithi & Coast)</option>
            <option value="bengaluru" className="text-slate-800">🇮🇳 Bengaluru (Lake Cascade)</option>
            <option value="delhi" className="text-slate-800">🇮🇳 Delhi (Yamuna Khadar)</option>
            <option value="visakhapatnam" className="text-slate-800">🇮🇳 Visakhapatnam (Bay of Bengal)</option>
          </select>
        </div>

        {/* Active Hazard Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md shadow-sm">
          {getHazardIcon()}
          <span className="text-xs font-bold tracking-wide text-white">
            {getHazardLabel()}
          </span>
        </div>

        {/* Sim Status & Clock */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md shadow-sm">
          <Activity className="w-4 h-4 text-emerald-300 animate-pulse" />
          <span className="text-xs font-semibold text-blue-100">
            STATUS: <strong className="text-white">{simStatus}</strong>
          </span>
          <span className="text-xs font-mono font-bold text-white bg-blue-900/40 px-2 py-0.5 rounded-full border border-white/20">
            {timestampStr}
          </span>
        </div>

        {/* Backend Status */}
        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md shadow-sm"
          title={isBackendConnected ? 'Connected to Python FastAPI & NetworkX backend' : 'Running standalone client simulation engine'}
        >
          <Server className={`w-3.5 h-3.5 ${isBackendConnected ? 'text-emerald-300' : 'text-amber-300'}`} />
          <span className="text-[11px] font-medium tracking-wide text-blue-100">
            {isBackendConnected ? 'FASTAPI CORE: ONLINE' : 'CLIENT ENGINE: ACTIVE'}
          </span>
          <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-300 animate-ping' : 'bg-amber-300'}`} />
        </div>
      </div>

      {/* Right Controls & Scenario Presets */}
      <div className="flex items-center gap-2.5">
        <select
          onChange={(e) => onApplyPreset(e.target.value)}
          defaultValue=""
          className="bg-white/20 text-white text-xs font-semibold border border-white/30 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer backdrop-blur-md transition hover:bg-white/30"
        >
          <option value="" disabled className="text-slate-800">Select Validated Scenario...</option>
          <option value="hyderabad_musi_flood" className="text-slate-800">🌊 Hyderabad: Musi River Flash Flood</option>
          <option value="chennai_cyclone_surge" className="text-slate-800">🌊 Chennai: Marina Beach Cyclone Surge</option>
          <option value="mumbai_mithi_cloudburst" className="text-slate-800">🌊 Mumbai: Mithi River High Tide Surcharge</option>
          <option value="bengaluru_lake_breach" className="text-slate-800">🌊 Bengaluru: Bellandur Lake Bund Breach</option>
          <option value="delhi_yamuna_breach" className="text-slate-800">🌊 Delhi: Hathnikund Barrage Discharge</option>
          <option value="vizag_cyclone_surge" className="text-slate-800">🌊 Vizag: Coastal Marine Overwash</option>
        </select>

        {onOpenReportModal && (
          <button
            onClick={onOpenReportModal}
            className="px-3.5 py-2 rounded-full bg-white/20 border border-white/30 text-white hover:bg-white/30 transition shadow-sm text-xs font-bold flex items-center gap-1.5 backdrop-blur-md"
            title="Export Incident Situation Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SITREP</span>
          </button>
        )}

        <button
          onClick={onResetView}
          className="p-2.5 rounded-full bg-white/20 border border-white/30 text-white hover:bg-white/30 transition shadow-sm"
          title="Reset Camera Orientation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
