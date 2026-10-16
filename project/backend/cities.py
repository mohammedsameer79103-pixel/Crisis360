import math
import random
from typing import List, Dict, Any, Tuple
import numpy as np

from .models import (
    CityDefinition, BuildingData, RoadSegmentData, InfrastructureNodeData
)

CITIES_METADATA = [
    {
        "id": "hyderabad",
        "name": "Hyderabad",
        "state": "Telangana",
        "title": "Hyderabad Metropolitan (Musi Basin & HITEC Corridor)",
        "coordinates": {"lat": 17.3850, "lng": 78.4867},
        "description": "Deccan plateau terrain traversed by the Musi River basin and Hussain Sagar lake, featuring high-density heritage quarters and HITEC City high-rises.",
        "water_type": "river_and_lake",
        "water_name": "Musi River & Hussain Sagar",
        "flood_sources": [
            {"id": "river_overflow", "name": "Musi River Catchment Overtopping", "origin": [2.0, -1.0], "desc": "Torrential monsoon rains cause Musi riverbanks to breach near Nayapul."},
            {"id": "dam_breach", "name": "Osman Sagar Dam Gate Surcharge", "origin": [-24.0, -3.0], "desc": "Upstream reservoir exceeds FTL, releasing high-velocity wave into western suburbs."},
            {"id": "rainfall_drainage", "name": "Urban Flash Cloudburst (120mm/hr)", "origin": [0.0, 0.0], "desc": "Surcharged stormwater nalas flood central commercial intersections."},
            {"id": "pipeline_rupture", "name": "Krishna Water Phase-3 Main Pipeline Burst", "origin": [14.0, 10.0], "desc": "High-pressure 2200mm trunk line fracture floods major transit corridor."}
        ],
        "wildfire_source": {"name": "Chilkur Balaji Scrub Forest Interface", "origin": [-18.0, 18.0]},
        "seismic_source": {"name": "Waddepally Intraplate Fault Epicenter", "origin": [6.0, -8.0]}
    },
    {
        "id": "chennai",
        "name": "Chennai",
        "state": "Tamil Nadu",
        "title": "Chennai Coastal Basin (Cooum, Adyar & Marina Shore)",
        "coordinates": {"lat": 13.0827, "lng": 80.2707},
        "description": "Low-lying coastal plain along the Coromandel Coast with the Bay of Bengal on the east, traversed by the Adyar and Cooum rivers and Buckingham Canal.",
        "water_type": "coastal_and_rivers",
        "water_name": "Bay of Bengal & Adyar River",
        "flood_sources": [
            {"id": "dam_breach", "name": "Chembarambakkam Reservoir Emergency Release", "origin": [-22.0, 2.0], "desc": "Sluice gates opened at 29,000 cusecs, inundating Adyar river floodplains."},
            {"id": "river_overflow", "name": "Cooum River Urban Basin Inundation", "origin": [4.0, -2.0], "desc": "Tidal backflow and storm discharge choke Cooum mouth near Napier Bridge."},
            {"id": "coastal_surge", "name": "Bay of Bengal Severe Cyclonic Storm Surge", "origin": [28.0, 0.0], "desc": "3.5m marine storm surge penetrates coastal Marina Beach Road and fishing hamlets."},
            {"id": "rainfall_drainage", "name": "Velachery Low-Lying Basin Surcharge", "origin": [6.0, 14.0], "desc": "Encroached marshlands fail to drain 180mm deluge, inundating residential zones."}
        ],
        "wildfire_source": {"name": "Guindy National Park Forest Interface", "origin": [-14.0, -14.0]},
        "seismic_source": {"name": "Offshore Coromandel Tectonic Fault", "origin": [22.0, 12.0]}
    },
    {
        "id": "mumbai",
        "name": "Mumbai",
        "state": "Maharashtra",
        "title": "Mumbai Peninsula (Mithi River & Arabian Sea Coast)",
        "coordinates": {"lat": 18.9220, "lng": 72.8347},
        "description": "Narrow coastal peninsula with the Arabian Sea on the west, vulnerable to high-tide sea surges and Mithi River overflow through BKC and Kurla.",
        "water_type": "coastal_peninsula",
        "water_name": "Arabian Sea & Mithi River",
        "flood_sources": [
            {"id": "river_overflow", "name": "Mithi River High-Tide Estuary Overtopping", "origin": [-2.0, 2.0], "desc": "Simultaneous 4.8m astronomical high tide and cloudburst cause Mithi to breach BKC."},
            {"id": "coastal_surge", "name": "Arabian Sea Marine Incursion (Worli Shore)", "origin": [-28.0, -4.0], "desc": "Cyclone Nisarga-scale waves overtop the Sea Link causeway and Marine Drive."},
            {"id": "rainfall_drainage", "name": "Hindmata & Kurla Low-Ground Cloudburst", "origin": [8.0, -6.0], "desc": "Historic chronic waterlogging depression submerges railway and road arteries."},
            {"id": "pipeline_rupture", "name": "Tansa-Vaitarna Twin Water Aqueduct Fracture", "origin": [16.0, 16.0], "desc": "Major 2400mm municipal transmission trunk fails, flooding northern avenue."}
        ],
        "wildfire_source": {"name": "Sanjay Gandhi National Park Dry Foothills", "origin": [16.0, 20.0]},
        "seismic_source": {"name": "Panvel Flexure Fault Rupture", "origin": [-6.0, -18.0]}
    },
    {
        "id": "bengaluru",
        "name": "Bengaluru",
        "state": "Karnataka",
        "title": "Bengaluru Tech Plateau (Bellandur Cascade & Valley)",
        "coordinates": {"lat": 12.9716, "lng": 77.5946},
        "description": "High-altitude undulating Deccan plateau (920m elevation) structured by ancient cascading tank/lake chains and the Vrishabhavathi stormwater valley.",
        "water_type": "lake_cascade",
        "water_name": "Bellandur & Varthur Cascade",
        "flood_sources": [
            {"id": "dam_breach", "name": "Bellandur-Varthur Cascading Lake Bund Breach", "origin": [12.0, -4.0], "desc": "Encroached wetland buffer gives way, submerging Outer Ring Road tech parks."},
            {"id": "river_overflow", "name": "Vrishabhavathi Storm Valley Overtopping", "origin": [-14.0, 8.0], "desc": "Industrial runoff and cloudburst deluge overflow the southern stormwater canal."},
            {"id": "rainfall_drainage", "name": "Silk Board & HSR Layout Torrential Waterlogging", "origin": [0.0, 12.0], "desc": "Major transit interchange gridlocks under 1.4m standing flash flood waters."},
            {"id": "pipeline_rupture", "name": "Cauvery Water Supply Phase-4 Trunk Burst", "origin": [-18.0, -12.0], "desc": "High-pressure feeder pipe bursts along Hosur elevated expressway approach."}
        ],
        "wildfire_source": {"name": "Bannerghatta Dry Deciduous Forest Fringe", "origin": [-18.0, 20.0]},
        "seismic_source": {"name": "Mandya-Channapatna Intraplate Fault", "origin": [-20.0, -16.0]}
    },
    {
        "id": "delhi",
        "name": "Delhi",
        "state": "Delhi NCR",
        "title": "Delhi NCR (Yamuna Floodplain & Central Ridge)",
        "coordinates": {"lat": 28.6139, "lng": 77.2090},
        "description": "Indo-Gangetic alluvial plain along the Yamuna River, featuring vulnerable low-lying Khadar floodplains, the Aravalli Ridge, and dense urban sprawl.",
        "water_type": "wide_river_floodplain",
        "water_name": "Yamuna River & Najafgarh Canal",
        "flood_sources": [
            {"id": "dam_breach", "name": "Hathnikund Barrage 350,000 Cusecs Discharge", "origin": [-4.0, -22.0], "desc": "Monsoon surge from Haryana reaches Delhi, breaching Wazirabad and Ring Road."},
            {"id": "river_overflow", "name": "Yamuna Khadar Floodplain Inundation", "origin": [0.0, 0.0], "desc": "River crosses 208.66m danger mark, submerging Monastery Market and ITO barrages."},
            {"id": "rainfall_drainage", "name": "Minto Bridge & Pragati Maidan Underpass Flooding", "origin": [-10.0, 6.0], "desc": "Severe local cloudburst exceeds pumping capacity, choking central artery."},
            {"id": "pipeline_rupture", "name": "Sonia Vihar Raw Water Canal Embankment Collapse", "origin": [18.0, -12.0], "desc": "Major supply channel breaches, washing away East Delhi access roads."}
        ],
        "wildfire_source": {"name": "Southern Aravalli Ridge Forest Fire", "origin": [-22.0, 16.0]},
        "seismic_source": {"name": "Sohna-Moradabad Fault Line Rupture (Mw 7.3)", "origin": [8.0, -14.0]}
    },
    {
        "id": "visakhapatnam",
        "name": "Visakhapatnam",
        "state": "Andhra Pradesh",
        "title": "Visakhapatnam Port & Coastal Ridge (Bay of Bengal)",
        "coordinates": {"lat": 17.6868, "lng": 83.2185},
        "description": "Natural deepwater harbor bounded by the Eastern Ghats hills (Kailasagiri, Dolphin's Nose) and the Bay of Bengal coastline, vulnerable to tropical cyclones.",
        "water_type": "coastal_harbor_and_hills",
        "water_name": "Bay of Bengal & Meghadrigedda",
        "flood_sources": [
            {"id": "coastal_surge", "name": "Super Cyclone 4.2m Coastal Storm Surge", "origin": [26.0, 0.0], "desc": "Severe cyclonic surge breaches Beach Road and floods Vizag Port cargo berths."},
            {"id": "dam_breach", "name": "Meghadrigedda Reservoir Gate Surcharge", "origin": [-20.0, -12.0], "desc": "Torrential catchment downpour forces emergency discharge into airport lowlands."},
            {"id": "river_overflow", "name": "Gudilova Gedda Mountain Torrent Flash Flood", "origin": [4.0, 16.0], "desc": "Hill drainage channel turns into raging torrent, inundating Gajuwaka highway."},
            {"id": "pipeline_rupture", "name": "Raiwada Water Supply Industrial Trunk Fracture", "origin": [-12.0, 10.0], "desc": "Steel Plant industrial cooling water pipe ruptures near port corridor."}
        ],
        "wildfire_source": {"name": "Kambalakonda Wildlife Sanctuary Hill Fire", "origin": [-16.0, 22.0]},
        "seismic_source": {"name": "Offshore Vizag Continental Shelf Strike-Slip", "origin": [22.0, -16.0]}
    }
]

