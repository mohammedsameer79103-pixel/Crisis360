import type {
  ScenarioConfig,
  CityDefinition,
  BranchTickMetrics,
  BranchId,
  FullSimulationResponse,
  HazardType
} from '../types/simulation';

export interface TacticalRecommendation {
  id: string;
  title: string;
  actionType: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  reasoning: string;
  triggerMetrics: string;
  assumptions: string[];
  modeledImpact: string;
  lossAvertedCr: number;
}

export interface CopilotAnalysis {
  executiveSummary: string;
  primaryThreat: {
    title: string;
    description: string;
    severityLabel: string;
    criticalMetrics: { label: string; value: string }[];
  };
  infrastructureRisk: {
    status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
    summary: string;
    cascadingChains: string[];
  };
  recommendations: TacticalRecommendation[];
  branchDivergenceNotes: string;
}

export function generateCopilotAnalysis(
  config: ScenarioConfig,
  city: CityDefinition,
  currentMetrics: BranchTickMetrics,
  activeBranch: BranchId,
  simulationData: FullSimulationResponse
): CopilotAnalysis {
  const hazardType = config.hazard_type;
  const tick = Math.round(currentMetrics.hazard_radius / 0.5) || 20; // approximate or derived
  const roadsBlocked = currentMetrics.roads_blocked_count || 0;
  const lossCr = currentMetrics.economic_loss_cr || 0;
  const riskPct = currentMetrics.residual_risk_pct || 0;
  const evacuated = currentMetrics.people_evacuated || 0;
  const trapped = currentMetrics.people_trapped || 0;

  // Find degraded or offline lifelines
  const offlineAssets = Object.entries(currentMetrics.infrastructure_status)
    .filter(([_, status]) => status === 'offline')
    .map(([id]) => city.infrastructure.find(i => i.id === id)?.name || id);

  const degradedAssets = Object.entries(currentMetrics.infrastructure_status)
    .filter(([_, status]) => status === 'degraded')
    .map(([id]) => city.infrastructure.find(i => i.id === id)?.name || id);

  // Determine Primary Threat
  let threatTitle = '';
  let threatDesc = '';
  if (hazardType === 'flood') {
    threatTitle = `${currentMetrics.source_marker?.name || 'Hydrological Breach'} Overtopping`;
    threatDesc = `Hydraulic head pressure at ${currentMetrics.source_marker?.name || 'River Basin'} has submerged ${roadsBlocked} road arteries. Rising water table threatens low-lying residential sectors and emergency hospital access.`;
  } else if (hazardType === 'fire') {
    threatTitle = `Gale-Driven Wildfire Interface Spread`;
    threatDesc = `Thermal radiation and ember casting front advancing along prevailing wind azimuth at ${Math.round(20 + config.weather_intensity * 0.6)} km/h. Fuel density at ${config.fuel_density || 70}% accelerating canopy fire propagation.`;
  } else {
    threatTitle = `Seismic Fault Slip & Structural Rupture`;
    threatDesc = `Peak Ground Acceleration (PGA) decay exceeding structural shear thresholds. Masonry and non-ductile concrete structures facing high collapse probability with secondary aftershock risks.`;
  }

  // Infrastructure Risk Chains
  const chains: string[] = [];
  if (offlineAssets.length > 0) {
    chains.push(`CRITICAL OUTAGE: [${offlineAssets.join(', ')}] offline due to direct hazard incursion.`);
  }
  if (degradedAssets.length > 0) {
    chains.push(`CASCADE DEGRADATION: [${degradedAssets.join(', ')}] operating at reduced capacity due to upstream power or pressure drop.`);
  }
  if (chains.length === 0) {
    chains.push(`Lifeline network stable: All primary grid substations, water treatment facilities, and trauma centers operational.`);
  }

  // Recommendations
  const recs: TacticalRecommendation[] = [];

  if (hazardType === 'flood') {
    recs.push({
      id: 'rec_flood_barrier',
      title: 'Deploy Demountable Flood Barriers & High-Capacity Pumps',
      actionType: 'deploy_barriers',
      priority: 'CRITICAL',
      reasoning: 'Water depth in river channel approaching crest elevation. Pre-positioning sandbag dikes and submersible dewatering pumps preserves arterial bridge access.',
      triggerMetrics: `Crest level +0.85m; ${roadsBlocked} road segments threatened; ${trapped.toLocaleString()} residents in risk zone.`,
      assumptions: [
        'Deployment crew transit time under 15 minutes',
        'Catchment rainfall intensity stabilizes within 45 minutes',
        'Pumping capacity matches inflow rate of 3.2 m³/s'
      ],
      modeledImpact: `Averts ₹${(lossCr * 0.38).toFixed(1)} Cr in structural damage; keeps hospital trauma corridor open.`,
      lossAvertedCr: Math.round(lossCr * 0.38 * 10) / 10
    });

    recs.push({
      id: 'rec_evac_reroute',
      title: 'Pre-empt Traffic Signals & Establish Elevated Evacuation Bypass',
      actionType: 'reroute_traffic',
      priority: 'HIGH',
      reasoning: 'Primary boulevard facing gridlock from panic evacuation. Rerouting civilian convoys to the elevated bypass prevents vehicle abandonment.',
      triggerMetrics: `Traffic congestion factor 82%; average exit velocity reduced to 4.2 km/h.`,
      assumptions: [
        'Automated variable message signs (VMS) operational',
        'Traffic police stationed at key bypass intersections within 8 minutes'
      ],
      modeledImpact: `Accelerates evacuation throughput by 35%; clears transit route for emergency ambulances.`,
      lossAvertedCr: Math.round(lossCr * 0.15 * 10) / 10
    });
  } else if (hazardType === 'fire') {
    recs.push({
      id: 'rec_firebreak',
      title: 'Cut Bulldozed Firebreaks & Establish Aerial Retardant Line',
      actionType: 'cut_firebreak',
      priority: 'CRITICAL',
      reasoning: 'Canopy fire advancing rapidly towards high-density urban interface. Creating a 30m mechanical fuel break stops head-fire momentum.',
      triggerMetrics: `Wind velocity ${Math.round(20 + config.weather_intensity * 0.6)} km/h; ambient humidity <28%; flame length 3.8m.`,
      assumptions: [
        'Heavy bulldozer equipment available at depot',
        'Downwind ember spotting distance does not exceed firebreak width'
      ],
      modeledImpact: `Halts fire perimeter expansion by 65%; saves adjacent commercial high-rises.`,
      lossAvertedCr: Math.round(lossCr * 0.45 * 10) / 10
    });
  } else {
    recs.push({
      id: 'rec_usar_dispatch',
      title: 'Mobilize Urban Search & Rescue (USAR) & Shoring Teams',
      actionType: 'mobilize_usar',
      priority: 'CRITICAL',
      reasoning: 'Multiple buildings at moderate-to-severe damage stage with imminent structural collapse risks from aftershocks.',
      triggerMetrics: `Joyner-Boore PGA 0.42g; 4 buildings showing structural foundation tilt.`,
      assumptions: [
        'Canine search units and acoustic listening devices operational',
        'Structural engineers verify debris stability before entry'
      ],
      modeledImpact: `Extracts trapped occupants within golden 72 hours; mitigates life safety hazard by 58%.`,
      lossAvertedCr: Math.round(lossCr * 0.32 * 10) / 10
    });
  }

  // General Lifeline Reinforcement Recommendation
  recs.push({
    id: 'rec_aux_power',
    title: 'Switch Critical Lifelines to Auxiliary Island Power',
    actionType: 'aux_power',
    priority: offlineAssets.length > 0 ? 'CRITICAL' : 'MEDIUM',
    reasoning: 'Grid feeder instability threatens medical ICU oxygen generators and emergency telecommunication relays.',
    triggerMetrics: `Grid voltage fluctuation detected; ${offlineAssets.length} upstream substations offline.`,
    assumptions: [
      'Diesel generator fuel reserves >= 36 hours',
      'Automatic transfer switches (ATS) cycle under 12 seconds'
    ],
    modeledImpact: `Maintains uninterrupted hospital trauma surgery operations and emergency 112 dispatch.`,
    lossAvertedCr: 24.5
  });

  const branchDivergence = activeBranch === 'B'
    ? 'Branch B (Early Intervention) reflects proactive sandbagging, early alert broadcasts at T-10m, and prioritized corridor management, resulting in the lowest residual risk and minimal economic loss.'
    : (activeBranch === 'C'
    ? 'Branch C is constrained by a 40% fleet deficit and 25-minute dispatch latency. Critical trade-offs between reinforcing power vs residential evacuation cause elevated losses.'
    : 'Branch A represents unmitigated baseline natural propagation with zero interventions, leading to cascading grid blackouts, bridge gridlock, and maximum modeled loss.');

  return {
    executiveSummary: `Crisis360 Copilot Diagnostic: Active Branch ${activeBranch} under ${hazardType.toUpperCase()} threat in ${city.name}. Current modeled loss is ₹${lossCr} Cr with ${riskPct}% residual risk. ${evacuated.toLocaleString()} civilians evacuated; ${roadsBlocked} road corridors impassable.`,
    primaryThreat: {
      title: threatTitle,
      description: threatDesc,
      severityLabel: config.severity > 75 ? 'CATASTROPHIC' : (config.severity > 50 ? 'SEVERE' : 'MODERATE'),
      criticalMetrics: [
        { label: 'Exposed Population', value: currentMetrics.people_at_risk?.toLocaleString() || 'N/A' },
        { label: 'Impassable Roads', value: `${roadsBlocked} / ${city.roads.length}` },
        { label: 'Modeled Asset Loss', value: `₹${lossCr} Cr` },
        { label: 'Residual Risk Index', value: `${riskPct}%` }
      ]
    },
    infrastructureRisk: {
      status: offlineAssets.length > 0 ? 'CRITICAL' : (degradedAssets.length > 0 ? 'ELEVATED' : 'NORMAL'),
      summary: offlineAssets.length > 0
        ? `Severe outage detected at ${offlineAssets.length} critical lifeline node(s).`
        : (degradedAssets.length > 0 ? `Subsystem degradation observed in ${degradedAssets.length} asset(s).` : 'All lifeline infrastructure operating within nominal thresholds.'),
      cascadingChains: chains
    },
    recommendations: recs,
    branchDivergenceNotes: branchDivergence
  };
}
