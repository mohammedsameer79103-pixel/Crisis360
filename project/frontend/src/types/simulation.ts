export type HazardType = 'flood' | 'fire' | 'quake';
export type BranchId = 'A' | 'B' | 'C';
export type PopulationMode = 'low' | 'medium' | 'high';
export type DamageStage = 'intact' | 'minor' | 'moderate' | 'severe' | 'critical' | 'destroyed';
export type CityId = 'hyderabad' | 'chennai' | 'mumbai' | 'bengaluru' | 'delhi' | 'visakhapatnam';
export type FloodSourceType = 'river_overflow' | 'dam_breach' | 'rainfall_drainage' | 'pipeline_rupture' | 'coastal_surge';

export interface FloodSourceOption {
  id: FloodSourceType;
  name: string;
  origin: [number, number];
  desc: string;
}

export interface CityMetadata {
  id: CityId;
  name: string;
  state: string;
  title: string;
  coordinates: { lat: number; lng: number };
  description: string;
  water_type: string;
  water_name: string;
  flood_sources: FloodSourceOption[];
  wildfire_source: { name: string; origin: [number, number] };
  seismic_source: { name: string; origin: [number, number] };
}

export interface ScenarioConfig {
  city_id: CityId;
  hazard_type: HazardType;
  flood_source_type: FloodSourceType;
  severity: number;           // 0 - 100
  weather_intensity: number;  // 0 - 100
  response_resources: number; // 10 - 100
  population_mode: PopulationMode;
  duration_ticks: number;
  seed: number;
  /** Custom source position in the 3D city coordinate grid (-38..38). */
  source_x?: number;
  source_z?: number;
  inflow_rate?: number;
  drainage_efficiency?: number;
  wind_speed?: number;
  wind_direction_deg?: number;
  humidity?: number;
  fuel_density?: number;
  magnitude?: number;
  focal_depth_km?: number;
  aftershock_tick?: number;
}

export interface BuildingData {
  id: string;
  name: string;
  type: string; // residential, commercial, hospital, school, substation, water_plant, shelter, depot, telecom
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  floors: number;
  occupants: number;
  replacement_cost_cr: number;
  structural_vulnerability: number;
  flood_tolerance: number;
  fire_vulnerability: number;
  seismic_resistance: number;
  damage_pct: number;
  damage_stage: DamageStage;
  tilt_x?: number;
  tilt_z?: number;
  collapse_ratio?: number;
  is_critical: boolean;
  water_depth?: number;
}

export interface RoadSegmentData {
  id: string;
  u: string;
  v: string;
  name: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  width: number;
  lanes: number;
  is_bridge: boolean;
  bridge_clearance: number;
  status: 'open' | 'congested' | 'threatened' | 'impassable';
}

export interface InfrastructureNodeData {
  id: string;
  name: string;
  type: string;
  x: number;
  z: number;
  status: 'operational' | 'degraded' | 'offline';
  integrity_pct: number;
  depends_on: string[];
  backup_power_mins: number;
  active_alert?: string;
}

export interface EventLogItem {
  id: string;
  tick: number;
  timestamp_str: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL' | 'ACTION';
  category: 'HAZARD' | 'INFRASTRUCTURE' | 'EVACUATION' | 'LOGISTICS';
  title: string;
  description: string;
}

export interface ResourceStatus {
  fire_engines: number;
  ambulances: number;
  rescue_squads: number;
  flood_barriers_deployed: number;
  drones_active: number;
  fuel_remaining_pct: number;
  medical_supplies_pct: number;
}

export interface SourceMarkerData {
  name: string;
  type: string;
  x: number;
  z: number;
  desc: string;
}

export interface BranchTickMetrics {
  tick: number;
  timestamp_str: string;
  hazard_radius: number;
  hazard_center: [number, number];
  hazard_intensity: number;
  residual_risk_pct: number;
  people_at_risk: number;
  people_evacuated: number;
  people_trapped: number;
  roads_blocked_count: number;
  critical_assets_at_risk_count: number;
  economic_loss_cr: number;
  buildings_damage: Record<string, number>;
  buildings_stage: Record<string, DamageStage>;
  infrastructure_status: Record<string, 'operational' | 'degraded' | 'offline'>;
  road_status: Record<string, 'open' | 'congested' | 'threatened' | 'impassable'>;
  resources: ResourceStatus;
  recent_events: EventLogItem[];
  source_marker?: SourceMarkerData;
}

export interface BranchSimulationResult {
  branch_id: BranchId;
  name: string;
  policy_description: string;
  timeline: BranchTickMetrics[];
  final_risk_reduction_pct: number;
  total_loss_cr: number;
  total_casualties_averted: number;
  summary_report: string;
}

export interface CityDefinition {
  name?: string;
  lat?: number;
  lon?: number;
  buildings: BuildingData[];
  roads: RoadSegmentData[];
  infrastructure: InfrastructureNodeData[];
  terrain_heights: number[][];
  river_path: [number, number][];
  shelters: {
    id: string;
    name: string;
    x: number;
    z: number;
    capacity: number;
    current_occupancy: number;
  }[];
}

export interface FullSimulationResponse {
  scenario_id: string;
  config: ScenarioConfig;
  city: CityDefinition;
  branch_A: BranchSimulationResult;
  branch_B: BranchSimulationResult;
  branch_C: BranchSimulationResult;
  comparison_summary: Record<string, any>;
}

// Runtime object exports
export const SimulationConstants = {
  VERSION: '2.4.0',
  PLATFORM_NAME: 'Crisis360 — Intelligent Disaster Simulation & Response Platform',
  SUPPORTED_CITIES: ['hyderabad', 'chennai', 'mumbai', 'bengaluru', 'delhi', 'visakhapatnam'] as const,
  BRANCHES: ['A', 'B', 'C'] as const
};
