import React from 'react';
import type {
  ScenarioConfig,
  FullSimulationResponse,
  BranchId,
  BuildingData,
  CityId,
  FloodSourceType
} from '../types/simulation';
import { CityScene3D } from '../components/CityScene3D';
import { ScenarioControls } from '../components/ScenarioControls';
import { BranchSelector } from '../components/BranchSelector';
import { AnalyticsDeck } from '../components/AnalyticsDeck';
import { BottomTimeline } from '../components/BottomTimeline';
import { BuildingInspectorModal } from '../components/BuildingInspectorModal';

interface SimulationLabPageProps {
  config: ScenarioConfig;
  setConfig: React.Dispatch<React.SetStateAction<ScenarioConfig>>;
  simulationData: FullSimulationResponse | null;
  activeBranch: BranchId;
  setActiveBranch: (b: BranchId) => void;
  currentTick: number;
  setCurrentTick: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (s: number) => void;
  splitView: boolean;
  setSplitView: (s: boolean) => void;
  dualBranchRight: BranchId;
  setDualBranchRight: (b: BranchId) => void;
  selectedBuilding: BuildingData | null;
  setSelectedBuilding: (b: BuildingData | null) => void;
  isForking: boolean;
  onForkSimulation: (cfg?: ScenarioConfig) => void;
  onSelectPreset: (presetId: string) => void;
  onDispatchAction: (type: string, x: number, z: number, notes?: string) => void;
  isBackendConnected: boolean;
}

