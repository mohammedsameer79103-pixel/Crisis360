import React, { useState } from 'react';
import {
  Sliders,
  ChevronDown,
  ChevronUp,
  GitFork,
  Wind,
  Shield,
  Gauge,
  MapPin,
  Waves,
  Compass,
  Flame,
  Activity
} from 'lucide-react';
import type { ScenarioConfig, HazardType, PopulationMode, CityId, FloodSourceType } from '../types/simulation';
import { CITIES_CATALOG } from '../services/cityData';

interface ScenarioControlsProps {
  config: ScenarioConfig;
  onChangeConfig: (updated: Partial<ScenarioConfig>) => void;
  onForkBranches: () => void;
  isForking: boolean;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  config,
  onChangeConfig,
  onForkBranches,
  isForking
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeCity = CITIES_CATALOG.find(c => c.id === config.city_id) || CITIES_CATALOG[0];

  const getEnvLabel = () => {
    switch (config.hazard_type) {
      case 'flood':
        return { name: 'Catchment Rainfall Rate', unit: 'mm/hr', val: `${Math.round(config.weather_intensity * 1.5)} mm/h` };
      case 'fire':
        return { name: 'Gale Wind Vector', unit: 'km/h', val: `${Math.round(20 + config.weather_intensity * 0.6)} km/h` };
      case 'quake':
        return { name: 'Soil Amplification', unit: 'coeff', val: `${(1.0 + config.weather_intensity * 0.015).toFixed(2)}x` };
    }
  };

  const env = getEnvLabel();

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
              Scenario Configuration
            </h2>
            <div className="text-[10px] text-slate-500 font-medium">Crisis360 Decision Engine</div>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
          WHAT-IF CONTROLS
        </span>
      </div>

