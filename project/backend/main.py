from fastapi import FastAPI, HTTPException, Body, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional

from .models import (
    ScenarioConfig, FullSimulationResponse, DispatchRequest, CityDefinition,
    IncidentModel, IncidentCreateRequest, IncidentUpdateRequest,
    EmergencyUnitModel, EmergencyUnitUpdateRequest,
    MedicalRequestModel, MedicalRequestCreate, MedicalRequestUpdate,
    ReliefRequestModel, ReliefRequestCreate, ReliefRequestUpdate,
    FacilityModel, FacilityCreate, VolunteerModel
)
from .simulation_engine import NexusSimulationEngine
from .cities import CITIES_METADATA, generate_city_definition
from .database import (
    save_scenario, record_dispatch_action, log_event,
    get_incidents, create_incident, update_incident,
    get_emergency_units, update_emergency_unit,
    get_medical_requests, create_medical_request, update_medical_request,
    get_relief_requests, create_relief_request, update_relief_request,
    get_facilities, create_facility, get_volunteers, reset_all_data
)

app = FastAPI(
    title="Crisis360 — Intelligent Disaster Simulation & Response Platform API",
    description="Deterministic multi-branch digital twin simulation engine for Indian metropolitan areas",
    version="2.4.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Engine singleton with default seed and city
engine = NexusSimulationEngine(seed=42, city_id="hyderabad")
latest_simulation_result: FullSimulationResponse = None

@app.on_event("startup")
def startup_event():
    global latest_simulation_result
    default_config = ScenarioConfig(city_id="hyderabad", hazard_type="flood", flood_source_type="river_overflow")
    latest_simulation_result = engine.run_three_branches(default_config)
    save_scenario(
        latest_simulation_result.scenario_id,
        default_config.hazard_type,
        default_config.severity,
        default_config.model_dump() if hasattr(default_config, 'model_dump') else default_config.dict()
    )

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Crisis360 Simulation Engine",
        "branding": "Crisis360 — Intelligent Disaster Simulation & Response Platform",
        "supported_cities": ["hyderabad", "chennai", "mumbai", "bengaluru", "delhi", "visakhapatnam"],
        "active_city": engine.city_id,
        "features": [
            "6 Indian Metropolitan Digital Twins",
            "Source-Based Hydrological Flood Solver (River, Dam, Drainage, Pipeline, Coastal Surge)",
            "Rothermel Wildfire Fuel & Wind Propagation",
            "Joyner-Boore Seismic Attenuation & Aftershock Trigger",
            "NetworkX Graph Evacuation Routing",
            "Infrastructure Dependency Cascade DAG",
            "3 Independent Future Simulation Branches (A, B, C)"
        ]
    }

@app.get("/api/cities")
def get_supported_cities():
    """Returns the list of all 6 supported Indian metropolitan cities and their hazard parameters."""
    return {"cities": CITIES_METADATA}

@app.get("/api/city", response_model=CityDefinition)
def get_current_city_definition():
    """Returns the complete structural definition of the currently active city."""
    return engine.city_def

@app.get("/api/city/{city_id}", response_model=CityDefinition)
def get_city_definition_by_id(city_id: str = Path(..., description="City ID")):
    """Returns the structural digital twin definition for a specific city."""
    if city_id not in [c["id"] for c in CITIES_METADATA]:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found. Supported: {[c['id'] for c in CITIES_METADATA]}")
    return generate_city_definition(city_id, engine.seed)

@app.post("/api/simulation/fork", response_model=FullSimulationResponse)
def fork_simulation(config: ScenarioConfig = Body(...)):
    """
    Forks the simulation into three independent branches from the exact same initial conditions:
    Branch A: No Intervention
    Branch B: Early Intervention
    Branch C: Resource-Constrained Intervention
    """
    global engine, latest_simulation_result
    result = engine.run_three_branches(config)
    latest_simulation_result = result

    # Persist scenario to SQLite
    cfg_data = config.model_dump() if hasattr(config, 'model_dump') else config.dict()
    save_scenario(result.scenario_id, config.hazard_type, config.severity, cfg_data)

    return result

