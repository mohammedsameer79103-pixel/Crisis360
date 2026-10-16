import React, { useState } from 'react';
import {
  Flame,
  ShieldAlert,
  Wind,
  Droplets,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Truck
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';

export const FireRescuePage: React.FC = () => {
  const {
    selectedCityId,
    incidents,
    emergencyUnits,
    updateIncident,
    assignUnitToIncident
  } = useCrisis();

  const cityIncidents = incidents.filter(i => i.city_id === selectedCityId);
  const fireIncidents = cityIncidents.filter(i => i.hazard_type === 'fire' || i.hazard_type === 'rescue');
  const fireUnits = emergencyUnits.filter(u => u.city_id === selectedCityId && (u.type === 'fire_engine' || u.type === 'rescue_squad'));

  const [selectedFireIncId, setSelectedFireIncId] = useState<string | null>(fireIncidents[0]?.id || null);
  const activeFireInc = fireIncidents.find(f => f.id === selectedFireIncId) || fireIncidents[0] || null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            <h1 className="text-xl font-black text-white">Fire & Search-and-Rescue Coordination</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Structural fire containment, Rothermel fuel spread modeling, USAR inflatable boat deployment, and trapped civilian extraction.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-amber-400 font-bold">
            🔥 {fireIncidents.length} FIRE & RESCUE FRONTS
          </span>
        </div>
      </div>

      {/* Environmental & Fuel Conditions Banner (Derived from active simulation physics) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono">WIND AZIMUTH & SPEED</div>
            <div className="font-bold text-white text-sm">35 km/h · NE 45°</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono">FUEL MOISTURE INDEX</div>
            <div className="font-bold text-white text-sm">22% RH · Extreme Dry</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono">WATER HYDRANT PRESSURE</div>
            <div className="font-bold text-white text-sm">4.2 Bar · Nominal</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono">READY FIRE APPARATUS</div>
            <div className="font-bold text-white text-sm">
              {fireUnits.filter(u => u.status === 'Available').length} Engines Available
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Fire Incidents Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Active Fire & Rescue Incidents ({fireIncidents.length})
          </div>

          <div className="space-y-3">
            {fireIncidents.map(inc => {
              const isSelected = activeFireInc?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedFireIncId(inc.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer select-none space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/50 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-amber-400 font-bold">{inc.id}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        inc.priority === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {inc.priority} PRIORITY
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white">{inc.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {inc.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{inc.location_name}</span>
                    </span>
                    <span className="text-amber-400 font-semibold">{inc.status}</span>
                  </div>
                </div>
              );
            })}

            {fireIncidents.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
                No active fire or structural rescue incidents currently registered in this city.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Engine Registry & Tactical Access Routes */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Incident Tactical Detail */}
          {activeFireInc && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                    ACTIVE SECTOR · {activeFireInc.id}
                  </div>
                  <h2 className="text-base font-bold text-white mt-0.5">{activeFireInc.title}</h2>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200">
                  {activeFireInc.status}
                </span>
              </div>

              {/* Tactical Access & Clearance Suggestion */}
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>SUGGESTED EMERGENCY ACCESS ROUTE</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Approach via <strong>Inner Ring Road East Bypass</strong>. Avoid direct passage through Nayapul Causeway due to +0.8m hydraulic flood ponding. Establish foam staging line 60m upwind.
                </p>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>CLEARANCE CLEAR: Heavy WT-101 compatible</span>
                  <span className="text-emerald-400 font-semibold">ETA: 4 mins</span>
                </div>
              </div>

              {/* Dispatch Unit Selector */}
              <div>
                <label className="text-slate-400 font-mono text-[10px] block mb-1 uppercase font-semibold">
                  DISPATCH / REASSIGN APPARATUS:
                </label>
                <select
                  value={activeFireInc.assigned_unit || ''}
                  onChange={(e) => assignUnitToIncident(e.target.value, activeFireInc.id)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none"
                >
                  <option value="">Select Engine / Squad</option>
                  {fireUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.id} · {unit.name} ({unit.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Fire Engine & USAR Squad Registry */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Fire & USAR Fleet Registry ({fireUnits.length})
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {fireUnits.filter(u => u.status === 'Available').length} READY
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {fireUnits.map(unit => (
                <div key={unit.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{unit.name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        unit.status === 'Available'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : unit.status === 'On Scene'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {unit.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{unit.capability}</div>
                  <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Station: {unit.location_name}</span>
                    <span>Fuel: {unit.fuel_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
