from typing import List, Dict, Optional, Any, Tuple
from pydantic import BaseModel, Field

class ScenarioConfig(BaseModel):
    city_id: str = Field(default="hyderabad", description="'hyderabad', 'chennai', 'mumbai', 'bengaluru', 'delhi', 'visakhapatnam'")
    hazard_type: str = Field(default="flood", description="'flood', 'fire', or 'quake'")
    flood_source_type: str = Field(default="river_overflow", description="'river_overflow', 'dam_breach', 'rainfall_drainage', 'pipeline_rupture', 'coastal_surge'")
    severity: float = Field(default=72.0, ge=0.0, le=100.0)
    weather_intensity: float = Field(default=65.0, ge=0.0, le=100.0)
    response_resources: float = Field(default=50.0, ge=10.0, le=100.0)
    population_mode: str = Field(default="medium", description="'low', 'medium', 'high'")
    duration_ticks: int = Field(default=100, ge=10, le=200)
    seed: int = Field(default=42)
    source_x: Optional[float] = Field(default=None, ge=-38.0, le=38.0, description="Optional custom disaster origin X in local city coordinates")
    source_z: Optional[float] = Field(default=None, ge=-38.0, le=38.0, description="Optional custom disaster origin Z in local city coordinates")
    # Disaster-specific scientific parameters
    inflow_rate: float = Field(default=450.0, description="Flood inflow in m3/s")
    drainage_efficiency: float = Field(default=0.6, ge=0.0, le=1.0)
    wind_speed: float = Field(default=35.0, description="Wind speed in km/h for wildfire")
    wind_direction_deg: float = Field(default=45.0, description="Wind azimuth in degrees")
    humidity: float = Field(default=22.0, description="Relative humidity in %")
    fuel_density: float = Field(default=60.0, description="Fuel density % for wildfire")
    magnitude: float = Field(default=7.2, description="Moment magnitude Mw for earthquake")
    focal_depth_km: float = Field(default=10.0, description="Focal depth in km")
    aftershock_tick: int = Field(default=60, description="Tick at which secondary aftershock occurs")

class BuildingData(BaseModel):
    id: str
    name: str
    type: str  # residential, commercial, hospital, school, substation, water_plant, shelter, depot, telecom
    x: float
    y: float
    z: float
    width: float
    height: float
    depth: float
    floors: int
    occupants: int
    replacement_cost_cr: float
    structural_vulnerability: float  # 0 to 1
    flood_tolerance: float           # elevation height before flood penetration
    fire_vulnerability: float        # flammability score
    seismic_resistance: float        # base shear resistance
    damage_pct: float = 0.0          # 0 to 100
    damage_stage: str = "intact"     # intact, minor, moderate, severe, critical, destroyed
    tilt_x: float = 0.0
    tilt_z: float = 0.0
    collapse_ratio: float = 0.0
    is_critical: bool = False
    is_ignited: bool = False
    water_depth: float = 0.0

class RoadSegmentData(BaseModel):
    id: str
    u: str
    v: str
    name: str
    x1: float
    z1: float
    x2: float
    z2: float
    width: float = 2.4
    lanes: int = 2
    is_bridge: bool = False
    bridge_clearance: float = 3.2
    status: str = "open"  # open, congested, threatened, impassable
    water_depth: float = 0.0
    debris_blockage: float = 0.0
    congestion_ratio: float = 1.0

class InfrastructureNodeData(BaseModel):
    id: str
    name: str
    type: str  # power, water, hospital, telecom, depot, school, shelter
    x: float
    z: float
    status: str = "operational"  # operational, degraded, offline
    integrity_pct: float = 100.0
    depends_on: List[str] = Field(default_factory=list)
    backup_power_mins: int = 240
    active_alert: Optional[str] = None

class EventLogItem(BaseModel):
    id: str
    tick: int
    timestamp_str: str
    level: str  # INFO, WARNING, CRITICAL, ACTION
    category: str  # HAZARD, INFRASTRUCTURE, EVACUATION, LOGISTICS
    title: str
    description: str

class ResourceStatus(BaseModel):
    fire_engines: int = 8
    ambulances: int = 12
    rescue_squads: int = 6
    flood_barriers_deployed: int = 0
    drones_active: int = 2
    fuel_remaining_pct: float = 100.0
    medical_supplies_pct: float = 100.0

class BranchTickMetrics(BaseModel):
    tick: int
    timestamp_str: str
    hazard_radius: float
    hazard_center: Tuple[float, float]
    hazard_intensity: float
    residual_risk_pct: float
    people_at_risk: int
    people_evacuated: int
    people_trapped: int
    roads_blocked_count: int
    critical_assets_at_risk_count: int
    economic_loss_cr: float
    buildings_damage: Dict[str, float] = Field(default_factory=dict)
    buildings_stage: Dict[str, str] = Field(default_factory=dict)
    infrastructure_status: Dict[str, str] = Field(default_factory=dict)
    road_status: Dict[str, str] = Field(default_factory=dict)
    resources: ResourceStatus = Field(default_factory=ResourceStatus)
    recent_events: List[EventLogItem] = Field(default_factory=list)
    source_marker: Optional[Dict[str, Any]] = None

class BranchSimulationResult(BaseModel):
    branch_id: str  # A, B, C
    name: str
    policy_description: str
    timeline: List[BranchTickMetrics]
    final_risk_reduction_pct: float
    total_loss_cr: float
    total_casualties_averted: int
    summary_report: str

