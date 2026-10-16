import React, { useState } from 'react';
import {
  Compass,
  Layers,
  ChevronDown,
  ChevronUp,
  Radio,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Shield,
  Activity
} from 'lucide-react';

interface MapToolsDrawerProps {
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlays: {
    hazardFootprint: boolean;
    lifelineHalos: boolean;
    evacCorridors: boolean;
    roadBarricades: boolean;
  };
  onToggleOverlay: (key: keyof MapToolsDrawerProps['overlays']) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const MapToolsDrawer: React.FC<MapToolsDrawerProps> = ({
  minimapCanvasRef,
  overlays,
  onToggleOverlay,
  isFullscreen,
  onToggleFullscreen
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'layers' | 'legend'>('radar');

  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
      {/* Collapsed Toggle Button */}
      {!isOpen ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-lg shadow-blue-500/5 flex items-center gap-2 text-xs font-bold transition group"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <Compass className="w-4 h-4 text-blue-600 group-hover:rotate-45 transition duration-200" />
            <span>MAP TOOLS & RADAR</span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-700 hover:text-blue-600 shadow-lg shadow-blue-500/5 text-xs font-bold transition"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter 3D Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        /* Expanded Floating Card */
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-blue-500/10 w-72 overflow-hidden text-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                Map Tools & Radar
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleFullscreen}
                className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-900 transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-900 transition"
                title="Collapse Panel"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subtabs: Radar / Layers / Legend */}
          <div className="flex border-b border-slate-100 bg-slate-50/40 text-[10px] font-bold p-1 gap-1">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                activeTab === 'radar' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              RADAR 2D
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                activeTab === 'layers' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              LAYERS
            </button>
            <button
              onClick={() => setActiveTab('legend')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                activeTab === 'legend' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              LEGEND
            </button>
          </div>

          {/* Tab 1: Radar 2D */}
          {activeTab === 'radar' && (
            <div className="p-3 flex flex-col items-center">
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-inner">
                <canvas
                  ref={minimapCanvasRef}
                  width={150}
                  height={150}
                  className="block"
                />
                <div className="absolute top-1.5 left-2 text-[8px] font-mono font-black text-blue-600 uppercase tracking-wider">
                  TACTICAL SWEEP
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 text-center">
                Live coordinate radar tracking hazard perimeter & active agent corridors.
              </div>
            </div>
          )}

          {/* Tab 2: Overlays & Layers */}
          {activeTab === 'layers' && (
            <div className="p-3 space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition">
                <span className="flex items-center gap-2 text-slate-700">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Hazard Inundation Footprint
                </span>
                <input
                  type="checkbox"
                  checked={overlays.hazardFootprint}
                  onChange={() => onToggleOverlay('hazardFootprint')}
                  className="accent-blue-600 w-3.5 h-3.5"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition">
                <span className="flex items-center gap-2 text-slate-700">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  Critical Lifeline Halos
                </span>
                <input
                  type="checkbox"
                  checked={overlays.lifelineHalos}
                  onChange={() => onToggleOverlay('lifelineHalos')}
                  className="accent-blue-600 w-3.5 h-3.5"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition">
                <span className="flex items-center gap-2 text-slate-700">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Evacuation Agent Routes
                </span>
                <input
                  type="checkbox"
                  checked={overlays.evacCorridors}
                  onChange={() => onToggleOverlay('evacCorridors')}
                  className="accent-emerald-600 w-3.5 h-3.5"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition">
                <span className="flex items-center gap-2 text-slate-700">
                  <Compass className="w-3.5 h-3.5 text-rose-600" />
                  Road Barricades & Blockages
                </span>
                <input
                  type="checkbox"
                  checked={overlays.roadBarricades}
                  onChange={() => onToggleOverlay('roadBarricades')}
                  className="accent-rose-600 w-3.5 h-3.5"
                />
              </label>
            </div>
          )}

          {/* Tab 3: Clear Map Legend */}
          {activeTab === 'legend' && (
            <div className="p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shrink-0" />
                <span className="text-slate-700">Hazard Origin & Front Epicenter</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shrink-0" />
                <span className="text-slate-700">Trauma Hospitals & Lifelines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span className="text-slate-700">Evacuation Shelters & Agents</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
                <span className="text-slate-700">Congested Road Artery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
                <span className="text-slate-700">Impassable / Submerged Road</span>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[10px] space-y-1 text-slate-500">
                <div>Building Damage: White (Intact) → Slate (Minor) → Charred/Rubble (Severe)</div>
                <div className="font-mono text-[9px] text-slate-400">Vertical Datum: MSL Indian Geodetic | CRS: EPSG:3857</div>
                <div className="font-mono text-[9px] text-slate-400">Road Hierarchy: Arterials (1.7m), Collectors (1.2m), Local (0.8m)</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
