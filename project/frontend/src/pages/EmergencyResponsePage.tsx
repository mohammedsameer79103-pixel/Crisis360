import React, { useState } from 'react';
import {
  Radio,
  AlertTriangle,
  Flame,
  Droplets,
  Zap,
  Ambulance,
  Filter,
  PlusCircle,
  MapPin,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle2,
  Send,
  Users
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import type { IncidentRecord, IncidentStatus, IncidentPriority } from '../types/crisis';

interface EmergencyResponsePageProps {
  onOpenReportModal: () => void;
}

export const EmergencyResponsePage: React.FC<EmergencyResponsePageProps> = ({ onOpenReportModal }) => {
  const {
    selectedCityId,
    incidents,
    emergencyUnits,
    updateIncident,
    assignUnitToIncident,
    activeIncidentId,
    setActiveIncidentId
  } = useCrisis();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [newNote, setNewNote] = useState('');

  const cityIncidents = incidents.filter(i => i.city_id === selectedCityId);

  const filteredIncidents = cityIncidents.filter(inc => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && inc.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && inc.hazard_type !== typeFilter) return false;
    return true;
  });

  const selectedIncident = cityIncidents.find(i => i.id === activeIncidentId) || cityIncidents[0] || null;
  const cityUnits = emergencyUnits.filter(u => u.city_id === selectedCityId);

  const statuses: IncidentStatus[] = ['Reported', 'Verified', 'Assigned', 'En Route', 'On Scene', 'Resolved'];

  const handleStatusChange = async (incId: string, newStatus: IncidentStatus) => {
    await updateIncident(incId, { status: newStatus, note: `Status updated to ${newStatus}` });
  };

  const handleUnitAssign = async (incId: string, unitId: string) => {
    if (!unitId) return;
    await assignUnitToIncident(unitId, incId);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedIncident) return;
    await updateIncident(selectedIncident.id, { note: newNote.trim() });
    setNewNote('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <h1 className="text-xl font-black text-white">Emergency Response Coordination</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tactical queue of reported crises, priority triage, unit dispatching, and field status verification.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>REPORT NEW INCIDENT</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-bold px-1">
          <Filter className="w-3.5 h-3.5" />
          <span>FILTERS:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none"
        >
          <option value="all">All Statuses ({cityIncidents.length})</option>
          <option value="Reported">Reported</option>
          <option value="Verified">Verified</option>
          <option value="Assigned">Assigned</option>
          <option value="En Route">En Route</option>
          <option value="On Scene">On Scene</option>
          <option value="Resolved">Resolved</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Hazard Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none"
        >
          <option value="all">All Incident Types</option>
          <option value="flood">Flood</option>
          <option value="fire">Fire</option>
          <option value="quake">Earthquake</option>
          <option value="medical">Medical</option>
          <option value="rescue">Rescue</option>
        </select>

        <span className="text-slate-400 font-mono text-[11px] ml-auto">
          Showing {filteredIncidents.length} of {cityIncidents.length} records
        </span>
      </div>

      {/* Main Two-Column Incident Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Incident Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Tactical Queue ({filteredIncidents.length})
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
            {filteredIncidents.map(inc => {
              const isSelected = selectedIncident?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setActiveIncidentId(inc.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{inc.id}</span>
                    <div className="flex items-center gap-1.5">
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
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          inc.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : inc.status === 'On Scene'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white mt-1.5 line-clamp-1">{inc.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {inc.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[140px]">{inc.location_name}</span>
                    </span>
                    <span>~{inc.affected_count} affected</span>
                  </div>
                </div>
              );
            })}

            {filteredIncidents.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                No incidents match the active filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Detailed Incident Management & Dispatching */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      {selectedIncident.id}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400 font-mono">
                      Logged {new Date(selectedIncident.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white mt-1">
                    {selectedIncident.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono">SEVERITY INDEX</div>
                    <div className="text-base font-black text-rose-400 font-mono">
                      {selectedIncident.severity}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Progression Bar */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  RESPONSE LIFECYCLE WORKFLOW
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                  {statuses.map(st => {
                    const isCurrent = selectedIncident.status === st;
                    const isPassed = statuses.indexOf(selectedIncident.status) >= statuses.indexOf(st);

                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(selectedIncident.id, st)}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold transition border ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20'
                            : isPassed
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            : 'bg-slate-950 text-slate-500 border-slate-800/80 hover:bg-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location & Unit Assignment Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">INCIDENT LOCATION</div>
                  <div className="font-bold text-white mt-0.5">{selectedIncident.location_name}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Coordinates: ({selectedIncident.x.toFixed(1)}, {selectedIncident.z.toFixed(1)})
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">ASSIGNED EMERGENCY UNIT</div>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={selectedIncident.assigned_unit || ''}
                      onChange={(e) => handleUnitAssign(selectedIncident.id, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="">No Unit Assigned (Unassigned)</option>
                      {cityUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.id} · {unit.name} ({unit.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Incident Notes & Operational Audit Log */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  ACTIVITY HISTORY & OPERATOR NOTES ({selectedIncident.notes.length})
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {selectedIncident.notes.map((note, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed"
                    >
                      {note}
                    </div>
                  ))}
                </div>

                {/* Append Note Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Log dispatcher update or field situation note..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ADD</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              Select an incident from the queue to view full dispatch details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
