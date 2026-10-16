export function generateClientCity(seed = 42) {
    let s = seed;
    const rand = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
    const buildings = [];
    const roads = [];
    const infrastructure = [];
    const shelters = [];
    // Terrain grid (25 x 25)
    const terrain_heights = [];
    for (let xi = 0; xi < 25; xi++) {
        const row = [];
        const x = -36 + xi * 3.0;
        for (let zi = 0; zi < 25; zi++) {
            const z = -36 + zi * 3.0;
            const river_dist = Math.abs(z - (-2.0 + Math.sin(x / 8.0) * 3.2));
            let height = 0.2;
            if (river_dist < 4.5) {
                height = -1.2 + (river_dist / 4.5) * 0.8;
            }
            else {
                const hill1 = Math.exp(-((x - 22) ** 2 + (z - 20) ** 2) / 250.0) * 2.8;
                const hill2 = Math.exp(-((x + 22) ** 2 + (z + 22) ** 2) / 300.0) * 2.2;
                height = 0.2 + (river_dist - 4.5) * 0.05 + hill1 + hill2;
            }
            row.push(Math.round(height * 100) / 100);
        }
        terrain_heights.push(row);
    }
    const river_path = [
        [-36.0, -2.0 + Math.sin(-36 / 8.0) * 3.2],
        [-24.0, -2.0 + Math.sin(-24 / 8.0) * 3.2],
        [-12.0, -2.0 + Math.sin(-12 / 8.0) * 3.2],
        [0.0, -2.0],
        [12.0, -2.0 + Math.sin(12 / 8.0) * 3.2],
        [24.0, -2.0 + Math.sin(24 / 8.0) * 3.2],
        [36.0, -2.0 + Math.sin(36 / 8.0) * 3.2],
    ];
    // Roads
    for (let z = -30; z <= 30; z += 10) {
        roads.push({
            id: `road_h_${z}`,
            u: `node_-30_${z}`,
            v: `node_30_${z}`,
            name: `Corridor ${z >= 0 ? '+' : ''}${z} E-W`,
            x1: -32.0,
            z1: z,
            x2: 32.0,
            z2: z,
            width: z === 0 || z === -20 ? 3.2 : 2.4,
            lanes: z === 0 ? 4 : 2,
            is_bridge: false,
            bridge_clearance: 0,
            status: 'open'
        });
    }
    for (let x = -30; x <= 30; x += 10) {
        const is_bridge = (x === -10 || x === 10 || x === 0);
        roads.push({
            id: `road_v_${x}`,
            u: `node_${x}_-30`,
            v: `node_${x}_30`,
            name: is_bridge ? `River Bridge ${x >= 0 ? '+' : ''}${x}` : `Metro Blvd ${x >= 0 ? '+' : ''}${x} N-S`,
            x1: x,
            z1: -32.0,
            x2: x,
            z2: 32.0,
            width: x === 0 ? 3.2 : 2.4,
            lanes: 4,
            is_bridge,
            bridge_clearance: is_bridge ? 2.8 : 0,
            status: 'open'
        });
    }
    // Critical Assets
    const infraConfigs = [
        { id: 'INF_HOSPITAL', name: 'St. Jude Regional Trauma Center', type: 'hospital', x: -20, z: -20, backup: 360, dep: ['INF_POWER_B'] },
        { id: 'INF_POWER_A', name: 'Metro Power Substation Alpha', type: 'power', x: 20, z: -20, backup: 0, dep: [] },
        { id: 'INF_POWER_B', name: 'Metro Power Substation Beta', type: 'power', x: -20, z: 20, backup: 0, dep: [] },
        { id: 'INF_WATER', name: 'Central Water Purification Facility', type: 'water', x: 20, z: 20, backup: 180, dep: ['INF_POWER_A'] },
        { id: 'INF_TELECOM', name: 'Emergency Communications Relay', type: 'telecom', x: 0, z: -20, backup: 240, dep: ['INF_POWER_A'] },
        { id: 'INF_DEPOT', name: 'Emergency Operations Logistics Depot', type: 'depot', x: 0, z: 0, backup: 480, dep: [] },
        { id: 'INF_SCHOOL', name: 'North Metro High School', type: 'school', x: -10, z: -20, backup: 60, dep: ['INF_POWER_B'] },
        { id: 'SHELTER_EAST', name: 'East High-Ground Evacuation Shelter', type: 'shelter', x: 25, z: -12, backup: 720, dep: [] },
        { id: 'SHELTER_SOUTH', name: 'South Civic Evacuation Center', type: 'shelter', x: -12, z: 25, backup: 720, dep: [] },
    ];
    for (const item of infraConfigs) {
        infrastructure.push({
            id: item.id,
            name: item.name,
            type: item.type,
            x: item.x,
            z: item.z,
            status: 'operational',
            integrity_pct: 100,
            depends_on: item.dep,
            backup_power_mins: item.backup
        });
        if (item.type === 'shelter') {
            shelters.push({
                id: item.id,
                name: item.name,
                x: item.x,
                z: item.z,
                capacity: 8500,
                current_occupancy: 0
            });
        }
        const isLarge = item.type === 'hospital' || item.type === 'water' || item.type === 'shelter';
        buildings.push({
            id: `BLD_${item.id}`,
            name: item.name,
            type: item.type,
            x: item.x,
            y: 0,
            z: item.z,
            width: isLarge ? 3.8 : 2.8,
            height: item.type === 'hospital' ? 5.8 : (item.type === 'telecom' ? 12.0 : 3.4),
            depth: isLarge ? 3.8 : 2.8,
            floors: item.type === 'hospital' ? 6 : 2,
            occupants: item.type === 'hospital' ? 850 : (item.type === 'school' ? 450 : 60),
            replacement_cost_cr: item.type === 'hospital' ? 45.0 : 22.0,
            structural_vulnerability: item.type === 'hospital' || item.type === 'power' ? 0.25 : 0.45,
            flood_tolerance: item.type === 'hospital' ? 1.8 : 0.8,
            fire_vulnerability: 0.3,
            seismic_resistance: item.type === 'hospital' ? 0.85 : 0.7,
            damage_pct: 0,
            damage_stage: 'intact',
            is_critical: true
        });
    }
    // Dense Procedural Buildings
    let bldIdx = 1;
    for (let bx = -27.0; bx <= 27.0; bx += 4.8) {
        for (let bz = -27.0; bz <= 27.0; bz += 4.8) {
            if (Math.abs(bx % 10.0) < 2.0 || Math.abs(bz % 10.0) < 2.0)
                continue;
            const riverCenter = -2.0 + Math.sin(bx / 8.0) * 3.2;
            if (Math.abs(bz - riverCenter) < 3.2)
                continue;
            if (infraConfigs.some(item => Math.hypot(bx - item.x, bz - item.z) < 3.5))
                continue;
            const distCenter = Math.hypot(bx, bz);
            const isCommercial = distCenter < 16.0 && rand() > 0.4;
            const floors = Math.floor(isCommercial ? 6 + rand() * 10 : 2 + rand() * 4);
            const height = floors * 0.95 + rand() * 1.2;
            const width = 1.8 + rand() * 1.0;
            const depth = 1.8 + rand() * 1.0;
            const occupants = Math.floor(floors * (25 + rand() * 35));
            const replacementCost = Math.round((floors * (0.9 + rand() * 1.3)) * 10) / 10;
            const btype = isCommercial ? 'commercial' : 'residential';
            const structVuln = Math.round((btype === 'residential' ? 0.35 + rand() * 0.4 : 0.2 + rand() * 0.25) * 100) / 100;
            const floodTol = Math.round((0.4 + rand() * 0.8) * 100) / 100;
            const fireVuln = Math.round((btype === 'residential' ? 0.4 + rand() * 0.4 : 0.25 + rand() * 0.25) * 100) / 100;
            const seismicRes = Math.max(0.2, Math.min(0.95, Math.round((1.0 - structVuln + (rand() - 0.5) * 0.2) * 100) / 100));
            buildings.push({
                id: `BLD_${String(bldIdx).padStart(3, '0')}`,
                name: `District Block ${String(bldIdx).padStart(3, '0')} (${btype})`,
                type: btype,
                x: Math.round(bx * 100) / 100,
                y: 0,
                z: Math.round(bz * 100) / 100,
                width: Math.round(width * 100) / 100,
                height: Math.round(height * 100) / 100,
                depth: Math.round(depth * 100) / 100,
                floors,
                occupants,
                replacement_cost_cr: replacementCost,
                structural_vulnerability: structVuln,
                flood_tolerance: floodTol,
                fire_vulnerability: fireVuln,
                seismic_resistance: seismicRes,
                damage_pct: 0,
                damage_stage: 'intact',
                is_critical: false
            });
            bldIdx++;
        }
    }
    return {
        buildings,
        roads,
        infrastructure,
        terrain_heights,
        river_path,
        shelters
    };
}
export function simulateThreeBranchesClient(config, city) {
    const popMap = { low: 12000, medium: 28000, high: 46000 };
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
        scenario_id: `SCEN_${config.hazard_type.toUpperCase()}_${config.seed}`,
        config,
        city,
        branch_A,
        branch_B,
        branch_C,
        comparison_summary: {
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
function simulateBranch(branchId, name, config, city, totalPop) {
    const timeline = [];
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
    }
    else if (branchId === 'B') {
        policyDesc = 'Early Intervention: Proactive perimeter barriers, early evacuation corridor alerts, priority dispatch.';
        mitigationFactor = 0.42;
        evacStartTick = 5;
        evacSpeed = 1.35;
        barrierEffective = 0.75;
    }
    else {
        policyDesc = 'Resource-Constrained: Delayed response, limited fuel & crews, bottlenecked traffic corridors.';
        mitigationFactor = Math.max(0.55, 1.0 - resFactor * 0.45);
        evacStartTick = 25;
        evacSpeed = 0.75;
        barrierEffective = 0.25 * resFactor;
    }
    let originX = 2.0;
    let originZ = -1.0;
    if (config.hazard_type === 'fire') {
        originX = -8.0;
        originZ = 4.0;
    }
    else if (config.hazard_type === 'quake') {
        originX = 4.0;
        originZ = -2.0;
    }
    const numTicks = config.duration_ticks || 100;
    let cumulativeEvacuated = 0;
    const eventsAccum = [
        {
            id: `evt_${branchId}_0`,
            tick: 0,
            timestamp_str: 'T+00:00',
            level: 'INFO',
            category: 'HAZARD',
            title: `SCENARIO INITIALIZED // BRANCH ${branchId}`,
            description: `${config.hazard_type.toUpperCase()} digital twin active. Policy: ${name}.`
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
            description: 'Emergency barriers staged along riverbank; hospital evacuation standby alert issued.'
        });
    }
    for (let tick = 0; tick <= numTicks; tick += 2) {
        const progress = tick / numTicks;
        const mins = tick * 3;
        const timestamp_str = `T+${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
        let hazardRadius = 0;
        let hazardIntensity = 0;
        if (config.hazard_type === 'flood') {
            const baseRadius = 4.0 + progress * 32.0 * (0.6 + sevFactor * 0.7) * mitigationFactor;
            hazardRadius = Math.round(baseRadius * 100) / 100;
            hazardIntensity = Math.min(1.0, 0.2 + progress * 0.8 * sevFactor);
        }
        else if (config.hazard_type === 'fire') {
            const baseRadius = 3.0 + progress * 24.0 * (0.5 + sevFactor * 0.8 + weatherFactor * 0.4) * mitigationFactor;
            hazardRadius = Math.round(baseRadius * 100) / 100;
            hazardIntensity = Math.min(1.0, 0.3 + progress * 0.75 * sevFactor);
        }
        else {
            hazardRadius = Math.round((2.0 + progress * 34.0) * 100) / 100;
            const baseIntensity = (config.magnitude || 7.2) / 8.0 * Math.exp(-progress * 1.5);
            hazardIntensity = Math.min(1.0, Math.max(0.1, baseIntensity + (tick >= (config.aftershock_tick || 60) && tick < (config.aftershock_tick || 60) + 6 ? 0.35 : 0)));
        }
        // Building damage
        const bldDamage = {};
        const bldStage = {};
        let totalLoss = 0;
        for (const bld of city.buildings) {
            const dist = Math.hypot(bld.x - originX, bld.z - originZ);
            let dmg = 0;
            if (config.hazard_type === 'flood') {
                const exposure = Math.max(0, Math.min(1, (hazardRadius - dist) / 8.0));
                dmg = exposure * (0.15 + progress * 0.85) * sevFactor * mitigationFactor * (1.0 - bld.flood_tolerance * 0.2);
            }
            else if (config.hazard_type === 'fire') {
                const exposure = Math.max(0, Math.min(1, (hazardRadius + 4.0 - dist) / 7.0));
                dmg = exposure * (0.2 + progress * 0.8) * sevFactor * mitigationFactor * bld.fire_vulnerability;
            }
            else {
                const exposure = Math.max(0, Math.min(1, (hazardRadius + 6.0 - dist) / 10.0));
                const pga = ((config.magnitude || 7.2) / 7.0) * (1.0 / Math.pow(dist + 3.0, 0.6));
                dmg = Math.min(1.0, pga * (1.2 - bld.seismic_resistance) * 1.4);
                if (tick >= (config.aftershock_tick || 60)) {
                    dmg = Math.min(1.0, dmg * 1.25);
                }
            }
            dmg = Math.max(0, Math.min(0.98, dmg));
            const dmgPct = Math.round(dmg * 1000) / 10;
            bldDamage[bld.id] = dmgPct;
            let stage = 'intact';
            if (dmgPct < 10)
                stage = 'intact';
            else if (dmgPct < 30)
                stage = 'minor';
            else if (dmgPct < 50)
                stage = 'moderate';
            else if (dmgPct < 75)
                stage = 'severe';
            else if (dmgPct < 95)
                stage = 'critical';
            else
                stage = 'destroyed';
            bldStage[bld.id] = stage;
            totalLoss += bld.replacement_cost_cr * (dmgPct / 100.0);
        }
        // Roads
        let roadsBlocked = 0;
        const roadStatusMap = {};
        for (const road of city.roads) {
            const midX = (road.x1 + road.x2) / 2.0;
            const midZ = (road.z1 + road.z2) / 2.0;
            const distRoad = Math.hypot(midX - originX, midZ - originZ);
            if (distRoad < hazardRadius * 0.75) {
                if (road.is_bridge && config.hazard_type === 'flood' && progress > 0.4) {
                    roadStatusMap[road.id] = 'impassable';
                    roadsBlocked++;
                }
                else if (distRoad < hazardRadius * 0.4) {
                    roadStatusMap[road.id] = 'impassable';
                    roadsBlocked++;
                }
                else {
                    roadStatusMap[road.id] = branchId === 'A' ? 'threatened' : 'congested';
                    if (branchId === 'A')
                        roadsBlocked++;
                }
            }
            else {
                roadStatusMap[road.id] = 'open';
            }
        }
        // Infrastructure
        const infraStatus = {};
        let criticalAtRisk = 0;
        for (const node of city.infrastructure) {
            const distNode = Math.hypot(node.x - originX, node.z - originZ);
            const directHit = distNode < hazardRadius * 0.8;
            const parentFailed = node.depends_on.some(pid => infraStatus[pid] === 'offline');
            if (directHit) {
                criticalAtRisk++;
                if (branchId === 'A' && progress > 0.35) {
                    infraStatus[node.id] = 'offline';
                }
                else if (branchId === 'C' && progress > 0.55) {
                    infraStatus[node.id] = 'offline';
                }
                else {
                    infraStatus[node.id] = branchId !== 'B' ? 'degraded' : 'operational';
                }
            }
            else if (parentFailed) {
                infraStatus[node.id] = tick > 50 ? 'degraded' : 'operational';
            }
            else {
                infraStatus[node.id] = 'operational';
            }
        }
        // Evacuation
        const residualRisk = Math.min(0.96, Math.max(0.08, (0.28 + sevFactor * 0.46 + weatherFactor * 0.16 + progress * 0.22) * mitigationFactor));
        const peopleAtRisk = Math.round(totalPop * residualRisk * 0.45);
        if (tick >= evacStartTick) {
            const evacRate = Math.round(totalPop * 0.016 * evacSpeed);
            cumulativeEvacuated = Math.min(totalPop - 100, cumulativeEvacuated + evacRate);
        }
        const trappedPct = branchId === 'B' ? 0.05 : (branchId === 'C' ? 0.22 : 0.42);
        const peopleTrapped = Math.round(peopleAtRisk * trappedPct * (roadsBlocked / Math.max(1, city.roads.length)));
        // Resources
        const resources = {
            fire_engines: Math.max(1, Math.round(12 * (branchId === 'C' ? resFactor : 1.0))),
            ambulances: Math.max(2, Math.round(16 * (branchId === 'C' ? resFactor : 1.0))),
            rescue_squads: Math.max(1, Math.round(8 * (branchId === 'C' ? resFactor : 1.0))),
            flood_barriers_deployed: Math.round(24 * barrierEffective),
            drones_active: branchId === 'B' ? 4 : 2,
            fuel_remaining_pct: Math.max(10, Math.round(100 - progress * (branchId === 'C' ? 70 : 35))),
            medical_supplies_pct: Math.max(15, Math.round(100 - progress * (branchId === 'C' ? 65 : 28)))
        };
        // Events
        if (tick === 20) {
            eventsAccum.push({
                id: `evt_${branchId}_${tick}`,
                tick,
                timestamp_str,
                level: 'WARNING',
                category: 'HAZARD',
                title: 'HAZARD REACHES TRANSIT ARTERIAL',
                description: `${config.hazard_type.toUpperCase()} perimeter has expanded. Main evacuation corridor threatened.`
            });
        }
        else if (tick === 44) {
            eventsAccum.push({
                id: `evt_${branchId}_${tick}`,
                tick,
                timestamp_str,
                level: 'CRITICAL',
                category: 'INFRASTRUCTURE',
                title: 'POWER SUBSTATION LOAD WARNING',
                description: 'Substation Alpha experiencing structural strain. Downstream backup power timers initiated.'
            });
        }
        else if (tick === 68) {
            eventsAccum.push({
                id: `evt_${branchId}_${tick}`,
                tick,
                timestamp_str,
                level: branchId === 'B' ? 'ACTION' : 'WARNING',
                category: 'EVACUATION',
                title: 'EVACUATION PROGRESS ALERT',
                description: branchId === 'B' ? 'High-ground corridor East remains free of congestion and active.' : 'Severe gridlock reported near River Bridge Alpha.'
            });
        }
        timeline.push({
            tick,
            timestamp_str,
            hazard_radius: hazardRadius,
            hazard_center: [originX, originZ],
            hazard_intensity: Math.round(hazardIntensity * 100) / 100,
            residual_risk_pct: Math.round(residualRisk * 1000) / 10,
            people_at_risk: peopleAtRisk,
            people_evacuated: cumulativeEvacuated,
            people_trapped: peopleTrapped,
            roads_blocked_count: roadsBlocked,
            critical_assets_at_risk_count: criticalAtRisk,
            economic_loss_cr: Math.round(totalLoss * 10) / 10,
            buildings_damage: bldDamage,
            buildings_stage: bldStage,
            infrastructure_status: infraStatus,
            road_status: roadStatusMap,
            resources,
            recent_events: eventsAccum.slice(-5)
        });
    }
    const finalLoss = timeline[timeline.length - 1].economic_loss_cr;
    const finalRisk = timeline[timeline.length - 1].residual_risk_pct;
    return {
        branch_id: branchId,
        name,
        policy_description: policyDesc,
        timeline,
        final_risk_reduction_pct: Math.max(0, Math.round((78.0 - finalRisk) * 10) / 10),
        total_loss_cr: finalLoss,
        total_casualties_averted: Math.round(cumulativeEvacuated * 0.75),
        summary_report: `Branch ${branchId} finalized with modeled economic loss of ₹${finalLoss} Cr and residual risk of ${finalRisk}%.`
    };
}
