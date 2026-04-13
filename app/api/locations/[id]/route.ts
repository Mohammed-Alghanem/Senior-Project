import { NextResponse } from 'next/server';
import { prisma, releasePrismaConnection } from '@/lib/prisma';
import { isDbUnavailableError } from '@/lib/db-error';

/**
 * GET /api/locations/[id]
 * Returns a location with its list of sensors (keyed by sensor_id).
 * Each sensor includes its readings (Water Level, Rain Intensity, Power Outage, Real Feel / Temperature).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing location id' }, { status: 400 });
  }

  try {
    const locationId = BigInt(id);
    // Graph windows are rounded to clock boundaries on the client, so fetch an extra hour
    // to avoid dropping the earliest visible bucket near window edges.
    const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000);
    const location = await prisma.location.findUnique({
      where: { location_id: locationId },
      include: {
        sensor_nodes: {
          orderBy: { node_id: 'asc' },
          include: {
            sensors: {
              orderBy: { sensor_id: 'asc' },
              include: {
                sensor_type: true,
                readings: {
                  where: {
                    time_stamp: {
                      gte: sevenHoursAgo,
                    },
                  },
                  orderBy: { time_stamp: 'desc' },
                  // Keep a deeper history window so early buckets don't vanish
                  // on high-frequency sensors between polling cycles.
                  take: 10000,
                },
              },
            },
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Build sensors list: each sensor has sensor_id as key, type, serial_no, and its readings
    const sensors = location.sensor_nodes.flatMap((node) =>
      node.sensors.map((s) => ({
        sensor_id: String(s.sensor_id),
        node_id: String(s.node_id),
        serial_no: s.serial_no,
        status: s.status,
        type_name: s.sensor_type?.type_name ?? null,
        unit: s.sensor_type?.unit ?? null,
        readings: s.readings.map((r) => ({
          reading_id: String(r.reading_id),
          sensor_id: String(r.sensor_id),
          time_stamp: r.time_stamp.toISOString(),
          raw_value: r.raw_value,
        })),
      }))
    );

    return NextResponse.json({
      location: {
        location_id: String(location.location_id),
        name: location.name,
        city: location.city,
        country: location.country,
        coordinates: location.coordinates,
        risk_class: location.risk_class,
      },
      sensors,
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      console.warn('Database unavailable while fetching location with sensors.');
      return NextResponse.json({ location: null, sensors: [], dbUnavailable: true });
    }
    console.error('Error fetching location with sensors', error);
    return NextResponse.json(
      { error: 'Failed to load location and sensors' },
      { status: 500 }
    );
  } finally {
    await releasePrismaConnection();
  }
}
