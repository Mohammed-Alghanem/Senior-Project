const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Single location: Al Qatif. All sensors and readings are linked to this location.
const AL_QATIF = {
  name: 'Al Qatif Central',
  city: 'Al Qatif',
  coordinates: '26.5200,50.0089',
  risk_class: 'low',
  country: 'Saudi Arabia',
};

async function main() {
  console.log('Seeding database (Al Qatif only)...');

  // Clean DB first: delete in order of dependencies (children before parents)
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

  const now = new Date();
  const hourAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000);

  // Single location: Al Qatif
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
  console.log('Created 1 location: Al Qatif.');

  const sensorTypes = await Promise.all([
    prisma.sensor_type.create({ data: { type_name: 'Temperature', unit: '°C', normal_min: 15, normal_max: 45 } }),
    prisma.sensor_type.create({ data: { type_name: 'Ultrasonic', unit: 'cm', normal_min: 0, normal_max: 100 } }),
    prisma.sensor_type.create({ data: { type_name: 'Power Outage', unit: 'bool', normal_min: 0, normal_max: 1 } }),
    prisma.sensor_type.create({ data: { type_name: 'Rain Intensity', unit: '%', normal_min: 0, normal_max: 100 } }),
    prisma.sensor_type.create({ data: { type_name: 'Humidity', unit: '%', normal_min: 0, normal_max: 100 } }),
  ]);
  console.log(`Created ${sensorTypes.length} sensor types.`);

  // One sensor node at Al Qatif
  const node = await prisma.sensor_node.create({
    data: {
      location_id: location.location_id,
      status: 'online',
      last_seen_ts: now,
    },
  });
  console.log('Created 1 sensor node at Al Qatif.');

  // All sensors linked to Al Qatif (via the node). Key = sensor_id + serial_no for "which sensor read what and where"
  const typeNames = ['Temperature', 'Ultrasonic', 'Power Outage', 'Rain Intensity', 'Humidity'];
  const sensors = [];
  for (let i = 0; i < sensorTypes.length; i++) {
    const s = await prisma.sensor.create({
      data: {
        node_id: node.node_id,
        sensor_type_id: sensorTypes[i].sensor_type_id,
        serial_no: `AQ-${String(i + 1).padStart(2, '0')}-${sensorTypes[i].type_name.replace(/\s/g, '')}`,
        status: 'active',
      },
    });
    sensors.push({ ...s, type_name: typeNames[i], type_idx: i });
  }
  console.log(`Created ${sensors.length} sensors at Al Qatif (keyed by sensor_id + serial_no).`);

  // Readings for each sensor so dashboard shows: Real Feel (Temperature), Water Level (Ultrasonic), Power Outage, Rain Intensity
  for (const s of sensors) {
    const typeIdx = s.type_idx;
    const baseValue =
      typeIdx === 0 ? 28 + Math.random() * 5
      : typeIdx === 1 ? 15 + Math.random() * 25
      : typeIdx === 2 ? 1
      : typeIdx === 3 ? 10 + Math.random() * 40
      : 35 + Math.random() * 25;
    // Current reading (used for dashboard cards)
    await prisma.sensor_reading.create({
      data: { sensor_id: s.sensor_id, time_stamp: hourAgo(0), raw_value: baseValue },
    });
    // Temperature (Real Feel): add a few recent readings
    if (typeIdx === 0) {
      for (let h = 1; h <= 5; h++) {
        await prisma.sensor_reading.create({
          data: { sensor_id: s.sensor_id, time_stamp: hourAgo(h), raw_value: baseValue - h * 0.5 + Math.random() * 2 },
        });
      }
    }
    // Ultrasonic (Water Level): hourly readings for graph (last 12h including now)
    if (typeIdx === 1) {
      for (let h = 1; h <= 11; h++) {
        await prisma.sensor_reading.create({
          data: {
            sensor_id: s.sensor_id,
            time_stamp: hourAgo(h),
            raw_value: 10 + Math.random() * 20 + h * 1.5,
          },
        });
      }
    }
    // Power Outage: a few readings (1 = good, 0 = outage)
    if (typeIdx === 2) {
      for (let h = 1; h <= 4; h++) {
        await prisma.sensor_reading.create({
          data: { sensor_id: s.sensor_id, time_stamp: hourAgo(h), raw_value: 1 },
        });
      }
    }
    // Rain Intensity: a few readings (%)
    if (typeIdx === 3) {
      for (let h = 1; h <= 5; h++) {
        await prisma.sensor_reading.create({
          data: { sensor_id: s.sensor_id, time_stamp: hourAgo(h), raw_value: 15 + Math.random() * 35 + h * 2 },
        });
      }
    }
  }
  console.log('Created sensor readings (Temperature, Ultrasonic, Power Outage, Rain Intensity, Humidity).');

  const models = await Promise.all(
    [1, 2].map((i) =>
      prisma.ml_model.create({
        data: {
          model_name: `FloodModel-v${i}`,
          version_tag: `1.${i}.0`,
          status: 'active',
          trained_on_start: hourAgo(720),
          trained_on_end: hourAgo(24),
        },
      })
    )
  );

  const hazardIn2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  await prisma.prediction.create({
    data: {
      ml_model_id: models[0].ml_model_id,
      location_id: location.location_id,
      time_stamp: now,
      risk_score: 0.35,
      risk_level: 'low',
      predicted_hazard_ts: hazardIn2Hours,
    },
  });
  const pred2 = await prisma.prediction.create({
    data: {
      ml_model_id: models[1].ml_model_id,
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
  console.log('Created predictions and alerts for Al Qatif.');

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
  console.log('Created flood event for Al Qatif.');

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
  console.log('Created weather source and forecast for Al Qatif.');
  console.log('Seed completed successfully. All data is for Al Qatif.');
}

main()
  .catch((e) => {
    if (e.message && e.message.includes("Can't reach database server")) {
      console.error('\n❌ Cannot reach the database. Check:\n');
      console.error('  1. Supabase project is not paused → Dashboard: https://supabase.com/dashboard → your project → Restore if paused.');
      console.error('  2. DATABASE_URL in .env uses the direct connection (host db....supabase.co, port 5432).');
      console.error('  3. Network/firewall allows outbound connections to port 5432 (try without VPN).\n');
    }
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
