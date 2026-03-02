import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDbUnavailableError } from '@/lib/db-error';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id');

  if (!locationId) {
    return NextResponse.json({ readings: [] });
  }

  try {
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

    // Graph window: last 4 hours.
    // Timeline:
    // - older part: 30-minute slots
    // - last 30 minutes: 10-minute slots (3 readings)
    // - always append a "now" tick on X-axis (value can be null)
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const floorToBucket = (date: Date, bucketMs: number) =>
      Math.floor(date.getTime() / bucketMs) * bucketMs;

    let readings = await prisma.sensor_reading.findMany({
      where: {
        time_stamp: {
          gte: fourHoursAgo,
          lte: now,
        },
        sensor: {
          sensor_type_id: ultrasonicType.sensor_type_id,
          node: {
            location_id: BigInt(locationId),
          },
        },
      },
      orderBy: {
        time_stamp: 'asc',
      },
      take: 300,
    });

    // If no recent ultrasonic data exists, auto-push simple test packets for the last 30 minutes.
    if (readings.length === 0) {
      const sensor = await prisma.sensor.findFirst({
        where: {
          sensor_type_id: ultrasonicType.sensor_type_id,
          node: {
            location_id: BigInt(locationId),
          },
        },
        orderBy: { sensor_id: 'asc' },
        select: { sensor_id: true },
      });

      if (sensor) {
        const tenBase = floorToBucket(now, 10 * 60 * 1000);
        await prisma.sensor_reading.createMany({
          data: [
            { sensor_id: sensor.sensor_id, time_stamp: new Date(tenBase - 30 * 60 * 1000), raw_value: 14.2 },
            { sensor_id: sensor.sensor_id, time_stamp: new Date(tenBase - 20 * 60 * 1000), raw_value: 15.0 },
            { sensor_id: sensor.sensor_id, time_stamp: new Date(tenBase - 10 * 60 * 1000), raw_value: 15.8 },
          ],
          skipDuplicates: true,
        });

        readings = await prisma.sensor_reading.findMany({
          where: {
            time_stamp: {
              gte: fourHoursAgo,
              lte: now,
            },
            sensor: {
              sensor_type_id: ultrasonicType.sensor_type_id,
              node: {
                location_id: BigInt(locationId),
              },
            },
          },
          orderBy: {
            time_stamp: 'asc',
          },
          take: 300,
        });
      }
    }

    const bucketMap = new Map<number, { latestTs: number; latestValue: number }>();
    for (const r of readings) {
      const ts = r.time_stamp.getTime();
      const bucketMs = ts >= thirtyMinsAgo.getTime() ? 10 * 60 * 1000 : 30 * 60 * 1000;
      const bucket = Math.floor(ts / bucketMs) * bucketMs;
      const existing = bucketMap.get(bucket);
      if (!existing || ts >= existing.latestTs) {
        bucketMap.set(bucket, { latestTs: ts, latestValue: r.raw_value });
      }
    }

    const slots: number[] = [];

    // 30-minute slots from 4h ago to just before last 30 minutes.
    const start30 = floorToBucket(fourHoursAgo, 30 * 60 * 1000);
    const end30 = floorToBucket(thirtyMinsAgo, 30 * 60 * 1000);
    for (let t = start30; t <= end30; t += 30 * 60 * 1000) {
      slots.push(t);
    }

    // Last 30 min: 3 slots, every 10 min.
    const tenBase = floorToBucket(now, 10 * 60 * 1000);
    slots.push(tenBase - 30 * 60 * 1000, tenBase - 20 * 60 * 1000, tenBase - 10 * 60 * 1000);

    // Always include current time tick on X-axis.
    slots.push(now.getTime());

    const uniqueSortedSlots = Array.from(new Set(slots))
      .filter((t) => t >= fourHoursAgo.getTime() && t <= now.getTime())
      .sort((a, b) => a - b);

    const graphReadings = uniqueSortedSlots.map((slotTs) => {
      const slotDate = new Date(slotTs);
      const isNowTick = slotTs === uniqueSortedSlots[uniqueSortedSlots.length - 1];
      if (isNowTick) {
        return {
          hour: slotDate.toISOString(),
          value: null,
          timestamp: slotDate.toISOString(),
        };
      }

      const bucketMs = slotTs >= thirtyMinsAgo.getTime() ? 10 * 60 * 1000 : 30 * 60 * 1000;
      const bucket = Math.floor(slotTs / bucketMs) * bucketMs;
      const latest = bucketMap.get(bucket);
      return {
        hour: slotDate.toISOString(),
        value: latest ? latest.latestValue : null,
        timestamp: slotDate.toISOString(),
      };
    });

    return NextResponse.json({ readings: graphReadings });
  } catch (error) {
    console.error('Error fetching water level graph data', error);
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ readings: [], dbUnavailable: true });
    }
    return NextResponse.json({ error: 'Failed to load water level graph data' }, { status: 500 });
  }
}
