export interface FloodData {
  floodRisk: 'none' | 'low' | 'medium' | 'high';
  waterLevel: number; // cm above normal
  waterLevelStatus: 'veryLow' | 'low' | 'normal' | 'high' | 'critical';
  affectedAreas: number; // number of affected areas
  evacuatedPeople: number;
  damageEstimate: number; // in millions SAR
  lastUpdated: string; // ISO date string
  forecast: {
    rainfall: number; // mm
    expectedWaterLevel: number; // cm
    confidence: number; // 0-100
  };
}

export interface Area {
  id: string;
  name: string;
  floodRisk: 'none' | 'low' | 'medium' | 'high';
  waterLevel: number; // cm above normal
  affectedPopulation: number;
}

export interface City {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  population: number;
  area: number; // square km
  areas: Area[]; // districts/neighborhoods within the city
  floodData: FloodData;
}

export interface DashboardData {
  cities: City[];
  lastSyncTime: string;
  totalAffectedCities: number;
  criticalAlerts: number;
}
