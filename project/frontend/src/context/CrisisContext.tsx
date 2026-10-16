import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CityId, HazardType } from '../types/simulation';
import type {
  CrisisPageId,
  IncidentRecord,
  EmergencyUnitRecord,
  MedicalRequestRecord,
  ReliefRequestRecord,
  FacilityRecord,
  VolunteerRecord,
  NotificationItem,
  IncidentStatus,
  IncidentPriority,
  ReliefWorkflowStatus
} from '../types/crisis';

interface CrisisContextType {
  activePage: CrisisPageId;
  setActivePage: (page: CrisisPageId) => void;
  selectedCityId: CityId;
  setSelectedCityId: (cityId: CityId) => void;
  activeIncidentId: string | null;
  setActiveIncidentId: (id: string | null) => void;
  isBackendConnected: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Collections
  incidents: IncidentRecord[];
  emergencyUnits: EmergencyUnitRecord[];
  medicalRequests: MedicalRequestRecord[];
  reliefRequests: ReliefRequestRecord[];
  facilities: FacilityRecord[];
  volunteers: VolunteerRecord[];
  notifications: NotificationItem[];

  // Mutators
  createIncident: (data: Partial<IncidentRecord>) => Promise<IncidentRecord>;
  updateIncident: (id: string, updates: Partial<IncidentRecord> & { note?: string }) => Promise<void>;
  assignUnitToIncident: (unitId: string, incidentId: string) => Promise<void>;
  createMedicalRequest: (data: Partial<MedicalRequestRecord>) => Promise<MedicalRequestRecord>;
  updateMedicalRequest: (id: string, updates: Partial<MedicalRequestRecord> & { note?: string }) => Promise<void>;
  createReliefRequest: (data: Partial<ReliefRequestRecord>) => Promise<ReliefRequestRecord>;
  updateReliefWorkflow: (id: string, status: ReliefWorkflowStatus, updates?: Partial<ReliefRequestRecord> & { note?: string }) => Promise<void>;
  registerFacility: (data: Partial<FacilityRecord>) => Promise<FacilityRecord>;
  resetToDemoData: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const CrisisContext = createContext<CrisisContextType | undefined>(undefined);

const API_BASE = 'http://127.0.0.1:8000';

// Default initial demo state for immediate fallback
const SEED_INCIDENTS: IncidentRecord[] = [
  {
    id: 'INC-HYD-01',
    title: 'Musi River South Bank Flood Barrier Breach',
    city_id: 'hyderabad',
    hazard_type: 'flood',
    severity: 82.0,
    priority: 'Critical',
    location_name: 'Nayapul Historic Causeway',
    x: 2.0,
    z: -1.0,
    affected_count: 1400,
    status: 'Assigned',
    assigned_unit: 'FIRE-HYD-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: 'Water surge exceeding 1.2m depth approaching Osmania General Hospital low-level basements.',
    notes: ['Initial alert logged by Musi Flood Watch sensor 4B', 'Dispatched Fire & Rescue Squad 01 with demountable flood dams']
  },
  {
    id: 'INC-HYD-02',
    title: 'HITEC City Sector-3 Substation Transformer Spark',
    city_id: 'hyderabad',
    hazard_type: 'fire',
    severity: 65.0,
    priority: 'High',
    location_name: 'HITEC City Tech Park North',
    x: 18.0,
    z: -18.0,
    affected_count: 320,
    status: 'En Route',
    assigned_unit: 'FIRE-HYD-02',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: 'Electrical arc flash ignited dry brush adjacent to primary 220kV feeder yard.',
    notes: ['Automated breaker trip detected', 'Response Unit Foam Crash Tender en route']
  },
  {
    id: 'INC-HYD-03',
    title: 'Banjara Hills Residential Hillside Landslip Risk',
    city_id: 'hyderabad',
    hazard_type: 'flood',
    severity: 55.0,
    priority: 'Medium',
    location_name: 'Banjara Hills Rd No 12',
    x: -12.0,
    z: 4.0,
    affected_count: 180,
    status: 'Verified',
    assigned_unit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: 'Heavy runoff destabilizing unreinforced retaining wall behind apartment clusters.',
    notes: ['Geotechnical warning issued', 'Evacuation advisory broadcast to Ward 14']
  },
  {
    id: 'INC-CHE-01',
    title: 'Cooum River Estuary Storm Surge Backflow',
    city_id: 'chennai',
    hazard_type: 'flood',
    severity: 88.0,
    priority: 'Critical',
    location_name: 'Napier Bridge Promenade',
    x: 4.0,
    z: -2.0,
    affected_count: 2400,
    status: 'Reported',
    assigned_unit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: '3.8m storm surge meeting swollen Cooum river outflow, submerging arterial access.',
    notes: ['Coastal Radar alert', 'Tide gauge reading +1.8m above MSL']
  },
  {
    id: 'INC-MUM-01',
    title: 'Mithi River Culvert Surcharge at BKC Crossing',
    city_id: 'mumbai',
    hazard_type: 'flood',
    severity: 85.0,
    priority: 'Critical',
    location_name: 'Bandra-Kurla Complex Artery',
    x: 0.0,
    z: 0.0,
    affected_count: 3100,
    status: 'Assigned',
    assigned_unit: 'AMB-MUM-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: 'Storm drain reverse incursion flooding major financial transit corridor.',
    notes: ['High-tide sync alert at 14:30 hrs', 'Traffic diversion active']
  },
  {
    id: 'INC-BLR-01',
    title: 'Bellandur Lake Bund Structural Overtopping',
    city_id: 'bengaluru',
    hazard_type: 'flood',
    severity: 74.0,
    priority: 'High',
    location_name: 'Outer Ring Road Tech Zone',
    x: 12.0,
    z: 10.0,
    affected_count: 950,
    status: 'Verified',
    assigned_unit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: 'Cascading lake surplus encroaching roadway and commercial basement parking.',
    notes: ['Lake buffer monitoring alert', 'Pump units requested']
  }
];

const SEED_UNITS: EmergencyUnitRecord[] = [
  { id: 'AMB-HYD-01', city_id: 'hyderabad', name: '108 Advanced Life Support ALS-01', type: 'ambulance', status: 'Available', capability: 'ALS · Ventilator & Defibrillator', location_name: 'Osmania Hospital Station', lat: 17.3616, lon: 78.4747, fuel_pct: 92.0, assigned_incident_id: null },
  { id: 'AMB-HYD-02', city_id: 'hyderabad', name: '108 Critical Care Ambulance ALS-02', type: 'ambulance', status: 'Assigned', capability: 'ALS · Trauma Support Unit', location_name: 'NIMS Panjagutta Bay', lat: 17.4222, lon: 78.4496, fuel_pct: 78.0, assigned_incident_id: 'INC-HYD-01' },
  { id: 'AMB-HYD-03', city_id: 'hyderabad', name: '108 Basic Life Support BLS-04', type: 'ambulance', status: 'Available', capability: 'BLS · Patient Transport', location_name: 'Secunderabad Transit Depot', lat: 17.4399, lon: 78.4983, fuel_pct: 85.0, assigned_incident_id: null },
  { id: 'FIRE-HYD-01', city_id: 'hyderabad', name: 'TSDRF Heavy Water Tender WT-101', type: 'fire_engine', status: 'On Scene', capability: '12,000L High-Volume Pump', location_name: 'Gowliguda Fire Station', lat: 17.3750, lon: 78.4800, fuel_pct: 65.0, assigned_incident_id: 'INC-HYD-01' },
  { id: 'FIRE-HYD-02', city_id: 'hyderabad', name: 'HITEC City Foam Crash Tender FC-204', type: 'fire_engine', status: 'En Route', capability: 'Specialized Chemical & Foam Engine', location_name: 'Madhapur Fire Station', lat: 17.4483, lon: 78.3915, fuel_pct: 88.0, assigned_incident_id: 'INC-HYD-02' },
  { id: 'RESCUE-HYD-01', city_id: 'hyderabad', name: 'GHMC Disaster Response Boat USAR-01', type: 'rescue_squad', status: 'Available', capability: 'Inflatable Flood Rescue & Sonar', location_name: 'Hussain Sagar Rescue Base', lat: 17.4239, lon: 78.4738, fuel_pct: 95.0, assigned_incident_id: null },
  { id: 'AMB-MUM-01', city_id: 'mumbai', name: '108 Mumbai Metro Trauma Unit MT-01', type: 'ambulance', status: 'En Route', capability: 'ALS · Mobile Intensive Care', location_name: 'KEM Hospital Base', lat: 18.9986, lon: 72.8427, fuel_pct: 82.0, assigned_incident_id: 'INC-MUM-01' },
  { id: 'FIRE-MUM-01', city_id: 'mumbai', name: 'BKC Fire Station Bronto Skylift 54m', type: 'fire_engine', status: 'Available', capability: '54m High-Rise Hydraulic Ladder', location_name: 'BKC Station', lat: 19.0600, lon: 72.8656, fuel_pct: 90.0, assigned_incident_id: null }
];

const SEED_MEDICAL: MedicalRequestRecord[] = [
  { id: 'MED-HYD-01', incident_id: 'INC-HYD-01', city_id: 'hyderabad', patient_count: 4, triage_category: 'Critical', assistance_required: 'Trauma and hypothermia from submerged vehicle rescue', location_name: 'Musi Causeway Sector 4', assigned_unit_id: 'AMB-HYD-02', assigned_hospital_id: 'FAC-HYD-01', status: 'Assigned', created_at: new Date().toISOString(), notes: ['Triage tagged Red', 'Ambulance ALS-02 dispatched'] },
  { id: 'MED-HYD-02', incident_id: 'INC-HYD-02', city_id: 'hyderabad', patient_count: 2, triage_category: 'Urgent', assistance_required: 'Smoke inhalation and first-degree burn care', location_name: 'HITEC Sector 3 Substation', assigned_unit_id: 'AMB-HYD-01', assigned_hospital_id: 'FAC-HYD-01', status: 'En Route', created_at: new Date().toISOString(), notes: ['Triage tagged Yellow', 'Oxygen therapy administered'] }
];

const SEED_RELIEF: ReliefRequestRecord[] = [
  { id: 'REL-HYD-01', city_id: 'hyderabad', category: 'food_water', item_name: 'Potable Drinking Water (20L Cans)', quantity_requested: 600, quantity_delivered: 450, unit: 'cans', status: 'In Progress', priority: 'Critical', location_name: 'Gachibowli Stadium Relief Camp', x: 24.0, z: -10.0, assigned_team: 'Red Cross Hyderabad Team 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), notes: ['450 cans delivered', 'Remaining 150 en route from Asif Nagar plant'] },
  { id: 'REL-HYD-02', city_id: 'hyderabad', category: 'food_water', item_name: 'Ready-to-Eat Emergency Meal Packets', quantity_requested: 1800, quantity_delivered: 1800, unit: 'meals', status: 'Completed', priority: 'High', location_name: 'LB Stadium High-Ground Shelter', x: -10.0, z: 24.0, assigned_team: 'GHMC Civil Supplies Team', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), notes: ['Full batch delivered and distributed'] },
  { id: 'REL-HYD-03', city_id: 'hyderabad', category: 'essential_supplies', item_name: 'Dry Blankets & Thermal Wraps', quantity_requested: 800, quantity_delivered: 300, unit: 'blankets', status: 'Assigned', priority: 'High', location_name: 'Nayapul Evacuation Assembly', x: 2.0, z: -1.0, assigned_team: 'SDRF Logistics Team B', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), notes: ['Allocated from central warehouse'] },
  { id: 'REL-HYD-04', city_id: 'hyderabad', category: 'temporary_shelter', item_name: 'Demountable Family Weatherproof Tents', quantity_requested: 120, quantity_delivered: 0, unit: 'tents', status: 'Approved', priority: 'Critical', location_name: 'LB Nagar Relief Staging Area', x: 20.0, z: 20.0, assigned_team: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), notes: ['Awaiting transporter dispatch'] }
];

