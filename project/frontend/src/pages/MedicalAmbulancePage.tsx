import React, { useState } from 'react';
import {
  Ambulance,
  HeartPulse,
  Activity,
  Hospital,
  AlertTriangle,
  PlusCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Filter,
  ShieldAlert,
  ArrowRight,
  BatteryCharging,
  Fuel
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import type { TriageCategory, MedicalStatus } from '../types/crisis';

export const MedicalAmbulancePage: React.FC = () => {
  const {
    selectedCityId,
    medicalRequests,
    emergencyUnits,
    facilities,
    createMedicalRequest,
    updateMedicalRequest
  } = useCrisis();

  const [triageFilter, setTriageFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New request form state
  const [newLocation, setNewLocation] = useState('');
  const [newAssistance, setNewAssistance] = useState('');
  const [newPatients, setNewPatients] = useState(1);
  const [newTriage, setNewTriage] = useState<TriageCategory>('Urgent');

  const cityMedRequests = medicalRequests.filter(m => m.city_id === selectedCityId);
  const cityAmbulances = emergencyUnits.filter(u => u.city_id === selectedCityId && u.type === 'ambulance');
  const cityHospitals = facilities.filter(f => f.city_id === selectedCityId && f.type === 'hospital');

  const filteredRequests = cityMedRequests.filter(req => {
    if (triageFilter !== 'all' && req.triage_category !== triageFilter) return false;
    return true;
  });

  const triageColors: Record<TriageCategory, { badge: string; dot: string; label: string }> = {
    Critical: { badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30', dot: 'bg-rose-500', label: 'RED · CRITICAL' },
    Urgent: { badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', dot: 'bg-amber-500', label: 'YELLOW · URGENT' },
    Moderate: { badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', dot: 'bg-emerald-500', label: 'GREEN · MODERATE' },
    Minor: { badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', dot: 'bg-blue-500', label: 'BLUE · MINOR' }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim() || !newAssistance.trim()) return;

    await createMedicalRequest({
      city_id: selectedCityId,
      location_name: newLocation.trim(),
      assistance_required: newAssistance.trim(),
      patient_count: Number(newPatients),
      triage_category: newTriage
    });

    setIsModalOpen(false);
    setNewLocation('');
    setNewAssistance('');
    setNewPatients(1);
  };

  const handleAssignAmbulance = async (reqId: string, unitId: string) => {
    await updateMedicalRequest(reqId, {
      assigned_unit_id: unitId || null,
      status: unitId ? 'Assigned' : 'Requested',
      note: `Assigned ambulance ${unitId}`
    });
  };

  const handleAssignHospital = async (reqId: string, hospId: string) => {
    await updateMedicalRequest(reqId, {
      assigned_hospital_id: hospId || null,
      note: `Designated destination facility: ${hospId}`
    });
  };

  const handleStatusAdvance = async (reqId: string, nextStatus: MedicalStatus) => {
    await updateMedicalRequest(reqId, {
      status: nextStatus,
      note: `Medical triage status advanced to ${nextStatus}`
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Ambulance className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-black text-white">Medical Triage & Ambulance Coordination</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Emergency patient intake, standardized mass-casualty triage categorization, ALS/BLS fleet tracking, and hospital capacity alignment.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>REQUEST MEDICAL DISPATCH</span>
        </button>
      </div>

      {/* KPI Triage Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {(['Critical', 'Urgent', 'Moderate', 'Minor'] as TriageCategory[]).map(cat => {
          const count = cityMedRequests.filter(m => m.triage_category === cat && m.status !== 'Resolved').length;
          const conf = triageColors[cat];

          return (
            <div
              key={cat}
              onClick={() => setTriageFilter(triageFilter === cat ? 'all' : cat)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                triageFilter === cat ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">{cat} Triage</span>
                <span className={`w-2.5 h-2.5 rounded-full ${conf.dot}`} />
              </div>
              <div className="text-2xl font-black text-white mt-1.5">{count}</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">{conf.label}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Medical Request Queue + Ambulance Fleet & Hospitals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Patient Requests Queue */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Patient Requests Queue ({filteredRequests.length})</span>
            {triageFilter !== 'all' && (
              <button onClick={() => setTriageFilter('all')} className="text-blue-400 hover:underline">
                Clear Filter
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredRequests.map(req => {
              const conf = triageColors[req.triage_category];
              const assignedUnit = cityAmbulances.find(u => u.id === req.assigned_unit_id);
              const assignedHosp = cityHospitals.find(h => h.id === req.assigned_hospital_id);

              return (
                <div key={req.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-400 font-bold">{req.id}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${conf.badge}`}>
                        {req.triage_category}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {req.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{req.assistance_required}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{req.location_name}</span>
                      </span>
                      <span>•</span>
                      <span>{req.patient_count} patient(s)</span>
                    </div>
                  </div>

                  {/* Assignment Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">ASSIGN AMBULANCE:</div>
                      <select
                        value={req.assigned_unit_id || ''}
                        onChange={(e) => handleAssignAmbulance(req.id, e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs font-semibold focus:outline-none"
                      >
                        <option value="">Select Ambulance</option>
                        {cityAmbulances.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.id} ({a.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">RECEIVING HOSPITAL:</div>
                      <select
                        value={req.assigned_hospital_id || ''}
                        onChange={(e) => handleAssignHospital(req.id, e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs font-semibold focus:outline-none"
                      >
                        <option value="">Select Destination</option>
                        {cityHospitals.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Advance Workflow */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <span className="text-[10px] text-slate-400">
                      Logged {new Date(req.created_at).toLocaleTimeString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {req.status === 'Requested' && (
                        <button
                          onClick={() => handleStatusAdvance(req.id, 'Verified')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold"
                        >
                          Verify Triage
                        </button>
                      )}
                      {req.status === 'Assigned' && (
                        <button
                          onClick={() => handleStatusAdvance(req.id, 'En Route')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold"
                        >
                          Mark En Route
                        </button>
                      )}
                      {req.status === 'En Route' && (
                        <button
                          onClick={() => handleStatusAdvance(req.id, 'On Scene')}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold"
                        >
                          Mark On Scene
                        </button>
                      )}
                      {req.status === 'On Scene' && (
                        <button
                          onClick={() => handleStatusAdvance(req.id, 'Resolved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold"
                        >
                          Patient Delivered / Resolved
                        </button>
                      )}
                      {req.status === 'Resolved' && (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRequests.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
                No active medical requests in this category.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 Cols): Fleet Registry & Hospitals */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ambulance Registry */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ambulance className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Ambulance Fleet Status ({cityAmbulances.length})
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {cityAmbulances.filter(a => a.status === 'Available').length} READY
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {cityAmbulances.map(amb => (
                <div key={amb.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{amb.name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        amb.status === 'Available'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : amb.status === 'Assigned'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {amb.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{amb.capability}</div>
                  <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Base: {amb.location_name}</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Fuel className="w-3 h-3 text-amber-400" />
                      <span>{amb.fuel_pct}% Fuel</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Receiving Hospitals Directory */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hospital className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Trauma Facilities Directory
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {cityHospitals.map(hosp => (
                <div key={hosp.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[200px]">{hosp.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      {hosp.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{hosp.address}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hosp.services.map((s, idx) => (
                      <span key={idx} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-blue-300">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Occupancy: {hosp.current_occupancy} / {hosp.capacity}</span>
                    <span>Emergency: {hosp.contact_phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Request Medical Assistance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              <span>Log Medical Assistance Dispatch</span>
            </h2>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Incident / Sector Location</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Osmania Hospital Sector 4 Causeway"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Triage Severity Category</label>
                <select
                  value={newTriage}
                  onChange={(e) => setNewTriage(e.target.value as TriageCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="Critical">RED · Critical (Immediate Resuscitation/Trauma)</option>
                  <option value="Urgent">YELLOW · Urgent (Serious condition, &lt;30m window)</option>
                  <option value="Moderate">GREEN · Moderate (Walking wounded/Ambulatory)</option>
                  <option value="Minor">BLUE · Minor (Non-urgent / First aid)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Patient Count</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newPatients}
                    onChange={(e) => setNewPatients(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Assistance Required / Injury Notes</label>
                <textarea
                  rows={3}
                  required
                  value={newAssistance}
                  onChange={(e) => setNewAssistance(e.target.value)}
                  placeholder="Describe patient condition, burns, fractures, hypothermia, or entrapment details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Confirm Dispatch Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
