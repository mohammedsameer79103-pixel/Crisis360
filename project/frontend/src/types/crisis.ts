import type { CityId, HazardType } from './simulation';

export type CrisisPageId =
  | 'command_center'
  | 'simulation_lab'
  | 'emergency_response'
  | 'medical_ambulance'
  | 'fire_rescue'
  | 'relief_assistance'
  | 'evacuation_map'
  | 'hospitals_shelters'
  | 'incident_management'
  | 'analytics_reports'
  | 'settings_sources';

export type IncidentStatus = 'Reported' | 'Verified' | 'Assigned' | 'En Route' | 'On Scene' | 'Resolved';
export type IncidentPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface IncidentRecord {
  id: string;
  title: string;
  city_id: CityId;
  hazard_type: HazardType | 'medical' | 'infrastructure' | 'rescue';
  severity: number;
  priority: IncidentPriority;
  location_name: string;
  x: number;
  z: number;
  affected_count: number;
  status: IncidentStatus;
  assigned_unit?: string | null;
  created_at: string;
  updated_at: string;
  description: string;
  notes: string[];
}

export type UnitType = 'ambulance' | 'fire_engine' | 'rescue_squad' | 'police';
export type UnitStatus = 'Available' | 'Assigned' | 'En Route' | 'On Scene' | 'Unavailable';

export interface EmergencyUnitRecord {
  id: string;
  city_id: CityId;
  name: string;
  type: UnitType;
  status: UnitStatus;
  capability: string;
  location_name: string;
  lat: number;
  lon: number;
  fuel_pct: number;
  assigned_incident_id?: string | null;
}

export type TriageCategory = 'Critical' | 'Urgent' | 'Moderate' | 'Minor';
export type MedicalStatus = 'Requested' | 'Verified' | 'Assigned' | 'En Route' | 'On Scene' | 'Resolved';

export interface MedicalRequestRecord {
  id: string;
  incident_id?: string | null;
  city_id: CityId;
  patient_count: number;
  triage_category: TriageCategory;
  assistance_required: string;
  location_name: string;
  assigned_unit_id?: string | null;
  assigned_hospital_id?: string | null;
  status: MedicalStatus;
  created_at: string;
  notes: string[];
}

export type ReliefCategory =
  | 'food_water'
  | 'temporary_shelter'
  | 'essential_supplies'
  | 'medical_relief'
  | 'special_assistance';

export type ReliefWorkflowStatus =
  | 'Requested'
  | 'Verified'
  | 'Approved'
  | 'Assigned'
  | 'In Progress'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

export interface ReliefRequestRecord {
  id: string;
  city_id: CityId;
  category: ReliefCategory;
  item_name: string;
  quantity_requested: number;
  quantity_delivered: number;
  unit: string;
  status: ReliefWorkflowStatus;
  priority: IncidentPriority;
  location_name: string;
  x: number;
  z: number;
  assigned_team?: string | null;
  created_at: string;
  updated_at: string;
  notes: string[];
}

export type FacilityType = 'hospital' | 'shelter';
export type FacilityStatus = 'operational' | 'high_occupancy' | 'full' | 'closed';

export interface FacilityRecord {
  id: string;
  city_id: CityId;
  type: FacilityType;
  name: string;
  address: string;
  x: number;
  z: number;
  capacity: number;
  current_occupancy: number;
  status: FacilityStatus;
  contact_phone: string;
  services: string[];
  accessibility: string;
  data_source: string;
}

export interface VolunteerRecord {
  id: string;
  city_id: CityId;
  name: string;
  phone: string;
  skills: string[];
  availability: 'Immediate' | 'Within 2 Hours' | 'On Standby';
  assigned_task?: string | null;
  status: 'Active' | 'Assigned' | 'Available' | 'Offline';
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  read: boolean;
  page_target?: CrisisPageId;
}
