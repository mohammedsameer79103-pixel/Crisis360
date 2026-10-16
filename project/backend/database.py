import sqlite3
import json
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "simulation.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Core Simulation tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        hazard_type TEXT NOT NULL,
        severity REAL NOT NULL,
        config_json TEXT NOT NULL
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS simulation_runs (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        executed_at TEXT NOT NULL,
        metrics_summary_json TEXT NOT NULL,
        FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_logs (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        tick INTEGER NOT NULL,
        timestamp_str TEXT NOT NULL,
        level TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dispatch_actions (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        tick INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        target_x REAL NOT NULL,
        target_z REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # 2. Operational Emergency Management Tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        city_id TEXT NOT NULL,
        hazard_type TEXT NOT NULL,
        severity REAL NOT NULL,
        priority TEXT NOT NULL,
        location_name TEXT NOT NULL,
        x REAL NOT NULL,
        z REAL NOT NULL,
        affected_count INTEGER NOT NULL,
        status TEXT NOT NULL,
        assigned_unit TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        description TEXT NOT NULL,
        notes_json TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emergency_units (
        id TEXT PRIMARY KEY,
        city_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        capability TEXT NOT NULL,
        location_name TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        fuel_pct REAL NOT NULL,
        assigned_incident_id TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medical_requests (
        id TEXT PRIMARY KEY,
        incident_id TEXT,
        city_id TEXT NOT NULL,
        patient_count INTEGER NOT NULL,
        triage_category TEXT NOT NULL,
        assistance_required TEXT NOT NULL,
        location_name TEXT NOT NULL,
        assigned_unit_id TEXT,
        assigned_hospital_id TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        notes_json TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS relief_requests (
        id TEXT PRIMARY KEY,
        city_id TEXT NOT NULL,
        category TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity_requested INTEGER NOT NULL,
        quantity_delivered INTEGER NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        location_name TEXT NOT NULL,
        x REAL NOT NULL,
        z REAL NOT NULL,
        assigned_team TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        notes_json TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS facilities (
        id TEXT PRIMARY KEY,
        city_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        x REAL NOT NULL,
        z REAL NOT NULL,
        capacity INTEGER NOT NULL,
        current_occupancy INTEGER NOT NULL,
        status TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        services_json TEXT NOT NULL,
        accessibility TEXT NOT NULL,
        data_source TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS volunteers (
        id TEXT PRIMARY KEY,
        city_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        skills_json TEXT NOT NULL,
        availability TEXT NOT NULL,
        assigned_task TEXT,
        status TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

    # Seed initial demonstration data if tables are fresh
    seed_initial_data_if_empty()

def seed_initial_data_if_empty():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM incidents")
    count = cursor.fetchone()["cnt"]
    if count == 0:
        seed_demonstration_records(conn)
    conn.close()

def seed_demonstration_records(conn):
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat()

    # Seed Incidents
    incidents_seed = [
        ("INC-HYD-01", "Musi River South Bank Flood Barrier Breach", "hyderabad", "flood", 82.0, "Critical", "Nayapul Historic Causeway", 2.0, -1.0, 1400, "Assigned", "FIRE-HYD-01", now_iso, now_iso, "Water surge exceeding 1.2m depth approaching Osmania General Hospital low-level basements.", json.dumps(["Initial alert logged by Musi Flood Watch sensor 4B", "Dispatched Fire & Rescue Squad 01 with demountable flood dams"])),
        ("INC-HYD-02", "HITEC City Sector-3 Substation Transformer Spark", "hyderabad", "fire", 65.0, "High", "HITEC City Tech Park North", 18.0, -18.0, 320, "En Route", "FIRE-HYD-02", now_iso, now_iso, "Electrical arc flash ignited dry brush adjacent to primary 220kV feeder yard.", json.dumps(["Automated breaker trip detected", "Response Unit Foam Crash Tender en route"])),
        ("INC-HYD-03", "Banjara Hills Residential Hillside Landslip Risk", "hyderabad", "flood", 55.0, "Medium", "Banjara Hills Rd No 12", -12.0, 4.0, 180, "Verified", None, now_iso, now_iso, "Heavy runoff destabilizing unreinforced retaining wall behind apartment clusters.", json.dumps(["Geotechnical warning issued", "Evacuation advisory broadcast to Ward 14"])),
        ("INC-CHE-01", "Cooum River Estuary Storm Surge Backflow", "chennai", "flood", 88.0, "Critical", "Napier Bridge Promenade", 4.0, -2.0, 2400, "Reported", None, now_iso, now_iso, "3.8m storm surge meeting swollen Cooum river outflow, submerging arterial access.", json.dumps(["Coastal Radar alert", "Tide gauge reading +1.8m above MSL"])),
        ("INC-MUM-01", "Mithi River Culvert Surcharge at BKC Crossing", "mumbai", "flood", 85.0, "Critical", "Bandra-Kurla Complex Artery", 0.0, 0.0, 3100, "Assigned", "AMB-MUM-01", now_iso, now_iso, "Storm drain reverse incursion flooding major financial transit corridor.", json.dumps(["High-tide sync alert at 14:30 hrs", "Traffic diversion active"])),
        ("INC-BLR-01", "Bellandur Lake Bund Structural Overtopping", "bengaluru", "flood", 74.0, "High", "Outer Ring Road Tech Zone", 12.0, 10.0, 950, "Verified", None, now_iso, now_iso, "Cascading lake surplus encroaching roadway and commercial basement parking.", json.dumps(["Lake buffer monitoring alert", "Pump units requested"]))
    ]
    cursor.executemany("""
    INSERT INTO incidents (id, title, city_id, hazard_type, severity, priority, location_name, x, z, affected_count, status, assigned_unit, created_at, updated_at, description, notes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, incidents_seed)

    # Seed Emergency Units
    units_seed = [
        ("AMB-HYD-01", "hyderabad", "108 Advanced Life Support ALS-01", "ambulance", "Available", "ALS · Ventilator & Defibrillator", "Osmania Hospital Station", 17.3616, 78.4747, 92.0, None),
        ("AMB-HYD-02", "hyderabad", "108 Critical Care Ambulance ALS-02", "ambulance", "Assigned", "ALS · Trauma Support Unit", "NIMS Panjagutta Bay", 17.4222, 78.4496, 78.0, "INC-HYD-01"),
        ("AMB-HYD-03", "hyderabad", "108 Basic Life Support BLS-04", "ambulance", "Available", "BLS · Patient Transport", "Secunderabad Transit Depot", 17.4399, 78.4983, 85.0, None),
        ("FIRE-HYD-01", "hyderabad", "TSDRF Heavy Water Tender WT-101", "fire_engine", "On Scene", "12,000L High-Volume Pump", "Gowliguda Fire Station", 17.3750, 78.4800, 65.0, "INC-HYD-01"),
        ("FIRE-HYD-02", "hyderabad", "HITEC City Foam Crash Tender FC-204", "fire_engine", "En Route", "Specialized Chemical & Foam Engine", "Madhapur Fire Station", 17.4483, 78.3915, 88.0, "INC-HYD-02"),
        ("RESCUE-HYD-01", "hyderabad", "GHMC Disaster Response Boat USAR-01", "rescue_squad", "Available", "Inflatable Flood Rescue & Sonar", "Hussain Sagar Rescue Base", 17.4239, 78.4738, 95.0, None),
        ("AMB-MUM-01", "mumbai", "108 Mumbai Metro Trauma Unit MT-01", "ambulance", "En Route", "ALS · Mobile Intensive Care", "KEM Hospital Base", 18.9986, 72.8427, 82.0, "INC-MUM-01"),
        ("FIRE-MUM-01", "mumbai", "BKC Fire Station Bronto Skylift 54m", "fire_engine", "Available", "54m High-Rise Hydraulic Ladder", "BKC Station", 19.0600, 72.8656, 90.0, None)
    ]
    cursor.executemany("""
    INSERT INTO emergency_units (id, city_id, name, type, status, capability, location_name, lat, lon, fuel_pct, assigned_incident_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, units_seed)

    # Seed Medical Requests
    med_seed = [
        ("MED-HYD-01", "INC-HYD-01", "hyderabad", 4, "Critical", "Trauma and hypothermia from submerged vehicle rescue", "Musi Causeway Sector 4", "AMB-HYD-02", "FAC-HYD-01", "Assigned", now_iso, json.dumps(["Triage tagged Red", "Ambulance ALS-02 dispatched"])),
        ("MED-HYD-02", "INC-HYD-02", "hyderabad", 2, "Urgent", "Smoke inhalation and first-degree burn care", "HITEC Sector 3 Substation", "AMB-HYD-01", "FAC-HYD-01", "En Route", now_iso, json.dumps(["Triage tagged Yellow", "Oxygen therapy administered"]))
    ]
    cursor.executemany("""
    INSERT INTO medical_requests (id, incident_id, city_id, patient_count, triage_category, assistance_required, location_name, assigned_unit_id, assigned_hospital_id, status, created_at, notes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, med_seed)

    # Seed Relief Requests
    relief_seed = [
        ("REL-HYD-01", "hyderabad", "food_water", "Potable Drinking Water (20L Cans)", 600, 450, "cans", "In Progress", "Critical", "Gachibowli Stadium Relief Camp", 24.0, -10.0, "Red Cross Hyderabad Team 1", now_iso, now_iso, json.dumps(["450 cans delivered", "Remaining 150 en route from Asif Nagar plant"])),
        ("REL-HYD-02", "hyderabad", "food_water", "Ready-to-Eat Emergency Meal Packets", 1800, 1800, "meals", "Completed", "High", "LB Stadium High-Ground Shelter", -10.0, 24.0, "GHMC Civil Supplies Team", now_iso, now_iso, json.dumps(["Full batch delivered and distributed"])),
        ("REL-HYD-03", "hyderabad", "essential_supplies", "Dry Blankets & Thermal Wraps", 800, 300, "blankets", "Assigned", "High", "Nayapul Evacuation Assembly", 2.0, -1.0, "SDRF Logistics Team B", now_iso, now_iso, json.dumps(["Allocated from central warehouse"])),
        ("REL-HYD-04", "hyderabad", "temporary_shelter", "Demountable Family Weatherproof Tents", 120, 0, "tents", "Approved", "Critical", "LB Nagar Relief Staging Area", 20.0, 20.0, None, now_iso, now_iso, json.dumps(["Awaiting transporter dispatch"]))
    ]
    cursor.executemany("""
    INSERT INTO relief_requests (id, city_id, category, item_name, quantity_requested, quantity_delivered, unit, status, priority, location_name, x, z, assigned_team, created_at, updated_at, notes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, relief_seed)

    # Seed Facilities
    facilities_seed = [
        ("FAC-HYD-01", "hyderabad", "hospital", "Osmania General Hospital Trauma Hub", "Afzal Gunj, Hyderabad", -20.0, -18.0, 1200, 890, "operational", "+91-40-2460-0121", json.dumps(["Level-1 Trauma", "24/7 ICU", "Blood Bank", "Emergency Helipad"]), "Wheelchair accessible, 500kVA emergency generator", "Demonstration Indian Health Cadastre"),
        ("FAC-HYD-02", "hyderabad", "hospital", "Nizam's Institute of Medical Sciences (NIMS)", "Panjagutta, Hyderabad", -14.0, 6.0, 1500, 1100, "operational", "+91-40-2348-9000", json.dumps(["Multi-Specialty Surgery", "Burn ICU", "Oxygen Plant"]), "Ramp access, secondary power grid backup", "Demonstration Indian Health Cadastre"),
        ("FAC-HYD-03", "hyderabad", "shelter", "Gachibowli Indoor Stadium Evacuation Hub", "Gachibowli Sports Complex", 24.0, -10.0, 12000, 3420, "operational", "+91-40-2300-1122", json.dumps(["Dormitory Beds", "Community Kitchen", "Medical Triage Station", "Sanitation Blocks"]), "Ground floor accessible, 1000kVA solar-hybrid backup", "Telangana Disaster Management Authority"),
        ("FAC-HYD-04", "hyderabad", "shelter", "LB Stadium High-Ground Shelter Complex", "Fateh Maidan, Basheerbagh", -10.0, 24.0, 9500, 2800, "operational", "+91-40-2323-4455", json.dumps(["Temporary Sleeping Bays", "Water Tanker Station", "Child Care Area"]), "Full ramp access, dual substation connection", "Telangana Disaster Management Authority"),
        ("FAC-MUM-01", "mumbai", "hospital", "King Edward Memorial Hospital (KEM)", "Parel, Mumbai", -18.0, -18.0, 1800, 1550, "high_occupancy", "+91-22-2410-7000", json.dumps(["Trauma Center", "Infectious Ward", "Mass Casualty Unit"]), "Emergency ramp, tidal flood barrier installed", "Demonstration Indian Health Cadastre"),
        ("FAC-MUM-02", "mumbai", "shelter", "Wankhede / Brabourne Arena Shelter Hub", "Churchgate, Mumbai", 24.0, -10.0, 16000, 4800, "operational", "+91-22-2281-1234", json.dumps(["Mass Evacuation Floor", "Mobile Food Dispensary", "First Aid Bay"]), "Wide gates, 720 min backup generator", "Brihanmumbai Municipal Corporation")
    ]
    cursor.executemany("""
    INSERT INTO facilities (id, city_id, type, name, address, x, z, capacity, current_occupancy, status, contact_phone, services_json, accessibility, data_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, facilities_seed)

    # Seed Volunteers
    volunteers_seed = [
        ("VOL-01", "hyderabad", "Rajesh Varma", "+91-98490-11223", json.dumps(["First Aid Certified", "Civil Defense Trained"]), "Immediate", "Assisting at Gachibowli Triage Desk", "Active"),
        ("VOL-02", "hyderabad", "Dr. Shalini Rao", "+91-99882-33445", json.dumps(["Physician", "Pediatric Trauma"]), "Immediate", "Medical Lead, LB Stadium Shelter", "Active"),
        ("VOL-03", "hyderabad", "Syed Farooq", "+91-97011-55667", json.dumps(["Heavy Vehicle Driver", "Boat Rescue"]), "Within 2 Hours", "Water Tanker Dispatch Route 2", "Assigned"),
        ("VOL-04", "hyderabad", "Ananya Reddy", "+91-94400-77889", json.dumps(["GIS Mapping", "Civil Logistics"]), "Immediate", "Damage Assessment Data Entry", "Active")
    ]
    cursor.executemany("""
    INSERT INTO volunteers (id, city_id, name, phone, skills_json, availability, assigned_task, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, volunteers_seed)

    conn.commit()

# ==========================================
# CRUD Operations
# ==========================================

def save_scenario(scenario_id: str, hazard_type: str, severity: float, config: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO scenarios (id, created_at, hazard_type, severity, config_json)
    VALUES (?, ?, ?, ?, ?)
    """, (scenario_id, datetime.utcnow().isoformat(), hazard_type, severity, json.dumps(config)))
    conn.commit()
    conn.close()

def record_dispatch_action(scenario_id: str, branch_id: str, tick: int, action_type: str, x: float, z: float, notes: str = ""):
    conn = get_connection()
    cursor = conn.cursor()
    action_id = f"act_{int(datetime.utcnow().timestamp()*1000)}"
    cursor.execute("""
    INSERT INTO dispatch_actions (id, scenario_id, branch_id, tick, action_type, target_x, target_z, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (action_id, scenario_id, branch_id, tick, action_type, x, z, notes, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    return action_id

def log_event(scenario_id: str, branch_id: str, tick: int, timestamp_str: str, level: str, category: str, title: str, description: str):
    conn = get_connection()
    cursor = conn.cursor()
    event_id = f"evt_{int(datetime.utcnow().timestamp()*1000)}_{tick}"
    cursor.execute("""
    INSERT INTO event_logs (id, scenario_id, branch_id, tick, timestamp_str, level, category, title, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (event_id, scenario_id, branch_id, tick, timestamp_str, level, category, title, description))
    conn.commit()
    conn.close()

def get_incidents(city_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if city_id:
        cursor.execute("SELECT * FROM incidents WHERE city_id = ? ORDER BY created_at DESC", (city_id,))
    else:
        cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "city_id": r["city_id"],
            "hazard_type": r["hazard_type"],
            "severity": r["severity"],
            "priority": r["priority"],
            "location_name": r["location_name"],
            "x": r["x"],
            "z": r["z"],
            "affected_count": r["affected_count"],
            "status": r["status"],
            "assigned_unit": r["assigned_unit"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "description": r["description"],
            "notes": json.loads(r["notes_json"]) if r["notes_json"] else []
        }
        for r in rows
    ]

def create_incident(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    incident_id = data.get("id") or f"INC-{data['city_id'][:3].upper()}-{int(datetime.utcnow().timestamp())%10000:04d}"
    now_iso = datetime.utcnow().isoformat()
    notes = data.get("notes") or ["Incident logged by operator"]
    
    cursor.execute("""
    INSERT INTO incidents (id, title, city_id, hazard_type, severity, priority, location_name, x, z, affected_count, status, assigned_unit, created_at, updated_at, description, notes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        incident_id,
        data["title"],
        data.get("city_id", "hyderabad"),
        data.get("hazard_type", "flood"),
        data.get("severity", 50.0),
        data.get("priority", "High"),
        data.get("location_name", "Municipal Center"),
        data.get("x", 0.0),
        data.get("z", 0.0),
        data.get("affected_count", 50),
        data.get("status", "Reported"),
        data.get("assigned_unit"),
        now_iso,
        now_iso,
        data.get("description", ""),
        json.dumps(notes)
    ))
    conn.commit()
    conn.close()
    data["id"] = incident_id
    data["created_at"] = now_iso
    data["updated_at"] = now_iso
    data["notes"] = notes
    return data

def update_incident(incident_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    notes = json.loads(row["notes_json"]) if row["notes_json"] else []
    if "note" in updates and updates["note"]:
        notes.append(f"[{datetime.utcnow().strftime('%H:%M:%S')}] {updates['note']}")

    now_iso = datetime.utcnow().isoformat()
    status = updates.get("status", row["status"])
    severity = updates.get("severity", row["severity"])
    priority = updates.get("priority", row["priority"])
    assigned_unit = updates.get("assigned_unit", row["assigned_unit"])

    cursor.execute("""
    UPDATE incidents
    SET status = ?, severity = ?, priority = ?, assigned_unit = ?, updated_at = ?, notes_json = ?
    WHERE id = ?
    """, (status, severity, priority, assigned_unit, now_iso, json.dumps(notes), incident_id))
    conn.commit()
    conn.close()

    return {
        "id": incident_id,
        "title": row["title"],
        "city_id": row["city_id"],
        "hazard_type": row["hazard_type"],
        "severity": severity,
        "priority": priority,
        "location_name": row["location_name"],
        "x": row["x"],
        "z": row["z"],
        "affected_count": row["affected_count"],
        "status": status,
        "assigned_unit": assigned_unit,
        "created_at": row["created_at"],
        "updated_at": now_iso,
        "description": row["description"],
        "notes": notes
    }

def get_emergency_units(city_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if city_id:
        cursor.execute("SELECT * FROM emergency_units WHERE city_id = ?", (city_id,))
    else:
        cursor.execute("SELECT * FROM emergency_units")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_emergency_unit(unit_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM emergency_units WHERE id = ?", (unit_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    status = updates.get("status", row["status"])
    assigned_incident_id = updates.get("assigned_incident_id", row["assigned_incident_id"])
    fuel_pct = updates.get("fuel_pct", row["fuel_pct"])

    cursor.execute("""
    UPDATE emergency_units
    SET status = ?, assigned_incident_id = ?, fuel_pct = ?
    WHERE id = ?
    """, (status, assigned_incident_id, fuel_pct, unit_id))
    conn.commit()
    conn.close()

    res = dict(row)
    res["status"] = status
    res["assigned_incident_id"] = assigned_incident_id
    res["fuel_pct"] = fuel_pct
    return res

def get_medical_requests(city_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if city_id:
        cursor.execute("SELECT * FROM medical_requests WHERE city_id = ? ORDER BY created_at DESC", (city_id,))
    else:
        cursor.execute("SELECT * FROM medical_requests ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "incident_id": r["incident_id"],
            "city_id": r["city_id"],
            "patient_count": r["patient_count"],
            "triage_category": r["triage_category"],
            "assistance_required": r["assistance_required"],
            "location_name": r["location_name"],
            "assigned_unit_id": r["assigned_unit_id"],
            "assigned_hospital_id": r["assigned_hospital_id"],
            "status": r["status"],
            "created_at": r["created_at"],
            "notes": json.loads(r["notes_json"]) if r["notes_json"] else []
        }
        for r in rows
    ]

def create_medical_request(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    req_id = f"MED-{data.get('city_id', 'hyd')[:3].upper()}-{int(datetime.utcnow().timestamp())%10000:04d}"
    now_iso = datetime.utcnow().isoformat()
    notes = ["Medical request logged in EOC triage queue"]

    cursor.execute("""
    INSERT INTO medical_requests (id, incident_id, city_id, patient_count, triage_category, assistance_required, location_name, assigned_unit_id, assigned_hospital_id, status, created_at, notes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        req_id,
        data.get("incident_id"),
        data.get("city_id", "hyderabad"),
        data.get("patient_count", 1),
        data.get("triage_category", "Urgent"),
        data.get("assistance_required", "Emergency Care"),
        data.get("location_name", "Urban Sector"),
        data.get("assigned_unit_id"),
        data.get("assigned_hospital_id"),
        "Requested",
        now_iso,
        json.dumps(notes)
    ))
    conn.commit()
    conn.close()
    data["id"] = req_id
    data["status"] = "Requested"
    data["created_at"] = now_iso
    data["notes"] = notes
    return data

def update_medical_request(req_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medical_requests WHERE id = ?", (req_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    notes = json.loads(row["notes_json"]) if row["notes_json"] else []
    if "note" in updates and updates["note"]:
        notes.append(f"[{datetime.utcnow().strftime('%H:%M:%S')}] {updates['note']}")

    status = updates.get("status", row["status"])
    assigned_unit_id = updates.get("assigned_unit_id", row["assigned_unit_id"])
    assigned_hospital_id = updates.get("assigned_hospital_id", row["assigned_hospital_id"])

    cursor.execute("""
    UPDATE medical_requests
    SET status = ?, assigned_unit_id = ?, assigned_hospital_id = ?, notes_json = ?
    WHERE id = ?
    """, (status, assigned_unit_id, assigned_hospital_id, json.dumps(notes), req_id))
    conn.commit()
    conn.close()

    res = dict(row)
    res["status"] = status
    res["assigned_unit_id"] = assigned_unit_id
    res["assigned_hospital_id"] = assigned_hospital_id
    res["notes"] = notes
    return res

def get_relief_requests(city_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if city_id:
        cursor.execute("SELECT * FROM relief_requests WHERE city_id = ? ORDER BY created_at DESC", (city_id,))
    else:
        cursor.execute("SELECT * FROM relief_requests ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "city_id": r["city_id"],
            "category": r["category"],
            "item_name": r["item_name"],
            "quantity_requested": r["quantity_requested"],
            "quantity_delivered": r["quantity_delivered"],
            "unit": r["unit"],
            "status": r["status"],
            "priority": r["priority"],
            "location_name": r["location_name"],
            "x": r["x"],
            "z": r["z"],
            "assigned_team": r["assigned_team"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "notes": json.loads(r["notes_json"]) if r["notes_json"] else []
        }
        for r in rows
    ]

def create_relief_request(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    req_id = f"REL-{data.get('city_id', 'hyd')[:3].upper()}-{int(datetime.utcnow().timestamp())%10000:04d}"
    now_iso = datetime.utcnow().isoformat()
    notes = [data.get("notes") or "Relief request registered"]

    cursor.execute("""
    INSERT INTO relief_requests (id, city_id, category, item_name, quantity_requested, quantity_delivered, unit, status, priority, location_name, x, z, assigned_team, created_at, updated_at, notes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        req_id,
        data.get("city_id", "hyderabad"),
        data.get("category", "food_water"),
        data.get("item_name", "Clean Drinking Water"),
        data.get("quantity_requested", 100),
        0,
        data.get("unit", "units"),
        "Requested",
        data.get("priority", "High"),
        data.get("location_name", "Relief Point"),
        data.get("x", 0.0),
        data.get("z", 0.0),
        None,
        now_iso,
        now_iso,
        json.dumps(notes)
    ))
    conn.commit()
    conn.close()
    data["id"] = req_id
    data["status"] = "Requested"
    data["quantity_delivered"] = 0
    data["created_at"] = now_iso
    data["updated_at"] = now_iso
    data["notes"] = notes
    return data

def update_relief_request(req_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM relief_requests WHERE id = ?", (req_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    notes = json.loads(row["notes_json"]) if row["notes_json"] else []
    if "note" in updates and updates["note"]:
        notes.append(f"[{datetime.utcnow().strftime('%H:%M:%S')}] {updates['note']}")

    now_iso = datetime.utcnow().isoformat()
    status = updates.get("status", row["status"])
    quantity_delivered = updates.get("quantity_delivered", row["quantity_delivered"])
    assigned_team = updates.get("assigned_team", row["assigned_team"])

    cursor.execute("""
    UPDATE relief_requests
    SET status = ?, quantity_delivered = ?, assigned_team = ?, updated_at = ?, notes_json = ?
    WHERE id = ?
    """, (status, quantity_delivered, assigned_team, now_iso, json.dumps(notes), req_id))
    conn.commit()
    conn.close()

    res = dict(row)
    res["status"] = status
    res["quantity_delivered"] = quantity_delivered
    res["assigned_team"] = assigned_team
    res["updated_at"] = now_iso
    res["notes"] = notes
    return res

def get_facilities(city_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if city_id:
        cursor.execute("SELECT * FROM facilities WHERE city_id = ?", (city_id,))
    else:
        cursor.execute("SELECT * FROM facilities")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "city_id": r["city_id"],
            "type": r["type"],
            "name": r["name"],
            "address": r["address"],
            "x": r["x"],
            "z": r["z"],
            "capacity": r["capacity"],
            "current_occupancy": r["current_occupancy"],
            "status": r["status"],
            "contact_phone": r["contact_phone"],
            "services": json.loads(r["services_json"]) if r["services_json"] else [],
            "accessibility": r["accessibility"],
            "data_source": r["data_source"]
        }
        for r in rows
    ]

def create_facility(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    fac_id = f"FAC-{data.get('city_id', 'hyd')[:3].upper()}-{int(datetime.utcnow().timestamp())%10000:04d}"
    services = data.get("services") or ["Emergency Shelter", "First Aid"]
    
    cursor.execute("""
    INSERT INTO facilities (id, city_id, type, name, address, x, z, capacity, current_occupancy, status, contact_phone, services_json, accessibility, data_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        fac_id,
        data.get("city_id", "hyderabad"),
        data.get("type", "shelter"),
        data["name"],
        data.get("address", "Municipal Zone"),
        data.get("x", 0.0),
        data.get("z", 0.0),
        data.get("capacity", 500),
        data.get("current_occupancy", 0),
        data.get("status", "operational"),
        data.get("contact_phone", "+91-40-2000-0000"),
        json.dumps(services),
        data.get("accessibility", "Standard access"),
        "Operator Registered"
    ))
    conn.commit()
    conn.close()
    data["id"] = fac_id
    data["services"] = services
    data["data_source"] = "Operator Registered"
    return data

def get_volunteers(city_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if city_id:
        cursor.execute("SELECT * FROM volunteers WHERE city_id = ?", (city_id,))
    else:
        cursor.execute("SELECT * FROM volunteers")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "city_id": r["city_id"],
            "name": r["name"],
            "phone": r["phone"],
            "skills": json.loads(r["skills_json"]) if r["skills_json"] else [],
            "availability": r["availability"],
            "assigned_task": r["assigned_task"],
            "status": r["status"]
        }
        for r in rows
    ]

def reset_all_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM incidents")
    cursor.execute("DELETE FROM emergency_units")
    cursor.execute("DELETE FROM medical_requests")
    cursor.execute("DELETE FROM relief_requests")
    cursor.execute("DELETE FROM facilities")
    cursor.execute("DELETE FROM volunteers")
    conn.commit()
    seed_demonstration_records(conn)
    conn.close()

# Auto-initialize on import
init_db()
