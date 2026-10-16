import React, { useState } from 'react';
import {
  Hospital,
  Building2,
  Search,
  PlusCircle,
  MapPin,
  Phone,
  Zap,
  Users,
  CheckCircle2,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import type { FacilityRecord, FacilityType, FacilityStatus } from '../types/crisis';

export const HospitalsSheltersPage: React.FC = () => {
  const {
    selectedCityId,
    facilities,
    registerFacility
  } = useCrisis();

  const [activeTab, setActiveTab] = useState<'all' | 'hospital' | 'shelter'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<FacilityType>('shelter');
  const [formAddress, setFormAddress] = useState('');
  const [formCapacity, setFormCapacity] = useState(500);
  const [formPhone, setFormPhone] = useState('+91-40-2000-0000');
  const [formServices, setFormServices] = useState('First Aid, Emergency Beds, Water Purification');

  const cityFacilities = facilities.filter(f => f.city_id === selectedCityId);

  const filteredFacilities = cityFacilities.filter(f => {
    if (activeTab !== 'all' && f.type !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.services.some(s => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    await registerFacility({
      city_id: selectedCityId,
      type: formType,
      name: formName.trim(),
      address: formAddress.trim() || 'Municipal Sector',
      capacity: Number(formCapacity),
      current_occupancy: 0,
      contact_phone: formPhone.trim(),
      services: formServices.split(',').map(s => s.trim()).filter(Boolean)
    });

    setIsModalOpen(false);
    setFormName('');
    setFormAddress('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-black text-white">Hospitals & Emergency Shelters Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative municipal register of trauma medical centers, evacuation stadiums, relief dormitories, and community shelters.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>REGISTER NEW FACILITY</span>
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Facilities ({cityFacilities.length})
          </button>
          <button
            onClick={() => setActiveTab('hospital')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'hospital' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hospitals ({cityFacilities.filter(f => f.type === 'hospital').length})
          </button>
          <button
            onClick={() => setActiveTab('shelter')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'shelter' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shelters ({cityFacilities.filter(f => f.type === 'shelter').length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility name, specialty..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Facility Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFacilities.map(fac => {
          const isHospital = fac.type === 'hospital';
          const occupancyPct = fac.capacity > 0 ? Math.round((fac.current_occupancy / fac.capacity) * 100) : 0;

          return (
            <div
              key={fac.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg hover:border-slate-700 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 font-bold">{fac.id}</span>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isHospital ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {fac.type.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{fac.name}</h3>
                <div className="flex items-start gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{fac.address}</span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>OCCUPANCY:</span>
                    <span className="font-bold text-white">
                      {fac.current_occupancy.toLocaleString()} / {fac.capacity.toLocaleString()} ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        occupancyPct > 85 ? 'bg-rose-500' : occupancyPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>
                </div>

                {/* Services Tags */}
                <div className="pt-2 flex flex-wrap gap-1">
                  {fac.services.map((svc, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Accessibility and Emergency Contact */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span>Contact: {fac.contact_phone}</span>
                  <span className="text-emerald-400 font-bold">{fac.status}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{fac.accessibility}</div>
              </div>
            </div>
          );
        })}

        {filteredFacilities.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            No hospitals or shelters match the current search filter.
          </div>
        )}
      </div>

      {/* Modal: Register New Facility */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Register Emergency Facility</span>
            </h2>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Facility Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as FacilityType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="shelter">Emergency Relief Shelter</option>
                  <option value="hospital">Hospital / Medical Trauma Center</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. City Central Community Hall"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Street Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Sector 12, Main Ring Road"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Capacity</label>
                  <input
                    type="number"
                    min={10}
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Services & Facilities (Comma-separated)</label>
                <input
                  type="text"
                  value={formServices}
                  onChange={(e) => setFormServices(e.target.value)}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Save Facility Cadastre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