const SEED_FACILITIES: FacilityRecord[] = [
  { id: 'FAC-HYD-01', city_id: 'hyderabad', type: 'hospital', name: 'Osmania General Hospital Trauma Hub', address: 'Afzal Gunj, Hyderabad', x: -20.0, z: -18.0, capacity: 1200, current_occupancy: 890, status: 'operational', contact_phone: '+91-40-2460-0121', services: ['Level-1 Trauma', '24/7 ICU', 'Blood Bank', 'Emergency Helipad'], accessibility: 'Wheelchair accessible, 500kVA emergency generator', data_source: 'Demonstration Indian Health Cadastre' },
  { id: 'FAC-HYD-02', city_id: 'hyderabad', type: 'hospital', name: "Nizam's Institute of Medical Sciences (NIMS)", address: 'Panjagutta, Hyderabad', x: -14.0, z: 6.0, capacity: 1500, current_occupancy: 1100, status: 'operational', contact_phone: '+91-40-2348-9000', services: ['Multi-Specialty Surgery', 'Burn ICU', 'Oxygen Plant'], accessibility: 'Ramp access, secondary power grid backup', data_source: 'Demonstration Indian Health Cadastre' },
  { id: 'FAC-HYD-03', city_id: 'hyderabad', type: 'shelter', name: 'Gachibowli Indoor Stadium Evacuation Hub', address: 'Gachibowli Sports Complex', x: 24.0, z: -10.0, capacity: 12000, current_occupancy: 3420, status: 'operational', contact_phone: '+91-40-2300-1122', services: ['Dormitory Beds', 'Community Kitchen', 'Medical Triage Station', 'Sanitation Blocks'], accessibility: 'Ground floor accessible, 1000kVA solar-hybrid backup', data_source: 'Telangana Disaster Management Authority' },
  { id: 'FAC-HYD-04', city_id: 'hyderabad', type: 'shelter', name: 'LB Stadium High-Ground Shelter Complex', address: 'Fateh Maidan, Basheerbagh', x: -10.0, z: 24.0, capacity: 9500, current_occupancy: 2800, status: 'operational', contact_phone: '+91-40-2323-4455', services: ['Temporary Sleeping Bays', 'Water Tanker Station', 'Child Care Area'], accessibility: 'Full ramp access, dual substation connection', data_source: 'Telangana Disaster Management Authority' },
  { id: 'FAC-MUM-01', city_id: 'mumbai', type: 'hospital', name: 'King Edward Memorial Hospital (KEM)', address: 'Parel, Mumbai', x: -18.0, z: -18.0, capacity: 1800, current_occupancy: 1550, status: 'high_occupancy', contact_phone: '+91-22-2410-7000', services: ['Trauma Center', 'Infectious Ward', 'Mass Casualty Unit'], accessibility: 'Emergency ramp, tidal flood barrier installed', data_source: 'Demonstration Indian Health Cadastre' },
  { id: 'FAC-MUM-02', city_id: 'mumbai', type: 'shelter', name: 'Wankhede / Brabourne Arena Shelter Hub', address: 'Churchgate, Mumbai', x: 24.0, z: -10.0, capacity: 16000, current_occupancy: 4800, status: 'operational', contact_phone: '+91-22-2281-1234', services: ['Mass Evacuation Floor', 'Mobile Food Dispensary', 'First Aid Bay'], accessibility: 'Wide gates, 720 min backup generator', data_source: 'Brihanmumbai Municipal Corporation' }
];

