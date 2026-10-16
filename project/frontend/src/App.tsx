import React, { useState, useEffect, useRef } from 'react';
import type {
  ScenarioConfig,
  FullSimulationResponse,
  BranchId,
  BuildingData,
  CityId,
  FloodSourceType
} from './types/simulation';

import { CITIES_CATALOG, generateClientCity } from './services/cityData';
import { simulateThreeBranchesClient } from './services/clientSimulationEngine';
import { checkBackendHealth, runForkSimulation, dispatchTacticalAction, fetchCityDefinition } from './services/api';

import { CrisisProvider, useCrisis } from './context/CrisisContext';
import { NavigationSidebar } from './components/NavigationSidebar';
import { GlobalTopBar } from './components/GlobalTopBar';
import { NewIncidentModal } from './components/NewIncidentModal';
import { IncidentReportModal } from './components/IncidentReportModal';

// 11 Feature Pages
import { CommandCenterPage } from './pages/CommandCenterPage';
import { SimulationLabPage } from './pages/SimulationLabPage';
import { EmergencyResponsePage } from './pages/EmergencyResponsePage';
import { MedicalAmbulancePage } from './pages/MedicalAmbulancePage';
import { FireRescuePage } from './pages/FireRescuePage';
import { ReliefAssistancePage } from './pages/ReliefAssistancePage';
import { ResourceEvacuationMapPage } from './pages/ResourceEvacuationMapPage';
import { HospitalsSheltersPage } from './pages/HospitalsSheltersPage';
import { IncidentManagementPage } from './pages/IncidentManagementPage';
import { AnalyticsReportsPage } from './pages/AnalyticsReportsPage';
import { SettingsDataSourcesPage } from './pages/SettingsDataSourcesPage';

