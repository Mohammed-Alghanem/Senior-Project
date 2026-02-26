import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id');

  try {
    // Find Ultrasonic sensor type
    const ultrasonicType = await prisma.sensor_type.findFirst({
      where: {
        type_name: {
          contains: 'Ultrasonic',
          mode: 'insensitive',
        },
      },
    });

    if (!ultrasonicType) {
      return NextResponse.json({ readings: [] });
    }

    // Find all ultrasonic sensors
    const sensors = await prisma.sensor.findMany({
      where: {
        sensor_type_id: ultrasonicType.sensor_type_id,
        ...(locationId && {
          node: {
            location_id: BigInt(locationId),
          },
        }),
      },
      include: {
        readings: {
          orderBy: { time_stamp: 'desc' },
          take: 1000, // Get enough readings to filter
        },
      },
    });

    // Get all readings for the last 12 hours up to now (so the graph shows current water level)
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const allReadings = sensors
      .flatMap((s) =>
        s.readings.map((r) => ({
          time_stamp: r.time_stamp,
          value: r.raw_value,
        }))
      )
      .filter((r) => r.time_stamp >= twelveHoursAgo && r.time_stamp <= now)
      .sort((a, b) => a.time_stamp.getTime() - b.time_stamp.getTime());

    // Group by hour and get average value per hour
    const hourlyReadings: Array<{ hour: string; value: number; timestamp: string }> = [];
    const hourMap = new Map<string, number[]>();

    allReadings.forEach((reading) => {
      const hour = new Date(reading.time_stamp);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();
      if (!hourMap.has(hourKey)) {
        hourMap.set(hourKey, []);
      }
      hourMap.get(hourKey)!.push(reading.value);
    });

    hourMap.forEach((values, hourKey) => {
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
      hourlyReadings.push({
        hour: hourKey,
        value: avgValue,
        timestamp: hourKey,
      });
    });

    hourlyReadings.sort((a, b) => a.hour.localeCompare(b.hour));

    return NextResponse.json({ readings: hourlyReadings });
  } catch (error) {
    console.error('Error fetching water level graph data', error);
    return NextResponse.json({ error: 'Failed to load water level graph data' }, { status: 500 });
  }
}