def generate_city_definition(city_id: str, seed: int = 42) -> CityDefinition:
    """
    Generates a full procedural 3D digital twin for any of the 6 Indian cities:
    - Hyderabad, Chennai, Mumbai, Bengaluru, Delhi, Visakhapatnam
    Configured with authentic local terrain, waterways, roads, and named lifelines.
    """
    city_meta = next((c for c in CITIES_METADATA if c["id"] == city_id), CITIES_METADATA[0])
    rng = random.Random(seed + hash(city_id) % 10000)

    buildings: List[BuildingData] = []
    roads: List[RoadSegmentData] = []
    infrastructure: List[InfrastructureNodeData] = []
    shelters: List[Dict[str, Any]] = []

    # 1. City-Specific Terrain & Waterways
    terrain_grid = []
    river_path: List[Tuple[float, float]] = []

    for xi in range(25):
        row = []
        x = -36.0 + xi * 3.0
        for zi in range(25):
            z = -36.0 + zi * 3.0

            if city_id == "hyderabad":
                # Musi River running E-W around z = -2, with northern Hussain Sagar depression
                river_dist = abs(z - (-2.0 + math.sin(x / 9.0) * 2.8))
                lake_dist = math.hypot(x - 6.0, z - (-18.0))
                if river_dist < 4.2:
                    y = -1.35 + (river_dist / 4.2) * 0.8
                elif lake_dist < 9.0:
                    y = -1.5 + (lake_dist / 9.0) * 0.9
                else:
                    # Deccan rocky hills (Jubilee Hills / Banjara Hills)
                    h1 = math.exp(-((x - 20)**2 + (z - 20)**2) / 240.0) * 3.4
                    h2 = math.exp(-((x + 22)**2 + (z - 16)**2) / 280.0) * 2.8
                    y = 0.25 + (river_dist - 4.2) * 0.04 + h1 + h2
            elif city_id == "chennai":
                # Bay of Bengal coast on East (x > 22 is ocean level -1.8), Adyar River curving south
                if x > 22.0:
                    y = -1.6  # Ocean surface
                else:
                    adyar_dist = abs(z - (10.0 + math.sin(x / 8.0) * 3.0))
                    cooum_dist = abs(z - (-10.0 + math.sin(x / 7.0) * 2.5))
                    if adyar_dist < 3.8:
                        y = -1.2 + (adyar_dist / 3.8) * 0.7
                    elif cooum_dist < 3.4:
                        y = -1.2 + (cooum_dist / 3.4) * 0.7
                    else:
                        y = 0.15 + (22.0 - x) * 0.02 + math.sin(z / 8.0) * 0.15
            elif city_id == "mumbai":
                # Arabian Sea on West (x < -22 is ocean), Mithi River canal in center
                if x < -22.0:
                    y = -1.6  # Ocean surface
                else:
                    mithi_dist = abs(z - (-1.0 + math.sin((x - 4) / 7.0) * 3.2))
                    if mithi_dist < 4.0:
                        y = -1.3 + (mithi_dist / 4.0) * 0.8
                    else:
                        ridge = math.exp(-((x - 16)**2 + (z - 18)**2) / 260.0) * 3.8
                        y = 0.2 + (x + 22.0) * 0.015 + ridge
            elif city_id == "bengaluru":
                # High plateau with undulating valleys, Bellandur Lake basin on East (x > 12, z ~ 0)
                lake_dist = math.hypot(x - 18.0, z - 2.0)
                valley_dist = abs(z - (x * 0.35 - 3.0))
                if lake_dist < 10.0:
                    y = -1.4 + (lake_dist / 10.0) * 0.85
                elif valley_dist < 4.0:
                    y = -0.9 + (valley_dist / 4.0) * 0.7
                else:
                    knolls = math.exp(-((x - (-18))**2 + (z - (-18))**2) / 300.0) * 2.5
                    y = 0.35 + knolls + math.cos(x / 10.0) * 0.25
            elif city_id == "delhi":
                # Wide Yamuna floodplain running N-S along x ~ 0, flat plain rising slightly to west (Aravalli Ridge)
                yamuna_dist = abs(x - (0.0 + math.sin(z / 10.0) * 3.2))
                if yamuna_dist < 5.0:
                    y = -1.4 + (yamuna_dist / 5.0) * 0.8
                else:
                    ridge = math.exp(-((x - (-22))**2 + (z - 12)**2) / 280.0) * 2.6
                    y = 0.18 + ridge + (yamuna_dist - 5.0) * 0.03
            else: # visakhapatnam
                # Coastal harbor on East (x > 20 is ocean), high Dolphin Nose / Kailasagiri hills in North & South
                if x > 20.0:
                    y = -1.6
                else:
                    hill_north = math.exp(-((x - 0)**2 + (z - 22)**2) / 200.0) * 4.5
                    hill_south = math.exp(-((x - 6)**2 + (z - (-22))**2) / 220.0) * 4.8
                    basin_dist = abs(z - 0.0)
                    y = 0.2 + hill_north + hill_south + (basin_dist < 4.0 and -0.8 or 0.0)

            row.append(round(y, 2))
        terrain_grid.append(row)

    # River / Coast path polyline for mini-map
    for px in np.arange(-36.0, 37.0, 12.0):
        if city_id == "hyderabad":
            pz = -2.0 + math.sin(px / 9.0) * 2.8
        elif city_id == "chennai":
            pz = 10.0 + math.sin(px / 8.0) * 3.0
        elif city_id == "mumbai":
            pz = -1.0 + math.sin((px - 4) / 7.0) * 3.2
        elif city_id == "delhi":
            pz = px * 0.8  # North-South Yamuna
        else:
            pz = -2.0 + math.sin(px / 8.0) * 3.0
        river_path.append((round(px, 1), round(pz, 1)))

    # 2. Road Network Grid & Major Named Arteries with Hierarchy
    # Horizontal Arteries (z in [-24, -16, -8, 0, 8, 16, 24])
    h_coords = [-24, -16, -8, 0, 8, 16, 24]
    for z in h_coords:
        road_id = f"road_h_{city_id}_{z}"
        name = get_city_road_name(city_id, 'h', z)
        is_highway = (z == 0)
        is_arterial = (abs(z) == 24)
        is_bridge = (city_id == "chennai" and z == 8) or (city_id == "delhi" and abs(z) <= 8)
        roads.append(RoadSegmentData(
            id=road_id,
            u=f"node_-32_{z}",
            v=f"node_32_{z}",
            name=name,
            x1=-32.0, z1=float(z),
            x2=32.0, z2=float(z),
            width=4.0 if is_highway else (3.4 if is_arterial else 2.6),
            lanes=4 if (is_highway or is_arterial) else 2,
            is_bridge=is_bridge,
            bridge_clearance=4.0 if is_bridge else 0.0
        ))

    # Vertical Arteries (x in [-24, -16, -8, 0, 8, 16, 24])
    v_coords = [-24, -16, -8, 0, 8, 16, 24]
    for x in v_coords:
        road_id = f"road_v_{city_id}_{x}"
        name = get_city_road_name(city_id, 'v', x)
        is_highway = (x == 0)
        is_arterial = (abs(x) == 24)
        # Bridges across river corridors
        is_bridge = (
            (city_id == "hyderabad" and abs(x) <= 16) or
            (city_id == "chennai" and abs(x) <= 8) or
            (city_id == "mumbai" and (x == 0 or x == -24)) or
            (city_id == "visakhapatnam" and x == 0)
        )
        roads.append(RoadSegmentData(
            id=road_id,
            u=f"node_{x}_-32",
            v=f"node_{x}_32",
            name=name,
            x1=float(x), z1=-32.0,
            x2=float(x), z2=32.0,
            width=4.0 if is_highway else (3.4 if is_arterial else 2.6),
            lanes=4 if (is_highway or is_arterial) else 2,
            is_bridge=is_bridge,
            bridge_clearance=4.2 if is_bridge else 0.0
        ))

    # 3. City-Specific Named Critical Lifelines & Shelters
    lifelines_spec = get_city_lifelines(city_id)
    for item in lifelines_spec:
        ground_y = get_terrain_elevation(item["x"], item["z"], terrain_grid)
        infrastructure.append(InfrastructureNodeData(
            id=item["id"],
            name=item["name"],
            type=item["type"],
            x=item["x"],
            z=item["z"],
            backup_power_mins=item.get("backup", 240),
            depends_on=item.get("dep", [])
        ))
        if item["type"] == "shelter":
            shelters.append({
                "id": item["id"],
                "name": item["name"],
                "x": item["x"],
                "z": item["z"],
                "capacity": item.get("capacity", 9500),
                "current_occupancy": 0
            })

        # Add physical building 3D mesh metadata
        is_large = item["type"] in ["hospital", "water", "shelter"]
        bld_h = 6.2 if item["type"] == "hospital" else (3.5 if item["type"] != "telecom" else 13.5)
        buildings.append(BuildingData(
            id=f"BLD_{item['id']}",
            name=item["name"],
            type=item["type"],
            x=item["x"],
            y=ground_y,
            z=item["z"],
            width=3.6 if is_large else 2.6,
            height=bld_h,
            depth=3.6 if is_large else 2.6,
            floors=7 if item["type"] == "hospital" else (2 if item["type"] != "telecom" else 1),
            occupants=1200 if item["type"] == "hospital" else (650 if item["type"] == "school" else 80),
            replacement_cost_cr=55.0 if item["type"] == "hospital" else 28.0,
            structural_vulnerability=0.22 if item["type"] in ["hospital", "power"] else 0.4,
            flood_tolerance=1.8 if item["type"] == "hospital" else 0.9,
            fire_vulnerability=0.25,
            seismic_resistance=0.88 if item["type"] == "hospital" else 0.75,
            is_critical=True
        ))

    # 4. Dense Urban Parcel Plots with Strict Setbacks
    bld_idx = 1
    parcel_coords = [-20.0, -12.0, -4.0, 4.0, 12.0, 20.0]
    for bx in parcel_coords:
        for bz in parcel_coords:
            # Exclude marine zones
            if city_id == "chennai" and bx > 18.0: continue
            if city_id == "mumbai" and bx < -18.0: continue
            if city_id == "visakhapatnam" and bx > 18.0: continue

            # Exclude river channels
            if city_id == "hyderabad" and abs(bz - (-2.0 + math.sin(bx / 9.0) * 2.8)) < 3.8: continue
            if city_id == "delhi" and abs(bx - (math.sin(bz / 10.0) * 3.2)) < 3.8: continue

            # Avoid lifelines footprint
            if any(math.hypot(bx - item["x"], bz - item["z"]) < 3.8 for item in lifelines_spec):
                continue

            ground_y = get_terrain_elevation(bx, bz, terrain_grid)
            dist_center = math.hypot(bx, bz)
            is_highrise = dist_center < 15.0 and rng.random() > 0.32
            floors = int(rng.uniform(8, 20) if is_highrise else rng.uniform(2, 6))
            height = round(floors * 0.95 + rng.uniform(0.6, 1.4), 2)
            width = round(rng.uniform(2.0, 2.4), 2)
            depth = round(rng.uniform(2.0, 2.4), 2)
            occupants = int(floors * rng.uniform(30, 65))
            replacement_cost = round(floors * rng.uniform(1.2, 2.8), 2)
            btype = "commercial" if is_highrise else "residential"

            struct_vuln = round(rng.uniform(0.35, 0.75) if btype == "residential" else rng.uniform(0.18, 0.42), 2)
            flood_tol = round(rng.uniform(0.4, 1.4), 2)
            fire_vuln = round(rng.uniform(0.4, 0.8) if btype == "residential" else rng.uniform(0.2, 0.45), 2)
            seismic_res = round(max(0.25, min(0.95, 1.0 - struct_vuln + rng.uniform(-0.08, 0.08))), 2)

            buildings.append(BuildingData(
                id=f"BLD_{city_id}_{bld_idx:03d}",
                name=f"{city_meta['name']} Block {bld_idx:03d} ({btype.capitalize()})",
                type=btype,
                x=round(float(bx), 2),
                y=ground_y,
                z=round(float(bz), 2),
                width=width,
                height=height,
                depth=depth,
                floors=floors,
                occupants=occupants,
                replacement_cost_cr=replacement_cost,
                structural_vulnerability=struct_vuln,
                flood_tolerance=flood_tol,
                fire_vulnerability=fire_vuln,
                seismic_resistance=seismic_res,
                is_critical=False
            ))
            bld_idx += 1

    meta = next((c for c in CITIES_METADATA if c["id"] == city_id), CITIES_METADATA[0])
    return CityDefinition(
        name=meta["name"],
        lat=meta["coordinates"]["lat"],
        lon=meta["coordinates"]["lng"],
        buildings=buildings,
        roads=roads,
        infrastructure=infrastructure,
        terrain_heights=terrain_grid,
        river_path=river_path,
        shelters=shelters
    )