class CityDefinition(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    buildings: List[BuildingData]
    roads: List[RoadSegmentData]
    infrastructure: List[InfrastructureNodeData]
    terrain_heights: List[List[float]]
    river_path: List[Tuple[float, float]]
    shelters: List[Dict[str, Any]]

class FullSimulationResponse(BaseModel):
    scenario_id: str
    config: ScenarioConfig
    city: CityDefinition
    branch_A: BranchSimulationResult
    branch_B: BranchSimulationResult
    branch_C: BranchSimulationResult
    comparison_summary: Dict[str, Any]

class DispatchRequest(BaseModel):
    branch_id: str
    action_type: str  # 'deploy_barrier', 'dispatch_fire_crew', 'dispatch_ambulance', 'order_evacuation'
    target_x: float
    target_z: float
    notes: Optional[str] = None

class IncidentModel(BaseModel):
    id: str
    title: str
    city_id: str
    hazard_type: str
    severity: float
    priority: str  # 'Critical', 'High', 'Medium', 'Low'
    location_name: str
    x: float
    z: float
    affected_count: int
    status: str  # 'Reported', 'Verified', 'Assigned', 'En Route', 'On Scene', 'Resolved'
    assigned_unit: Optional[str] = None
    created_at: str
    updated_at: str
    description: str
    notes: List[str] = Field(default_factory=list)

class IncidentCreateRequest(BaseModel):
    title: str
    city_id: str = "hyderabad"
    hazard_type: str = "flood"
    severity: float = 60.0
    priority: str = "High"
    location_name: str
    x: float = 0.0
    z: float = 0.0
    affected_count: int = 50
    description: str
    assigned_unit: Optional[str] = None

class IncidentUpdateRequest(BaseModel):
    status: Optional[str] = None
    severity: Optional[float] = None
    priority: Optional[str] = None
    assigned_unit: Optional[str] = None
    note: Optional[str] = None

class EmergencyUnitModel(BaseModel):
    id: str
    city_id: str
    name: str
    type: str  # 'ambulance', 'fire_engine', 'rescue_squad', 'police'
    status: str  # 'Available', 'Assigned', 'En Route', 'On Scene', 'Unavailable'
    capability: str
    location_name: str
    lat: float
    lon: float
    fuel_pct: float
    assigned_incident_id: Optional[str] = None

class EmergencyUnitUpdateRequest(BaseModel):
    status: Optional[str] = None
    assigned_incident_id: Optional[str] = None
    fuel_pct: Optional[float] = None

class MedicalRequestModel(BaseModel):
    id: str
    incident_id: Optional[str] = None
    city_id: str
    patient_count: int
    triage_category: str  # 'Critical', 'Urgent', 'Moderate', 'Minor'
    assistance_required: str
    location_name: str
    assigned_unit_id: Optional[str] = None
    assigned_hospital_id: Optional[str] = None
    status: str  # 'Requested', 'Verified', 'Assigned', 'En Route', 'On Scene', 'Resolved'
    created_at: str
    notes: List[str] = Field(default_factory=list)

class MedicalRequestCreate(BaseModel):
    incident_id: Optional[str] = None
    city_id: str = "hyderabad"
    patient_count: int = 1
    triage_category: str = "Urgent"
    assistance_required: str
    location_name: str
    assigned_hospital_id: Optional[str] = None

class MedicalRequestUpdate(BaseModel):
    status: Optional[str] = None
    assigned_unit_id: Optional[str] = None
    assigned_hospital_id: Optional[str] = None
    note: Optional[str] = None

class ReliefRequestModel(BaseModel):
    id: str
    city_id: str
    category: str  # 'food_water', 'temporary_shelter', 'essential_supplies', 'medical_relief', 'special_assistance'
    item_name: str
    quantity_requested: int
    quantity_delivered: int = 0
    unit: str  # 'meals', 'liters', 'kits', 'people', 'blankets'
    status: str  # 'Requested', 'Verified', 'Approved', 'Assigned', 'In Progress', 'Delivered', 'Completed'
    priority: str  # 'Critical', 'High', 'Medium', 'Low'
    location_name: str
    x: float = 0.0
    z: float = 0.0
    assigned_team: Optional[str] = None
    created_at: str
    updated_at: str
    notes: List[str] = Field(default_factory=list)

class ReliefRequestCreate(BaseModel):
    city_id: str = "hyderabad"
    category: str = "food_water"
    item_name: str
    quantity_requested: int = 100
    unit: str = "meals"
    priority: str = "High"
    location_name: str
    x: float = 0.0
    z: float = 0.0
    notes: Optional[str] = None

class ReliefRequestUpdate(BaseModel):
    status: Optional[str] = None
    quantity_delivered: Optional[int] = None
    assigned_team: Optional[str] = None
    note: Optional[str] = None

class FacilityModel(BaseModel):
    id: str
    city_id: str
    type: str  # 'hospital', 'shelter'
    name: str
    address: str
    x: float
    z: float
    capacity: int
    current_occupancy: int
    status: str  # 'operational', 'high_occupancy', 'full', 'closed'
    contact_phone: str
    services: List[str] = Field(default_factory=list)
    accessibility: str
    data_source: str = "Seeded Demonstration Cadastre"

class FacilityCreate(BaseModel):
    city_id: str = "hyderabad"
    type: str = "shelter"
    name: str
    address: str
    x: float = 0.0
    z: float = 0.0
    capacity: int = 500
    current_occupancy: int = 0
    status: str = "operational"
    contact_phone: str = "+91-40-2345-0000"
    services: List[str] = Field(default_factory=list)
    accessibility: str = "Wheelchair accessible, generator backup"

class VolunteerModel(BaseModel):
    id: str
    city_id: str
    name: str
    phone: str
    skills: List[str] = Field(default_factory=list)
    availability: str  # 'Immediate', 'Within 2 Hours', 'On Standby'
    assigned_task: Optional[str] = None
    status: str  # 'Active', 'Assigned', 'Available', 'Offline'