const CrisisAppShell: React.FC = () => {
  const {
    activePage,
    selectedCityId,
    setSelectedCityId,
    toastMessage,
    showToast
  } = useCrisis();

  // Scenario Configuration
  const [config, setConfig] = useState<ScenarioConfig>({
    city_id: 'hyderabad',
    hazard_type: 'flood',
    flood_source_type: 'river_overflow',
    fuel_density: 70,
    severity: 72,
    weather_intensity: 65,
    response_resources: 50,
    population_mode: 'medium',
    duration_ticks: 100,
    seed: 42
  });

  // Simulation State
  const initialCity = useRef(generateClientCity('hyderabad', 42)).current;
  const [simulationData, setSimulationData] = useState<FullSimulationResponse>(() =>
    simulateThreeBranchesClient(config, initialCity)
  );

  const [activeBranch, setActiveBranch] = useState<BranchId>('A');
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [splitView, setSplitView] = useState<boolean>(false);
  const [dualBranchRight, setDualBranchRight] = useState<BranchId>('B');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isForking, setIsForking] = useState<boolean>(false);

  // Modals State
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState(false);
  const [isSitRepModalOpen, setIsSitRepModalOpen] = useState(false);

  // Check Backend API Connection on mount
  useEffect(() => {
    checkBackendHealth().then((connected) => {
      setIsBackendConnected(connected);
      if (connected) {
        showToast('Connected to Python FastAPI & SQLite Core');
      }
    });
  }, [showToast]);

  // Synchronize simulation city when selectedCityId changes in global context
  useEffect(() => {
    if (config.city_id !== selectedCityId) {
      const updatedConfig = { ...config, city_id: selectedCityId };
      setConfig(updatedConfig);
      handleForkSimulation(updatedConfig);
    }
  }, [selectedCityId]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTick((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return Math.min(100, prev + 2);
      });
    }, 180 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Fork Three Simulation Branches
  const handleForkSimulation = async (customConfig?: ScenarioConfig) => {
    const activeCfg = customConfig || config;
    setIsForking(true);

    try {
      if (isBackendConnected) {
        const result = await runForkSimulation(activeCfg);
        setSimulationData(result);
        setCurrentTick(0);
        showToast(`Three futures simulated for ${activeCfg.city_id} via FastAPI backend`);
      } else {
        const clientCity = generateClientCity(activeCfg.city_id, activeCfg.seed);
        const result = simulateThreeBranchesClient(activeCfg, clientCity);
        setSimulationData(result);
        setCurrentTick(0);
        showToast(`Three futures generated via deterministic client engine`);
      }
    } catch {
      const clientCity = generateClientCity(activeCfg.city_id, activeCfg.seed);
      const result = simulateThreeBranchesClient(activeCfg, clientCity);
      setSimulationData(result);
      setCurrentTick(0);
      showToast(`Simulation updated via client solver fallback`);
    } finally {
      setIsForking(false);
    }
  };

  // Scenario Presets
  const handleSelectPreset = (presetId: string) => {
    const presetMap: Record<string, Partial<ScenarioConfig>> = {
      hyderabad_musi_flood: {
        city_id: 'hyderabad',
        hazard_type: 'flood',
        flood_source_type: 'river_overflow',
        severity: 78,
        weather_intensity: 70
      },
      chennai_cyclone_surge: {
        city_id: 'chennai',
        hazard_type: 'flood',
        flood_source_type: 'coastal_surge',
        severity: 85,
        weather_intensity: 88
      },
      mumbai_mithi_cloudburst: {
        city_id: 'mumbai',
        hazard_type: 'flood',
        flood_source_type: 'river_overflow',
        severity: 82,
        weather_intensity: 85
      },
      bengaluru_lake_breach: {
        city_id: 'bengaluru',
        hazard_type: 'flood',
        flood_source_type: 'dam_breach',
        severity: 74,
        weather_intensity: 65
      },
      delhi_yamuna_breach: {
        city_id: 'delhi',
        hazard_type: 'flood',
        flood_source_type: 'dam_breach',
        severity: 80,
        weather_intensity: 75
      },
      vizag_cyclone_surge: {
        city_id: 'visakhapatnam',
        hazard_type: 'flood',
        flood_source_type: 'coastal_surge',
        severity: 84,
        weather_intensity: 82
      }
    };

    const p = presetMap[presetId];
    if (p) {
      const updatedConfig = { ...config, ...p };
      setConfig(updatedConfig);
      if (p.city_id) setSelectedCityId(p.city_id);
      handleForkSimulation(updatedConfig);
    }
  };

  // Dispatch Tactical Action
  const handleDispatchAction = async (type: string, x: number, z: number, notes?: string) => {
    showToast(`Dispatched ${type} to Sector (${x.toFixed(1)}, ${z.toFixed(1)})`);

    if (isBackendConnected) {
      try {
        await dispatchTacticalAction({
          branch_id: activeBranch,
          action_type: type,
          target_x: x,
          target_z: z,
          notes: notes || 'Dispatched from Crisis360 EOC'
        });
      } catch {
        // Fallback
      }
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. Persistent Left Navigation Rail */}
      <NavigationSidebar />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Global Persistent Top Bar */}
        <GlobalTopBar
          onOpenReportModal={() => setIsNewIncidentModalOpen(true)}
          onOpenSitRepModal={() => setIsSitRepModalOpen(true)}
        />

        {/* Dynamic Page Router */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activePage === 'command_center' && (
            <CommandCenterPage
              onOpenReportModal={() => setIsNewIncidentModalOpen(true)}
              onOpenSitRepModal={() => setIsSitRepModalOpen(true)}
            />
          )}

          {activePage === 'simulation_lab' && (
            <SimulationLabPage
              config={config}
              setConfig={setConfig}
              simulationData={simulationData}
              activeBranch={activeBranch}
              setActiveBranch={setActiveBranch}
              currentTick={currentTick}
              setCurrentTick={setCurrentTick}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
              splitView={splitView}
              setSplitView={setSplitView}
              dualBranchRight={dualBranchRight}
              setDualBranchRight={setDualBranchRight}
              selectedBuilding={selectedBuilding}
              setSelectedBuilding={setSelectedBuilding}
              isForking={isForking}
              onForkSimulation={handleForkSimulation}
              onSelectPreset={handleSelectPreset}
              onDispatchAction={handleDispatchAction}
              isBackendConnected={isBackendConnected}
            />
          )}

          {activePage === 'emergency_response' && (
            <EmergencyResponsePage onOpenReportModal={() => setIsNewIncidentModalOpen(true)} />
          )}

          {activePage === 'medical_ambulance' && <MedicalAmbulancePage />}

          {activePage === 'fire_rescue' && <FireRescuePage />}

          {activePage === 'relief_assistance' && <ReliefAssistancePage />}

          {activePage === 'evacuation_map' && <ResourceEvacuationMapPage />}

          {activePage === 'hospitals_shelters' && <HospitalsSheltersPage />}

          {activePage === 'incident_management' && (
            <IncidentManagementPage onOpenReportModal={() => setIsNewIncidentModalOpen(true)} />
          )}

          {activePage === 'analytics_reports' && <AnalyticsReportsPage />}

          {activePage === 'settings_sources' && <SettingsDataSourcesPage />}
        </main>
      </div>

      {/* Global Modals */}
      <NewIncidentModal
        isOpen={isNewIncidentModalOpen}
        onClose={() => setIsNewIncidentModalOpen(false)}
      />

      {simulationData && (
        <IncidentReportModal
          isOpen={isSitRepModalOpen}
          onClose={() => setIsSitRepModalOpen(false)}
          simulationData={simulationData}
          config={config}
          city={simulationData.city}
        />
      )}

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-150">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <CrisisProvider>
      <CrisisAppShell />
    </CrisisProvider>
  );
};

export default App;