def get_terrain_elevation(x: float, z: float, terrain_heights: List[List[float]]) -> float:
    if not terrain_heights or len(terrain_heights) == 0:
        return 0.2
    grid_len = len(terrain_heights)
    max_idx = grid_len - 1

    u = max(0.0, min(float(max_idx), ((x + 36.0) / 72.0) * max_idx))
    v = max(0.0, min(float(max_idx), ((z + 36.0) / 72.0) * max_idx))

    u0 = int(math.floor(u))
    u1 = min(max_idx, u0 + 1)
    fu = u - u0

    v0 = int(math.floor(v))
    v1 = min(max_idx, v0 + 1)
    fv = v - v0

    row0 = terrain_heights[u0] if u0 < grid_len else []
    row1 = terrain_heights[u1] if u1 < grid_len else []

    y00 = row0[v0] if v0 < len(row0) else 0.2
    y01 = row0[v1] if v1 < len(row0) else 0.2
    y10 = row1[v0] if v0 < len(row1) else 0.2
    y11 = row1[v1] if v1 < len(row1) else 0.2

    y = (1.0 - fu) * (1.0 - fv) * y00 + fu * (1.0 - fv) * y10 + (1.0 - fu) * fv * y01 + fu * fv * y11
    return round(float(y), 2)

