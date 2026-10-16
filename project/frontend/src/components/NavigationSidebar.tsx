import React, { useState } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Radio,
  Ambulance,
  Flame,
  HandHeart,
  Map,
  Building2,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import type { CrisisPageId } from '../types/crisis';

interface NavItem {
  id: CrisisPageId;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
  highlight?: boolean;
}

export const NavigationSidebar: React.FC = () => {
  const { activePage, setActivePage, incidents, medicalRequests, reliefRequests, selectedCityId } = useCrisis();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute live badges from shared application data
  const cityIncidents = incidents.filter(i => i.city_id === selectedCityId);
  const activeIncidentsCount = cityIncidents.filter(i => i.status !== 'Resolved').length;
  const criticalMedCount = medicalRequests.filter(m => m.city_id === selectedCityId && m.status !== 'Resolved').length;
  const pendingReliefCount = reliefRequests.filter(r => r.city_id === selectedCityId && r.status !== 'Completed').length;

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'command_center', label: 'Command Center', icon: LayoutDashboard },
        {
          id: 'emergency_response',
          label: 'Emergency Response',
          icon: Radio,
          badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
          badgeColor: 'bg-rose-500'
        },
        {
          id: 'medical_ambulance',
          label: 'Medical & Ambulance',
          icon: Ambulance,
          badge: criticalMedCount > 0 ? criticalMedCount : undefined,
          badgeColor: 'bg-blue-500'
        },
        { id: 'fire_rescue', label: 'Fire & Rescue', icon: Flame },
        {
          id: 'relief_assistance',
          label: 'Relief & Assistance',
          icon: HandHeart,
          badge: pendingReliefCount > 0 ? pendingReliefCount : undefined,
          badgeColor: 'bg-emerald-500'
        }
      ]
    },
    {
      title: 'SIMULATION & GIS',
      items: [
        {
          id: 'simulation_lab',
          label: 'Disaster Simulation Lab',
          icon: Cpu,
          badge: '3D TWIN',
          badgeColor: 'bg-indigo-600',
          highlight: true
        },
        { id: 'evacuation_map', label: 'Resource & Evacuation Map', icon: Map },
        { id: 'hospitals_shelters', label: 'Hospitals & Shelters', icon: Building2 }
      ]
    },
    {
      title: 'GOVERNANCE & REPORTS',
      items: [
        { id: 'incident_management', label: 'Incident Management', icon: ClipboardList },
        { id: 'analytics_reports', label: 'Analytics & Reports', icon: BarChart3 },
        { id: 'settings_sources', label: 'Settings & Data Sources', icon: Settings }
      ]
    }
  ];

  return (
    <aside
      className={`h-screen sticky top-0 bg-slate-950 border-r border-slate-800/90 text-slate-300 flex flex-col transition-all duration-300 z-30 select-none shadow-2xl ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-slate-900/60">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight truncate">
              <div className="text-sm font-black tracking-wider text-white flex items-center gap-1.5">
                <span>CRISIS360</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">
                  v2.4
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase truncate">
                Disaster Platform
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 pb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {section.title}
              </div>
            )}

            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition group relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : item.highlight
                      ? 'bg-slate-900/90 text-indigo-300 hover:bg-indigo-950/60 hover:text-white border border-indigo-900/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md text-white shrink-0 ${
                        item.badgeColor || 'bg-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Toggle for Collapsed View */}
      {isCollapsed && (
        <div className="p-2 border-t border-slate-800 flex justify-center">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Operator Status Pill */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="font-mono text-[11px] text-slate-300 font-bold truncate">EOC DUTY OFFICER</div>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            City Cadastre: <span className="text-blue-400 font-semibold capitalize">{selectedCityId}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
