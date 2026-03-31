import { NextResponse } from 'next/server';
import { prisma, releasePrismaConnection } from '@/lib/prisma';
import { isDbUnavailableError } from '@/lib/db-error';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id');

  if (!locationId) {
    return NextResponse.json({ readings: [] });
  }

  try {
    const waterLevelTypes = await prisma.sensor_type.findMany({
      where: {
        type_name: {
          in: ['Water Level', 'Ultrasonic'],
        },
      },
      select: { sensor_type_id: true },
    });

    if (waterLevelTypes.length === 0) {
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

    const sensorsForLocation = await prisma.sensor.findMany({
      where: {
        sensor_type_id: { in: waterLevelTypes.map((t) => t.sensor_type_id) },
        node: { location_id: BigInt(locationId) },
      },
      select: { sensor_id: true },
      orderBy: { sensor_id: 'asc' },
    });

    if (sensorsForLocation.length === 0) {
      return NextResponse.json({ readings: [] });
    }

    const readings = await prisma.sensor_reading.findMany({
      where: {
        time_stamp: {
          gte: fourHoursAgo,
          lte: now,
        },
        sensor_id: { in: sensorsForLocation.map((s) => s.sensor_id) },
      },
      orderBy: {
        time_stamp: 'asc',
      },
      take: 300,
    });

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
  } finally {
    await releasePrismaConnection();
  }
}
