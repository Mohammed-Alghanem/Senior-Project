const path = require('path');
const { config } = require('dotenv');
const { PrismaClient } = require('@prisma/client');

config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

const SCORE_BY_RISK = {
  low: 0.25,
  medium: 0.6,
  high: 0.9,
};

const FIXED_HAZARD_TS = '2026-04-19T12:33:16.605Z';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    locationId: '4',
    risk: 'high',
    minutesAhead: '60',
    channel: 'dashboard',
  };

  for (const arg of args) {
    if (arg.startsWith('--location=')) out.locationId = arg.replace('--location=', '');
    if (arg.startsWith('--risk=')) out.risk = arg.replace('--risk=', '').toLowerCase();
    if (arg.startsWith('--minutes=')) out.minutesAhead = arg.replace('--minutes=', '');
    if (arg.startsWith('--channel=')) out.channel = arg.replace('--channel=', '');
  }

  return out;
}

async function main() {
  const { locationId, risk, minutesAhead, channel } = parseArgs();

  if (!['low', 'medium', 'high'].includes(risk)) {
    throw new Error("Invalid --risk. Use one of: low, medium, high");
  }

  const minutes = Number(minutesAhead);
  if (!Number.isFinite(minutes) || minutes < 0) {
    throw new Error('Invalid --minutes. Use a non-negative number.');
  }

  const locationIdBigInt = BigInt(locationId);
  const now = new Date();
  const hazardTs = new Date(FIXED_HAZARD_TS);

  if (Number.isNaN(hazardTs.getTime())) {
    throw new Error(`Invalid fixed hazard timestamp: ${FIXED_HAZARD_TS}`);
  }

  const location = await prisma.location.findUnique({
    where: { location_id: locationIdBigInt },
    select: { location_id: true, name: true, city: true },
  });

  if (!location) {
    throw new Error(`Location ${locationId} not found`);
  }

  let model = await prisma.ml_model.findFirst({
    orderBy: [{ created_at: 'desc' }, { ml_model_id: 'desc' }],
  });

  if (!model) {
    model = await prisma.ml_model.create({
      data: {
        model_name: 'FloodModel-manual-script',
        version_tag: 'manual-script-1.0.0',
        status: 'active',
        trained_on_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        trained_on_end: new Date(),
      },
    });
  }

  const prediction = await prisma.prediction.create({
    data: {
      ml_model_id: model.ml_model_id,
      location_id: location.location_id,
      time_stamp: now,
      risk_score: SCORE_BY_RISK[risk],
      risk_level: risk,
      predicted_hazard_ts: hazardTs,
    },
  });

  await prisma.alert.create({
    data: {
      prediction_id: prediction.prediction_id,
      channel,
    },
  });

  console.log('Inserted warning successfully.');
  console.log(`location_id: ${String(location.location_id)} (${location.city || location.name || 'unknown'})`);
  console.log(`risk: ${risk}`);
  console.log(`time_stamp: ${now.toISOString()}`);
  console.log(`predicted_hazard_ts: ${hazardTs.toISOString()}`);
  console.log(`channel: ${channel}`);
}

main()
  .catch((error) => {
    console.error('appendWarning failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
