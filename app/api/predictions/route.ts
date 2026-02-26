import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id');

  try {
    const predictions = await prisma.prediction.findMany({
      where: {
        ...(locationId && { location_id: BigInt(locationId) }),
        predicted_hazard_ts: {
          not: null,
        },
      },
      orderBy: {
        predicted_hazard_ts: 'asc',
      },
      take: 1, // Get the earliest upcoming prediction
    });

    if (predictions.length === 0 || !predictions[0].predicted_hazard_ts) {
      return NextResponse.json({ prediction: null });
    }

    const prediction = predictions[0];
    const now = new Date();
    const hazardTime = new Date(prediction.predicted_hazard_ts);
    const secondsUntilHazard = Math.max(0, Math.floor((hazardTime.getTime() - now.getTime()) / 1000));

    return NextResponse.json({
      prediction: {
        prediction_id: String(prediction.prediction_id),
        predicted_hazard_ts: prediction.predicted_hazard_ts.toISOString(),
        risk_level: prediction.risk_level,
        risk_score: prediction.risk_score,
        seconds_until_hazard: secondsUntilHazard,
      },
    });
  } catch (error) {
    console.error('Error fetching predictions', error);
    return NextResponse.json({ error: 'Failed to load predictions' }, { status: 500 });
  }
}
