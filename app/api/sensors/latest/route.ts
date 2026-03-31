import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDbUnavailableError } from '@/lib/db-error';

/**
 * GET /api/sensors/latest?location_id=
 * Returns latest reading for Real Feel, Water Level, Power Outage, Rain Intensity
 * in one DB round-trip so the dashboard can poll fast without 4 separate requests.
 * All data is read from the database (sensor + sensor_reading tables only).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id');

  if (!locationId) {
    return NextResponse.json({ error: 'location_id required' }, { status: 400 });
  }

  try {
    const locId = BigInt(locationId);

    const sensorTypes = await prisma.sensor_type.findMany({
      where: {
        type_name: {
          in: [
            'Temperature',
            'Water Level',
            'Ultrasonic',
            'Sewage Water Level',
            'Power Outage',
            'Rain Intensity',
          ],
        },
      },
      select: { sensor_type_id: true, type_name: true, unit: true },
    });

    if (sensorTypes.length === 0) {
      return NextResponse.json({
        temperature: null,
        waterLevel: null,
        powerOutage: null,
        rainIntensity: null,
      });
    }

    const sensors = await prisma.sensor.findMany({
      where: {
        sensor_type_id: { in: sensorTypes.map((t) => t.sensor_type_id) },
        node: { location_id: locId },
      },
      include: {
        sensor_type: { select: { type_name: true, unit: true } },
        readings: {
          orderBy: { time_stamp: 'desc' },
          take: 1,
          select: { raw_value: true, time_stamp: true },
        },
      },
    });

    const points = sensors
      .map((s) => {
        const reading = s.readings[0];
        if (!reading || !s.sensor_type?.type_name) return null;
        return {
          typeName: s.sensor_type.type_name,
          value: reading.raw_value,
          unit: s.sensor_type.unit ?? null,
          timestamp: reading.time_stamp.toISOString(),
          tsMs: reading.time_stamp.getTime(),
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const pickLatest = (typeNames: string[]) => {
      const lower = typeNames.map((n) => n.toLowerCase());
      const matches = points.filter((p) => lower.includes(p.typeName.toLowerCase()));
      if (matches.length === 0) return null;
      const latest = matches.reduce((a, b) => (b.tsMs > a.tsMs ? b : a));
      return {
        value: latest.value,
        unit: latest.unit,
        timestamp: latest.timestamp,
      };
    };

    return NextResponse.json({
      temperature: pickLatest(['Temperature']),
      waterLevel: pickLatest(['Water Level', 'Ultrasonic']),
      sewageWaterLevel: pickLatest(['Sewage Water Level']),
      powerOutage: pickLatest(['Power Outage']),
      rainIntensity: pickLatest(['Rain Intensity']),
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      console.warn('Database unavailable while fetching latest sensors.');
      return NextResponse.json(
        { temperature: null, waterLevel: null, powerOutage: null, rainIntensity: null, dbUnavailable: true },
        { status: 200 }
      );
    }
    console.error('Error fetching sensor latest', error);
    return NextResponse.json({ error: 'Failed to load sensor data' }, { status: 500 });
  }
}
