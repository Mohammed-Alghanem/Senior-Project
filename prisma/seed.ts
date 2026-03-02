import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AL_QATIF = {
  name: 'Al Qatif Central',
  city: 'Al Qatif',
  coordinates: '26.5200,50.0089',
  risk_class: 'low',
  country: 'Saudi Arabia',
};

async function main() {
  const skipClean = process.env.SKIP_CLEAN === '1' || process.env.SKIP_CLEAN === 'true';
  console.log('Seeding database (Al Qatif only)...', skipClean ? '(insert only)' : '');

  if (!skipClean) {
    console.log('Cleaning existing data...');
    await prisma.alert.deleteMany();
    await prisma.sensor_reading.deleteMany();
    await prisma.weather_forecast.deleteMany();
    await prisma.prediction.deleteMany();
    await prisma.flood_event.deleteMany();
    await prisma.sensor.deleteMany();
    await prisma.sensor_node.deleteMany();
    await prisma.location.deleteMany();
    await prisma.sensor_type.deleteMany();
    await prisma.ml_model.deleteMany();
    await prisma.weather_source.deleteMany();
    console.log('Cleaned.');
  }

  const now = new Date();
  const hourAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  const existing = await prisma.location.findFirst({
    where: { city: { contains: 'Qatif', mode: 'insensitive' } },
  });
  if (existing) {
    console.log('Al Qatif already exists. Run without SKIP_CLEAN to replace.');
    return;
  }

  const location = await prisma.location.create({
    data: {
      name: AL_QATIF.name,
      city: AL_QATIF.city,
      country: AL_QATIF.country,
      coordinates: AL_QATIF.coordinates,
      elevation: 15,
      risk_class: AL_QATIF.risk_class,
      notes: 'FloodSense monitoring location - Al Qatif',
    },
  });
  console.log('Created location: Al Qatif.');

  const sensorTypes = await Promise.all([
    prisma.sensor_type.create({ data: { type_name: 'Temperature', unit: '°C', normal_min: 15, normal_max: 45 } }),
    prisma.sensor_type.create({ data: { type_name: 'Ultrasonic', unit: 'cm', normal_min: 0, normal_max: 100 } }),
    prisma.sensor_type.create({ data: { type_name: 'Power Outage', unit: 'bool', normal_min: 0, normal_max: 1 } }),
    prisma.sensor_type.create({ data: { type_name: 'Rain Intensity', unit: '%', normal_min: 0, normal_max: 100 } }),
    prisma.sensor_type.create({ data: { type_name: 'Humidity', unit: '%', normal_min: 0, normal_max: 100 } }),
  ]);
  console.log(`Created ${sensorTypes.length} sensor types.`);

  const node = await prisma.sensor_node.create({
    data: {
      location_id: location.location_id,
      status: 'online',
      last_seen_ts: now,
    },
  });
  console.log('Created 1 sensor node at Al Qatif.');

  const typeNames = ['Temperature', 'Ultrasonic', 'Power Outage', 'Rain Intensity', 'Humidity'];
  const sensors: { sensor_id: bigint; type_idx: number; type_name: string }[] = [];
  for (let i = 0; i < sensorTypes.length; i++) {
    const s = await prisma.sensor.create({
      data: {
        node_id: node.node_id,
        sensor_type_id: sensorTypes[i].sensor_type_id,
        serial_no: `AQ-${String(i + 1).padStart(2, '0')}-${sensorTypes[i].type_name.replace(/\s/g, '')}`,
        status: 'active',
      },
    });
    sensors.push({ ...s, type_idx: i, type_name: typeNames[i] });
  }
  console.log(`Created ${sensors.length} sensors.`);

  for (const s of sensors) {
    const typeIdx = s.type_idx;
    const baseValue =
      typeIdx === 0 ? 28 + Math.random() * 5
      : typeIdx === 1 ? 15 + Math.random() * 25
      : typeIdx === 2 ? 1
      : typeIdx === 3 ? 10 + Math.random() * 40
      : 35 + Math.random() * 25;

    await prisma.sensor_reading.create({
      data: { sensor_id: s.sensor_id, time_stamp: hourAgo(0), raw_value: baseValue },
    });

    if (typeIdx === 0) {
      for (let h = 1; h <= 5; h++) {
        await prisma.sensor_reading.create({
          data: { sensor_id: s.sensor_id, time_stamp: hourAgo(h), raw_value: baseValue - h * 0.5 + Math.random() * 2 },
        });
      }
    }
    if (typeIdx === 1) {
      for (let h = 1; h <= 11; h++) {
        await prisma.sensor_reading.create({
          data: { sensor_id: s.sensor_id, time_stamp: hourAgo(h), raw_value: 10 + Math.random() * 20 + h * 1.5 },
        });
      }
    }
    if (typeIdx === 2) {
      for (let h = 1; h <= 4; h++) {
        await prisma.sensor_reading.create({
          data: { sensor_id: s.sensor_id, time_stamp: hourAgo(h), raw_value: 1 },
        });
      }
    }
    if (typeIdx === 3) {
      for (let h = 1; h <= 5; h++) {
        await prisma.sensor_reading.create({
          data: { sensor_id: s.sensor_id, time_stamp: hourAgo(h), raw_value: 15 + Math.random() * 35 + h * 2 },
        });
      }
    }
  }

  // Graph test series: ultrasonic packets for last 5 hours (every 30 minutes).
  const ultrasonicSensor = sensors.find((s) => s.type_name === 'Ultrasonic');
  if (ultrasonicSensor) {
    const graphPackets = [];
    for (let i = 0; i <= 10; i++) {
      const sampleTs = new Date(now.getTime() - 5 * 60 * 60 * 1000 + i * 30 * 60 * 1000);
      const sampleValue = 20 + 8 * Math.sin(i / 3.5) + i * 0.35;
      graphPackets.push({
        sensor_id: ultrasonicSensor.sensor_id,
        time_stamp: sampleTs,
        raw_value: sampleValue,
      });
    }
    await prisma.sensor_reading.createMany({
      data: graphPackets,
      skipDuplicates: true,
    });
    console.log('Created graph seed packets for Ultrasonic sensor (-5h to now, every 30m).');
  }

  console.log('Created sensor readings (Real Feel, Water Level, Power Outage, Rain Intensity).');

  const [model] = await Promise.all([
    prisma.ml_model.create({
      data: {
        model_name: 'FloodModel-v1',
        version_tag: '1.1.0',
        status: 'active',
        trained_on_start: hourAgo(720),
        trained_on_end: hourAgo(24),
      },
    }),
  ]);

  const hazardIn2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  await prisma.prediction.create({
    data: {
      ml_model_id: model.ml_model_id,
      location_id: location.location_id,
      time_stamp: now,
      risk_score: 0.35,
      risk_level: 'low',
      predicted_hazard_ts: hazardIn2Hours,
    },
  });
  const pred2 = await prisma.prediction.create({
    data: {
      ml_model_id: model.ml_model_id,
      location_id: location.location_id,
      time_stamp: now,
      risk_score: 0.2,
      risk_level: 'low',
      predicted_hazard_ts: null,
    },
  });
  await prisma.alert.create({
    data: { prediction_id: pred2.prediction_id, channel: 'dashboard' },
  });
  console.log('Created predictions and alerts.');

  await prisma.flood_event.create({
    data: {
      location_id: location.location_id,
      start_ts: hourAgo(24),
      end_ts: hourAgo(18),
      risk_level: 'low',
      confirmed_by: 'system',
      notes: 'Seed flood event - Al Qatif',
    },
  });
  console.log('Created flood event.');

  const source = await prisma.weather_source.create({
    data: { provider_name: 'Open-Meteo', api: 'https://api.open-meteo.com', notes: 'Seed' },
  });
  await prisma.weather_forecast.create({
    data: {
      location_id: location.location_id,
      source_id: source.source_id,
      value_type: 'temperature',
      value: 26,
      issued_at: now,
      valid_from: now,
      valid_to: hourAgo(-24),
    },
  });
  console.log('Created weather source and forecast.');
  console.log('Seed completed. All data is for Al Qatif.');
}

main()
  .catch((e) => {
    if (e.message?.includes("Can't reach database server")) {
      console.error('\n❌ Cannot reach the database. Check Supabase is not paused and DATABASE_URL in .env.\n');
    }
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
