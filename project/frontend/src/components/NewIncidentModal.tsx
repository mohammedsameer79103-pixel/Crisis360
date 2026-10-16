import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  PlusCircle,
  MapPin,
  Flame,
  Droplets,
  Zap,
  Radio
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { CITIES_CATALOG } from '../services/cityData';
import type { CityId, HazardType } from '../types/simulation';
import type { IncidentPriority } from '../types/crisis';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({ isOpen, onClose }) => {
  const { selectedCityId, createIncident, emergencyUnits } = useCrisis();

  const [title, setTitle] = useState('');
  const [cityId, setCityId] = useState<CityId>(selectedCityId);
  const [hazardType, setHazardType] = useState<HazardType | 'medical' | 'infrastructure'>('flood');
  const [priority, setPriority] = useState<IncidentPriority>('High');
  const [severity, setSeverity] = useState(65);
  const [locationName, setLocationName] = useState('');
  const [affectedCount, setAffectedCount] = useState(150);
  const [description, setDescription] = useState('');
  const [assignedUnit, setAssignedUnit] = useState<string>('');

  if (!isOpen) return null;

  const availableUnits = emergencyUnits.filter(u => u.city_id === cityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim()) return;

    await createIncident({
      title: title.trim(),
      city_id: cityId,
      hazard_type: hazardType as HazardType,
      priority,
      severity: Number(severity),
      location_name: locationName.trim(),
      affected_count: Number(affectedCount),
      description: description.trim() || 'Emergency field incident reported to EOC.',
      assigned_unit: assignedUnit || null
    });

    onClose();
    setTitle('');
    setLocationName('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <h2 className="text-base font-bold text-white">Log Official Crisis Incident</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Incident Headline / Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Musi River Stormwater Conduit Breach at Sector 4"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Target Metropolitan Twin</label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value as CityId)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
              >
                {CITIES_CATALOG.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Hazard Threat Vector</label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
              >
                <option value="flood">Hydrological Flood</option>
                <option value="fire">Thermal Wildfire / Structural</option>
                <option value="quake">Seismic / Earthquake</option>
                <option value="medical">Mass Casualty Medical</option>
                <option value="infrastructure">Critical Lifeline Failure</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Priority Triage</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
              >
                <option value="Critical">Critical (Immediate Response)</option>
                <option value="High">High (High Priority)</option>
                <option value="Medium">Medium (Standard Triage)</option>
                <option value="Low">Low (Advisory Monitor)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">
                Severity Score: <span className="font-mono text-rose-400">{severity}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full accent-rose-500 mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Geographic Location / Landmark *</label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Nayapul Heritage Causeway"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Estimated Affected Citizens</label>
              <input
                type="number"
                min={10}
                value={affectedCount}
                onChange={(e) => setAffectedCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Assign Emergency Unit (Optional)</label>
            <select
              value={assignedUnit}
              onChange={(e) => setAssignedUnit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
            >
              <option value="">Do Not Assign (Leave Unassigned)</option>
              {availableUnits.map(u => (
                <option key={u.id} value={u.id}>
                  {u.id} · {u.name} ({u.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Field Situation Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe hydraulic inundation height, structural danger, blocked roads, or trapped citizens..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Incident into EOC Queue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