      {/* Control Sliders & Inputs */}
      <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* City Selection */}
        <div className="space-y-1.5">
          <label className="text-slate-700 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Indian Metropolitan Twin
            </span>
            <span className="text-[10px] font-bold text-blue-600 uppercase">LOCATION</span>
          </label>
          <select
            value={config.city_id}
            onChange={(e) => onChangeConfig({ city_id: e.target.value as CityId })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm text-xs"
          >
            <option value="hyderabad">🇮🇳 Hyderabad (Musi Basin & HITEC City)</option>
            <option value="chennai">🇮🇳 Chennai (Marina Coast & Adyar Basin)</option>
            <option value="mumbai">🇮🇳 Mumbai (Mithi River & Sea Link)</option>
            <option value="bengaluru">🇮🇳 Bengaluru (Bellandur Lake Cascade)</option>
            <option value="delhi">🇮🇳 Delhi (Yamuna Khadar Floodplain)</option>
            <option value="visakhapatnam">🇮🇳 Visakhapatnam (Bay of Bengal & Port)</option>
          </select>
          <div className="text-[10px] text-slate-500 italic px-1">
            {activeCity.description}
          </div>
        </div>

        {/* Disaster Type */}
        <div className="space-y-1.5">
          <label className="text-slate-700 font-semibold flex items-center justify-between">
            <span>Disaster Threat Vector</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase">PRIMARY HAZARD</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onChangeConfig({ hazard_type: 'flood' })}
              className={`py-2 px-1 text-xs font-bold rounded-xl border transition flex flex-col items-center gap-1 ${
                config.hazard_type === 'flood'
                  ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">🌊</span>
              <span>FLOOD</span>
            </button>
            <button
              onClick={() => onChangeConfig({ hazard_type: 'fire' })}
              className={`py-2 px-1 text-xs font-bold rounded-xl border transition flex flex-col items-center gap-1 ${
                config.hazard_type === 'fire'
                  ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">🔥</span>
              <span>WILDFIRE</span>
            </button>
            <button
              onClick={() => onChangeConfig({ hazard_type: 'quake' })}
              className={`py-2 px-1 text-xs font-bold rounded-xl border transition flex flex-col items-center gap-1 ${
                config.hazard_type === 'quake'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">⚡</span>
              <span>SEISMIC</span>
            </button>
          </div>
        </div>

        {/* Flood Specific: Source Type Selection */}
        {config.hazard_type === 'flood' && (
          <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
            <label className="text-blue-900 font-bold flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-blue-600" />
                Flood Origin Source
              </span>
              <span className="text-[9px] font-mono text-blue-700 uppercase">3D PIN MARKER</span>
            </label>
            <select
              value={config.flood_source_type}
              onChange={(e) => onChangeConfig({ flood_source_type: e.target.value as FloodSourceType })}
              className="w-full bg-white border border-blue-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              {activeCity.flood_sources.map(src => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </select>
            <div className="text-[10px] text-blue-700 font-normal">
              {activeCity.flood_sources.find(s => s.id === config.flood_source_type)?.desc || activeCity.flood_sources[0].desc}
            </div>
          </div>
        )}

        {/* Editable hazard origin: local coordinates on the current city's 3D twin */}
        <div className="space-y-2 p-3 rounded-xl bg-cyan-50/60 border border-cyan-200">
          <label className="text-cyan-950 font-bold flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cyan-700" /> Editable Disaster Source Location</span>
            <span className="text-[9px] font-mono text-cyan-700 uppercase">3D ORIGIN</span>
          </label>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Choose any point inside the active 3D city: click PLACE DISASTER SOURCE in the scene, or enter X/Z coordinates here. Select another city to model a different supported metro. Coordinates are local to this synthetic city twin, not GPS coordinates.
          </p>
          {(() => {
            const defaultOrigin = config.hazard_type === 'flood'
              ? (activeCity.flood_sources.find(s => s.id === config.flood_source_type) || activeCity.flood_sources[0]).origin
              : config.hazard_type === 'fire' ? activeCity.wildfire_source.origin : activeCity.seismic_source.origin;
            const sourceX = config.source_x ?? defaultOrigin[0];
            const sourceZ = config.source_z ?? defaultOrigin[1];
            return (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-semibold text-slate-700">X coordinate
                    <input aria-label="Disaster source X coordinate" type="number" min={-38} max={38} step={0.5}
                      value={sourceX} onChange={e => onChangeConfig({ source_x: Math.max(-38, Math.min(38, Number(e.target.value))), source_z: sourceZ })}
                      className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-2 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  </label>
                  <label className="text-[10px] font-semibold text-slate-700">Z coordinate
                    <input aria-label="Disaster source Z coordinate" type="number" min={-38} max={38} step={0.5}
                      value={sourceZ} onChange={e => onChangeConfig({ source_x: sourceX, source_z: Math.max(-38, Math.min(38, Number(e.target.value))) })}
                      className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-2 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  </label>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-cyan-800 font-mono">Origin: {sourceX.toFixed(1)}, {sourceZ.toFixed(1)}</span>
                  <button type="button" onClick={() => onChangeConfig({ source_x: undefined, source_z: undefined })}
                    className="text-[10px] font-bold text-cyan-800 underline underline-offset-2">Use suggested origin</button>
                </div>
              </>
            );
          })()}
        </div>

        {/* Wildfire Specific: Wind & Fuel */}
        {config.hazard_type === 'fire' && (
          <div className="space-y-2 p-3 rounded-xl bg-orange-50/50 border border-orange-100">
            <div className="flex justify-between items-center text-orange-950 font-bold text-[11px]">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-orange-600" />
                Wildfire Fuel & Wind Vector
              </span>
              <span className="text-orange-700 font-mono">{config.fuel_density || 60}% Fuel</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={config.fuel_density || 60}
              onChange={(e) => onChangeConfig({ fuel_density: Number(e.target.value) })}
              className="w-full accent-orange-600 h-1.5 bg-orange-200/60 rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-orange-800">
              Origin: {activeCity.wildfire_source.name}
            </div>
          </div>
        )}

        {/* Earthquake Specific: Magnitude & Aftershocks */}
        {config.hazard_type === 'quake' && (
          <div className="space-y-2 p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <div className="flex justify-between items-center text-rose-950 font-bold text-[11px]">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-rose-600" />
                Seismic Moment Magnitude
              </span>
              <span className="text-rose-700 font-mono font-bold">Mw {config.magnitude || 7.2}</span>
            </div>
            <input
              type="range"
              min="50"
              max="85"
              value={(config.magnitude || 7.2) * 10}
              onChange={(e) => onChangeConfig({ magnitude: Number(e.target.value) / 10 })}
              className="w-full accent-rose-600 h-1.5 bg-rose-200/60 rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-rose-800">
              Fault: {activeCity.seismic_source.name} · Aftershock at T+03:00
            </div>
          </div>
        )}

        {/* Severity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700">
            <span className="flex items-center gap-1.5 font-semibold">
              <Gauge className="w-3.5 h-3.5 text-rose-600" />
              Event Severity Index
            </span>
            <span className="font-bold text-rose-600 text-sm">{config.severity}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={config.severity}
            onChange={(e) => onChangeConfig({ severity: Number(e.target.value) })}
            className="w-full accent-rose-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Moderate (20%)</span>
            <span>Severe (60%)</span>
            <span>Catastrophic (100%)</span>
          </div>
        </div>

        {/* Environmental Parameter Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700">
            <span className="flex items-center gap-1.5 font-semibold">
              <Wind className="w-3.5 h-3.5 text-blue-600" />
              {env.name}
            </span>
            <span className="font-bold text-blue-600 text-sm">{env.val}</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={config.weather_intensity}
            onChange={(e) => onChangeConfig({ weather_intensity: Number(e.target.value) })}
            className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
          />
        </div>

        {/* Response Resources Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700">
            <span className="flex items-center gap-1.5 font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Available Emergency Fleet
            </span>
            <span className="font-bold text-emerald-600 text-sm">{config.response_resources}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={config.response_resources}
            onChange={(e) => onChangeConfig({ response_resources: Number(e.target.value) })}
            className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Severe Shortage</span>
            <span>Standard Fleet</span>
            <span>Full Mobilization</span>
          </div>
        </div>

        {/* Population Density Mode */}
        <div className="space-y-1.5">
          <label className="text-slate-700 font-semibold flex items-center justify-between">
            <span>Ward Population Density</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase">CENSUS</span>
          </label>
          <select
            value={config.population_mode}
            onChange={(e) => onChangeConfig({ population_mode: e.target.value as PopulationMode })}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm text-xs"
          >
            <option value="low">Low Density · 12,000 residents / ward</option>
            <option value="medium">Medium Density · 28,000 residents / ward</option>
            <option value="high">High Density · 46,000 residents / ward</option>
          </select>
        </div>

        {/* Advanced Solver Accordion */}
        <div className="pt-1">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 p-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 transition"
          >
            <span>Advanced Domain Solver Parameters</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[10px] font-mono text-slate-600">
              <div className="flex justify-between">
                <span>City Coordinates:</span>
                <span className="font-bold text-slate-800">{activeCity.coordinates.lat}°N, {activeCity.coordinates.lng}°E</span>
              </div>
              <div className="flex justify-between">
                <span>Hydraulic Cell Grid:</span>
                <span className="font-bold text-slate-800">48 × 48 Finite Diff</span>
              </div>
              <div className="flex justify-between">
                <span>Rothermel Surface Spread:</span>
                <span className="font-bold text-slate-800">Fuel Model 4 (Subtropical Scrub)</span>
              </div>
              <div className="flex justify-between">
                <span>Seismic Attenuation:</span>
                <span className="font-bold text-slate-800">Joyner-Boore (1981)</span>
              </div>
              <div className="flex justify-between">
                <span>Evacuation Graph:</span>
                <span className="font-bold text-slate-800">NetworkX Shortest Path</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fork Futures Primary Pill Action Button */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={onForkBranches}
          disabled={isForking}
          className={`w-full py-3.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
            isForking
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white shadow-blue-500/25 active:scale-98'
          }`}
        >
          <GitFork className={`w-4 h-4 ${isForking ? 'animate-spin' : ''}`} />
          <span>{isForking ? 'RECALCULATING THREE FUTURES...' : 'FORK THREE FUTURES'}</span>
        </button>
        <div className="text-[10px] text-center text-slate-400 mt-2 font-medium">
          Simulates 3 independent futures from matching initial state in {activeCity.name}
        </div>
      </div>
    </div>
  );
};