export const SimulationLabPage: React.FC<SimulationLabPageProps> = ({
  config,
  setConfig,
  simulationData,
  activeBranch,
  setActiveBranch,
  currentTick,
  setCurrentTick,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  splitView,
  setSplitView,
  dualBranchRight,
  setDualBranchRight,
  selectedBuilding,
  setSelectedBuilding,
  isForking,
  onForkSimulation,
  onSelectPreset,
  onDispatchAction,
  isBackendConnected
}) => {
  if (!simulationData) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-white">Initializing 3D Simulation Twin...</div>
        </div>
      </div>
    );
  }

  // Active branch metrics
  const activeBranchData =
    activeBranch === 'A'
      ? simulationData.branch_A
      : activeBranch === 'B'
      ? simulationData.branch_B
      : simulationData.branch_C;

  const dualBranchRightData =
    dualBranchRight === 'A'
      ? simulationData.branch_A
      : dualBranchRight === 'B'
      ? simulationData.branch_B
      : simulationData.branch_C;

  const tickIndex = activeBranchData?.timeline
    ? Math.min(activeBranchData.timeline.length - 1, Math.floor(currentTick / 2))
    : 0;

  const currentMetrics = activeBranchData?.timeline?.[tickIndex] || {
    tick: 0,
    timestamp_str: 'T+00:00',
    hazard_radius: 5,
    hazard_center: [0, 0] as [number, number],
    hazard_intensity: 50,
    residual_risk_pct: 70,
    people_at_risk: 10000,
    people_evacuated: 0,
    people_trapped: 0,
    roads_blocked_count: 0,
    critical_assets_at_risk_count: 0,
    economic_loss_cr: 0.5,
    buildings_damage: {},
    buildings_stage: {},
    infrastructure_status: {},
    road_status: {},
    resources: {
      fire_engines: 8,
      ambulances: 12,
      rescue_squads: 6,
      flood_barriers_deployed: 0,
      drones_active: 2,
      fuel_remaining_pct: 100,
      medical_supplies_pct: 100
    },
    recent_events: []
  };

  const dualRightMetrics = dualBranchRightData?.timeline?.[tickIndex] || currentMetrics;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 text-slate-100">
      {/* Simulation Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Collapsible Scenario Configurator */}
        <div className="w-80 h-full shrink-0 border-r border-slate-800 bg-slate-900/60 overflow-y-auto">
          <ScenarioControls
            config={config}
            onChangeConfig={(updated) => setConfig((prev) => ({ ...prev, ...updated }))}
            onForkBranches={() => onForkSimulation()}
            isForking={isForking}
          />
        </div>

        {/* Center: 3D Viewport with Branch Strategy Matrix & Timeline */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          {/* Three Future Branches Strategy Comparison Header */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
            <BranchSelector
              simulationData={simulationData}
              activeBranch={activeBranch}
              onSelectBranch={setActiveBranch}
              currentTick={currentTick}
              splitView={splitView}
              onToggleSplitView={() => setSplitView(!splitView)}
            />
          </div>

          {/* 3D WebGL Canvas Area */}
          <div className="flex-1 relative min-h-0 bg-sky-950/20">
            {!splitView ? (
              <CityScene3D
                city={simulationData.city}
                currentMetrics={currentMetrics}
                hazardType={config.hazard_type}
                branchId={activeBranch}
                onSelectBuilding={setSelectedBuilding}
                selectedBuildingId={selectedBuilding?.id || null}
                onSetSourceOrigin={(x, z) => setConfig(prev => ({ ...prev, source_x: x, source_z: z }))}
              />
            ) : (
              <div className="grid grid-cols-2 h-full divide-x divide-slate-800">
                <div className="relative h-full">
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-blue-600/90 text-[10px] font-bold text-white shadow">
                    BRANCH {activeBranch}
                  </div>
                  <CityScene3D
                    city={simulationData.city}
                    currentMetrics={currentMetrics}
                    hazardType={config.hazard_type}
                    branchId={activeBranch}
                    onSelectBuilding={setSelectedBuilding}
                    selectedBuildingId={selectedBuilding?.id || null}
                    onSetSourceOrigin={(x, z) => setConfig(prev => ({ ...prev, source_x: x, source_z: z }))}
                  />
                </div>
                <div className="relative h-full">
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-emerald-600/90 text-[10px] font-bold text-white shadow">
                    BRANCH {dualBranchRight}
                  </div>
                  <CityScene3D
                    city={simulationData.city}
                    currentMetrics={dualRightMetrics}
                    hazardType={config.hazard_type}
                    branchId={dualBranchRight}
                    onSelectBuilding={setSelectedBuilding}
                    selectedBuildingId={selectedBuilding?.id || null}
                    onSetSourceOrigin={(x, z) => setConfig(prev => ({ ...prev, source_x: x, source_z: z }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Synchronized Simulation Timeline */}
          <div className="h-16 border-t border-slate-800 bg-slate-900/90 shrink-0 px-4 flex items-center">
            <BottomTimeline
              currentTick={currentTick}
              maxTicks={config.duration_ticks || 100}
              timestampStr={currentMetrics.timestamp_str || 'T+00:00'}
              isRunning={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onStepForward={(step) => setCurrentTick((prev) => Math.min(config.duration_ticks || 100, prev + step))}
              onReset={() => setCurrentTick(0)}
              onScrubTimeline={setCurrentTick}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
              events={currentMetrics.recent_events || []}
            />
          </div>
        </div>

        {/* Right: AI Copilot & Real-Time Decision Analytics Deck */}
        <div className="w-96 h-full shrink-0 border-l border-slate-800 bg-slate-900/60 overflow-y-auto">
          <AnalyticsDeck
            currentMetrics={currentMetrics}
            simulationData={simulationData}
            activeBranch={activeBranch}
            onDispatchAction={(action) => onDispatchAction(action, 0, 0)}
          />
        </div>
      </div>

      {/* Building Details Inspector Modal */}
      {selectedBuilding && (
        <BuildingInspectorModal
          building={selectedBuilding}
          damagePct={currentMetrics.buildings_damage?.[selectedBuilding.id] ?? 0}
          damageStage={currentMetrics.buildings_stage?.[selectedBuilding.id] ?? 'intact'}
          waterDepth={currentMetrics.road_status ? 0.3 : 0}
          onClose={() => setSelectedBuilding(null)}
          onDispatchAction={(type) => {
            onDispatchAction(type, selectedBuilding.x, selectedBuilding.z, `Target: ${selectedBuilding.name}`);
          }}
        />
      )}
    </div>
  );
};
