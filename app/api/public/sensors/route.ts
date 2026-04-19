import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isDbUnavailableError } from '@/lib/db-error';

const DEFAULT_LOCATION_ID = 4;
const FEED_CACHE_TTL_MS = 5000;
const feedCache = new Map<string, { expiresAt: number; payload: unknown }>();
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

type LatestReadingRow = {
  sensor_id: bigint;
  node_id: bigint | null;
  serial_no: string | null;
  status: string | null;
  type_name: string | null;
  unit: string | null;
  raw_value: number | null;
  time_stamp: Date | null;
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

    const cached = feedCache.get(locationIdRaw);
    if (cached && cached.expiresAt > Date.now()) {
      return withCors(NextResponse.json(cached.payload));
    }

    const [location, rows] = await Promise.all([
      prisma.location.findUnique({
        where: { location_id: locationId },
        select: {
          location_id: true,
          name: true,
          city: true,
          country: true,
          coordinates: true,
        },
      }),
      prisma.$queryRaw<LatestReadingRow[]>(Prisma.sql`
        SELECT
          s.sensor_id,
          s.node_id,
          s.serial_no,
          s.status,
          st.type_name,
          st.unit,
          lr.raw_value,
          lr.time_stamp
        FROM public.sensor s
        JOIN public.sensor_node sn ON sn.node_id = s.node_id
        LEFT JOIN public.sensor_type st ON st.sensor_type_id = s.sensor_type_id
        LEFT JOIN LATERAL (
          SELECT sr.raw_value, sr.time_stamp
          FROM public.sensor_readings_table sr
          WHERE sr.sensor_id = s.sensor_id
          ORDER BY sr.time_stamp DESC
          LIMIT 1
        ) lr ON TRUE
        WHERE sn.location_id = ${locationId}
        ORDER BY s.sensor_id ASC
      `),
    ]);

    if (!location) {
      return withCors(NextResponse.json({ error: 'Location not found' }, { status: 404 }));
    }

    const items: SensorItem[] = rows.map((row) => ({
      sensor_id: String(row.sensor_id),
      node_id: row.node_id !== null ? String(row.node_id) : null,
      serial_no: row.serial_no,
      status: row.status,
      type_name: row.type_name,
      unit: row.unit,
      latest_value: row.raw_value,
      latest_timestamp: row.time_stamp?.toISOString() ?? null,
    }));

    const payload = {
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
    };

    feedCache.set(locationIdRaw, {
      expiresAt: Date.now() + FEED_CACHE_TTL_MS,
      payload,
    });

    const response = NextResponse.json(payload);

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

