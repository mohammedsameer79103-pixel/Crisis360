import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.models import ScenarioConfig
from backend.simulation_engine import NexusSimulationEngine
from backend.cities import CITIES_METADATA, generate_city_definition

class TestCrisis360Simulation(unittest.TestCase):
    def test_all_six_cities_metadata(self):
        city_ids = [c["id"] for c in CITIES_METADATA]
        required_cities = ["hyderabad", "chennai", "mumbai", "bengaluru", "delhi", "visakhapatnam"]
        for city in required_cities:
            self.assertIn(city, city_ids, f"Required city {city} is missing")

    def test_city_geometry_generation(self):
        for meta in CITIES_METADATA:
            city_id = meta["id"]
            city_def = generate_city_definition(city_id, seed=42)
            self.assertGreaterEqual(len(city_def.buildings), 30, f"{city_id} has insufficient buildings")
            self.assertGreaterEqual(len(city_def.roads), 14, f"{city_id} has insufficient roads")
            self.assertGreaterEqual(len(city_def.infrastructure), 7, f"{city_id} has insufficient lifelines")
            self.assertGreaterEqual(len(city_def.shelters), 2, f"{city_id} has insufficient shelters")
            self.assertEqual(len(city_def.terrain_heights), 25, f"{city_id} terrain grid height mismatch")

    def test_source_based_flood_simulation(self):
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
            self.assertIsNotNone(res.branch_A)
            self.assertIsNotNone(res.branch_B)
            self.assertIsNotNone(res.branch_C)
            first_tick = res.branch_A.timeline[0]
            self.assertIsNotNone(first_tick.source_marker)
            self.assertEqual(first_tick.source_marker["type"], source)

    def test_three_branch_divergence_and_mitigation(self):
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

        self.assertLess(final_B.residual_risk_pct, final_A.residual_risk_pct)
        self.assertLess(final_B.economic_loss_cr, final_A.economic_loss_cr)
        self.assertGreater(final_B.people_evacuated, final_A.people_evacuated)

    def test_wildfire_wind_and_fuel(self):
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
        self.assertGreater(res.branch_A.timeline[-1].hazard_radius, res.branch_B.timeline[-1].hazard_radius)

    def test_earthquake_aftershocks(self):
        engine = NexusSimulationEngine(seed=42, city_id="mumbai")
        config = ScenarioConfig(
            city_id="mumbai",
            hazard_type="quake",
            magnitude=7.4,
            aftershock_tick=30,
            duration_ticks=60
        )
        res = engine.run_three_branches(config)
        timeline_A = res.branch_A.timeline
        tick_30 = next((t for t in timeline_A if t.tick == 30), None)
        self.assertIsNotNone(tick_30)
        self.assertGreater(tick_30.hazard_intensity, 0.3)

if __name__ == "__main__":
    unittest.main()
