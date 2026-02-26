import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sensorTypeName = searchParams.get('type'); // e.g., "Temperature", "Ultrasonic", "Power Outage", "Rain Intensity"
  const locationId = searchParams.get('location_id');

  try {
    // Find sensor type by name
    const sensorType = await prisma.sensor_type.findFirst({
      where: {
        type_name: {
          contains: sensorTypeName || '',
          mode: 'insensitive',
        },
      },
    });

    if (!sensorType) {
      return NextResponse.json({ value: null, unit: null, error: 'Sensor type not found' });
    }

    // Find sensors of this type
    const sensors = await prisma.sensor.findMany({
      where: {
        sensor_type_id: sensorType.sensor_type_id,
        ...(locationId && {
          node: {
            location_id: BigInt(locationId),
          },
        }),
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
    return NextResponse.json({ error: 'Failed to load sensor data' }, { status: 500 });
  }
}
