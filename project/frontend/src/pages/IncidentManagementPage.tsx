import React, { useState } from 'react';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  PlusCircle,
  FileText,
  Shield,
  Send,
  Users,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import type { IncidentRecord, IncidentStatus, IncidentPriority } from '../types/crisis';

interface IncidentManagementPageProps {
  onOpenReportModal: () => void;
}

export const IncidentManagementPage: React.FC<IncidentManagementPageProps> = ({ onOpenReportModal }) => {
  const {
    selectedCityId,
    incidents,
    emergencyUnits,
    medicalRequests,
    reliefRequests,
    updateIncident,
    setActivePage
  } = useCrisis();

  const cityIncidents = incidents.filter(i => i.city_id === selectedCityId);
  const [selectedIncId, setSelectedIncId] = useState<string>(cityIncidents[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newNote, setNewNote] = useState('');

  const currentInc = cityIncidents.find(i => i.id === selectedIncId) || cityIncidents[0] || null;

  // Linked items
  const linkedMed = currentInc ? medicalRequests.filter(m => m.incident_id === currentInc.id) : [];
  const linkedUnits = currentInc && currentInc.assigned_unit
    ? emergencyUnits.filter(u => u.id === currentInc.assigned_unit)
    : [];

  const handleUpdateStatus = async (newStatus: IncidentStatus) => {
    if (!currentInc) return;
    await updateIncident(currentInc.id, {
      status: newStatus,
      note: `Official incident status transitioned to ${newStatus}`
    });
  };

  const handleUpdatePriority = async (newPriority: IncidentPriority) => {
    if (!currentInc) return;
    await updateIncident(currentInc.id, {
      priority: newPriority,
      note: `Incident priority reclassified to ${newPriority}`
    });
  };

  const handleAddAuditNote = async () => {
    if (!currentInc || !newNote.trim()) return;
    await updateIncident(currentInc.id, { note: newNote.trim() });
    setNewNote('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-black text-white">Master Incident Management Workspace</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative incident lifecycle audit: verification, severity reclassification, cross-functional linkages, and post-action notes.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>LOG NEW INCIDENT</span>
        </button>
      </div>

      {/* Main Master Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 Cols): Master Registry List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Incident Registry ({cityIncidents.length})</span>
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
            {cityIncidents.map(inc => {
              const isSelected = currentInc?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncId(inc.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 ring-1 ring-blue-500/50 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-blue-400 font-bold">{inc.id}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        inc.priority === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400'
                          : inc.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {inc.priority}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white mt-1.5 truncate">{inc.title}</h3>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{inc.location_name}</div>

                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Severity: {inc.severity}%</span>
                    <span className="text-white font-semibold">{inc.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 Cols): Comprehensive Incident Lifecycle Dossier */}
        <div className="lg:col-span-8">
          {currentInc ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                      {currentInc.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Created: {new Date(currentInc.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white">{currentInc.title}</h2>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentInc.location_name}</span>
                  </div>
                </div>

                {/* Priority Selector */}
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 shrink-0 text-xs">
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">RECLASSIFY PRIORITY:</span>
                  <select
                    value={currentInc.priority}
                    onChange={(e) => handleUpdatePriority(e.target.value as IncidentPriority)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-bold focus:outline-none"
                  >
                    <option value="Critical">Critical (P1)</option>
                    <option value="High">High (P2)</option>
                    <option value="Medium">Medium (P3)</option>
                    <option value="Low">Low (P4)</option>
                  </select>
                </div>
              </div>

              {/* Status Controls */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  LIFECYCLE STATUS TRANSITION:
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(['Reported', 'Verified', 'Assigned', 'En Route', 'On Scene', 'Resolved'] as IncidentStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                        currentInc.status === st
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Operational Entities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Linked Medical Triage Requests */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase font-bold">
                    <span>LINKED MEDICAL TRIAGE</span>
                    <span>{linkedMed.length}</span>
                  </div>
                  {linkedMed.map(m => (
                    <div key={m.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">{m.assistance_required}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{m.patient_count} patient(s) · {m.triage_category} · {m.status}</div>
                    </div>
                  ))}
                  {linkedMed.length === 0 && (
                    <div className="text-slate-500 text-[11px] py-1">No medical requests linked to this incident.</div>
                  )}
                </div>

                {/* Assigned Units */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase font-bold">
                    <span>DISPATCHED RESPONSE APPARATUS</span>
                    <span>{currentInc.assigned_unit ? '1' : '0'}</span>
                  </div>
                  {currentInc.assigned_unit ? (
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">{currentInc.assigned_unit}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Assigned and committed to scene</div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[11px] py-1">No unit currently dispatched.</div>
                  )}
                </div>
              </div>

              {/* Complete Audit History */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  AUTHORITATIVE ACTIVITY LOG & OPERATOR AUDIT TRAIL ({currentInc.notes.length})
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {currentInc.notes.map((note, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-mono"
                    >
                      {note}
                    </div>
                  ))}
                </div>

                {/* Add Entry */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAuditNote()}
                    placeholder="Record formal incident log entry, debrief note, or cause analysis..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddAuditNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>RECORD NOTE</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
              Select an incident from the registry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
