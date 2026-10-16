import type { ScenarioConfig, FullSimulationResponse, CityDefinition, CityId, CityMetadata } from '../types/simulation';
import { generateClientCity, simulateThreeBranchesClient } from './clientSimulationEngine';
import { CITIES_CATALOG } from './cityData';

const API_BASE_URL = 'http://localhost:8000/api';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(1800) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchCitiesList(): Promise<CityMetadata[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/cities`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (data.cities && data.cities.length > 0) return data.cities;
    }
  } catch {
    // Fallback
  }
  return CITIES_CATALOG;
}

export async function fetchCityDefinition(cityId: CityId = 'hyderabad', seed = 42): Promise<CityDefinition> {
  try {
    const res = await fetch(`${API_BASE_URL}/city/${cityId}`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to client-side procedural generator
  }
  return generateClientCity(cityId, seed);
}

export async function runForkSimulation(config: ScenarioConfig, city: CityDefinition): Promise<FullSimulationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/simulation/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
      signal: AbortSignal.timeout(4500)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to client simulation engine
  }
  return simulateThreeBranchesClient(config, city);
}

export async function dispatchTacticalAction(branchId: string, actionType: string, x: number, z: number, notes = ''): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/simulation/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch_id: branchId,
        action_type: actionType,
        target_x: x,
        target_z: z,
        notes
      }),
      signal: AbortSignal.timeout(2000)
    });
    return res.ok;
  } catch {
    return true; // client state handled locally
  }
}
