import React from 'react';
import type { BuildingData, DamageStage } from '../types/simulation';
import { X, Building, ShieldCheck, AlertCircle, DollarSign, Users, MapPin } from 'lucide-react';

interface BuildingInspectorModalProps {
  building: BuildingData | null;
  onClose: () => void;
  damagePct: number;
  damageStage: DamageStage;
}

export const BuildingInspectorModal: React.FC<BuildingInspectorModalProps> = ({
  building,
  onClose,
  damagePct,
  damageStage
}) => {
  if (!building) return null;

  const integrityPct = Math.max(0, Math.round(100 - damagePct));

  return (
    <div className="absolute top-20 right-6 w-84 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-4 z-40 text-xs animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs leading-tight">
              {building.name}
            </h4>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              ID: {building.id} · {building.type.toUpperCase()}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Structural Telemetry */}
      <div className="py-3 space-y-3">
        {/* Integrity Gauge */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-slate-600 font-medium">Structural Integrity</span>
            <span className={`font-mono font-bold ${
              integrityPct > 70 ? 'text-emerald-600' : (integrityPct > 35 ? 'text-amber-600' : 'text-rose-600')
            }`}>
              {integrityPct}% ({damageStage.toUpperCase()})
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                integrityPct > 70 ? 'bg-emerald-500' : (integrityPct > 35 ? 'bg-amber-500' : 'bg-rose-500')
              }`}
              style={{ width: `${integrityPct}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-600" />
              Occupants
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {building.occupants.toLocaleString()}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              Replacement Cost
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              ₹{building.replacement_cost_cr} Cr
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-[10px] text-slate-500">Floors</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {building.floors} Levels
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-600" />
              Coordinates
            </div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              ({building.x}, {building.z})
            </div>
          </div>
        </div>

        {/* Vulnerability Matrix */}
        <div className="pt-2 border-t border-slate-100 text-[10px] space-y-1.5 text-slate-500">
          <div className="flex justify-between">
            <span>Structural Fragility:</span>
            <span className="font-mono text-slate-700 font-semibold">{(building.structural_vulnerability * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Flood Clearance Threshold:</span>
            <span className="font-mono text-slate-700 font-semibold">{building.flood_tolerance} m</span>
          </div>
          <div className="flex justify-between">
            <span>Seismic Shear Resistance:</span>
            <span className="font-mono text-slate-700 font-semibold">{(building.seismic_resistance * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
