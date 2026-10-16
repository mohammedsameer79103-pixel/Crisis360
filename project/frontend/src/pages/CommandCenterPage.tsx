import React, { useRef, useEffect } from 'react';
import {
  AlertTriangle,
  Users,
  ShieldCheck,
  Ambulance,
  Flame,
  Building2,
  HandHeart,
  Activity,
  ArrowRight,
  PlusCircle,
  Radio,
  FileText,
  MapPin,
  Clock,
  Compass,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { CITIES_CATALOG } from '../services/cityData';

interface CommandCenterPageProps {
  onOpenReportModal: () => void;
  onOpenSitRepModal: () => void;
}

export const CommandCenterPage: React.FC<CommandCenterPageProps> = ({
  onOpenReportModal,
  onOpenSitRepModal
}) => {
  const {
    selectedCityId,
    incidents,
    emergencyUnits,
    medicalRequests,
    reliefRequests,
    facilities,
    volunteers,
    setActivePage,
    setActiveIncidentId
  } = useCrisis();

  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const currentCityMeta = CITIES_CATALOG.find(c => c.id === selectedCityId) || CITIES_CATALOG[0];

  // Derived KPIs from actual records
  const cityIncidents = incidents.filter(i => i.city_id === selectedCityId);
  const activeIncidents = cityIncidents.filter(i => i.status !== 'Resolved');
  const criticalIncidents = activeIncidents.filter(i => i.priority === 'Critical');

  const cityUnits = emergencyUnits.filter(u => u.city_id === selectedCityId);
  const availableAmbulances = cityUnits.filter(u => u.type === 'ambulance' && u.status === 'Available');
  const availableFireEngines = cityUnits.filter(u => u.type === 'fire_engine' && u.status === 'Available');
  const availableRescueSquads = cityUnits.filter(u => u.type === 'rescue_squad' && u.status === 'Available');

  const cityFacilities = facilities.filter(f => f.city_id === selectedCityId);
  const hospitals = cityFacilities.filter(f => f.type === 'hospital');
  const shelters = cityFacilities.filter(f => f.type === 'shelter');
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const currentShelterOccupancy = shelters.reduce((acc, s) => acc + s.current_occupancy, 0);

  const cityMedRequests = medicalRequests.filter(m => m.city_id === selectedCityId);
  const pendingMedRequests = cityMedRequests.filter(m => m.status !== 'Resolved');

  const cityReliefRequests = reliefRequests.filter(r => r.city_id === selectedCityId);
  const pendingRelief = cityReliefRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled');
  const totalReliefDelivered = cityReliefRequests.reduce((acc, r) => acc + r.quantity_delivered, 0);
  const totalReliefDemanded = cityReliefRequests.reduce((acc, r) => acc + r.quantity_requested, 0);

  const totalAffectedPeople = activeIncidents.reduce((acc, i) => acc + i.affected_count, 0);
  const vulnerableEstimated = Math.round(totalAffectedPeople * 0.28);

  // Render 2D Tactical Mini-Map Preview
  useEffect(() => {
    const canvas = miniMapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // River / Water Line
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.bezierCurveTo(w * 0.3, h * 0.45, w * 0.7, h * 0.55, w, h * 0.5);
    ctx.stroke();

    // Road Grid Lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    [0.25, 0.5, 0.75].forEach(pct => {
      ctx.beginPath();
      ctx.moveTo(0, h * pct);
      ctx.lineTo(w, h * pct);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * pct, 0);
      ctx.lineTo(w * pct, h);
      ctx.stroke();
    });

    // Plot Hospitals (Blue crosses)
    hospitals.forEach(hosp => {
      const px = ((hosp.x + 36) / 72) * w;
      const py = ((hosp.z + 36) / 72) * h;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Plot Shelters (Emerald dots)
    shelters.forEach(sh => {
      const px = ((sh.x + 36) / 72) * w;
      const py = ((sh.z + 36) / 72) * h;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Plot Incidents (Pulsing Red / Amber beacons)
    cityIncidents.forEach(inc => {
      const px = ((inc.x + 36) / 72) * w;
      const py = ((inc.z + 36) / 72) * h;
      ctx.fillStyle = inc.priority === 'Critical' ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Beacon halo
      ctx.strokeStyle = inc.priority === 'Critical' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.stroke();
    });
  }, [selectedCityId, cityIncidents, hospitals, shelters]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Top Banner / Headline */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/80 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
              SITUATIONAL INTELLIGENCE OVERVIEW
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-300">
              {currentCityMeta.name} Metropolitan Area
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Command Center Operations
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Real-time emergency telemetry for {currentCityMeta.name}. Integrated data stream synchronizing
            authoritative field incidents, dispatched rescue units, medical triage, and humanitarian relief distribution.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>LOG INCIDENT</span>
          </button>
          <button
            onClick={() => setActivePage('simulation_lab')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
          >
            <Zap className="w-4 h-4" />
            <span>RUN 3D SIMULATION</span>
          </button>
          <button
            onClick={onOpenSitRepModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <FileText className="w-4 h-4" />
            <span>EXPORT SITREP</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Summary Cards (All calculated directly from data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Incidents */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{activeIncidents.length}</span>
            <span className="text-xs font-semibold text-rose-400">
              {criticalIncidents.length} Critical
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Resolved in last 24h:</span>
            <span className="font-mono font-bold text-slate-300">
              {cityIncidents.filter(i => i.status === 'Resolved').length}
            </span>
          </div>
        </div>

        {/* KPI 2: Population at Risk */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Affected Citizens</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {totalAffectedPeople.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              ESTIMATED
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Vulnerable (Elderly/Minors):</span>
            <span className="font-mono font-bold text-slate-300">
              ~{vulnerableEstimated.toLocaleString()}
            </span>
          </div>
        </div>

        {/* KPI 3: Available Emergency Units */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Fleet Readiness</span>
            <Ambulance className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {availableAmbulances.length + availableFireEngines.length}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              of {cityUnits.length} total units
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ambulance / Fire:</span>
            <span className="font-mono font-bold text-slate-300">
              {availableAmbulances.length} ALS / {availableFireEngines.length} WT
            </span>
          </div>
        </div>

        {/* KPI 4: Shelter Capacity */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Shelter Occupancy</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {totalShelterCapacity > 0 ? Math.round((currentShelterOccupancy / totalShelterCapacity) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              {currentShelterOccupancy.toLocaleString()} / {totalShelterCapacity.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Active Shelters:</span>
            <span className="font-mono font-bold text-slate-300">
              {shelters.filter(s => s.status === 'operational').length} operational
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2D Tactical Map Preview + Active Incidents Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tactical Map Preview & Resource Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tactical Mini-Map Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Metropolitan Tactical Overview · {currentCityMeta.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Incidents
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Hospitals
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Shelters
                </span>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-inner h-64 bg-slate-950">
              <canvas ref={miniMapRef} width={640} height={256} className="w-full h-full block" />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-950/80 backdrop-blur rounded-lg border border-slate-800 text-[9px] font-mono text-slate-400">
                PROJECTION: EPSG:3857 | MSL DATUM
              </div>
              <button
                onClick={() => setActivePage('evacuation_map')}
                className="absolute top-2 right-2 px-2.5 py-1 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow transition"
              >
                <span>OPEN FULL GIS MAP</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Pending Demands & Critical Resource Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medical Triage Queue Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Medical Triage Queue
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                  {pendingMedRequests.length} PENDING
                </span>
              </div>

              <div className="space-y-2">
                {pendingMedRequests.slice(0, 3).map(med => (
                  <div
                    key={med.id}
                    onClick={() => setActivePage('medical_ambulance')}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            med.triage_category === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                        <span>{med.location_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                        {med.assistance_required} ({med.patient_count} patients)
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {med.status}
                    </span>
                  </div>
                ))}
                {pendingMedRequests.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    All medical triage requests resolved.
                  </div>
                )}
              </div>
            </div>

            {/* Relief Supply Pipeline Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HandHeart className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Humanitarian Relief Pipeline
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {pendingRelief.length} ACTIVE
                </span>
              </div>

              <div className="space-y-2">
                {cityReliefRequests.slice(0, 3).map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => setActivePage('relief_assistance')}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate">{rel.item_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {rel.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{rel.location_name}</span>
                      <span className="font-mono">
                        {rel.quantity_delivered} / {rel.quantity_requested} {rel.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Active Incident Queue & Operations Feed */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Incident Queue ({activeIncidents.length})
                </span>
              </div>
              <button
                onClick={() => setActivePage('emergency_response')}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                View Queue →
              </button>
            </div>

            <div className="space-y-2.5">
              {cityIncidents.slice(0, 4).map(inc => (
                <div
                  key={inc.id}
                  onClick={() => {
                    setActiveIncidentId(inc.id);
                    setActivePage('emergency_response');
                  }}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white group-hover:text-blue-400 transition truncate max-w-[180px]">
                      {inc.title}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        inc.priority === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : inc.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {inc.priority}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 line-clamp-2">
                    {inc.description}
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{inc.location_name}</span>
                    </span>
                    <span className="text-blue-400 font-semibold">{inc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Volunteer Readiness Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Civil Defense Volunteer Roster
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {volunteers.filter(v => v.status === 'Active').length} READY
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {volunteers.slice(0, 3).map(v => (
                <div key={v.id} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{v.name}</div>
                    <div className="text-[10px] text-slate-400">{v.assigned_task || 'On Standby'}</div>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                    {v.availability}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