const SEED_VOLUNTEERS: VolunteerRecord[] = [
  { id: 'VOL-01', city_id: 'hyderabad', name: 'Rajesh Varma', phone: '+91-98490-11223', skills: ['First Aid Certified', 'Civil Defense Trained'], availability: 'Immediate', assigned_task: 'Assisting at Gachibowli Triage Desk', status: 'Active' },
  { id: 'VOL-02', city_id: 'hyderabad', name: 'Dr. Shalini Rao', phone: '+91-99882-33445', skills: ['Physician', 'Pediatric Trauma'], availability: 'Immediate', assigned_task: 'Medical Lead, LB Stadium Shelter', status: 'Active' },
  { id: 'VOL-03', city_id: 'hyderabad', name: 'Syed Farooq', phone: '+91-97011-55667', skills: ['Heavy Vehicle Driver', 'Boat Rescue'], availability: 'Within 2 Hours', assigned_task: 'Water Tanker Dispatch Route 2', status: 'Assigned' },
  { id: 'VOL-04', city_id: 'hyderabad', name: 'Ananya Reddy', phone: '+91-94400-77889', skills: ['GIS Mapping', 'Civil Logistics'], availability: 'Immediate', assigned_task: 'Damage Assessment Data Entry', status: 'Active' }
];

