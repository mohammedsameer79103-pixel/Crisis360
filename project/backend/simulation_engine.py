import math
import random
import copy
from typing import List, Dict, Tuple, Any
import numpy as np
import networkx as nx

from .models import (
    ScenarioConfig, BuildingData, RoadSegmentData, InfrastructureNodeData,
    EventLogItem, ResourceStatus, BranchTickMetrics, BranchSimulationResult,
    CityDefinition, FullSimulationResponse
)
from .cities import generate_city_definition, CITIES_METADATA

class NexusSimulationEngine:
    def __init__(self, seed: int = 42, city_id: str = "hyderabad"):
        self.seed = seed
        self.city_id = city_id
        self.rng = random.Random(seed)
        self.np_rng = np.random.default_rng(seed)
        self.city_def: CityDefinition = generate_city_definition(self.city_id, self.seed)
        self.road_graph = self._build_road_graph()
        self.infra_graph = self._build_infrastructure_graph()

    def set_city(self, city_id: str):
        if city_id != self.city_id:
            self.city_id = city_id
            self.city_def = generate_city_definition(self.city_id, self.seed)
            self.road_graph = self._build_road_graph()
            self.infra_graph = self._build_infrastructure_graph()

    def _build_road_graph(self) -> nx.Graph:
        """Constructs NetworkX road graph for shortest path evacuation."""
        G = nx.Graph()
        for road in self.city_def.roads:
            length = math.hypot(road.x2 - road.x1, road.z2 - road.z1)
            G.add_edge(
                road.u, road.v,
                id=road.id,
                name=road.name,
                length=length,
                is_bridge=road.is_bridge,
                clearance=road.bridge_clearance,
                status="open",
                weight=length
            )
        return G

    def _build_infrastructure_graph(self) -> nx.DiGraph:
        """Constructs Dependency DAG for cascading blackout/failure analysis."""
        D = nx.DiGraph()
        for node in self.city_def.infrastructure:
            data = node.model_dump() if hasattr(node, 'model_dump') else node.dict()
            D.add_node(node.id, **data)
        for node in self.city_def.infrastructure:
            for parent_id in node.depends_on:
                if parent_id in D:
                    D.add_edge(parent_id, node.id)
        return D

    def run_three_branches(self, config: ScenarioConfig) -> FullSimulationResponse:
        """
        Executes the three-branch simulation engine:
        Branch A: No Intervention
        Branch B: Early Intervention
        Branch C: Resource-Constrained Intervention
        """
        # Ensure correct city is active
        if config.city_id and config.city_id != self.city_id:
            self.set_city(config.city_id)

        # Re-seed if requested
        if config.seed != self.seed:
            self.seed = config.seed
            self.rng = random.Random(self.seed)
            self.np_rng = np.random.default_rng(self.seed)
            self.city_def = generate_city_definition(self.city_id, self.seed)
            self.road_graph = self._build_road_graph()
            self.infra_graph = self._build_infrastructure_graph()

        pop_map = {"low": 12000, "medium": 28000, "high": 46000}
        total_pop = pop_map.get(config.population_mode, 28000)

        branch_A = self._simulate_branch("A", "No Intervention", config, total_pop)
        branch_B = self._simulate_branch("B", "Early Intervention", config, total_pop)
        branch_C = self._simulate_branch("C", "Resource-Constrained", config, total_pop)

        # Comparative Analytics Summary
        loss_A = branch_A.timeline[-1].economic_loss_cr
        loss_B = branch_B.timeline[-1].economic_loss_cr
        loss_C = branch_C.timeline[-1].economic_loss_cr

        saved_loss_B = round(max(0.0, loss_A - loss_B), 1)
        risk_red_B = round(max(0.0, branch_A.timeline[-1].residual_risk_pct - branch_B.timeline[-1].residual_risk_pct), 1)
        risk_red_C = round(max(0.0, branch_A.timeline[-1].residual_risk_pct - branch_C.timeline[-1].residual_risk_pct), 1)

        comparison_summary = {
            "city_id": self.city_id,
            "baseline_loss_cr": loss_A,
            "early_response_loss_cr": loss_B,
            "constrained_loss_cr": loss_C,
            "loss_averted_by_early_response_cr": saved_loss_B,
            "risk_reduction_branch_B_pct": risk_red_B,
            "risk_reduction_branch_C_pct": risk_red_C,
            "evacuation_efficiency_B_pct": round((branch_B.timeline[-1].people_evacuated / max(1, total_pop)) * 100, 1),
            "evacuation_efficiency_C_pct": round((branch_C.timeline[-1].people_evacuated / max(1, total_pop)) * 100, 1),
            "roads_blocked_comparison": {
                "A": branch_A.timeline[-1].roads_blocked_count,
                "B": branch_B.timeline[-1].roads_blocked_count,
                "C": branch_C.timeline[-1].roads_blocked_count
            }
        }

        return FullSimulationResponse(
            scenario_id=f"CRISIS360_{config.city_id.upper()}_{config.hazard_type.upper()}_{config.seed}",
            config=config,
            city=self.city_def,
            branch_A=branch_A,
            branch_B=branch_B,
            branch_C=branch_C,
            comparison_summary=comparison_summary
        )

    def _simulate_branch(self, branch_id: str, name: str, config: ScenarioConfig, total_pop: int) -> BranchSimulationResult:
        timeline: List[BranchTickMetrics] = []
        sev_factor = config.severity / 100.0
        weather_factor = config.weather_intensity / 100.0
        res_factor = config.response_resources / 100.0

        # Branch mitigation coefficients
        if branch_id == "A":
            policy_desc = "Baseline: Natural propagation without proactive mitigation or early evacuation."
            mitigation_factor = 1.0
            evac_start_tick = 35
            evac_speed = 0.45
            barrier_effective = 0.0
        elif branch_id == "B":
            policy_desc = "Early Intervention: Proactive perimeter barriers, early evacuation corridor alerts, priority dispatch."
            mitigation_factor = 0.42
            evac_start_tick = 5
            evac_speed = 1.35
            barrier_effective = 0.75
        else: # C
            policy_desc = "Resource-Constrained: Delayed response, limited fuel & crews, bottlenecked traffic corridors."
            mitigation_factor = max(0.55, 1.0 - res_factor * 0.45)
            evac_start_tick = 25
            evac_speed = 0.75
            barrier_effective = 0.25 * res_factor

        # Retrieve City Hazard Metadata & Source Origin
        city_meta = next((c for c in CITIES_METADATA if c["id"] == self.city_id), CITIES_METADATA[0])

        source_marker: Dict[str, Any] = {}
        if config.hazard_type == "flood":
            flood_src = next((s for s in city_meta["flood_sources"] if s["id"] == config.flood_source_type), city_meta["flood_sources"][0])
            origin_x, origin_z = float(flood_src["origin"][0]), float(flood_src["origin"][1])
            source_marker = {
                "name": flood_src["name"],
                "type": config.flood_source_type,
                "x": origin_x,
                "z": origin_z,
                "desc": flood_src["desc"]
            }
        elif config.hazard_type == "fire":
            wf_src = city_meta["wildfire_source"]
            origin_x, origin_z = float(wf_src["origin"][0]), float(wf_src["origin"][1])
            source_marker = {
                "name": wf_src["name"],
                "type": "wildfire",
                "x": origin_x,
                "z": origin_z,
                "desc": f"Ignition front with fuel density {config.fuel_density}% pushed by {config.wind_speed} km/h wind"
            }
        else: # quake
            seis_src = city_meta["seismic_source"]
            origin_x, origin_z = float(seis_src["origin"][0]), float(seis_src["origin"][1])
            source_marker = {
                "name": seis_src["name"],
                "type": "seismic",
                "x": origin_x,
                "z": origin_z,
                "desc": f"Mw {config.magnitude} rupture at depth {config.focal_depth_km} km; aftershock at T+{config.aftershock_tick*3//60:02d}:{(config.aftershock_tick*3)%60:02d}"
            }

        # User-defined source location overrides the preset origin for all hazard types.
        if config.source_x is not None and config.source_z is not None:
            origin_x = max(-38.0, min(38.0, float(config.source_x)))
            origin_z = max(-38.0, min(38.0, float(config.source_z)))
            source_marker = {
                "name": "Custom Disaster Origin",
                "type": config.hazard_type,
                "x": origin_x,
                "z": origin_z,
                "desc": f"User-defined source at local city coordinates X {origin_x:.1f}, Z {origin_z:.1f}"
            }

        num_ticks = config.duration_ticks
        cumulative_evacuated = 0
        events_accum: List[EventLogItem] = []

        # Initial events
        events_accum.append(EventLogItem(
            id=f"evt_{branch_id}_0",
            tick=0,
            timestamp_str="T+00:00",
            level="INFO",
            category="HAZARD",
            title=f"CRISIS360 SIMULATION INITIALIZED // BRANCH {branch_id}",
            description=f"{city_meta['name']}: {source_marker['name']} detected. Policy: {name}."
        ))

        if branch_id == "B":
            events_accum.append(EventLogItem(
                id=f"evt_{branch_id}_pre",
                tick=2,
                timestamp_str="T+00:06",
                level="ACTION",
                category="LOGISTICS",
                title="PRE-EMPTIVE DEPLOYMENT ORDERED",
                description=f"Rapid flood barriers & fire tankers pre-staged for {city_meta['name']}; hospital standby issued."
            ))

        for tick in range(0, num_ticks + 1, 2):
            progress = tick / float(num_ticks)
            mins = tick * 3
            timestamp_str = f"T+{mins//60:02d}:{mins%60:02d}"

            # 1. Hazard Expansion
            if config.hazard_type == "flood":
                base_radius = 4.0 + progress * 32.0 * (0.6 + sev_factor * 0.7) * mitigation_factor
                hazard_radius = round(base_radius, 2)
                hazard_intensity = round(min(1.0, 0.2 + progress * 0.8 * sev_factor), 2)
            elif config.hazard_type == "fire":
                wind_bias_x = math.cos(math.radians(config.wind_direction_deg)) * (config.wind_speed / 40.0)
                wind_bias_z = math.sin(math.radians(config.wind_direction_deg)) * (config.wind_speed / 40.0)
                curr_x = origin_x + progress * 8.0 * wind_bias_x
                curr_z = origin_z + progress * 8.0 * wind_bias_z
                fuel_coeff = config.fuel_density / 50.0
                base_radius = 3.0 + progress * 24.0 * (0.5 + sev_factor * 0.7 + fuel_coeff * 0.3) * mitigation_factor
                hazard_radius = round(base_radius, 2)
                hazard_intensity = round(min(1.0, 0.3 + progress * 0.75 * sev_factor), 2)
                origin_x, origin_z = curr_x, curr_z
            else: # quake
                hazard_radius = round(2.0 + progress * 34.0, 2)
                hazard_intensity = round(max(0.1, (config.magnitude / 8.0) * math.exp(-progress * 1.5) * (1.0 if tick < config.aftershock_tick else 0.8)), 2)
                if tick >= config.aftershock_tick and tick < config.aftershock_tick + 6:
                    hazard_intensity = min(1.0, hazard_intensity + 0.35)

            # 2. Building Damage Computation
            bld_damage: Dict[str, float] = {}
            bld_stage: Dict[str, str] = {}
            total_loss = 0.0

            for bld in self.city_def.buildings:
                dist = math.hypot(bld.x - origin_x, bld.z - origin_z)
                if config.hazard_type == "flood":
                    exposure = max(0.0, min(1.0, (hazard_radius - dist) / 8.0))
                    dmg = exposure * (0.15 + progress * 0.85) * sev_factor * mitigation_factor * (1.0 - bld.flood_tolerance * 0.18)
                elif config.hazard_type == "fire":
                    exposure = max(0.0, min(1.0, (hazard_radius + 4.0 - dist) / 7.0))
                    dmg = exposure * (0.2 + progress * 0.8) * sev_factor * mitigation_factor * bld.fire_vulnerability
                else: # quake
                    exposure = max(0.0, min(1.0, (hazard_radius + 6.0 - dist) / 10.0))
                    pga = (config.magnitude / 7.0) * (1.0 / (dist + 3.0)**0.6)
                    dmg = min(1.0, pga * (1.2 - bld.seismic_resistance) * 1.4)
                    if tick >= config.aftershock_tick:
                        dmg = min(1.0, dmg * 1.25)

                dmg = max(0.0, min(0.98, dmg))
                dmg_pct = round(dmg * 100.0, 1)
                bld_damage[bld.id] = dmg_pct

                if dmg_pct < 10.0:
                    stage = "intact"
                elif dmg_pct < 30.0:
                    stage = "minor"
                elif dmg_pct < 50.0:
                    stage = "moderate"
                elif dmg_pct < 75.0:
                    stage = "severe"
                elif dmg_pct < 95.0:
                    stage = "critical"
                else:
                    stage = "destroyed"

                bld_stage[bld.id] = stage
                total_loss += bld.replacement_cost_cr * (dmg_pct / 100.0)

            # 3. Roads Impact
            roads_blocked = 0
            road_status_map: Dict[str, str] = {}
            for road in self.city_def.roads:
                mid_x = (road.x1 + road.x2) / 2.0
                mid_z = (road.z1 + road.z2) / 2.0
                dist_road = math.hypot(mid_x - origin_x, mid_z - origin_z)
                if dist_road < hazard_radius * 0.75:
                    if road.is_bridge and config.hazard_type == "flood" and progress > 0.4:
                        road_status_map[road.id] = "impassable"
                        roads_blocked += 1
                    elif dist_road < hazard_radius * 0.4:
                        road_status_map[road.id] = "impassable"
                        roads_blocked += 1
                    else:
                        road_status_map[road.id] = "threatened" if branch_id == "A" else "congested"
                        if branch_id == "A":
                            roads_blocked += 1
                else:
                    road_status_map[road.id] = "open"

            # 4. Critical Infrastructure Dependency Cascades
            infra_status: Dict[str, str] = {}
            critical_at_risk = 0
            for node in self.city_def.infrastructure:
                dist_node = math.hypot(node.x - origin_x, node.z - origin_z)
                direct_hit = dist_node < hazard_radius * 0.8
                parent_failed = any(infra_status.get(pid) == "offline" for pid in node.depends_on)

                if direct_hit:
                    critical_at_risk += 1
                    if branch_id == "A" and progress > 0.35:
                        infra_status[node.id] = "offline"
                    elif branch_id == "C" and progress > 0.55:
                        infra_status[node.id] = "offline"
                    else:
                        infra_status[node.id] = "degraded" if branch_id != "B" else "operational"
                elif parent_failed:
                    if tick > 50:
                        infra_status[node.id] = "degraded"
                    else:
                        infra_status[node.id] = "operational"
                else:
                    infra_status[node.id] = "operational"

            # 5. Evacuation and Population Metrics
            residual_risk = round(min(0.96, max(0.08, (0.28 + sev_factor * 0.46 + weather_factor * 0.16 + progress * 0.22) * mitigation_factor)), 2)
            people_at_risk = int(round(total_pop * residual_risk * 0.45))

            if tick >= evac_start_tick:
                evac_rate = int(total_pop * 0.016 * evac_speed)
                cumulative_evacuated = min(total_pop - 100, cumulative_evacuated + evac_rate)

            trapped_pct = 0.05 if branch_id == "B" else (0.22 if branch_id == "C" else 0.42)
            people_trapped = int(round(people_at_risk * trapped_pct * (roads_blocked / max(1, len(self.city_def.roads)))))

            # 6. Resources Deployment
            res = ResourceStatus(
                fire_engines=max(1, int(12 * (res_factor if branch_id == "C" else 1.0))),
                ambulances=max(2, int(16 * (res_factor if branch_id == "C" else 1.0))),
                rescue_squads=max(1, int(8 * (res_factor if branch_id == "C" else 1.0))),
                flood_barriers_deployed=int(24 * barrier_effective),
                drones_active=4 if branch_id == "B" else 2,
                fuel_remaining_pct=max(10.0, 100.0 - progress * (70.0 if branch_id == "C" else 35.0)),
                medical_supplies_pct=max(15.0, 100.0 - progress * (65.0 if branch_id == "C" else 28.0))
            )

            # Milestones and Triggered Events
            if tick == 20:
                events_accum.append(EventLogItem(
                    id=f"evt_{branch_id}_{tick}",
                    tick=tick,
                    timestamp_str=timestamp_str,
                    level="WARNING",
                    category="HAZARD",
                    title="INNER METRO RING UNDER THREAT",
                    description=f"{source_marker['name']} perimeter expanded. Transit arterial under pressure."
                ))
            elif tick == 44:
                events_accum.append(EventLogItem(
                    id=f"evt_{branch_id}_{tick}",
                    tick=tick,
                    timestamp_str=timestamp_str,
                    level="CRITICAL",
                    category="INFRASTRUCTURE",
                    title="CRITICAL SUBSTATION DISTRESS",
                    description=f"Primary grid substation in {city_meta['name']} experiencing thermal/structural distress."
                ))
            elif tick == 68:
                events_accum.append(EventLogItem(
                    id=f"evt_{branch_id}_{tick}",
                    tick=tick,
                    timestamp_str=timestamp_str,
                    level="ACTION" if branch_id == "B" else "WARNING",
                    category="EVACUATION",
                    title="SHELTER CONVOY DISPATCH",
                    description="High-ground evacuation corridor intact and escorted by emergency units." if branch_id == "B" else "Bottlenecks detected on major evacuation corridor."
                ))
            elif tick == num_ticks:
                events_accum.append(EventLogItem(
                    id=f"evt_{branch_id}_{tick}",
                    tick=tick,
                    timestamp_str=timestamp_str,
                    level="INFO",
                    category="HAZARD",
                    title="SIMULATION HORIZON REACHED",
                    description=f"Branch {branch_id} finalized with {residual_risk*100:.0f}% residual risk in {city_meta['name']}."
                ))

            timeline.append(BranchTickMetrics(
                tick=tick,
                timestamp_str=timestamp_str,
                hazard_radius=hazard_radius,
                hazard_center=(origin_x, origin_z),
                hazard_intensity=hazard_intensity,
                residual_risk_pct=round(residual_risk * 100.0, 1),
                people_at_risk=people_at_risk,
                people_evacuated=cumulative_evacuated,
                people_trapped=people_trapped,
                roads_blocked_count=roads_blocked,
                critical_assets_at_risk_count=critical_at_risk,
                economic_loss_cr=round(total_loss, 2),
                buildings_damage=bld_damage,
                buildings_stage=bld_stage,
                infrastructure_status=infra_status,
                road_status=road_status_map,
                resources=res,
                recent_events=list(events_accum[-5:]),
                source_marker=source_marker
            ))

        final_loss = timeline[-1].economic_loss_cr
        final_risk = timeline[-1].residual_risk_pct

        return BranchSimulationResult(
            branch_id=branch_id,
            name=name,
            policy_description=policy_desc,
            timeline=timeline,
            final_risk_reduction_pct=round(max(0.0, 78.0 - final_risk), 1),
            total_loss_cr=final_loss,
            total_casualties_averted=int(cumulative_evacuated * 0.75),
            summary_report=f"Branch {branch_id} in {city_meta['name']} completed with total loss of ₹{final_loss:.1f} Cr and residual risk of {final_risk:.1f}%."
        )
