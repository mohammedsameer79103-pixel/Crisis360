import React, { useState } from 'react';
import {
  MapPin,
  Bell,
  Radio,
  FileText,
  AlertTriangle,
  Cpu,
  PlusCircle,
  X,
  CheckCircle2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { CITIES_CATALOG } from '../services/cityData';
import type { CityId } from '../types/simulation';

interface GlobalTopBarProps {
  onOpenReportModal?: () => void;
  onOpenSitRepModal?: () => void;
}

export const GlobalTopBar: React.FC<GlobalTopBarProps> = ({ onOpenReportModal, onOpenSitRepModal }) => {
  const {
    activePage,
    setActivePage,
    selectedCityId,
    setSelectedCityId,
    incidents,
    activeIncidentId,
    setActiveIncidentId,
    isBackendConnected,
    notifications,
    markNotificationRead,
    clearNotifications
  } = useCrisis();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const activeIncident = incidents.find(i => i.id === activeIncidentId) || incidents[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  const pageTitles: Record<string, string> = {
    command_center: 'Command Center & Situational Overview',
    simulation_lab: '3D Disaster Digital Twin Simulation Lab',
    emergency_response: 'Emergency Response Center & Unit Dispatch',
    medical_ambulance: 'Medical Coordination & Ambulance Registry',
    fire_rescue: 'Fire & Rescue Operations Coordination',
    relief_assistance: 'Humanitarian Relief & Supply Assistance',
    evacuation_map: 'Resource & Evacuation Tactical GIS Map',
    hospitals_shelters: 'Hospitals & Emergency Shelters Directory',
    incident_management: 'Master Incident Registry & Lifecycle Audit',
    analytics_reports: 'Analytics, KPI Metrics & Report Generator',
    settings_sources: 'Settings, 3D Tiles & Geodetic Data Sources'
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-slate-100 px-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
      {/* Left: Breadcrumbs & City Selector */}
      <div className="flex items-center gap-3">
        {/* City Selector */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl hover:border-blue-500 transition shadow-inner">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value as CityId)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              {CITIES_CATALOG.map(city => (
                <option key={city.id} value={city.id} className="bg-slate-900 text-slate-100">
                  {city.name} ({city.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden lg:block w-[1px] h-6 bg-slate-800" />

        {/* Page Title Breadcrumb */}
        <div className="hidden md:block">
          <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            EOC WORKSPACE
          </div>
          <div className="text-xs font-bold text-slate-200">
            {pageTitles[activePage] || 'Crisis360 Emergency Operations'}
          </div>
        </div>
      </div>

      {/* Middle: Active Primary Incident Indicator */}
      {activeIncident && (
        <div
          onClick={() => {
            setActiveIncidentId(activeIncident.id);
            if (activePage !== 'emergency_response' && activePage !== 'incident_management') {
              setActivePage('emergency_response');
            }
          }}
          className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition max-w-md truncate group"
          title="Click to view incident response details"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <div className="text-left truncate">
            <div className="text-[9px] font-mono font-black text-rose-400 uppercase flex items-center gap-1.5">
              <span>ACTIVE DISASTER</span>
              <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {activeIncident.id}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-300 truncate group-hover:text-white transition">
              {activeIncident.title}
            </div>
          </div>
        </div>
      )}

      {/* Right: Actions, Backend Health, Notifications */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Backend Online / Offline Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition ${
            isBackendConnected
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
              : 'bg-blue-950/60 text-blue-300 border-blue-800/80'
          }`}
          title={isBackendConnected ? 'Connected to FastAPI & SQLite' : 'Running on high-speed Client Digital Twin'}
        >
          <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
          <span className="hidden sm:inline">{isBackendConnected ? 'FASTAPI CORE' : 'CLIENT TWIN'}</span>
        </div>

        {/* Quick Shortcut: 3D Simulation Lab */}
        {activePage !== 'simulation_lab' && (
          <button
            onClick={() => setActivePage('simulation_lab')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D SIM LAB</span>
          </button>
        )}

        {/* Quick Report Incident Button */}
        {onOpenReportModal && (
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LOG INCIDENT</span>
          </button>
        )}

        {/* SitRep Summary Modal Trigger */}
        {onOpenSitRepModal && (
          <button
            onClick={onOpenSitRepModal}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
            title="Download Operational SitRep"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition relative"
            title="Tactical Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {isNotifOpen && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 text-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    EOC Tactical Alerts ({notifications.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-slate-400 hover:text-rose-400 transition font-semibold"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No active emergency alerts recorded.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-slate-900/60 transition flex items-start gap-2.5 ${
                        !n.read ? 'bg-slate-900/40' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.level === 'CRITICAL'
                            ? 'bg-rose-500 ring-2 ring-rose-500/20'
                            : n.level === 'WARNING'
                            ? 'bg-amber-500 ring-2 ring-amber-500/20'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-white">
                          <span className="truncate">{n.title}</span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          {n.page_target && (
                            <button
                              onClick={() => {
                                setActivePage(n.page_target!);
                                setIsNotifOpen(false);
                              }}
                              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                            >
                              <span>Open Module</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          {!n.read && (
                            <button
                              onClick={() => markNotificationRead(n.id)}
                              className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 ml-auto"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mark Read</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
