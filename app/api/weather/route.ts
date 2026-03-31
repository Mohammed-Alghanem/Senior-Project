import { NextResponse } from 'next/server';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

function mapCondition(weatherCode: number, windKmh?: number): string {
  const isNonPrecipCode = weatherCode >= 0 && weatherCode <= 3;
  if (typeof windKmh === 'number' && windKmh >= 30 && isNonPrecipCode) return 'Windy';
  if (weatherCode === 0) return 'Sunny';
  if ([1, 2].includes(weatherCode)) return 'Partly Cloudy';
  if (weatherCode === 3) return 'Cloudy';
  if ([45, 48].includes(weatherCode)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return 'Rainy';
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'Snowy';
  if ([95, 96, 99].includes(weatherCode)) return 'Stormy';
  return 'Cloudy';
}

async function fetchOpenMeteo(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,is_day,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max',
    timezone: 'auto',
    wind_speed_unit: 'kmh',
    forecast_days: '7',
    past_hours: '2',
    forecast_hours: '8',
  });

  try {
    const response = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Open-Meteo error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Open-Meteo fetch error', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  const lat = latParam ? parseFloat(latParam) : 26.4554;
  const lon = lonParam ? parseFloat(lonParam) : 50.2165;

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json(
      { error: 'Valid lat and lon required' },
      { status: 400 }
    );
  }

  try {
    const data = await fetchOpenMeteo(lat, lon);
    if (!data) {
      if (type === 'hourly') return NextResponse.json({ hourly: [] });
      if (type === 'daily') return NextResponse.json({ daily: [] });
      return NextResponse.json({ humidity: null, wind: null });
    }

    if (type === 'hourly') {
      const times: string[] = data.hourly?.time || [];
      const temps: number[] = data.hourly?.temperature_2m || [];
      const weatherCodes: number[] = data.hourly?.weather_code || [];
      const isDayList: number[] = data.hourly?.is_day || [];
      const windList: number[] = data.hourly?.wind_speed_10m || [];

      const rows = times.map((time, i) => {
        const weatherCode = Number(weatherCodes[i] ?? 3);
        return {
          time,
          temp: Math.round(Number(temps[i] ?? 0)),
          is_day: Number(isDayList[i] ?? 1) === 1,
          weather_code: weatherCode,
          wind_kmh: Math.round(Number(windList[i] ?? 0)),
          condition: mapCondition(weatherCode, Number(windList[i] ?? 0)),
        };
      });

      const now = Date.now();
      const closestNowIndex = rows.reduce((best, row, i, arr) => {
        const currentDiff = Math.abs(new Date(row.time).getTime() - now);
        const bestDiff = Math.abs(new Date(arr[best].time).getTime() - now);
        return currentDiff < bestDiff ? i : best;
      }, 0);

      let start = Math.max(0, closestNowIndex - 2);
      const end = Math.min(rows.length, start + 8);
      if (end - start < 8) {
        start = Math.max(0, end - 8);
      }
      const hourly = rows.slice(start, end);
      return NextResponse.json({ hourly });
    }

    if (type === 'daily') {
      const times = data.daily?.time || [];
      const maxT = data.daily?.temperature_2m_max || [];
      const minT = data.daily?.temperature_2m_min || [];
      const weatherCodes = data.daily?.weather_code || [];
      const windMax = data.daily?.wind_speed_10m_max || [];
      const daily = times.map((date: string, i: number) => ({
        date,
        temp: Math.round((maxT[i] + minT[i]) / 2) || Math.round(maxT[i] ?? 0),
        min: Math.round(minT[i] ?? 0),
        max: Math.round(maxT[i] ?? 0),
        weather_code: Number(weatherCodes[i] ?? 3),
        wind_kmh_max: Math.round(Number(windMax[i] ?? 0)),
        condition: mapCondition(Number(weatherCodes[i] ?? 3), Number(windMax[i] ?? 0)),
        is_day: true,
      }));
      return NextResponse.json({ daily });
    }

    const current = data.current || {};
    const humidity = current.relative_humidity_2m ?? null;
    const windKmh = current.wind_speed_10m != null ? Number(current.wind_speed_10m).toFixed(1) : null;

    return NextResponse.json({
      humidity,
      wind: windKmh,
    });
  } catch (error) {
    console.error('Error in weather API', error);
    return NextResponse.json(
      { error: 'Failed to load weather data' },
      { status: 500 }
    );
  }
}