def get_city_road_name(city_id: str, axis: str, coord: int) -> str:
    names = {
        "hyderabad": {
            "h": {-24: "Nehru Outer Ring Road North", -16: "HITEC City Cyber Towers Blvd", -8: "Banjara Hills Road No. 1", 0: "PVNR Elevated Expressway Spine", 8: "Nayapul Musi Heritage Avenue", 16: "Inner Ring Road Chandrayangutta", 24: "Rajiv Gandhi Airport Expressway", -30: "Nehru Outer Ring Road North", -20: "HITEC City Main Boulevard", -10: "Banjara Hills Road No. 1", 10: "Nayapul Musi Causeway", 20: "Inner Ring Road South", 30: "Airport Approach Expressway"},
            "v": {-24: "Gachibowli Financial District Rd", -16: "Madhapur IT Tech Corridor", -8: "Purana Pul Historic Musi Crossing", 0: "Nayapul Central Musi Arched Bridge", 8: "Chaderghat River Bridge Corridor", 16: "Secunderabad Central Station Link", 24: "LB Nagar Arterial Highway", -30: "Gachibowli Financial District Rd", -20: "Madhapur Tech Corridor", -10: "Purana Pul Historic Bridge", 10: "Chaderghat River Bridge", 20: "Secunderabad Station Link", 30: "LB Nagar Arterial Highway"}
        },
        "chennai": {
            "h": {-24: "Grand Northern Trunk Road", -16: "Poonamallee High Road", -8: "Anna Salai Central Spine", 0: "Dr. Radhakrishnan Salai Arterial", 8: "Adyar River South Bridge Way", 16: "OMR Rajiv Gandhi IT Expressway", 24: "East Coast Highway (ECR)", -30: "Grand Northern Trunk Rd", -20: "Poonamallee High Rd", -10: "Anna Salai (Mount Rd)", 10: "Adyar River Bridge Corridor", 20: "OMR Rajiv Gandhi IT Expressway", 30: "ECR Coastal Highway"},
            "v": {-24: "Maduravoyal Elevated Bypass", -16: "Koyambedu Transit Corridor", -8: "Kathipara Grade Separator", 0: "Napier Bridge Over Cooum", 8: "Marina Beach Coastal Promenade", 16: "Thiruvanmiyur Beach Access", 24: "Chennai Port Container Corridor", -30: "Maduravoyal Elevated Bypass", -20: "Koyambedu Transit Corridor", -10: "Kathipara Grade Separator", 10: "Marina Beach Coastal Road", 20: "Thiruvanmiyur Beach Access", 30: "Chennai Port Container Way"}
        },
        "mumbai": {
            "h": {-24: "Ghodbunder Link Highway", -16: "Jogeshwari-Vikhroli Link Rd", -8: "Santacruz-Chembur Link Rd", 0: "Bandra-Kurla Complex (BKC) Blvd", 8: "Senapati Bapat Marg", 16: "Nariman Point Business Corridor", 24: "Colaba Marine Promenade", -30: "Ghodbunder Link Highway", -20: "Jogeshwari-Vikhroli Link Rd", -10: "Santacruz-Chembur Link Rd", 10: "Senapati Bapat Marg", 20: "Nariman Point Business Corridor", 30: "Colaba Marine Promenade"},
            "v": {-24: "Bandra-Worli Sea Link Marine Causeway", -16: "Western Express Highway", -8: "SVT Road Santa Cruz Link", 0: "Mithi River Causeway Crossing", 8: "Eastern Express Highway", 16: "Eastern Freeway Elevated Arterial", 24: "Mumbai Port Maritime Highway", -30: "Arabian Sea Coastal Road", -20: "Bandra-Worli Sea Link Bridge", -10: "Western Express Highway", 10: "Eastern Express Highway", 20: "Eastern Freeway Elevated Way", 30: "Mumbai Port Maritime Highway"}
        },
        "bengaluru": {
            "h": {-24: "Bellary Road Airport Expressway", -16: "Outer Ring Road Hebbal", -8: "Rajajinagar Commercial Spine", 0: "MG Road Central Boulevard", 8: "Koramangala 100ft Transit Way", 16: "Outer Ring Road Bellandur", 24: "Electronic City Elevated Highway", -30: "Bellary Road Airport Expressway", -20: "Outer Ring Road Hebbal", -10: "Rajajinagar Main Corridor", 10: "Koramangala 100ft Boulevard", 20: "Outer Ring Road Bellandur", 30: "Electronic City Elevated Way"},
            "v": {-24: "Tumkur Road West Corridor", -16: "West of Chord Road Arterial", -8: "Vrishabhavathi Canal Bridge", 0: "Hosur Main Road Arterial", 8: "Sarjapur Tech Corridor", 16: "Whitefield ITPL Expressway", 24: "Varthur Lake Bypass Corridor", -30: "Tumkur Road West Corridor", -20: "West of Chord Road", -10: "Vrishabhavathi Canal Bridge", 10: "Sarjapur Tech Arterial", 20: "Whitefield ITPL Expressway", 30: "Varthur Lake Bypass Corridor"}
        },
        "delhi": {
            "h": {-24: "GT Karnal Highway Arterial", -16: "Outer Ring Road Wazirabad", -8: "Vikas Marg Central Crossway", 0: "Ring Road Central (ITO Corridor)", 8: "Barapullah Elevated Expressway", 16: "DND Flyway Yamuna Bridge", 24: "Badarpur Mehrauli Highway", -30: "GT Karnal Highway", -20: "Outer Ring Road Wazirabad", -10: "Vikas Marg East-West", 10: "Barapullah Elevated Corridor", 20: "DND Flyway Expressway", 30: "Badarpur Mehrauli Arterial"},
            "v": {-24: "Rohtak Road Western Arterial", -16: "Ridge Road Forest Corridor", -8: "Connaught Place Radial Arterial", 0: "ITO Yamuna River Bridge", 8: "Nizamuddin Yamuna Bridge", 16: "Mayur Vihar Highway", 24: "Noida-Delhi Link Highway", -30: "Rohtak Road Arterial", -20: "Ridge Road Forest Link", -10: "Connaught Place Radial Arterial", 10: "Nizamuddin Yamuna Bridge", 20: "Mayur Vihar Highway", 30: "Noida-Delhi Link Highway"}
        },
        "visakhapatnam": {
            "h": {-24: "NH16 Anandapuram Bypass", -16: "Simhachalam Foothill Road", -8: "RTC Complex Central Arterial", 0: "RK Beach Promenade Road", 8: "Meghadrigedda Canal Road", 16: "Gajuwaka Steel Plant Expressway", 24: "Gangavaram Port Arterial", -30: "NH16 Anandapuram Bypass", -20: "Simhachalam Foothill Rd", -10: "RTC Complex Central Arterial", 10: "Meghadrigedda Canal Road", 20: "Gajuwaka Steel Plant Expressway", 30: "Gangavaram Port Arterial"},
            "v": {-24: "Pendurthi Highway Link", -16: "Airport Approach Corridor", -8: "NAD Kotha Road Flyover", 0: "Port Access Elevated Viaduct", 8: "Rushikonda Coastal Highway", 16: "Kailasagiri Hill Marine Route", 24: "Vizag Port Outer Harbor Way", -30: "Pendurthi Highway Link", -20: "Airport Approach Corridor", -10: "NAD Kotha Road Flyover", 10: "Rushikonda Coastal Highway", 20: "Kailasagiri Hill Marine Route", 30: "Vizag Port Outer Harbor Way"}
        }
    }
    city_dict = names.get(city_id, names["hyderabad"])
    axis_dict = city_dict.get(axis, {})
    return axis_dict.get(coord, f"{city_id.capitalize()} Corridor {axis.upper()}{coord:+d}")

