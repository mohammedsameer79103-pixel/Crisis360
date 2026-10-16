import type {
  ScenarioConfig,
  CityDefinition,
  FullSimulationResponse,
  BranchSimulationResult,
  BranchTickMetrics,
  DamageStage,
  EventLogItem,
  ResourceStatus,
  SourceMarkerData
} from '../types/simulation';
import { CITIES_CATALOG, generateClientCity } from './cityData';

export { generateClientCity };

export function simulateThreeBranchesClient(
  config: ScenarioConfig,
  city: CityDefinition
): FullSimulationResponse {
  const popMap: Record<string, number> = { low: 12000, medium: 28000, high: 46000 };
  const totalPop = popMap[config.population_mode] || 28000;

  const branch_A = simulateBranch('A', 'No Intervention', config, city, totalPop);
  const branch_B = simulateBranch('B', 'Early Intervention', config, city, totalPop);
  const branch_C = simulateBranch('C', 'Resource-Constrained', config, city, totalPop);

  const loss_A = branch_A.timeline[branch_A.timeline.length - 1].economic_loss_cr;
  const loss_B = branch_B.timeline[branch_B.timeline.length - 1].economic_loss_cr;
  const loss_C = branch_C.timeline[branch_C.timeline.length - 1].economic_loss_cr;
  const saved_loss_B = Math.max(0, Math.round((loss_A - loss_B) * 10) / 10);

  const risk_A = branch_A.timeline[branch_A.timeline.length - 1].residual_risk_pct;
  const risk_B = branch_B.timeline[branch_B.timeline.length - 1].residual_risk_pct;
  const risk_C = branch_C.timeline[branch_C.timeline.length - 1].residual_risk_pct;

  return {
    scenario_id: `CRISIS360_${(config.city_id || 'hyderabad').toUpperCase()}_${config.hazard_type.toUpperCase()}_${config.seed}`,
    config,
    city,
    branch_A,
    branch_B,
    branch_C,
    comparison_summary: {
      city_id: config.city_id || 'hyderabad',
      baseline_loss_cr: loss_A,
      early_response_loss_cr: loss_B,
      constrained_loss_cr: loss_C,
      loss_averted_by_early_response_cr: saved_loss_B,
      risk_reduction_branch_B_pct: Math.max(0, Math.round((risk_A - risk_B) * 10) / 10),
      risk_reduction_branch_C_pct: Math.max(0, Math.round((risk_A - risk_C) * 10) / 10),
      evacuation_efficiency_B_pct: Math.round((branch_B.timeline[branch_B.timeline.length - 1].people_evacuated / totalPop) * 100),
      evacuation_efficiency_C_pct: Math.round((branch_C.timeline[branch_C.timeline.length - 1].people_evacuated / totalPop) * 100),
      roads_blocked_comparison: {
        A: branch_A.timeline[branch_A.timeline.length - 1].roads_blocked_count,
        B: branch_B.timeline[branch_B.timeline.length - 1].roads_blocked_count,
        C: branch_C.timeline[branch_C.timeline.length - 1].roads_blocked_count
      }
    }
  };
}

