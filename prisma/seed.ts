import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KSA_CITIES = [
  { name: 'Qatif Central', city: 'Qatif', coordinates: '26.5200,50.0089', risk_class: 'low' },
  { name: 'Dammam North', city: 'Dammam', coordinates: '26.4200,50.1200', risk_class: 'medium' },
  { name: 'Khobar District', city: 'Khobar', coordinates: '26.2170,50.1971', risk_class: 'low' },
  { name: 'Riyadh Downtown', city: 'Riyadh', coordinates: '24.7136,46.6753', risk_class: 'none' },
  { name: 'Jeddah Corniche', city: 'Jeddah', coordinates: '21.5433,39.1727', risk_class: 'high' },
];

async function main() {
  console.log('Seeding database...');

  const now = new Date();
  const hourAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  // 1) Locations (5)
  const locations = await Promise.all(
    KSA_CITIES.map((c) =>
      prisma.location.create({
        data: {
          name: c.name,
          city: c.city,
          coordinates: c.coordinates,
          elevation: 10 + Math.random() * 50,
          risk_class: c.risk_class,
          notes: `Seed location for ${c.city}`,
        },
      })
    )
  );
  console.log(`Created ${locations.length} locations.`);

  // 2) Sensor types (5)
  const sensorTypes = await Promise.all([
    prisma.sensor_type.create({ data: { type_name: 'Temperature', unit: '°C', normal_min: 15, normal_max: 45 } }),
    prisma.sensor_type.create({ data: { type_name: 'Ultrasonic', unit: 'cm', normal_min: 0, normal_max: 100 } }),
    prisma.sensor_type.create({ data: { type_name: 'Power Outage', unit: 'bool', normal_min: 0, normal_max: 1 } }),
    prisma.sensor_type.create({ data: { type_name: 'Rain Intensity', unit: '%', normal_min: 0, normal_max: 100 } }),
    prisma.sensor_type.create({ data: { type_name: 'Humidity', unit: '%', normal_min: 0, normal_max: 100 } }),
  ]);
  console.log(`Created ${sensorTypes.length} sensor types.`);

  // 3) Sensor nodes (5 – one per location)
  const nodes = await Promise.all(
    locations.map((loc) =>
      prisma.sensor_node.create({
        data: {
          location_id: loc.location_id,
          status: 'online',
          last_seen_ts: now,
        },
      })
    )
  );
  console.log(`Created ${nodes.length} sensor nodes.`);

  // 4) Sensors (5 – one per node, cycling through types)
  const sensors = await Promise.all(
    nodes.map((node, i) =>
      prisma.sensor.create({
        data: {
          node_id: node.node_id,
          sensor_type_id: sensorTypes[i % sensorTypes.length].sensor_type_id,
          serial_no: `SN-${node.node_id}-${i + 1}`,
          status: 'active',
        },
      })
    )
  );
  console.log(`Created ${sensors.length} sensors.`);

  // 5) Sensor readings (5 per sensor type for dashboard – add 5 more generic)
  for (let r = 0; r < 5; r++) {
    await prisma.sensor_reading.create({
      data: {
        sensor_id: sensors[r % sensors.length].sensor_id,
        time_stamp: hourAgo(r),
        raw_value: r === 0 ? 28 + Math.random() * 5 : r === 1 ? 15 + Math.random() * 30 : r === 2 ? 1 : r === 3 ? 10 + Math.random() * 40 : 35 + Math.random() * 25,
      },
    });
  }
  // Extra readings for graph (hourly over last 10 hours for ultrasonic)
  const ultrasonicSensor = sensors.find((_, i) => i === 1);
  if (ultrasonicSensor) {
    for (let h = 1; h <= 9; h++) {
      await prisma.sensor_reading.create({
        data: {
          sensor_id: ultrasonicSensor.sensor_id,
          time_stamp: hourAgo(h),
          raw_value: 10 + Math.random() * 25 + h * 2,
        },
      });
    }
  }
  console.log('Created sensor readings.');

  // 6) ML models (5)
  const models = await Promise.all(
    [1, 2, 3, 4, 5].map((i) =>
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
  console.log(`Created ${models.length} ML models.`);

  // 7) Predictions (5 – one per location, one with future hazard for countdown)
  const hazardIn2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const predictions = await Promise.all([
    prisma.prediction.create({
      data: {
        ml_model_id: models[0].ml_model_id,
        location_id: locations[0].location_id,
        time_stamp: now,
        risk_score: 0.3,
        risk_level: 'low',
        predicted_hazard_ts: null,
      },
    }),
    prisma.prediction.create({
      data: {
        ml_model_id: models[1].ml_model_id,
        location_id: locations[1].location_id,
        time_stamp: now,
        risk_score: 0.7,
        risk_level: 'high',
        predicted_hazard_ts: hazardIn2Hours,
      },
    }),
    prisma.prediction.create({
      data: {
        ml_model_id: models[2].ml_model_id,
        location_id: locations[2].location_id,
        time_stamp: now,
        risk_score: 0.2,
        risk_level: 'low',
        predicted_hazard_ts: null,
      },
    }),
    prisma.prediction.create({
      data: {
        ml_model_id: models[3].ml_model_id,
        location_id: locations[3].location_id,
        time_stamp: now,
        risk_score: 0.1,
        risk_level: 'none',
        predicted_hazard_ts: null,
      },
    }),
    prisma.prediction.create({
      data: {
        ml_model_id: models[4].ml_model_id,
        location_id: locations[4].location_id,
        time_stamp: now,
        risk_score: 0.85,
        risk_level: 'high',
        predicted_hazard_ts: new Date(now.getTime() + 30 * 60 * 1000),
      },
    }),
  ]);
  console.log(`Created ${predictions.length} predictions.`);

  // 8) Alerts (5)
  await Promise.all(
    predictions.map((p) =>
      prisma.alert.create({
        data: {
          prediction_id: p.prediction_id,
          channel: 'dashboard',
        },
      })
    )
  );
  console.log('Created 5 alerts.');

  // 9) Flood events (5)
  await Promise.all(
    locations.map((loc, i) =>
      prisma.flood_event.create({
        data: {
          location_id: loc.location_id,
          start_ts: hourAgo(24 + i * 6),
          end_ts: hourAgo(18 + i * 6),
          risk_level: ['low', 'medium', 'low', 'none', 'high'][i],
          confirmed_by: 'system',
          notes: `Seed flood event ${i + 1}`,
        },
      })
    )
  );
  console.log('Created 5 flood events.');

  // 10) Weather sources (5)
  const sources = await Promise.all(
    ['Open-Meteo', 'WeatherAPI', 'AccuWeather', 'Meteostat', 'Custom'].map((name) =>
      prisma.weather_source.create({
        data: { provider_name: name, api: `https://api.${name.toLowerCase().replace(' ', '')}.com`, notes: 'Seed' },
      })
    )
  );
  console.log(`Created ${sources.length} weather sources.`);

  // 11) Weather forecasts (5 per location × 1 each = 5 total for “5 per table”)
  for (let i = 0; i < 5; i++) {
    await prisma.weather_forecast.create({
      data: {
        location_id: locations[i].location_id,
        source_id: sources[i].source_id,
        value_type: 'temperature',
        value: 22 + Math.random() * 15,
        issued_at: now,
        valid_from: now,
        valid_to: hourAgo(-24),
      },
    });
  }
  console.log('Created 5 weather forecasts.');

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
