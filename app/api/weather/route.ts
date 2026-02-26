import { NextResponse } from 'next/server';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

async function fetchOpenMeteo(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
    hourly: 'temperature_2m',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '7',
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
      const hourly = (data.hourly?.time || []).slice(0, 6).map((time: string, i: number) => ({
        time,
        temp: Math.round((data.hourly?.temperature_2m?.[i] ?? 0)),
      }));
      return NextResponse.json({ hourly });
    }

    if (type === 'daily') {
      const times = data.daily?.time || [];
      const maxT = data.daily?.temperature_2m_max || [];
      const minT = data.daily?.temperature_2m_min || [];
      const daily = times.map((date: string, i: number) => ({
        date,
        temp: Math.round((maxT[i] + minT[i]) / 2) || Math.round(maxT[i] ?? 0),
        min: Math.round(minT[i] ?? 0),
        max: Math.round(maxT[i] ?? 0),
      }));
      return NextResponse.json({ daily });
    }

    const current = data.current || {};
    const humidity = current.relative_humidity_2m ?? null;
    const windMs = current.wind_speed_10m;
    const windKmh = windMs != null ? (windMs * 3.6).toFixed(1) : null;

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
