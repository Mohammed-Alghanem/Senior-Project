import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDbUnavailableError } from '@/lib/db-error';

const DEFAULT_LOCATION_ID = 4;
export const dynamic = 'force-dynamic';

function withCors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}

type SensorItem = {
  sensor_id: string;
  node_id: string | null;
  serial_no: string | null;
  status: string | null;
  type_name: string | null;
  unit: string | null;
  latest_value: number | null;
  latest_timestamp: string | null;
};

function pickByType(items: SensorItem[], names: string[]) {
  for (const name of names) {
    const match = items.find((item) => (item.type_name || '').toLowerCase() === name.toLowerCase());
    if (match) {
      return {
        value: match.latest_value,
        unit: match.unit,
        timestamp: match.latest_timestamp,
      };
    }
  }
  return { value: null, unit: null, timestamp: null };
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/**
 * Public sensor feed endpoint for external consumers.
 * GET /api/public/sensors?location_id=4
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationIdRaw = searchParams.get('location_id') ?? String(DEFAULT_LOCATION_ID);

  if (!/^\d+$/.test(locationIdRaw)) {
    return withCors(NextResponse.json({ error: 'location_id must be numeric' }, { status: 400 }));
  }

  try {
    const locationId = BigInt(locationIdRaw);

    const location = await prisma.location.findUnique({
      where: { location_id: locationId },
      select: {
        location_id: true,
        name: true,
        city: true,
        country: true,
        coordinates: true,
      },
    });

    if (!location) {
      return withCors(NextResponse.json({ error: 'Location not found' }, { status: 404 }));
    }

    const sensors = await prisma.sensor.findMany({
      where: {
        node: { location_id: locationId },
      },
      select: {
        sensor_id: true,
        node_id: true,
        serial_no: true,
        status: true,
        sensor_type: { select: { type_name: true, unit: true } },
        readings: {
          orderBy: { time_stamp: 'desc' },
          take: 1,
          select: { raw_value: true, time_stamp: true },
        },
      },
      orderBy: { sensor_id: 'asc' },
    });

    const items: SensorItem[] = sensors.map((sensor) => ({
      sensor_id: String(sensor.sensor_id),
      node_id: sensor.node_id !== null ? String(sensor.node_id) : null,
      serial_no: sensor.serial_no,
      status: sensor.status,
      type_name: sensor.sensor_type?.type_name ?? null,
      unit: sensor.sensor_type?.unit ?? null,
      latest_value: sensor.readings[0]?.raw_value ?? null,
      latest_timestamp: sensor.readings[0]?.time_stamp?.toISOString() ?? null,
    }));

    const response = NextResponse.json({
      location: {
        location_id: String(location.location_id),
        name: location.name,
        city: location.city,
        country: location.country,
        coordinates: location.coordinates,
      },
      summary: {
        temperature: pickByType(items, ['Temperature']),
        water_level: pickByType(items, ['Water Level', 'Ultrasonic']),
        sewage_water_level: pickByType(items, ['Sewage Water Level']),
        rain_intensity: pickByType(items, ['Rain Intensity']),
      },
      sensors: items,
      count: items.length,
      generated_at: new Date().toISOString(),
    });

    return withCors(response);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return withCors(
        NextResponse.json(
          {
            location: null,
            summary: null,
            sensors: [],
            count: 0,
            dbUnavailable: true,
            generated_at: new Date().toISOString(),
          },
          { status: 200 }
        )
      );
    }
    console.error('Error fetching public sensor feed', error);
    return withCors(NextResponse.json({ error: 'Failed to load sensor feed' }, { status: 500 }));
  }
}

