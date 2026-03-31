import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDbUnavailableError } from '@/lib/db-error';
import { QueryMode } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sensorTypeName = searchParams.get('type'); // e.g. Temperature (Real Feel), Ultrasonic (Water Level), Power Outage, Rain Intensity
  const locationId = searchParams.get('location_id');

  if (!locationId) {
    return NextResponse.json({ value: null, unit: null, error: 'location_id required' });
  }

  try {
    const sensorType = await prisma.sensor_type.findFirst({
      where: {
        type_name: {
          contains: sensorTypeName || '',
          mode: QueryMode.insensitive,
        },
      },
    });

    if (!sensorType) {
      return NextResponse.json({ value: null, unit: null, error: 'Sensor type not found' });
    }

    // Only sensors at this location (Al Qatif when called from dashboard)
    const sensors = await prisma.sensor.findMany({
      where: {
        sensor_type_id: sensorType.sensor_type_id,
        node: {
          location_id: BigInt(locationId),
        },
      },
      include: {
        readings: {
          orderBy: { time_stamp: 'desc' },
          take: 1,
        },
      },
    });

    // Get the latest reading from any sensor of this type
    const latestReading = sensors
      .flatMap((s) => s.readings)
      .sort((a, b) => b.time_stamp.getTime() - a.time_stamp.getTime())[0];

    if (!latestReading) {
      return NextResponse.json({ value: null, unit: sensorType.unit, error: 'No readings found' });
    }

    return NextResponse.json({
      value: latestReading.raw_value,
      unit: sensorType.unit,
      timestamp: latestReading.time_stamp.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching sensor data', error);
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ value: null, unit: null, dbUnavailable: true });
    }
    return NextResponse.json({ error: 'Failed to load sensor data' }, { status: 500 });
  }
}

/**
 * POST /api/sensors
 * Quick testing endpoint to push a sensor packet.
 * Body:
 * {
 *   "location_id": "1",
 *   "type": "Ultrasonic",
 *   "value": 42.5
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const locationIdRaw = body?.location_id;
    const typeRaw = body?.type;
    const valueRaw = body?.value;

    if (locationIdRaw === undefined || locationIdRaw === null || locationIdRaw === '') {
      return NextResponse.json({ error: 'location_id is required' }, { status: 400 });
    }
    if (typeof typeRaw !== 'string' || !typeRaw.trim()) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }
    if (!Number.isFinite(Number(valueRaw))) {
      return NextResponse.json({ error: 'value must be a number' }, { status: 400 });
    }

    const locationId = BigInt(locationIdRaw);
    const typeName = typeRaw.trim();
    const value = Number(valueRaw);

    const sensorType = await prisma.sensor_type.findFirst({
      where: {
        type_name: {
          contains: typeName,
          mode: QueryMode.insensitive,
        },
      },
    });
    if (!sensorType) {
      return NextResponse.json({ error: `Sensor type "${typeName}" not found` }, { status: 404 });
    }

    const sensor = await prisma.sensor.findFirst({
      where: {
        sensor_type_id: sensorType.sensor_type_id,
        node: { location_id: locationId },
      },
      orderBy: { sensor_id: 'asc' },
    });
    if (!sensor) {
      return NextResponse.json({ error: `No ${sensorType.type_name} sensor found for this location` }, { status: 404 });
    }

    const reading = await prisma.sensor_reading.create({
      data: {
        sensor_id: sensor.sensor_id,
        time_stamp: new Date(),
        raw_value: value,
      },
    });

    return NextResponse.json(
      {
        inserted: true,
        reading: {
          reading_id: String(reading.reading_id),
          sensor_id: String(reading.sensor_id),
          type: sensorType.type_name,
          value: reading.raw_value,
          unit: sensorType.unit,
          time_stamp: reading.time_stamp.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating sensor packet', error);
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ inserted: false, dbUnavailable: true }, { status: 200 });
    }
    return NextResponse.json({ error: 'Failed to create sensor packet' }, { status: 500 });
  }
}