def get_city_lifelines(city_id: str) -> List[Dict[str, Any]]:
    lifelines_by_city = {
        "hyderabad": [
            {"id": "INF_HOSPITAL", "name": "Osmania General Hospital", "type": "hospital", "x": -20.0, "z": -18.0, "backup": 360, "dep": ["INF_POWER_B"]},
            {"id": "INF_POWER_A", "name": "TSSPDCL HITEC 220kV Substation", "type": "power", "x": 20.0, "z": -20.0, "backup": 0, "dep": []},
            {"id": "INF_POWER_B", "name": "Musi South Grid Substation", "type": "power", "x": -20.0, "z": 20.0, "backup": 0, "dep": []},
            {"id": "INF_WATER", "name": "Asif Nagar Water Purification Plant", "type": "water", "x": 18.0, "z": 18.0, "backup": 240, "dep": ["INF_POWER_A"]},
            {"id": "INF_TELECOM", "name": "BSNL Hyderabad Metro Central Relay", "type": "telecom", "x": 0.0, "z": -18.0, "backup": 300, "dep": ["INF_POWER_A"]},
            {"id": "INF_DEPOT", "name": "GHMC Disaster Response Force Depot", "type": "depot", "x": 0.0, "z": 0.0, "backup": 480, "dep": []},
            {"id": "INF_SCHOOL", "name": "Hyderabad Public School Complex", "type": "school", "x": -10.0, "z": -18.0, "backup": 120, "dep": ["INF_POWER_B"]},
            {"id": "SHELTER_EAST", "name": "Gachibowli Stadium Evacuation Hub", "type": "shelter", "x": 24.0, "z": -10.0, "capacity": 12000, "backup": 720, "dep": []},
            {"id": "SHELTER_SOUTH", "name": "LB Stadium High-Ground Shelter", "type": "shelter", "x": -10.0, "z": 24.0, "capacity": 9500, "backup": 720, "dep": []}
        ],
        "chennai": [
            {"id": "INF_HOSPITAL", "name": "Rajiv Gandhi Govt General Hospital", "type": "hospital", "x": -18.0, "z": -18.0, "backup": 420, "dep": ["INF_POWER_B"]},
            {"id": "INF_POWER_A", "name": "TANGEDCO Guindy 230kV Substation", "type": "power", "x": 18.0, "z": -18.0, "backup": 0, "dep": []},
            {"id": "INF_POWER_B", "name": "Chennai Central Harbor Substation", "type": "power", "x": -18.0, "z": 18.0, "backup": 0, "dep": []},
            {"id": "INF_WATER", "name": "Kilpauk Water Works & Treatment", "type": "water", "x": 18.0, "z": 18.0, "backup": 300, "dep": ["INF_POWER_A"]},
            {"id": "INF_TELECOM", "name": "Chennai Coastal Maritime Relay", "type": "telecom", "x": 0.0, "z": -18.0, "backup": 360, "dep": ["INF_POWER_A"]},
            {"id": "INF_DEPOT", "name": "Chennai Port Disaster Relief Depot", "type": "depot", "x": 0.0, "z": 0.0, "backup": 480, "dep": []},
            {"id": "INF_SCHOOL", "name": "Madras Christian College Complex", "type": "school", "x": -10.0, "z": -18.0, "backup": 120, "dep": ["INF_POWER_B"]},
            {"id": "SHELTER_EAST", "name": "Jawaharlal Nehru Stadium Shelter", "type": "shelter", "x": 22.0, "z": -10.0, "capacity": 14000, "backup": 720, "dep": []},
            {"id": "SHELTER_SOUTH", "name": "Velachery Civic Relief Center", "type": "shelter", "x": -10.0, "z": 24.0, "capacity": 8500, "backup": 720, "dep": []}
        ],
        "mumbai": [
            {"id": "INF_HOSPITAL", "name": "KEM Hospital & Trauma Center", "type": "hospital", "x": -18.0, "z": -18.0, "backup": 480, "dep": ["INF_POWER_B"]},
            {"id": "INF_POWER_A", "name": "Tata Power Trombay Receiving Station", "type": "power", "x": 18.0, "z": -18.0, "backup": 0, "dep": []},
            {"id": "INF_POWER_B", "name": "BKC Master 220kV Receiving Substation", "type": "power", "x": -18.0, "z": 18.0, "backup": 0, "dep": []},
            {"id": "INF_WATER", "name": "Bhandup Water Treatment Complex", "type": "water", "x": 18.0, "z": 18.0, "backup": 360, "dep": ["INF_POWER_A"]},
            {"id": "INF_TELECOM", "name": "MTNL Mumbai Disaster Control Relay", "type": "telecom", "x": 0.0, "z": -18.0, "backup": 360, "dep": ["INF_POWER_A"]},
            {"id": "INF_DEPOT", "name": "Bandra Emergency Logistics Base", "type": "depot", "x": 0.0, "z": 0.0, "backup": 600, "dep": []},
            {"id": "INF_SCHOOL", "name": "St. Xavier's Academic Complex", "type": "school", "x": -10.0, "z": -18.0, "backup": 120, "dep": ["INF_POWER_B"]},
            {"id": "SHELTER_EAST", "name": "Wankhede / Brabourne Arena Shelter", "type": "shelter", "x": 24.0, "z": -10.0, "capacity": 16000, "backup": 720, "dep": []},
            {"id": "SHELTER_SOUTH", "name": "Andheri Sports Complex Relief Hub", "type": "shelter", "x": -10.0, "z": 24.0, "capacity": 11000, "backup": 720, "dep": []}
        ],
        "bengaluru": [
            {"id": "INF_HOSPITAL", "name": "Victoria Hospital Trauma Care", "type": "hospital", "x": -18.0, "z": -18.0, "backup": 360, "dep": ["INF_POWER_B"]},
            {"id": "INF_POWER_A", "name": "KPTCL Peenya 400kV Substation", "type": "power", "x": 18.0, "z": -18.0, "backup": 0, "dep": []},
            {"id": "INF_POWER_B", "name": "HAL Transmission Substation", "type": "power", "x": -18.0, "z": 18.0, "backup": 0, "dep": []},
            {"id": "INF_WATER", "name": "BWSSB T.K. Halli Pumping Station", "type": "water", "x": 18.0, "z": 18.0, "backup": 280, "dep": ["INF_POWER_A"]},
            {"id": "INF_TELECOM", "name": "ISRO/BSNL Emergency SatCom Relay", "type": "telecom", "x": 0.0, "z": -18.0, "backup": 360, "dep": ["INF_POWER_A"]},
            {"id": "INF_DEPOT", "name": "BBMP SDRF Central Rescue Depot", "type": "depot", "x": 0.0, "z": 0.0, "backup": 480, "dep": []},
            {"id": "INF_SCHOOL", "name": "National Public School Complex", "type": "school", "x": -10.0, "z": -18.0, "backup": 120, "dep": ["INF_POWER_B"]},
            {"id": "SHELTER_EAST", "name": "Kanteerava Indoor Stadium Shelter", "type": "shelter", "x": 24.0, "z": -10.0, "capacity": 13000, "backup": 720, "dep": []},
            {"id": "SHELTER_SOUTH", "name": "Koramangala Indoor Relief Center", "type": "shelter", "x": -10.0, "z": 24.0, "capacity": 9500, "backup": 720, "dep": []}
        ],
        "delhi": [
            {"id": "INF_HOSPITAL", "name": "AIIMS Apex Trauma Center", "type": "hospital", "x": -18.0, "z": -18.0, "backup": 500, "dep": ["INF_POWER_B"]},
            {"id": "INF_POWER_A", "name": "DTL Indraprastha 220kV Substation", "type": "power", "x": 18.0, "z": -18.0, "backup": 0, "dep": []},
            {"id": "INF_POWER_B", "name": "Wazirabad North Grid Substation", "type": "power", "x": -18.0, "z": 18.0, "backup": 0, "dep": []},
            {"id": "INF_WATER", "name": "Wazirabad Water Treatment Plant", "type": "water", "x": 18.0, "z": 18.0, "backup": 360, "dep": ["INF_POWER_A"]},
            {"id": "INF_TELECOM", "name": "MTNL Central Secretariat Comm Relay", "type": "telecom", "x": 0.0, "z": -18.0, "backup": 400, "dep": ["INF_POWER_A"]},
            {"id": "INF_DEPOT", "name": "NDRF National Logistics Depot", "type": "depot", "x": 0.0, "z": 0.0, "backup": 600, "dep": []},
            {"id": "INF_SCHOOL", "name": "Delhi Public School RK Puram", "type": "school", "x": -10.0, "z": -18.0, "backup": 120, "dep": ["INF_POWER_B"]},
            {"id": "SHELTER_EAST", "name": "Thyagaraj Sports Stadium Shelter", "type": "shelter", "x": 24.0, "z": -10.0, "capacity": 15000, "backup": 720, "dep": []},
            {"id": "SHELTER_SOUTH", "name": "Yamuna Sports Complex Relief Center", "type": "shelter", "x": -10.0, "z": 24.0, "capacity": 12000, "backup": 720, "dep": []}
        ],
        "visakhapatnam": [
            {"id": "INF_HOSPITAL", "name": "King George Hospital (KGH)", "type": "hospital", "x": -18.0, "z": -18.0, "backup": 380, "dep": ["INF_POWER_B"]},
            {"id": "INF_POWER_A", "name": "APTransco Simhachalam Grid Station", "type": "power", "x": 18.0, "z": -18.0, "backup": 0, "dep": []},
            {"id": "INF_POWER_B", "name": "Visakhapatnam Port 132kV Substation", "type": "power", "x": -18.0, "z": 18.0, "backup": 0, "dep": []},
            {"id": "INF_WATER", "name": "Meghadrigedda Pumping Filtration", "type": "water", "x": 18.0, "z": 18.0, "backup": 260, "dep": ["INF_POWER_A"]},
            {"id": "INF_TELECOM", "name": "Vizag Cyclone Warning Radar Tower", "type": "telecom", "x": 0.0, "z": -18.0, "backup": 420, "dep": ["INF_POWER_A"]},
            {"id": "INF_DEPOT", "name": "Eastern Naval Command Relief Depot", "type": "depot", "x": 0.0, "z": 0.0, "backup": 540, "dep": []},
            {"id": "INF_SCHOOL", "name": "St. Aloysius Anglo-Indian School", "type": "school", "x": -10.0, "z": -18.0, "backup": 120, "dep": ["INF_POWER_B"]},
            {"id": "SHELTER_EAST", "name": "Swarna Bharathi Indoor Stadium", "type": "shelter", "x": 22.0, "z": -10.0, "capacity": 11500, "backup": 720, "dep": []},
            {"id": "SHELTER_SOUTH", "name": "Rushikonda Beach High-Ground Shelter", "type": "shelter", "x": -10.0, "z": 24.0, "capacity": 8500, "backup": 720, "dep": []}
        ]
    }
    return lifelines_by_city.get(city_id, lifelines_by_city["hyderabad"])