function simulateBranch(
  branchId: 'A' | 'B' | 'C',
  name: string,
  config: ScenarioConfig,
  city: CityDefinition,
  totalPop: number
): BranchSimulationResult {
  const timeline: BranchTickMetrics[] = [];
  const sevFactor = config.severity / 100.0;
  const weatherFactor = config.weather_intensity / 100.0;
  const resFactor = config.response_resources / 100.0;

  let policyDesc = '';
  let mitigationFactor = 1.0;
  let evacStartTick = 35;
  let evacSpeed = 0.45;
  let barrierEffective = 0.0;

  if (branchId === 'A') {
    policyDesc = 'Baseline: Natural propagation without proactive mitigation or early evacuation.';
    mitigationFactor = 1.0;
    evacStartTick = 35;
    evacSpeed = 0.45;
    barrierEffective = 0.0;
  } else if (branchId === 'B') {
    policyDesc = 'Early Intervention: Proactive perimeter barriers, early evacuation corridor alerts, priority dispatch.';
    mitigationFactor = 0.42;
    evacStartTick = 5;
    evacSpeed = 1.35;
    barrierEffective = 0.75;
  } else {
    policyDesc = 'Resource-Constrained: Delayed response, limited fuel & crews, bottlenecked traffic corridors.';
    mitigationFactor = Math.max(0.55, 1.0 - resFactor * 0.45);
    evacStartTick = 25;
    evacSpeed = 0.75;
    barrierEffective = 0.25 * resFactor;
  }

  // Retrieve City Hazard Metadata & Source Origin
  const cityMeta = CITIES_CATALOG.find(c => c.id === config.city_id) || CITIES_CATALOG[0];

  let originX = 2.0;
  let originZ = -1.0;
  let sourceMarker: SourceMarkerData = {
    name: 'Disaster Incursion Origin',
    type: config.hazard_type,
    x: 0,
    z: 0,
    desc: 'Primary threat epicenter'
  };

  if (config.hazard_type === 'flood') {
    const floodSrc = cityMeta.flood_sources.find(s => s.id === config.flood_source_type) || cityMeta.flood_sources[0];
    originX = floodSrc.origin[0];
    originZ = floodSrc.origin[1];
    sourceMarker = {
      name: floodSrc.name,
      type: config.flood_source_type,
      x: originX,
      z: originZ,
      desc: floodSrc.desc
    };
  } else if (config.hazard_type === 'fire') {
    originX = cityMeta.wildfire_source.origin[0];
    originZ = cityMeta.wildfire_source.origin[1];
    sourceMarker = {
      name: cityMeta.wildfire_source.name,
      type: 'wildfire',
      x: originX,
      z: originZ,
      desc: `Ignition front pushed by ${config.wind_speed || 35} km/h wind vector`
    };
  } else {
    originX = cityMeta.seismic_source.origin[0];
    originZ = cityMeta.seismic_source.origin[1];
    sourceMarker = {
      name: cityMeta.seismic_source.name,
      type: 'seismic',
      x: originX,
      z: originZ,
      desc: `Mw ${config.magnitude || 7.2} tectonic rupture at ${config.focal_depth_km || 10} km focal depth`
    };
  }

  // User-defined source overrides the preset origin and drives every branch's propagation.
  if (Number.isFinite(config.source_x) && Number.isFinite(config.source_z)) {
    originX = Math.max(-38, Math.min(38, Number(config.source_x)));
    originZ = Math.max(-38, Math.min(38, Number(config.source_z)));
    sourceMarker = {
      name: 'Custom Disaster Origin',
      type: config.hazard_type,
      x: originX,
      z: originZ,
      desc: `User-defined source at local city coordinates X ${originX.toFixed(1)}, Z ${originZ.toFixed(1)}`
    };
  }

  const numTicks = config.duration_ticks || 100;
  let cumulativeEvacuated = 0;
  const eventsAccum: EventLogItem[] = [
    {
      id: `evt_${branchId}_0`,
      tick: 0,
      timestamp_str: 'T+00:00',
      level: 'INFO',
      category: 'HAZARD',
      title: `CRISIS360 INITIALIZED // BRANCH ${branchId}`,
      description: `${cityMeta.name}: ${sourceMarker.name} active. Policy: ${name}.`
    }
  ];

  if (branchId === 'B') {
    eventsAccum.push({
      id: `evt_${branchId}_pre`,
      tick: 2,
      timestamp_str: 'T+00:06',
      level: 'ACTION',
      category: 'LOGISTICS',
      title: 'PRE-EMPTIVE DEPLOYMENT ORDERED',
      description: `Rapid flood deflectors pre-staged for ${cityMeta.name}; hospital triage and shelter corridors alert.`
    });
  }

  for (let tick = 0; tick <= numTicks; tick += 2) {
    const progress = tick / numTicks;
    const mins = tick * 3;
    const timestamp_str = `T+${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

    // 1. Hazard Expansion
    let hazard_radius = 4.0;
    let hazard_intensity = 0.5;

    if (config.hazard_type === 'flood') {
      hazard_radius = Math.round((4.0 + progress * 32.0 * (0.6 + sevFactor * 0.7) * mitigationFactor) * 100) / 100;
      hazard_intensity = Math.round(Math.min(1.0, 0.2 + progress * 0.8 * sevFactor) * 100) / 100;
    } else if (config.hazard_type === 'fire') {
      const windSpeed = config.wind_speed || 35;
      const windDir = config.wind_direction_deg || 45;
      const windBiasX = Math.cos((windDir * Math.PI) / 180) * (windSpeed / 40.0);
      const windBiasZ = Math.sin((windDir * Math.PI) / 180) * (windSpeed / 40.0);
      originX += 0.05 * windBiasX;
      originZ += 0.05 * windBiasZ;
      const fuelCoeff = (config.fuel_density || 60) / 50.0;
      hazard_radius = Math.round((3.0 + progress * 24.0 * (0.5 + sevFactor * 0.7 + fuelCoeff * 0.3) * mitigationFactor) * 100) / 100;
      hazard_intensity = Math.round(Math.min(1.0, 0.3 + progress * 0.75 * sevFactor) * 100) / 100;
    } else {
      hazard_radius = Math.round((2.0 + progress * 34.0) * 100) / 100;
      const mag = config.magnitude || 7.2;
      const aftershockTick = config.aftershock_tick || 60;
      hazard_intensity = Math.round(Math.max(0.1, (mag / 8.0) * Math.exp(-progress * 1.5) * (tick < aftershockTick ? 1.0 : 0.8)) * 100) / 100;
      if (tick >= aftershockTick && tick < aftershockTick + 6) {
        hazard_intensity = Math.min(1.0, hazard_intensity + 0.35);
      }
    }

    // 2. Building Damage
    const buildings_damage: Record<string, number> = {};
    const buildings_stage: Record<string, DamageStage> = {};
    let totalLoss = 0;

    for (const bld of city.buildings) {
      const dist = Math.hypot(bld.x - originX, bld.z - originZ);
      let dmg = 0;

      if (config.hazard_type === 'flood') {
        const exposure = Math.max(0, Math.min(1, (hazard_radius - dist) / 8.0));
        dmg = exposure * (0.15 + progress * 0.85) * sevFactor * mitigationFactor * (1.0 - bld.flood_tolerance * 0.18);
      } else if (config.hazard_type === 'fire') {
        const exposure = Math.max(0, Math.min(1, (hazard_radius + 4.0 - dist) / 7.0));
        dmg = exposure * (0.2 + progress * 0.8) * sevFactor * mitigationFactor * bld.fire_vulnerability;
      } else {
        const exposure = Math.max(0, Math.min(1, (hazard_radius + 6.0 - dist) / 10.0));
        const mag = config.magnitude || 7.2;
        const pga = (mag / 7.0) * (1.0 / Math.pow(dist + 3.0, 0.6));
        dmg = Math.min(1.0, pga * (1.2 - bld.seismic_resistance) * 1.4);
        if (tick >= (config.aftershock_tick || 60)) {
          dmg = Math.min(1.0, dmg * 1.25);
        }
      }

      dmg = Math.max(0, Math.min(0.98, dmg));
      const dmgPct = Math.round(dmg * 1000) / 10;
      buildings_damage[bld.id] = dmgPct;

      let stage: DamageStage = 'intact';
      if (dmgPct >= 95) stage = 'destroyed';
      else if (dmgPct >= 75) stage = 'critical';
      else if (dmgPct >= 50) stage = 'severe';
      else if (dmgPct >= 30) stage = 'moderate';
      else if (dmgPct >= 10) stage = 'minor';

      buildings_stage[bld.id] = stage;
      totalLoss += bld.replacement_cost_cr * (dmgPct / 100.0);
    }

    // 3. Road Status
    let roadsBlocked = 0;
    const road_status: Record<string, 'open' | 'congested' | 'threatened' | 'impassable'> = {};
    for (const road of city.roads) {
      const midX = (road.x1 + road.x2) / 2;
      const midZ = (road.z1 + road.z2) / 2;
      const dist = Math.hypot(midX - originX, midZ - originZ);

      if (dist < hazard_radius * 0.75) {
        if (road.is_bridge && config.hazard_type === 'flood' && progress > 0.4) {
          road_status[road.id] = 'impassable';
          roadsBlocked++;
        } else if (dist < hazard_radius * 0.4) {
          road_status[road.id] = 'impassable';
          roadsBlocked++;
        } else {
          road_status[road.id] = branchId === 'A' ? 'threatened' : 'congested';
          if (branchId === 'A') roadsBlocked++;
        }
      } else {
        road_status[road.id] = 'open';
      }
    }

    // 4. Critical Infrastructure Dependency Cascades
    const infrastructure_status: Record<string, 'operational' | 'degraded' | 'offline'> = {};
    let criticalAtRisk = 0;
    for (const node of city.infrastructure) {
      const dist = Math.hypot(node.x - originX, node.z - originZ);
      const directHit = dist < hazard_radius * 0.8;
      const parentFailed = node.depends_on.some(pid => infrastructure_status[pid] === 'offline');

      if (directHit) {
        criticalAtRisk++;
        if (branchId === 'A' && progress > 0.35) {
          infrastructure_status[node.id] = 'offline';
        } else if (branchId === 'C' && progress > 0.55) {
          infrastructure_status[node.id] = 'offline';
        } else {
          infrastructure_status[node.id] = branchId !== 'B' ? 'degraded' : 'operational';
        }
      } else if (parentFailed) {
        infrastructure_status[node.id] = tick > 50 ? 'degraded' : 'operational';
      } else {
        infrastructure_status[node.id] = 'operational';
      }
    }

    // 5. Evacuation Metrics
    const residualRisk = Math.round(Math.min(0.96, Math.max(0.08, (0.28 + sevFactor * 0.46 + weatherFactor * 0.16 + progress * 0.22) * mitigationFactor)) * 100) / 100;
    const people_at_risk = Math.round(totalPop * residualRisk * 0.45);

    if (tick >= evacStartTick) {
      const rate = Math.round(totalPop * 0.016 * evacSpeed);
      cumulativeEvacuated = Math.min(totalPop - 100, cumulativeEvacuated + rate);
    }

    const trappedPct = branchId === 'B' ? 0.05 : (branchId === 'C' ? 0.22 : 0.42);
    const people_trapped = Math.round(people_at_risk * trappedPct * (roadsBlocked / Math.max(1, city.roads.length)));

    // 6. Resources
    const resources: ResourceStatus = {
      fire_engines: Math.max(1, Math.floor(12 * (branchId === 'C' ? resFactor : 1.0))),
      ambulances: Math.max(2, Math.floor(16 * (branchId === 'C' ? resFactor : 1.0))),
      rescue_squads: Math.max(1, Math.floor(8 * (branchId === 'C' ? resFactor : 1.0))),
      flood_barriers_deployed: Math.floor(24 * barrierEffective),
      drones_active: branchId === 'B' ? 4 : 2,
      fuel_remaining_pct: Math.max(10, Math.round(100 - progress * (branchId === 'C' ? 70 : 35))),
      medical_supplies_pct: Math.max(15, Math.round(100 - progress * (branchId === 'C' ? 65 : 28)))
    };

    if (tick === 20) {
      eventsAccum.push({
        id: `evt_${branchId}_20`,
        tick: 20,
        timestamp_str,
        level: 'WARNING',
        category: 'HAZARD',
        title: 'INNER METRO ARTERY PRESSURED',
        description: `${sourceMarker.name} perimeter expanded to ${hazard_radius}m in ${cityMeta.name}.`
      });
    } else if (tick === 44) {
      eventsAccum.push({
        id: `evt_${branchId}_44`,
        tick: 44,
        timestamp_str,
        level: 'CRITICAL',
        category: 'INFRASTRUCTURE',
        title: 'SUBSTATION THERMAL OVERLOAD',
        description: `Primary grid substation in ${cityMeta.name} reporting severe degradation.`
      });
    } else if (tick === 68) {
      eventsAccum.push({
        id: `evt_${branchId}_68`,
        tick: 68,
        timestamp_str,
        level: branchId === 'B' ? 'ACTION' : 'WARNING',
        category: 'EVACUATION',
        title: 'EVACUATION CORRIDOR TRAFFIC',
        description: branchId === 'B' ? 'Emergency shelter corridors secure and flowing.' : 'Severe gridlock on central bridge artery.'
      });
    }

    timeline.push({
      tick,
      timestamp_str,
      hazard_radius,
      hazard_center: [originX, originZ],
      hazard_intensity,
      residual_risk_pct: Math.round(residualRisk * 1000) / 10,
      people_at_risk,
      people_evacuated: cumulativeEvacuated,
      people_trapped,
      roads_blocked_count: roadsBlocked,
      critical_assets_at_risk_count: criticalAtRisk,
      economic_loss_cr: Math.round(totalLoss * 10) / 10,
      buildings_damage,
      buildings_stage,
      infrastructure_status,
      road_status,
      resources,
      recent_events: eventsAccum.slice(-5),
      source_marker: sourceMarker
    });
  }

  const finalLoss = timeline[timeline.length - 1].economic_loss_cr;
  const finalRisk = timeline[timeline.length - 1].residual_risk_pct;

  return {
    branch_id: branchId,
    name,
    policy_description: policyDesc,
    timeline,
    final_risk_reduction_pct: Math.max(0, Math.round((78 - finalRisk) * 10) / 10),
    total_loss_cr: finalLoss,
    total_casualties_averted: Math.floor(cumulativeEvacuated * 0.75),
    summary_report: `Branch ${branchId} in ${cityMeta.name} completed with total modeled economic loss of ₹${finalLoss} Cr and residual risk of ${finalRisk}%.`
  };
}