@app.get("/api/simulation/latest", response_model=FullSimulationResponse)
def get_latest_simulation():
    """Returns the most recent calculated simulation run."""
    global latest_simulation_result
    if latest_simulation_result is None:
        latest_simulation_result = engine.run_three_branches(ScenarioConfig(city_id="hyderabad"))
    return latest_simulation_result

@app.get("/api/simulation/presets")
def get_scenario_presets():
    """Provides validated scenario presets for Indian cities for demonstrations."""
    return {
        "presets": [
            {
                "id": "hyderabad_musi_flood",
                "city_id": "hyderabad",
                "name": "Hyderabad: Musi River Flash Inundation",
                "hazard_type": "flood",
                "flood_source_type": "river_overflow",
                "severity": 78.0,
                "weather_intensity": 70.0,
                "response_resources": 55.0,
                "population_mode": "medium",
                "description": "Torrential catchment downpour causes Musi River overtopping near Nayapul, threatening Osmania General Hospital."
            },
            {
                "id": "chennai_cyclone_surge",
                "city_id": "chennai",
                "name": "Chennai: Coastal Super Cyclone Surge & Adyar Flood",
                "hazard_type": "flood",
                "flood_source_type": "coastal_surge",
                "severity": 85.0,
                "weather_intensity": 88.0,
                "response_resources": 60.0,
                "population_mode": "high",
                "description": "3.8m storm surge coincides with Chembarambakkam reservoir discharge along the coastal Marina corridor."
            },
            {
                "id": "mumbai_mithi_cloudburst",
                "city_id": "mumbai",
                "name": "Mumbai: Mithi River & High Tide Stormwater Surcharge",
                "hazard_type": "flood",
                "flood_source_type": "river_overflow",
                "severity": 82.0,
                "weather_intensity": 85.0,
                "response_resources": 55.0,
                "population_mode": "high",
                "description": "Simultaneous 4.8m high tide and cloudburst cause Mithi River to breach the BKC commercial core."
            },
            {
                "id": "bengaluru_lake_breach",
                "city_id": "bengaluru",
                "name": "Bengaluru: Bellandur-Varthur Cascading Lake Breach",
                "hazard_type": "flood",
                "flood_source_type": "dam_breach",
                "severity": 74.0,
                "weather_intensity": 65.0,
                "response_resources": 50.0,
                "population_mode": "medium",
                "description": "Encroached lake bund yields under heavy monsoon downpour, submerging Outer Ring Road tech parks."
            },
            {
                "id": "delhi_yamuna_breach",
                "city_id": "delhi",
                "name": "Delhi: Hathnikund Barrage Surge & Yamuna Floodplain",
                "hazard_type": "flood",
                "flood_source_type": "dam_breach",
                "severity": 80.0,
                "weather_intensity": 75.0,
                "response_resources": 55.0,
                "population_mode": "high",
                "description": "Upstream discharge pushes Yamuna over 208.6m, flooding Ring Road and Wazirabad water treatment."
            },
            {
                "id": "vizag_cyclone_surge",
                "city_id": "visakhapatnam",
                "name": "Visakhapatnam: Cyclonic Surge & Harbor Overwash",
                "hazard_type": "flood",
                "flood_source_type": "coastal_surge",
                "severity": 84.0,
                "weather_intensity": 82.0,
                "response_resources": 50.0,
                "population_mode": "medium",
                "description": "Gale-force cyclonic surge penetrates RK Beach Road and threatens Vizag Port logistics lines."
            }
        ]
    }

@app.post("/api/simulation/dispatch")
def dispatch_resource(req: DispatchRequest):
    """
    Records an on-the-fly emergency commander dispatch command.
    """
    action_id = record_dispatch_action(
        scenario_id=latest_simulation_result.scenario_id if latest_simulation_result else "CRISIS360_MANUAL",
        branch_id=req.branch_id,
        tick=0,
        action_type=req.action_type,
        x=req.target_x,
        z=req.target_z,
        notes=req.notes or ""
    )
    return {
        "status": "dispatched",
        "action_id": action_id,
        "message": f"Successfully executed {req.action_type} for Branch {req.branch_id} at ({req.target_x}, {req.target_z})."
    }

# ==========================================
# OPERATIONAL EMERGENCY RESPONSE ENDPOINTS
# ==========================================

