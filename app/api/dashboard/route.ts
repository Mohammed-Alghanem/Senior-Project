import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { DashboardData, City, Area, FloodData } from '@/app/types';

const mapRiskClassToFloodRisk = (risk: string | null): FloodData['floodRisk'] => {
  const normalized = (risk ?? '').toLowerCase();
  if (normalized === 'high') return 'high';
  if (normalized === 'medium' || normalized === 'mid') return 'medium';
  if (normalized === 'low') return 'low';
  if (normalized === 'none') return 'none';
  return 'low';
};

const computeWaterLevelStatus = (value: number): FloodData['waterLevelStatus'] => {
  if (value <= 5) return 'veryLow';
  if (value <= 15) return 'low';
  if (value <= 30) return 'normal';
  if (value <= 60) return 'high';
  return 'critical';
};

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: {
        sensor_nodes: {
          include: {
            sensors: {
              include: {
                readings: {
                  orderBy: { time_stamp: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        predictions: {
          orderBy: { time_stamp: 'desc' },
          take: 1,
        },
      },
      take: 200,
    });

    const citiesById = new Map<string, City>();

    for (const loc of locations) {
      const cityKey = (loc.city ?? loc.name ?? `loc-${loc.location_id}`).toLowerCase().replace(/\s+/g, '-');
      const cityName = loc.city ?? loc.name ?? `Location ${loc.location_id}`;
      const region = loc.city ?? 'Unknown';

      let city = citiesById.get(cityKey);

      const latestReading = loc.sensor_nodes
        .flatMap((node) => node.sensors)
        .flatMap((sensor) => sensor.readings)
        .sort((a, b) => (b.time_stamp?.getTime() ?? 0) - (a.time_stamp?.getTime() ?? 0))[0];

      const baseWaterLevel = latestReading ? Number(latestReading.raw_value) || 0 : 0;
      const floodRisk = mapRiskClassToFloodRisk(loc.risk_class);

      if (!city) {
        const floodData: FloodData = {
          floodRisk,
          waterLevel: baseWaterLevel,
          waterLevelStatus: computeWaterLevelStatus(baseWaterLevel),
          affectedAreas: 0,
          evacuatedPeople: 0,
          damageEstimate: 0,
          lastUpdated: new Date().toISOString(),
          forecast: {
            rainfall: 0,
            expectedWaterLevel: baseWaterLevel,
            confidence: 70,
          },
        };

        city = {
          id: cityKey,
          name: cityName,
          region,
          latitude: 0,
          longitude: 0,
          population: 0,
          area: 0,
          areas: [],
          floodData,
        };

        citiesById.set(cityKey, city);
      }

      const coordinates = (loc.coordinates ?? '').split(',').map((v) => parseFloat(v.trim()));
      const lat = Number.isFinite(coordinates[0]) ? coordinates[0] : 0;
      const lng = Number.isFinite(coordinates[1]) ? coordinates[1] : 0;

      const area: Area = {
        id: String(loc.location_id),
        name: loc.name ?? `Area ${loc.location_id}`,
        floodRisk,
        waterLevel: baseWaterLevel,
        affectedPopulation: 0,
      };

      city.areas.push(area);
      city.floodData.affectedAreas = city.areas.filter((a) => a.floodRisk !== 'none').length;
      city.floodData.waterLevel = Math.max(city.floodData.waterLevel, baseWaterLevel);
      city.floodData.waterLevelStatus = computeWaterLevelStatus(city.floodData.waterLevel);

      if (lat !== 0 || lng !== 0) {
        city.latitude = lat;
        city.longitude = lng;
      }
    }

    const cities = Array.from(citiesById.values());

    const dashboard: DashboardData = {
      cities,
      lastSyncTime: new Date().toISOString(),
      totalAffectedCities: cities.filter((c) => c.floodData.affectedAreas > 0).length,
      criticalAlerts: cities.filter((c) => c.floodData.floodRisk === 'high').length,
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error building dashboard data', error);
    return NextResponse.json({ error: 'Failed to load dashboard from database' }, { status: 500 });
  }
}

