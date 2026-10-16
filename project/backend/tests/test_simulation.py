import pytest
from backend.models import ScenarioConfig
from backend.simulation_engine import NexusSimulationEngine
from backend.cities import CITIES_METADATA, generate_city_definition

def test_all_six_cities_metadata():
    """Validates that all 6 required Indian cities are properly registered."""
    city_ids = [c["id"] for c in CITIES_METADATA]
    required_cities = ["hyderabad", "chennai", "mumbai", "bengaluru", "delhi", "visakhapatnam"]
    for city in required_cities:
        assert city in city_ids, f"Required city {city} is missing from CITIES_METADATA"

def test_city_geometry_generation():
    """Validates that procedural geometry generates without nulls for each city."""
    for meta in CITIES_METADATA:
        city_id = meta["id"]
        city_def = generate_city_definition(city_id, seed=42)
        assert len(city_def.buildings) >= 30, f"{city_id} has insufficient buildings ({len(city_def.buildings)})"
        assert len(city_def.roads) >= 14, f"{city_id} has insufficient roads ({len(city_def.roads)})"
        assert len(city_def.infrastructure) >= 7, f"{city_id} has insufficient lifelines ({len(city_def.infrastructure)})"
        assert len(city_def.shelters) >= 2, f"{city_id} has insufficient shelters ({len(city_def.shelters)})"
        assert len(city_def.terrain_heights) == 25, f"{city_id} terrain grid height mismatch"

def test_source_based_flood_simulation():
    """Validates source-based flood origins across different flood sources."""
    engine = NexusSimulationEngine(seed=42, city_id="hyderabad")
    for source in ["river_overflow", "dam_breach", "rainfall_drainage", "pipeline_rupture"]:
        config = ScenarioConfig(
            city_id="hyderabad",
            hazard_type="flood",
            flood_source_type=source,
            severity=75.0,
            duration_ticks=50
        )
        res = engine.run_three_branches(config)
        assert res.branch_A is not None
        assert res.branch_B is not None
        assert res.branch_C is not None
        # Check source marker exists
        first_tick = res.branch_A.timeline[0]
        assert first_tick.source_marker is not None
        assert first_tick.source_marker["type"] == source

def test_three_branch_divergence_and_mitigation():
    """Validates that Branch B (Proactive) significantly reduces residual risk compared to Branch A (Baseline)."""
    engine = NexusSimulationEngine(seed=42, city_id="chennai")
    config = ScenarioConfig(
        city_id="chennai",
        hazard_type="flood",
        flood_source_type="coastal_surge",
        severity=80.0,
        duration_ticks=60
    )
    res = engine.run_three_branches(config)

    final_A = res.branch_A.timeline[-1]
    final_B = res.branch_B.timeline[-1]
    final_C = res.branch_C.timeline[-1]

    # Branch B should have lower residual risk and lower loss than Branch A
    assert final_B.residual_risk_pct < final_A.residual_risk_pct, "Branch B risk should be lower than Branch A"
    assert final_B.economic_loss_cr < final_A.economic_loss_cr, "Branch B economic loss should be lower than Branch A"
    assert final_B.people_evacuated > final_A.people_evacuated, "Branch B should evacuate more people than Branch A"

def test_wildfire_wind_and_fuel():
    """Validates wildfire simulation with wind and fuel density."""
    engine = NexusSimulationEngine(seed=42, city_id="delhi")
    config = ScenarioConfig(
        city_id="delhi",
        hazard_type="fire",
        wind_speed=50.0,
        wind_direction_deg=90.0,
        humidity=15.0,
        fuel_density=80.0,
        duration_ticks=40
    )
    res = engine.run_three_branches(config)
    assert res.branch_A.timeline[-1].hazard_radius > res.branch_B.timeline[-1].hazard_radius

def test_earthquake_aftershocks():
    """Validates earthquake simulation and aftershock hazard intensity spike."""
    engine = NexusSimulationEngine(seed=42, city_id="mumbai")
    config = ScenarioConfig(
        city_id="mumbai",
        hazard_type="quake",
        magnitude=7.4,
        aftershock_tick=30,
        duration_ticks=60
    )
    res = engine.run_three_branches(config)
    # Check aftershock tick
    timeline_A = res.branch_A.timeline
    tick_30 = next((t for t in timeline_A if t.tick == 30), None)
    assert tick_30 is not None
    assert tick_30.hazard_intensity > 0.3