export const CrisisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<CrisisPageId>('command_center');
  const [selectedCityId, setSelectedCityId] = useState<CityId>('hyderabad');
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>('INC-HYD-01');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<IncidentRecord[]>(SEED_INCIDENTS);
  const [emergencyUnits, setEmergencyUnits] = useState<EmergencyUnitRecord[]>(SEED_UNITS);
  const [medicalRequests, setMedicalRequests] = useState<MedicalRequestRecord[]>(SEED_MEDICAL);
  const [reliefRequests, setReliefRequests] = useState<ReliefRequestRecord[]>(SEED_RELIEF);
  const [facilities, setFacilities] = useState<FacilityRecord[]>(SEED_FACILITIES);
  const [volunteers, setVolunteers] = useState<VolunteerRecord[]>(SEED_VOLUNTEERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'notif-1', timestamp: new Date().toLocaleTimeString(), level: 'CRITICAL', title: 'Barrier Breach Alert', message: 'Musi River barrier water level exceeded +1.2m threshold near Nayapul.', read: false, page_target: 'emergency_response' },
    { id: 'notif-2', timestamp: new Date().toLocaleTimeString(), level: 'WARNING', title: 'Water Tanker Shortage', message: 'Gachibowli Stadium camp requested 150 additional 20L water cans.', read: false, page_target: 'relief_assistance' },
    { id: 'notif-3', timestamp: new Date().toLocaleTimeString(), level: 'INFO', title: 'Ambulance Assigned', message: 'Unit ALS-02 dispatched to Osmania Hospital Sector 4.', read: true, page_target: 'medical_ambulance' }
  ]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3200);
  }, []);

  // Sync data with FastAPI backend on mount and city change
  const refreshBackendData = useCallback(async () => {
    try {
      const [resInc, resUnits, resMed, resRel, resFac, resVol] = await Promise.all([
        fetch(`${API_BASE}/api/incidents`),
        fetch(`${API_BASE}/api/units`),
        fetch(`${API_BASE}/api/medical-requests`),
        fetch(`${API_BASE}/api/relief-requests`),
        fetch(`${API_BASE}/api/facilities`),
        fetch(`${API_BASE}/api/volunteers`)
      ]);

      if (resInc.ok) {
        const data = await resInc.json();
        if (data.incidents?.length) setIncidents(data.incidents);
      }
      if (resUnits.ok) {
        const data = await resUnits.json();
        if (data.units?.length) setEmergencyUnits(data.units);
      }
      if (resMed.ok) {
        const data = await resMed.json();
        if (data.requests?.length) setMedicalRequests(data.requests);
      }
      if (resRel.ok) {
        const data = await resRel.json();
        if (data.requests?.length) setReliefRequests(data.requests);
      }
      if (resFac.ok) {
        const data = await resFac.json();
        if (data.facilities?.length) setFacilities(data.facilities);
      }
      if (resVol.ok) {
        const data = await resVol.json();
        if (data.volunteers?.length) setVolunteers(data.volunteers);
      }
      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    refreshBackendData();
    const interval = setInterval(refreshBackendData, 10000);
    return () => clearInterval(interval);
  }, [refreshBackendData]);

  // Create Incident
  const createIncident = async (data: Partial<IncidentRecord>): Promise<IncidentRecord> => {
    const newInc: IncidentRecord = {
      id: `INC-${(data.city_id || selectedCityId).slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: data.title || 'Untitled Emergency Incident',
      city_id: data.city_id || selectedCityId,
      hazard_type: data.hazard_type || 'flood',
      severity: data.severity ?? 60.0,
      priority: data.priority || 'High',
      location_name: data.location_name || 'City Core',
      x: data.x ?? 0.0,
      z: data.z ?? 0.0,
      affected_count: data.affected_count ?? 100,
      status: 'Reported',
      assigned_unit: data.assigned_unit || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: data.description || 'Emergency incident reported by field observation.',
      notes: ['Incident created via Crisis360 EOC Command Interface']
    };

    setIncidents(prev => [newInc, ...prev]);
    showToast(`Created incident ${newInc.id}`);

    // Add alert notification
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: newInc.priority === 'Critical' ? 'CRITICAL' : 'WARNING',
        title: `New Incident: ${newInc.title}`,
        message: `${newInc.location_name} (${newInc.severity}% severity, ~${newInc.affected_count} affected)`,
        read: false,
        page_target: 'emergency_response'
      },
      ...prev
    ]);

    // Send to backend
    try {
      await fetch(`${API_BASE}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInc)
      });
    } catch {
      // offline fallback
    }

    return newInc;
  };

  // Update Incident
  const updateIncident = async (id: string, updates: Partial<IncidentRecord> & { note?: string }) => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === id) {
          const notes = [...inc.notes];
          if (updates.note) {
            notes.push(`[${new Date().toLocaleTimeString()}] ${updates.note}`);
          }
          return {
            ...inc,
            ...updates,
            updated_at: new Date().toISOString(),
            notes
          };
        }
        return inc;
      })
    );
    showToast(`Updated incident ${id}`);

    try {
      await fetch(`${API_BASE}/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch {
      // offline fallback
    }
  };

  // Assign Unit
  const assignUnitToIncident = async (unitId: string, incidentId: string) => {
    setEmergencyUnits(prev =>
      prev.map(u => (u.id === unitId ? { ...u, status: 'Assigned', assigned_incident_id: incidentId } : u))
    );
    setIncidents(prev =>
      prev.map(inc => (inc.id === incidentId ? { ...inc, assigned_unit: unitId, status: 'Assigned' } : inc))
    );
    showToast(`Assigned ${unitId} to incident ${incidentId}`);

    try {
      await fetch(`${API_BASE}/api/units/${unitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Assigned', assigned_incident_id: incidentId })
      });
      await fetch(`${API_BASE}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_unit: unitId, status: 'Assigned', note: `Unit ${unitId} assigned to scene` })
      });
    } catch {
      // offline fallback
    }
  };

  // Create Medical Request
  const createMedicalRequest = async (data: Partial<MedicalRequestRecord>): Promise<MedicalRequestRecord> => {
    const newMed: MedicalRequestRecord = {
      id: `MED-${(data.city_id || selectedCityId).slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      incident_id: data.incident_id || null,
      city_id: data.city_id || selectedCityId,
      patient_count: data.patient_count ?? 1,
      triage_category: data.triage_category || 'Urgent',
      assistance_required: data.assistance_required || 'Emergency Triage & Evacuation',
      location_name: data.location_name || 'Emergency Sector',
      assigned_unit_id: data.assigned_unit_id || null,
      assigned_hospital_id: data.assigned_hospital_id || null,
      status: 'Requested',
      created_at: new Date().toISOString(),
      notes: ['Logged in Medical Coordination Queue']
    };

    setMedicalRequests(prev => [newMed, ...prev]);
    showToast(`Created medical request ${newMed.id} (${newMed.triage_category})`);

    try {
      await fetch(`${API_BASE}/api/medical-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMed)
      });
    } catch {
      // offline fallback
    }

    return newMed;
  };

  // Update Medical Request
  const updateMedicalRequest = async (id: string, updates: Partial<MedicalRequestRecord> & { note?: string }) => {
    setMedicalRequests(prev =>
      prev.map(m => {
        if (m.id === id) {
          const notes = [...m.notes];
          if (updates.note) {
            notes.push(`[${new Date().toLocaleTimeString()}] ${updates.note}`);
          }
          return { ...m, ...updates, notes };
        }
        return m;
      })
    );
    showToast(`Updated medical request ${id}`);

    try {
      await fetch(`${API_BASE}/api/medical-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch {
      // offline fallback
    }
  };

  // Create Relief Request
  const createReliefRequest = async (data: Partial<ReliefRequestRecord>): Promise<ReliefRequestRecord> => {
    const newRel: ReliefRequestRecord = {
      id: `REL-${(data.city_id || selectedCityId).slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      city_id: data.city_id || selectedCityId,
      category: data.category || 'food_water',
      item_name: data.item_name || 'Drinking Water Cans',
      quantity_requested: data.quantity_requested ?? 100,
      quantity_delivered: 0,
      unit: data.unit || 'units',
      status: 'Requested',
      priority: data.priority || 'High',
      location_name: data.location_name || 'Relief Camp',
      x: data.x ?? 0.0,
      z: data.z ?? 0.0,
      assigned_team: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: ['Relief demand logged in humanitarian registry']
    };

    setReliefRequests(prev => [newRel, ...prev]);
    showToast(`Registered relief request ${newRel.id}`);

    try {
      await fetch(`${API_BASE}/api/relief-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRel)
      });
    } catch {
      // offline fallback
    }

    return newRel;
  };

  // Update Relief Workflow: Requested → Verified → Approved → Assigned → In Progress → Delivered → Completed
  const updateReliefWorkflow = async (
    id: string,
    status: ReliefWorkflowStatus,
    updates?: Partial<ReliefRequestRecord> & { note?: string }
  ) => {
    setReliefRequests(prev =>
      prev.map(r => {
        if (r.id === id) {
          const notes = [...r.notes];
          if (updates?.note) {
            notes.push(`[${new Date().toLocaleTimeString()}] ${updates.note}`);
          } else {
            notes.push(`[${new Date().toLocaleTimeString()}] Workflow advanced to ${status}`);
          }
          return {
            ...r,
            ...updates,
            status,
            updated_at: new Date().toISOString(),
            notes
          };
        }
        return r;
      })
    );
    showToast(`Relief ${id} moved to: ${status}`);

    try {
      await fetch(`${API_BASE}/api/relief-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...updates })
      });
    } catch {
      // offline fallback
    }
  };

  // Register Facility
  const registerFacility = async (data: Partial<FacilityRecord>): Promise<FacilityRecord> => {
    const newFac: FacilityRecord = {
      id: `FAC-${(data.city_id || selectedCityId).slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      city_id: data.city_id || selectedCityId,
      type: data.type || 'shelter',
      name: data.name || 'Emergency Relief Center',
      address: data.address || 'Civil Lines',
      x: data.x ?? 0.0,
      z: data.z ?? 0.0,
      capacity: data.capacity ?? 500,
      current_occupancy: data.current_occupancy ?? 0,
      status: 'operational',
      contact_phone: data.contact_phone || '+91-40-2000-0000',
      services: data.services || ['Shelter Bays', 'Drinking Water', 'First Aid'],
      accessibility: data.accessibility || 'Wheelchair accessible, generator backup',
      data_source: 'Operator Registered Cadastre'
    };

    setFacilities(prev => [newFac, ...prev]);
    showToast(`Registered facility ${newFac.name}`);

    try {
      await fetch(`${API_BASE}/api/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFac)
      });
    } catch {
      // offline fallback
    }

    return newFac;
  };

  // Reset to Demo Data
  const resetToDemoData = async () => {
    setIncidents(SEED_INCIDENTS);
    setEmergencyUnits(SEED_UNITS);
    setMedicalRequests(SEED_MEDICAL);
    setReliefRequests(SEED_RELIEF);
    setFacilities(SEED_FACILITIES);
    setVolunteers(SEED_VOLUNTEERS);
    showToast('Reset all operational records to default demonstration data');

    try {
      await fetch(`${API_BASE}/api/data/reset`, { method: 'POST' });
    } catch {
      // offline fallback
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <CrisisContext.Provider
      value={{
        activePage,
        setActivePage,
        selectedCityId,
        setSelectedCityId,
        activeIncidentId,
        setActiveIncidentId,
        isBackendConnected,
        toastMessage,
        showToast,
        incidents,
        emergencyUnits,
        medicalRequests,
        reliefRequests,
        facilities,
        volunteers,
        notifications,
        createIncident,
        updateIncident,
        assignUnitToIncident,
        createMedicalRequest,
        updateMedicalRequest,
        createReliefRequest,
        updateReliefWorkflow,
        registerFacility,
        resetToDemoData,
        markNotificationRead,
        clearNotifications
      }}
    >
      {children}
    </CrisisContext.Provider>
  );
};

export const useCrisis = (): CrisisContextType => {
  const ctx = useContext(CrisisContext);
  if (!ctx) {
    throw new Error('useCrisis must be used within a CrisisProvider');
  }
  return ctx;
};