@app.get("/api/incidents")
def list_incidents(city_id: Optional[str] = None):
    """Retrieves authoritative incident list, optionally filtered by city."""
    return {"incidents": get_incidents(city_id)}

@app.post("/api/incidents")
def report_new_incident(req: IncidentCreateRequest):
    """Creates a new emergency incident in the command queue."""
    created = create_incident(req.model_dump() if hasattr(req, 'model_dump') else req.dict())
    return {"status": "created", "incident": created}

@app.patch("/api/incidents/{incident_id}")
def update_incident_record(incident_id: str, updates: IncidentUpdateRequest):
    """Updates status, priority, severity, or assigned unit for an incident."""
    updated = update_incident(incident_id, updates.model_dump(exclude_unset=True) if hasattr(updates, 'model_dump') else updates.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"status": "updated", "incident": updated}

@app.get("/api/units")
def list_emergency_units(city_id: Optional[str] = None):
    """Returns registry of ambulances, fire engines, and rescue squads."""
    return {"units": get_emergency_units(city_id)}

@app.patch("/api/units/{unit_id}")
def update_unit_record(unit_id: str, updates: EmergencyUnitUpdateRequest):
    """Updates availability status or assignment for an emergency response unit."""
    updated = update_emergency_unit(unit_id, updates.model_dump(exclude_unset=True) if hasattr(updates, 'model_dump') else updates.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Emergency unit not found")
    return {"status": "updated", "unit": updated}

@app.get("/api/medical-requests")
def list_medical_requests(city_id: Optional[str] = None):
    """Returns triage queue of patient medical assistance requests."""
    return {"requests": get_medical_requests(city_id)}

@app.post("/api/medical-requests")
def create_new_medical_request(req: MedicalRequestCreate):
    """Logs a new medical assistance request with triage categorization."""
    created = create_medical_request(req.model_dump() if hasattr(req, 'model_dump') else req.dict())
    return {"status": "created", "request": created}

@app.patch("/api/medical-requests/{req_id}")
def update_medical_request_record(req_id: str, updates: MedicalRequestUpdate):
    """Updates medical request status, unit assignment, or hospital destination."""
    updated = update_medical_request(req_id, updates.model_dump(exclude_unset=True) if hasattr(updates, 'model_dump') else updates.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Medical request not found")
    return {"status": "updated", "request": updated}

@app.get("/api/relief-requests")
def list_relief_requests(city_id: Optional[str] = None):
    """Returns relief aid requests across food, shelter, supplies, and assistance."""
    return {"requests": get_relief_requests(city_id)}

@app.post("/api/relief-requests")
def create_new_relief_request(req: ReliefRequestCreate):
    """Logs a new relief aid request for disaster-affected populations."""
    created = create_relief_request(req.model_dump() if hasattr(req, 'model_dump') else req.dict())
    return {"status": "created", "request": created}

@app.patch("/api/relief-requests/{req_id}")
def update_relief_request_record(req_id: str, updates: ReliefRequestUpdate):
    """Advances the 7-step relief request workflow."""
    updated = update_relief_request(req_id, updates.model_dump(exclude_unset=True) if hasattr(updates, 'model_dump') else updates.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Relief request not found")
    return {"status": "updated", "request": updated}

@app.get("/api/facilities")
def list_facilities(city_id: Optional[str] = None):
    """Returns verified directory of hospitals and emergency shelters."""
    return {"facilities": get_facilities(city_id)}

@app.post("/api/facilities")
def register_new_facility(req: FacilityCreate):
    """Registers a new hospital or emergency shelter facility."""
    created = create_facility(req.model_dump() if hasattr(req, 'model_dump') else req.dict())
    return {"status": "created", "facility": created}

@app.get("/api/volunteers")
def list_volunteers(city_id: Optional[str] = None):
    """Returns registered volunteer corps with skill tags and status."""
    return {"volunteers": get_volunteers(city_id)}

@app.post("/api/data/reset")
def reset_demonstration_data():
    """Resets all operational tables back to default clean demonstration seed."""
    reset_all_data()
    return {"status": "reset", "message": "All operational records reset to default demonstration state."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
