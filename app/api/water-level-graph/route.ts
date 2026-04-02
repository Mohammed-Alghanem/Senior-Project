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

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

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
          gte: oneHourAgo,
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
    const bucketMs = 6 * 60 * 1000;
    const startMs = now.getTime() - 60 * 60 * 1000;
    for (const r of readings) {
      const ts = r.time_stamp.getTime();
      const bucketIndex = Math.floor((ts - startMs) / bucketMs);
      if (bucketIndex < 0 || bucketIndex > 10) continue;
      const bucket = startMs + bucketIndex * bucketMs;
      const existing = bucketMap.get(bucket);
      if (!existing || ts >= existing.latestTs) {
        bucketMap.set(bucket, { latestTs: ts, latestValue: r.raw_value });
      }
    }

    const slots: number[] = [];
    for (let i = 0; i <= 10; i += 1) {
      slots.push(startMs + i * bucketMs);
    }

    const graphReadings = slots.map((slotTs) => {
      const slotDate = new Date(slotTs);
      const latest = bucketMap.get(slotTs);
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
