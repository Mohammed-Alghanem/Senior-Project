import { NextResponse } from 'next/server';
import { prisma, releasePrismaConnection } from '@/lib/prisma';
import { isDbUnavailableError } from '@/lib/db-error';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id');

  try {
    // Only return predictions for this location (Al Qatif), never other cities
    if (!locationId) {
      return NextResponse.json({ prediction: null });
    }

    const now = new Date();
    const prediction = await prisma.prediction.findFirst({
      where: {
        location_id: BigInt(locationId),
        predicted_hazard_ts: {
          gte: now,
        },
      },
      orderBy: {
        predicted_hazard_ts: 'asc',
      },
    });

    if (!prediction || !prediction.predicted_hazard_ts) {
      return NextResponse.json({ prediction: null });
    }

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
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ prediction: null, dbUnavailable: true });
    }
    return NextResponse.json({ error: 'Failed to load predictions' }, { status: 500 });
  } finally {
    await releasePrismaConnection();
  }
}

/**
 * POST /api/predictions
 * Quick testing endpoint to insert one prediction and start countdown.
 * Body:
 * {
 *   "location_id": "1",
 *   "seconds_until_hazard": 120,
 *   "risk_score": 0.8,
 *   "risk_level": "high"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const locationIdRaw = body?.location_id;
    const secondsRaw = body?.seconds_until_hazard;
    const riskScoreRaw = body?.risk_score;
    const riskLevelRaw = body?.risk_level;

    if (locationIdRaw === undefined || locationIdRaw === null || locationIdRaw === '') {
      return NextResponse.json({ error: 'location_id is required' }, { status: 400 });
    }

    const locationId = BigInt(locationIdRaw);
    const secondsUntilHazard = Number.isFinite(Number(secondsRaw)) ? Math.max(0, Number(secondsRaw)) : 120;
    const riskScore = Number.isFinite(Number(riskScoreRaw)) ? Math.max(0, Math.min(1, Number(riskScoreRaw))) : 0.8;
    const riskLevel = typeof riskLevelRaw === 'string' && riskLevelRaw.trim() ? riskLevelRaw.trim() : 'high';

    const location = await prisma.location.findUnique({
      where: { location_id: locationId },
      select: { location_id: true },
    });
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    let model = await prisma.ml_model.findFirst({
      orderBy: [{ created_at: 'desc' }, { ml_model_id: 'desc' }],
    });

    if (!model) {
      model = await prisma.ml_model.create({
        data: {
          model_name: 'FloodModel-live',
          version_tag: '1.0.0',
          status: 'active',
          trained_on_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          trained_on_end: new Date(),
        },
      });
    }

    const now = new Date();
    const hazardTs = new Date(now.getTime() + secondsUntilHazard * 1000);
    // DB writes are intentionally disabled for pull-only mode.
    // const prediction = await prisma.prediction.create({
    //   data: {
    //     ml_model_id: model.ml_model_id,
    //     location_id: location.location_id,
    //     time_stamp: now,
    //     risk_score: riskScore,
    //     risk_level: riskLevel,
    //     predicted_hazard_ts: hazardTs,
    //   },
    // });
    //
    // await prisma.alert.create({
    //   data: {
    //     prediction_id: prediction.prediction_id,
    //     channel: 'dashboard',
    //   },
    // });

    return NextResponse.json(
      {
        inserted: false,
        disabled: true,
        message: 'Prediction writes are disabled (pull-only mode).',
        prediction_preview: {
          location_id: String(location.location_id),
          predicted_hazard_ts: hazardTs.toISOString(),
          seconds_until_hazard: secondsUntilHazard,
          risk_score: riskScore,
          risk_level: riskLevel,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating prediction', error);
    if (isDbUnavailableError(error)) {
      return NextResponse.json({ inserted: false, dbUnavailable: true }, { status: 200 });
    }
    return NextResponse.json({ error: 'Failed to create prediction' }, { status: 500 });
  } finally {
    await releasePrismaConnection();
  }
}
