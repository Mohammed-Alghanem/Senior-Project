'use client';

import { Header } from '@/app/components/Header';
import { Suspense } from 'react';
import Image from 'next/image';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { FloodPopup } from '@/app/components/FloodPopup';
import SunPng from '../../SVGs/Sun.png';
import CloudPng from '../../SVGs/Cloud.png';
import CloudMidRainPng from '../../SVGs/Cloud mid rain.png';
import SunCloudMidRainPng from '../../SVGs/Sun cloud mid rain.png';
import MoonCloudPng from '../../SVGs/Moon cloud.png';
import SnowPng from '../../SVGs/Big snow little snow.png';
import CloudFastWindPng from '../../SVGs/Cloud fast wind.png';
import MoonCloudFastWindPng from '../../SVGs/Moon cloud fast wind.png';
import FastWindsPng from '../../SVGs/Fast winds.png';
import MoonCloudZapPng from '../../SVGs/Moon cloud zap.png';
import CloudAngledRainZapPng from '../../SVGs/Cloud angled rain zap.png';
import CloudHailstonePng from '../../SVGs/Cloud hailstone.png';
import EyeSvg from '../../SVGs/eye.svg';
import RaindropSvg from '../../SVGs/raindrop.svg';

type LocationSummary = {
  location_id: bigint | number;
  name: string | null;
  city: string | null;
  risk_class: string | null;
  coordinates: string | null;
};

type SensorData = {
  value: number | null;
  unit: string | null;
};

type HourlyForecast = {
  time: string;
  temp: number;
  condition?: string;
  is_day?: boolean;
  weather_code?: number;
  wind_kmh?: number;
};

type DailyForecast = {
  date: string;
  temp: number;
  min: number;
  max: number;
  condition?: string;
  is_day?: boolean;
  weather_code?: number;
  wind_kmh_max?: number;
};

type WaterLevelReading = {
  hour: string;
  value: number | null;
  timestamp: string;
};

type Prediction = {
  prediction_id: string;
  predicted_hazard_ts: string;
  risk_level: string | null;
  risk_score: number | null;
  seconds_until_hazard: number;
};

type SensorWithReadings = {
  sensor_id: string;
  node_id: string;
  location_id: string;
  serial_no: string | null;
  status: string | null;
  type_name: string | null;
  unit: string | null;
  readings: { time_stamp: string; raw_value: number }[];
};

type CanonicalSensorKey = 'temperature' | 'water_surface' | 'water_underground' | 'rain_intensity';

const GRAPH_DISPLAY_ORDER: CanonicalSensorKey[] = ['water_surface', 'water_underground', 'rain_intensity', 'temperature'];
const SENSOR_SECTION_ORDER: CanonicalSensorKey[] = [...GRAPH_DISPLAY_ORDER];

const SENSOR_DISPLAY_LABELS: Record<CanonicalSensorKey, string> = {
  temperature: 'Temperature',
  water_surface: 'Water Level Surface',
  water_underground: 'Water Level Underground',
  rain_intensity: 'Rain Intensity',
};

const getForecastIcon = (
  condition: string | undefined,
  isDay: boolean | undefined,
  temp: number,
  weatherCode?: number,
  windKmh?: number
) => {
  const normalized = (condition || '').toLowerCase();
  const day = isDay ?? true;
  const code = typeof weatherCode === 'number' ? weatherCode : null;
  const isWindy = typeof windKmh === 'number' && windKmh >= 30;

  if (code !== null) {
    if (isWindy && code >= 0 && code <= 3) return day ? CloudFastWindPng : MoonCloudFastWindPng;
    if (code === 0) return day ? SunPng : MoonCloudPng;
    if ([1, 2].includes(code)) return day ? SunPng : MoonCloudPng;
    if (code === 3) return CloudPng;
    if ([45, 48].includes(code)) return CloudPng;
    if ([51, 53, 55, 56, 57].includes(code)) return day ? CloudMidRainPng : MoonCloudPng;
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return day ? SunCloudMidRainPng : CloudMidRainPng;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return SnowPng;
    if ([95, 96, 99].includes(code)) return day ? CloudAngledRainZapPng : MoonCloudZapPng;
  }

  if (normalized.includes('storm')) return day ? CloudAngledRainZapPng : MoonCloudZapPng;
  if (normalized.includes('snow')) return SnowPng;
  if (normalized.includes('drizzle') || normalized.includes('rain')) return day ? SunCloudMidRainPng : CloudMidRainPng;
  if (normalized.includes('wind') || isWindy) return day ? CloudFastWindPng : MoonCloudFastWindPng;
  if (normalized.includes('fog')) return CloudPng;
  if (normalized.includes('hail')) return CloudHailstonePng;
  if (normalized.includes('sun')) return day ? SunPng : MoonCloudPng;
  if (normalized.includes('partly')) return day ? SunPng : MoonCloudPng;
  if (normalized.includes('cloud')) return CloudPng;

  // Fallback when API condition is missing.
  if (temp <= 5) return SnowPng;
  if (temp >= 33) return day ? SunPng : MoonCloudPng;
  return day ? CloudPng : MoonCloudPng;
};

function HourCard({
  time,
  temp,
  iconSrc,
}: {
  time: string;
  temp: number;
  iconSrc: React.ComponentProps<typeof Image>['src'];
}) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 'clamp(44px, 12vw, 74px)',
          height: 'clamp(44px, 12vw, 74px)',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          src={iconSrc}
          alt="Forecast icon"
          width={66}
          height={66}
          style={{ width: '100%', height: '100%', maxWidth: 66, maxHeight: 66, objectFit: 'contain', objectPosition: 'center center', display: 'block' }}
        />
      </div>
      <div style={{ marginTop: 0, color: 'var(--text)', fontSize: 'clamp(11px, 3.2vw, 14px)' }}>{time}</div>
      <div style={{ marginTop: 6, color: 'var(--text)', fontWeight: 500, fontSize: 'clamp(14px, 4vw, 18px)', lineHeight: 1 }}>{temp}°</div>
    </div>
  );
}

function CountdownTimer({
  predictedHazardTs,
  onShowCaution,
}: {
  predictedHazardTs: string | null;
  onShowCaution: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const cautionShownRef = useRef(false);
  const onShowCautionRef = useRef(onShowCaution);

  useEffect(() => {
    onShowCautionRef.current = onShowCaution;
  }, [onShowCaution]);

  useEffect(() => {
    cautionShownRef.current = false;

    if (!predictedHazardTs) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(null);
      return;
    }
    const hazardMs = new Date(predictedHazardTs).getTime();
    const initial = Math.max(0, Math.floor((hazardMs - Date.now()) / 1000));
    setTimeLeft(initial);
  }, [predictedHazardTs]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!predictedHazardTs) {
        setTimeLeft(null);
        return;
      }
      const hazardMs = new Date(predictedHazardTs).getTime();
      const next = Math.max(0, Math.floor((hazardMs - Date.now()) / 1000));

      if (next < 3600 && next > 0 && !cautionShownRef.current) {
        cautionShownRef.current = true;
        onShowCautionRef.current();
      }
      setTimeLeft(next);
    }, 1000);

    return () => clearInterval(timer);
  }, [predictedHazardTs]);

  const isSafe = timeLeft === null || timeLeft === 0;
  const hours = timeLeft !== null ? Math.floor(timeLeft / 3600) : 0;
  const minutes = timeLeft !== null ? Math.floor((timeLeft % 3600) / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;

  const totalTime = 21600; // 6 hours default
  const progress = timeLeft !== null ? timeLeft / totalTime : 1;
  const circumference = 2 * Math.PI * 48;
  const strokeDashoffset = circumference * (1 - progress);

  // Color: light blue (rain color) when safe, red when countdown active
  const strokeColor = isSafe ? '#0EA5E9' : '#FF3C3C';

  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={120} height={120} viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r="48" stroke="#374151" strokeWidth={10} fill="rgba(255,255,255,0.02)" />
        <circle
          cx="60"
          cy="60"
          r="48"
          stroke={strokeColor}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
        {isSafe ? (
          <text x="60" y="68" textAnchor="middle" fontSize={20} fill="#E6EEF8" fontWeight={700}>
            Safe
          </text>
        ) : (
          <text x="60" y="68" textAnchor="middle" fontSize={18} fill="#E6EEF8" fontWeight={700}>
            {`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
          </text>
        )}
      </svg>
    </div>
  );
}

function DashboardPageContent() {
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Sensor data
  const [temperature, setTemperature] = useState<SensorData>({ value: null, unit: null });
  const [waterLevel, setWaterLevel] = useState<SensorData>({ value: null, unit: null });
  const [rainIntensity, setRainIntensity] = useState<SensorData>({ value: null, unit: null });

  // Weather data
  const [precipitation, setPrecipitation] = useState<number | null>(null);
  const [weatherTemperature, setWeatherTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [wind, setWind] = useState<number | null>(null);
  const [realFeel, setRealFeel] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<number | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);

  // Water level graph
  const [waterLevelReadings, setWaterLevelReadings] = useState<WaterLevelReading[]>([]);
  const [waterLevelGraphLoadedOnce, setWaterLevelGraphLoadedOnce] = useState(false);

  // Prediction
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  // Per-sensor data (Al Qatif): each sensor and its readings for correct display
  const [sensorsList, setSensorsList] = useState<SensorWithReadings[]>([]);
  const [sensorsLoadedOnce, setSensorsLoadedOnce] = useState(false);
  const [dbUnavailable, setDbUnavailable] = useState(false);

  // Popups
  const [showCautionPopup, setShowCautionPopup] = useState(false);

  const searchParams = useSearchParams();
  const urlLocationId = searchParams.get('location_id');
  // Use first location from API, or location_id from URL (e.g. when redirected from /city/3) so Al Qatif data is shown
  const locationId = locations.length > 0 ? String(locations[0].location_id) : (urlLocationId || null);
  const locationName = locations.length > 0 ? (locations[0].city || locations[0].name || 'Location') : (urlLocationId ? 'Al Qatif' : 'Location');

  const coords = locations.length > 0 && locations[0].coordinates
    ? locations[0].coordinates.trim().split(',').map((s) => parseFloat(s.trim()))
    : null;
  const lat = coords && coords.length >= 2 && Number.isFinite(coords[0]) ? coords[0] : 26.4554;
  const lon = coords && coords.length >= 2 && Number.isFinite(coords[1]) ? coords[1] : 50.2165;

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const json = await res.json();
          setLocations(json.locations ?? []);
        }
      } catch (err) {
        console.error('Error fetching locations', err);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (!locationId) return;
    const pollMs = 7000;
    const fetchSensorsForLocation = async () => {
      try {
        const res = await fetch(`/api/locations/${locationId}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (data.dbUnavailable) {
          setDbUnavailable(true);
          return;
        }
        if (res.ok) {
          setSensorsList(data.sensors ?? []);
          setDbUnavailable(false);
        }
      } catch (err) {
        console.error('Error fetching sensors for location', err);
      } finally {
        setSensorsLoadedOnce(true);
      }
    };
    fetchSensorsForLocation();
    const t = setInterval(fetchSensorsForLocation, pollMs);
    return () => clearInterval(t);
  }, [locationId]);

  useEffect(() => {
    if (!locationId) return;
    const pollMs = 7000;

    const fetchSensorData = async () => {
      try {
        // Read all 4 dashboard sensors in ONE fast API call (still from DB sensor tables)
        const res = await fetch(`/api/sensors/latest?location_id=${locationId}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (data.dbUnavailable) {
          setDbUnavailable(true);
          return;
        }
        if (!res.ok) return;
        setTemperature({ value: data.temperature?.value ?? null, unit: data.temperature?.unit ?? null });
        setWaterLevel({ value: data.waterLevel?.value ?? null, unit: data.waterLevel?.unit ?? null });
        setRainIntensity({ value: data.rainIntensity?.value ?? null, unit: data.rainIntensity?.unit ?? null });
        setDbUnavailable(false);
      } catch (err) {
        console.error('Error fetching sensor data', err);
      }
    };

    fetchSensorData();
    const sensorInterval = setInterval(fetchSensorData, pollMs);
    return () => clearInterval(sensorInterval);
  }, [locationId]);

  useEffect(() => {
    if (!locationId) return;
    const pollMs = 7000;

    const fetchWaterLevelGraph = async () => {
      try {
        const res = await fetch(`/api/water-level-graph?location_id=${locationId}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (data.dbUnavailable) setDbUnavailable(true);
        else if (res.ok) {
          const readings = data.readings ?? [];
          console.log('[water-level-graph] readings inserted into graph', readings);
          setWaterLevelReadings(readings);
        }
      } catch (err) {
        console.error('Error fetching water level graph', err);
      } finally {
        setWaterLevelGraphLoadedOnce(true);
      }
    };

    fetchWaterLevelGraph();
    const graphInterval = setInterval(fetchWaterLevelGraph, pollMs);
    return () => clearInterval(graphInterval);
  }, [locationId]);

  useEffect(() => {
    if (!locationId) return;
    const pollMs = 7000;

    const fetchPrediction = async () => {
      try {
        const res = await fetch(`/api/predictions?location_id=${locationId}`);
        if (res.ok) {
          const data = await res.json();
          setPrediction(data.prediction);
        }
      } catch (err) {
        console.error('Error fetching prediction', err);
      }
    };

    fetchPrediction();
    const predictionInterval = setInterval(fetchPrediction, pollMs);
    return () => clearInterval(predictionInterval);
  }, [locationId]);

  useEffect(() => {
    const fetchCurrentWeather = async () => {
      try {
        const latLon = `lat=${lat}&lon=${lon}`;
        const currentRes = await fetch(`/api/weather?type=current&${latLon}`);
        if (currentRes.ok) {
          const currentData = await currentRes.json();
          const temperatureValue = Number(currentData.temperature);
          setWeatherTemperature(Number.isFinite(temperatureValue) ? temperatureValue : null);
          const precipitationValue = Number(currentData.precipitation);
          setPrecipitation(Number.isFinite(precipitationValue) ? precipitationValue : null);
          const humidityValue = Number(currentData.humidity);
          setHumidity(Number.isFinite(humidityValue) ? humidityValue : null);
          setWind(currentData.wind != null ? parseFloat(currentData.wind) : null);
          const apparentTemperatureValue = Number(currentData.apparent_temperature);
          setRealFeel(Number.isFinite(apparentTemperatureValue) ? apparentTemperatureValue : null);
          const visibilityValue = Number(currentData.visibility);
          setVisibility(Number.isFinite(visibilityValue) ? visibilityValue : null);
        }
      } catch (err) {
        console.error('Error fetching current weather', err);
      }
    };

    fetchCurrentWeather();
    const currentWeatherInterval = setInterval(fetchCurrentWeather, 7000);
    return () => clearInterval(currentWeatherInterval);
  }, [lat, lon]);

  useEffect(() => {
    const fetchForecastWeather = async () => {
      try {
        const latLon = `lat=${lat}&lon=${lon}`;

        const hourlyRes = await fetch(`/api/weather?type=hourly&${latLon}`);
        if (hourlyRes.ok) {
          const hourlyData = await hourlyRes.json();
          setHourlyForecast(hourlyData.hourly ?? []);
        }

        const dailyRes = await fetch(`/api/weather?type=daily&${latLon}`);
        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          setDailyForecast(dailyData.daily ?? []);
        }
      } catch (err) {
        console.error('Error fetching forecast weather', err);
      }
    };

    fetchForecastWeather();
    const forecastWeatherInterval = setInterval(fetchForecastWeather, 300000);
    return () => clearInterval(forecastWeatherInterval);
  }, [lat, lon]);

  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderSensorGraph = (readings: WaterLevelReading[], unitLabel: string) => {
    const chartTopY = 30;
    const chartBottomY = 150;
    const chartHeight = chartBottomY - chartTopY;

    if (readings.length === 0) {
      return (
        <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="muted">No sensor data available</div>
        </div>
      );
    }

    const valueReadings = readings.filter((r) => typeof r.value === 'number');
    if (valueReadings.length === 0) {
      return (
        <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="muted">No sensor data available</div>
        </div>
      );
    }

    const SPIKE_THRESHOLD_CM = 20;
    const SAFE_BLUE = '#7C88CA';
    const ALERT_RED = '#FF4245';

    const maxValue = Math.max(...valueReadings.map((r) => r.value as number), 1);
    const minValue = Math.min(...valueReadings.map((r) => r.value as number), 0);
    const valueRange = maxValue - minValue || 1;

    const chartEnd = new Date();
    chartEnd.setSeconds(0, 0);
    if (chartEnd.getMinutes() > 0) {
      chartEnd.setHours(chartEnd.getHours() + 1, 0, 0, 0);
    } else {
      chartEnd.setMinutes(0, 0, 0);
    }

    const chartStart = new Date(chartEnd);
    chartStart.setHours(chartEnd.getHours() - 6);

    const chartStartMs = chartStart.getTime();
    const chartEndMs = chartEnd.getTime();
    const chartRangeMs = Math.max(chartEndMs - chartStartMs, 1);

    const toChartX = (ts: number): number => {
      const clampedTs = Math.min(Math.max(ts, chartStartMs), chartEndMs);
      return 70 + (((clampedTs - chartStartMs) / chartRangeMs) * 690);
    };

    const plotted = readings.map((reading, index) => {
      if (typeof reading.value !== 'number') return null;
      const ts = new Date(reading.timestamp).getTime();
      const fallbackTs = chartStartMs + ((index / Math.max(readings.length - 1, 1)) * chartRangeMs);
      const x = toChartX(Number.isFinite(ts) ? ts : fallbackTs);
      const normalizedValue = ((reading.value as number) - minValue) / valueRange;
      const y = chartBottomY - (normalizedValue * chartHeight);
      return { x, y, value: reading.value as number };
    });

    const hourLabels = Array.from({ length: 7 }, (_, index) => {
      const labelDate = new Date(chartStart);
      labelDate.setHours(chartStart.getHours() + index, 0, 0, 0);
      const displayHour = labelDate.getHours() % 12 || 12;
      const displayPeriod = labelDate.getHours() >= 12 ? 'pm' : 'am';
      return {
        x: toChartX(labelDate.getTime()),
        label: `${displayHour}:00 ${displayPeriod}`,
      };
    });

    return (
      <svg width="100%" height="100%" viewBox="0 0 820 200" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <line x1="70" y1={chartTopY} x2="760" y2={chartTopY} stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1={(chartTopY + chartBottomY) / 2} x2="760" y2={(chartTopY + chartBottomY) / 2} stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1={chartBottomY} x2="760" y2={chartBottomY} stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1={chartTopY} x2="70" y2={chartBottomY} stroke="#E5E7EB" strokeWidth="2" />

        {/* Y-axis labels */}
        <text x="20" y={chartTopY} fontSize="13" fill="#E5E7EB" dominantBaseline="middle">{maxValue.toFixed(1)} {unitLabel}</text>
        <text x="20" y={chartBottomY} fontSize="13" fill="#E5E7EB" dominantBaseline="middle">{minValue.toFixed(1)} {unitLabel}</text>

        {/* Chart line (threshold coloring) */}
        {plotted.map((point, index) => {
          const next = plotted[index + 1];
          if (!point || !next) return null;
          const segmentColor = Math.max(point.value, next.value) > SPIKE_THRESHOLD_CM ? ALERT_RED : SAFE_BLUE;
          return (
            <line
              key={`segment-${index}`}
              x1={point.x}
              y1={point.y}
              x2={next.x}
              y2={next.y}
              stroke={segmentColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Data points */}
        {plotted.map((point, index) => {
          if (!point) return null;
          const pointColor = point.value > SPIKE_THRESHOLD_CM ? ALERT_RED : SAFE_BLUE;
          return (
            <circle key={index} cx={point.x} cy={point.y} r="5" fill={pointColor} stroke="#FFFFFF" strokeWidth="2" />
          );
        })}

        {/* X-axis labels */}
        {hourLabels.map((label, index) => (
          <text key={index} x={label.x} y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">
            {label.label}
          </text>
        ))}
      </svg>
    );
  };

  const renderWaterLevelGraph = () => {
    const unitLabel = waterLevel.unit || 'cm';
    const chartTopY = 30;
    const chartBottomY = 150;
    const chartHeight = chartBottomY - chartTopY;

    if (waterLevelReadings.length === 0) {
      return (
        <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="muted">No sensor data available</div>
        </div>
      );
    }

    const valueReadings = waterLevelReadings.filter((r) => typeof r.value === 'number');
    const hasValues = valueReadings.length > 0;
    if (!hasValues) {
      return (
        <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="muted">No sensor data available</div>
        </div>
      );
    }
    const maxValue = hasValues ? Math.max(...valueReadings.map((r) => r.value as number), 1) : 1;
    const minValue = hasValues ? Math.min(...valueReadings.map((r) => r.value as number), 0) : 0;
    const valueRange = maxValue - minValue || 1;

    const chartEnd = new Date();
    chartEnd.setSeconds(0, 0);
    if (chartEnd.getMinutes() > 0) {
      chartEnd.setHours(chartEnd.getHours() + 1, 0, 0, 0);
    } else {
      chartEnd.setMinutes(0, 0, 0);
    }

    const chartStart = new Date(chartEnd);
    chartStart.setHours(chartEnd.getHours() - 6);

    const chartStartMs = chartStart.getTime();
    const chartEndMs = chartEnd.getTime();
    const chartRangeMs = Math.max(chartEndMs - chartStartMs, 1);

    const toChartX = (ts: number): number => {
      const clampedTs = Math.min(Math.max(ts, chartStartMs), chartEndMs);
      return 70 + (((clampedTs - chartStartMs) / chartRangeMs) * 690);
    };

    const SPIKE_THRESHOLD_CM = 20;
    const SAFE_BLUE = '#7C88CA';
    const ALERT_RED = '#FF4245';

    const plotted = waterLevelReadings.map((reading, index) => {
      if (typeof reading.value !== 'number') return null;
      const ts = new Date(reading.timestamp).getTime();
      const fallbackTs = chartStartMs + ((index / Math.max(waterLevelReadings.length - 1, 1)) * chartRangeMs);
      const x = toChartX(Number.isFinite(ts) ? ts : fallbackTs);
      const normalizedValue = ((reading.value as number) - minValue) / valueRange;
      const y = chartBottomY - (normalizedValue * chartHeight);
      return { x, y, value: reading.value as number };
    });

    const segments: Array<{ from: number; to: number; color: string }> = [];
    let lastValidIndex = -1;

    for (let i = 0; i < waterLevelReadings.length; i += 1) {
      if (typeof waterLevelReadings[i].value !== 'number') continue;

      if (lastValidIndex !== -1) {
        const gapSize = i - lastValidIndex - 1;
        if (gapSize <= 2) {
          const fromPoint = plotted[lastValidIndex];
          const toPoint = plotted[i];
          if (fromPoint && toPoint) {
            segments.push({
              from: lastValidIndex,
              to: i,
              color: Math.max(fromPoint.value, toPoint.value) > SPIKE_THRESHOLD_CM ? ALERT_RED : SAFE_BLUE,
            });
          }
        }
      }

      lastValidIndex = i;
    }

    const hourLabels = Array.from({ length: 7 }, (_, index) => {
      const labelDate = new Date(chartStart);
      labelDate.setHours(chartStart.getHours() + index, 0, 0, 0);

      const displayHour = labelDate.getHours() % 12 || 12;
      const displayPeriod = labelDate.getHours() >= 12 ? 'pm' : 'am';

      return {
        x: toChartX(labelDate.getTime()),
        label: `${displayHour}:00 ${displayPeriod}`,
      };
    });

    return (
      <svg width="100%" height="100%" viewBox="0 0 820 200" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <line x1="70" y1={chartTopY} x2="760" y2={chartTopY} stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1={(chartTopY + chartBottomY) / 2} x2="760" y2={(chartTopY + chartBottomY) / 2} stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1={chartBottomY} x2="760" y2={chartBottomY} stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1={chartTopY} x2="70" y2={chartBottomY} stroke="#E5E7EB" strokeWidth="2" />

        {/* Y-axis labels */}
        <text x="20" y={chartTopY} fontSize="13" fill="#E5E7EB" dominantBaseline="middle">
          {hasValues ? `${maxValue.toFixed(1)} ${unitLabel}` : `-- ${unitLabel}`}
        </text>
        <text x="20" y={chartBottomY} fontSize="13" fill="#E5E7EB" dominantBaseline="middle">
          {hasValues ? `${minValue.toFixed(1)} ${unitLabel}` : `-- ${unitLabel}`}
        </text>

        {/* Chart line (threshold coloring) */}
        {segments.map((segment) => {
          const fromPoint = plotted[segment.from];
          const toPoint = plotted[segment.to];
          if (!fromPoint || !toPoint) return null;

          return (
            <line
              key={`segment-${segment.from}-${segment.to}`}
              x1={fromPoint.x}
              y1={fromPoint.y}
              x2={toPoint.x}
              y2={toPoint.y}
              stroke={segment.color}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Data points */}
        {plotted.map((point, index) => {
          if (!point) return null;
          const pointColor = point.value > SPIKE_THRESHOLD_CM ? ALERT_RED : SAFE_BLUE;
          return (
            <circle key={index} cx={point.x} cy={point.y} r="5" fill={pointColor} stroke="#FFFFFF" strokeWidth="2" />
          );
        })}

        {/* X-axis labels */}
        {hourLabels.map((label, index) => (
          <text key={index} x={label.x} y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">
            {label.label}
          </text>
        ))}
      </svg>
    );
  };

  const renderWaterLevelStyleSensorGraph = (readings: WaterLevelReading[], unitLabel: string) => {
    const chartTopY = 30;
    const chartBottomY = 150;
    const chartHeight = chartBottomY - chartTopY;

    if (readings.length === 0) {
      return (
        <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="muted">No sensor data available</div>
        </div>
      );
    }

    const valueReadings = readings.filter((r) => typeof r.value === 'number');
    const hasValues = valueReadings.length > 0;
    if (!hasValues) {
      return (
        <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="muted">No sensor data available</div>
        </div>
      );
    }
    const maxValue = hasValues ? Math.max(...valueReadings.map((r) => r.value as number), 1) : 1;
    const minValue = hasValues ? Math.min(...valueReadings.map((r) => r.value as number), 0) : 0;
    const valueRange = maxValue - minValue || 1;

    const chartEnd = new Date();
    chartEnd.setSeconds(0, 0);
    if (chartEnd.getMinutes() > 0) {
      chartEnd.setHours(chartEnd.getHours() + 1, 0, 0, 0);
    } else {
      chartEnd.setMinutes(0, 0, 0);
    }

    const chartStart = new Date(chartEnd);
    chartStart.setHours(chartEnd.getHours() - 6);

    const chartStartMs = chartStart.getTime();
    const chartEndMs = chartEnd.getTime();
    const chartRangeMs = Math.max(chartEndMs - chartStartMs, 1);

    const toChartX = (ts: number): number => {
      const clampedTs = Math.min(Math.max(ts, chartStartMs), chartEndMs);
      return 70 + (((clampedTs - chartStartMs) / chartRangeMs) * 690);
    };

    const SPIKE_THRESHOLD_CM = 20;
    const SAFE_BLUE = '#7C88CA';
    const ALERT_RED = '#FF4245';

    const plotted = readings.map((reading, index) => {
      if (typeof reading.value !== 'number') return null;
      const ts = new Date(reading.timestamp).getTime();
      const fallbackTs = chartStartMs + ((index / Math.max(readings.length - 1, 1)) * chartRangeMs);
      const x = toChartX(Number.isFinite(ts) ? ts : fallbackTs);
      const normalizedValue = ((reading.value as number) - minValue) / valueRange;
      const y = chartBottomY - (normalizedValue * chartHeight);
      return { x, y, value: reading.value as number };
    });

    const segments: Array<{ from: number; to: number; color: string }> = [];
    let lastValidIndex = -1;

    for (let i = 0; i < readings.length; i += 1) {
      if (typeof readings[i].value !== 'number') continue;

      if (lastValidIndex !== -1) {
        const gapSize = i - lastValidIndex - 1;
        if (gapSize <= 2) {
          const fromPoint = plotted[lastValidIndex];
          const toPoint = plotted[i];
          if (fromPoint && toPoint) {
            segments.push({
              from: lastValidIndex,
              to: i,
              color: Math.max(fromPoint.value, toPoint.value) > SPIKE_THRESHOLD_CM ? ALERT_RED : SAFE_BLUE,
            });
          }
        }
      }

      lastValidIndex = i;
    }

    const hourLabels = Array.from({ length: 7 }, (_, index) => {
      const labelDate = new Date(chartStart);
      labelDate.setHours(chartStart.getHours() + index, 0, 0, 0);
      const displayHour = labelDate.getHours() % 12 || 12;
      const displayPeriod = labelDate.getHours() >= 12 ? 'pm' : 'am';
      return {
        x: toChartX(labelDate.getTime()),
        label: `${displayHour}:00 ${displayPeriod}`,
      };
    });

    return (
      <svg width="100%" height="100%" viewBox="0 0 820 200" preserveAspectRatio="xMidYMid meet">
        <line x1="70" y1={chartTopY} x2="760" y2={chartTopY} stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1={(chartTopY + chartBottomY) / 2} x2="760" y2={(chartTopY + chartBottomY) / 2} stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1={chartBottomY} x2="760" y2={chartBottomY} stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1={chartTopY} x2="70" y2={chartBottomY} stroke="#E5E7EB" strokeWidth="2" />

        <text x="20" y={chartTopY} fontSize="13" fill="#E5E7EB" dominantBaseline="middle">
          {hasValues ? `${maxValue.toFixed(1)} ${unitLabel}` : `-- ${unitLabel}`}
        </text>
        <text x="20" y={chartBottomY} fontSize="13" fill="#E5E7EB" dominantBaseline="middle">
          {hasValues ? `${minValue.toFixed(1)} ${unitLabel}` : `-- ${unitLabel}`}
        </text>

        {segments.map((segment) => {
          const fromPoint = plotted[segment.from];
          const toPoint = plotted[segment.to];
          if (!fromPoint || !toPoint) return null;
          return (
            <line
              key={`segment-${segment.from}-${segment.to}`}
              x1={fromPoint.x}
              y1={fromPoint.y}
              x2={toPoint.x}
              y2={toPoint.y}
              stroke={segment.color}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          );
        })}

        {plotted.map((point, index) => {
          if (!point) return null;
          const pointColor = point.value > SPIKE_THRESHOLD_CM ? ALERT_RED : SAFE_BLUE;
          return (
            <circle key={index} cx={point.x} cy={point.y} r="5" fill={pointColor} stroke="#FFFFFF" strokeWidth="2" />
          );
        })}

        {hourLabels.map((label, index) => (
          <text key={index} x={label.x} y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">
            {label.label}
          </text>
        ))}
      </svg>
    );
  };

  const sensorGraphReadings = (sensor: SensorWithReadings): WaterLevelReading[] => {
    const key = normalizeSensorTypeKey(sensor);
    if (key === 'water_surface' || key === 'water_underground') {
      const now = new Date();
      now.setSeconds(0, 0);
      if (now.getMinutes() > 0) {
        now.setHours(now.getHours() + 1, 0, 0, 0);
      } else {
        now.setMinutes(0, 0, 0);
      }

      const chartEnd = now.getTime();
      const windowMs = 6 * 60 * 60 * 1000;
      const bucketMs = 30 * 60 * 1000;
      const chartStart = chartEnd - windowMs;

      const points = (sensor.readings || [])
        .map((r) => {
          const ts = new Date(r.time_stamp).getTime();
          return {
            ts,
            value: Number(r.raw_value),
          };
        })
        .filter((r) => Number.isFinite(r.ts) && Number.isFinite(r.value) && r.ts >= chartStart && r.ts <= chartEnd)
        .sort((a, b) => a.ts - b.ts);

      const sampled: WaterLevelReading[] = [];
      let pointIndex = 0;

      for (let i = 0; i <= windowMs / bucketMs; i += 1) {
        const bucketEnd = chartStart + i * bucketMs;
        const bucketStart = bucketEnd - bucketMs;
        let latestInBucket: { ts: number; value: number } | null = null;

        while (pointIndex < points.length && points[pointIndex].ts <= bucketEnd) {
          if (points[pointIndex].ts >= bucketStart) {
            latestInBucket = points[pointIndex];
          }
          pointIndex += 1;
        }

        const tsIso = new Date(bucketEnd).toISOString();
        sampled.push({
          hour: tsIso,
          value: latestInBucket ? latestInBucket.value : null,
          timestamp: tsIso,
        });
      }

      return sampled;
    }

    const now = new Date();
    now.setSeconds(0, 0);
    if (now.getMinutes() > 0) {
      now.setHours(now.getHours() + 1, 0, 0, 0);
    } else {
      now.setMinutes(0, 0, 0);
    }

    const chartEnd = now.getTime();
    const windowMs = 6 * 60 * 60 * 1000;
    const bucketMs = 60 * 60 * 1000;
    const chartStart = chartEnd - windowMs;

    const allPoints = (sensor.readings || [])
      .map((r) => {
        const ts = new Date(r.time_stamp).getTime();
        return {
          ts,
          value: Number(r.raw_value),
        };
      })
      .filter((r) => Number.isFinite(r.ts) && Number.isFinite(r.value))
      .sort((a, b) => a.ts - b.ts);

    const points = allPoints.filter((r) => r.ts >= chartStart && r.ts <= chartEnd);
    const sampled: WaterLevelReading[] = [];
    let pointIndex = 0;

    for (let i = 0; i <= windowMs / bucketMs; i += 1) {
      const bucketEnd = chartStart + i * bucketMs;
      const bucketStart = bucketEnd - bucketMs;
      let latestInBucket: { ts: number; value: number } | null = null;

      while (pointIndex < points.length && points[pointIndex].ts <= bucketEnd) {
        if (points[pointIndex].ts >= bucketStart) {
          latestInBucket = points[pointIndex];
        }
        pointIndex += 1;
      }

      const tsIso = new Date(bucketEnd).toISOString();
      sampled.push({
        hour: tsIso,
        value: latestInBucket ? latestInBucket.value : null,
        timestamp: tsIso,
      });
    }

    return sampled;
  };

  const normalizeSensorTypeKey = (
    sensor: SensorWithReadings
  ): CanonicalSensorKey | 'other' => {
    const rawType = (sensor.type_name || '').trim().toLowerCase();
    const compactType = rawType.replace(/[\s_-]/g, '');
    const serial = (sensor.serial_no || '').trim().toLowerCase().replace(/[\s_-]/g, '');

    if (rawType === 'temperature') return 'temperature';
    // AQ-02 ultrasonic is the surface water-level probe in this deployment.
    if (serial.includes('aq02')) return 'water_surface';
    // Sewer/underground probe serials are usually AQ-03.
    if (serial.includes('aq03')) return 'water_underground';
    if (rawType === 'water level') return 'water_surface';
    if (rawType === 'sewage water level' || rawType === 'ultrasonic') return 'water_underground';
    if (compactType === 'rainintensity' || compactType === 'aq04rainintensity' || serial === 'aq04rainintensity') {
      return 'rain_intensity';
    }

    return 'other';
  };

  const normalizeSensorDisplayName = (sensor: SensorWithReadings): string => {
    const key = normalizeSensorTypeKey(sensor);
    if (key !== 'other') return SENSOR_DISPLAY_LABELS[key];

    return (sensor.type_name || '').trim() || 'Sensor';
  };

  const renderGraphTitle = (sensor: SensorWithReadings): React.ReactNode => {
    const key = normalizeSensorTypeKey(sensor);
    if (key === 'water_underground') {
      return (
        <>
          Water Level <strong>Underground</strong>
        </>
      );
    }
    if (key === 'water_surface') return 'Water Level Surface';
    if (key === 'rain_intensity') return 'Rain Intensity';
    if (key === 'temperature') return 'Temperature';
    return normalizeSensorDisplayName(sensor);
  };

  const graphSensors = useMemo(() => {
    const pickNewestByKey = new Map<CanonicalSensorKey, SensorWithReadings>();

    const latestTs = (sensor: SensorWithReadings): number => {
      const ts = sensor.readings?.[0]?.time_stamp;
      if (!ts) return -1;
      const parsed = new Date(ts).getTime();
      return Number.isFinite(parsed) ? parsed : -1;
    };

    for (const sensor of sensorsList) {
      const key = normalizeSensorTypeKey(sensor);
      // Surface water has a dedicated graph card sourced from /api/water-level-graph.
      if (key === 'other' || key === 'water_surface') continue;

      const current = pickNewestByKey.get(key);
      if (!current || latestTs(sensor) > latestTs(current)) {
        pickNewestByKey.set(key, sensor);
      }
    }

    return GRAPH_DISPLAY_ORDER
      .filter((key): key is Exclude<CanonicalSensorKey, 'water_surface'> => key !== 'water_surface')
      .map((key) => pickNewestByKey.get(key))
      .filter((sensor): sensor is SensorWithReadings => sensor !== undefined);
  }, [sensorsList]);

  const sensorCards = useMemo(() => {
    const pickNewestByKey = new Map<CanonicalSensorKey, SensorWithReadings>();

    const latestTs = (sensor: SensorWithReadings): number => {
      const ts = sensor.readings?.[0]?.time_stamp;
      if (!ts) return -1;
      const parsed = new Date(ts).getTime();
      return Number.isFinite(parsed) ? parsed : -1;
    };

    for (const sensor of sensorsList) {
      const key = normalizeSensorTypeKey(sensor);
      if (key === 'other') continue;

      const current = pickNewestByKey.get(key);
      if (!current || latestTs(sensor) > latestTs(current)) {
        pickNewestByKey.set(key, sensor);
      }
    }

    return SENSOR_SECTION_ORDER
      .map((key) => {
        const sensor = pickNewestByKey.get(key);
        return sensor ? { key, sensor } : null;
      })
      .filter((item): item is { key: CanonicalSensorKey; sensor: SensorWithReadings } => item !== null);
  }, [sensorsList]);

  const waterLevelGraphState = useMemo(() => {
    const hasRecentReading = waterLevelReadings.some((reading) => typeof reading.value === 'number');
    return hasRecentReading
      ? { isOn: true, reason: 'Reading' }
      : { isOn: false, reason: 'No reading for 6h' };
  }, [waterLevelReadings]);

  const graphsReady = sensorsLoadedOnce && waterLevelGraphLoadedOnce;

  const formatHourlyTime = (timeStr: string): string => {
    const date = new Date(timeStr);
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${date.getMinutes().toString().padStart(2, '0')} ${ampm.toLowerCase()}`;
  };

  const formatDailyDate = (dateStr: string, index: number): string => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {showCautionPopup && prediction && (
        <FloodPopup
          type="caution"
          timeRemaining={formatTimeRemaining(Math.max(0, Math.floor((new Date(prediction.predicted_hazard_ts).getTime() - Date.now()) / 1000)))}
          onClose={() => setShowCautionPopup(false)}
        />
      )}

      <main className="dashboard-main" style={{ maxWidth: 1400, margin: '18px auto', width: '100%', padding: '0 18px' }}>
        {dbUnavailable && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 10,
              color: '#fca5a5',
              fontSize: 14,
            }}
          >
            <strong>Database unavailable.</strong> Open{' '}
            <a href="/api/db-check" target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
              /api/db-check
            </a>{' '}
            in a new tab to see the exact reason and what to fix (e.g. Supabase paused, wrong DATABASE_URL, or network).
          </div>
        )}
        <div className="dashboard-grid">
          <div className="card main-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Automated Early Warning System</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="panel-title" style={{ fontSize: 26 }}>{locationName}</span>
                  {!dbUnavailable && (sensorsList.length > 0 || temperature.value !== null || waterLevel.value !== null) && (
                    <span className="muted" style={{ fontSize: 11, background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', padding: '4px 8px', borderRadius: 6 }}>Live from database</span>
                  )}
                </div>
                <div className="muted">
                  Chance of flood {prediction?.risk_score ? `${Math.round(prediction.risk_score * 100)}%` : 'N/A'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 900 }}>
                  {weatherTemperature !== null ? `${Math.round(weatherTemperature)}°` : '--°'}
                </div>
                <div style={{ opacity: 0.9 }}>
                  <svg width={48} height={28} viewBox="0 0 48 28" aria-hidden>
                    <circle cx="14" cy="14" r="10" fill="#9CA3AF" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="panel-inner">
                <div className="hour-cards-container">
                  {hourlyForecast.slice(0, 8).map((forecast, i) => (
                    <HourCard
                      key={i}
                      time={formatHourlyTime(forecast.time)}
                      temp={forecast.temp}
                      iconSrc={getForecastIcon(
                        forecast.condition,
                        forecast.is_day,
                        forecast.temp,
                        forecast.weather_code,
                        forecast.wind_kmh
                      )}
                    />
                  ))}
                  {hourlyForecast.length === 0 && (
                    <>
                      {[-2, -1, 0, 1, 2, 3, 4, 5].map((i) => (
                        <HourCard
                          key={i}
                          time={`${i >= 0 ? `+${i}` : i}h`}
                          temp={0}
                          iconSrc={getForecastIcon('Cloudy', true, 0)}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="panel-inner" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="panel-title" style={{ fontSize: 14, marginBottom: 16 }}>Air conditions</div>
                <div className="air-conditions-grid" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
                      <Image src="/temperature.svg" alt="Temperature" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Real feel</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 0, width: '100%', textAlign: 'center' }}>
                      {realFeel !== null ? `${Math.round(realFeel)}°` : '--°'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
                      <Image src={RaindropSvg} alt="Precipitation" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Precipitation</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 0, width: '100%', textAlign: 'center' }}>
                      {precipitation !== null ? `${precipitation.toFixed(1)} mm` : '-- mm'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
                      <Image src="/wind.svg" alt="Wind" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Wind</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 0, width: '100%', textAlign: 'center' }}>
                      {wind !== null ? `${wind.toFixed(1)} km/h` : '-- km/h'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
                      <Image src="/Water_Drop.svg" alt="Humidity" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Humidity</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 0, width: '100%', textAlign: 'center' }}>
                      {humidity !== null ? `${humidity} %` : '-- %'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
                      <Image src={EyeSvg} alt="Visibility" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Visibility</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 0, width: '100%', textAlign: 'center' }}>
                      {visibility !== null ? `${visibility >= 1000 ? `${(visibility / 1000).toFixed(1)} km` : `${Math.round(visibility)} m`}` : '--'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="panel-inner">
                <div className="panel-title" style={{ fontSize: 14, marginBottom: 12 }}>Sensor readings - {locationName}</div>
                {(() => {
                  if (sensorCards.length === 0 && !locationsLoading) {
                    return <div className="muted" style={{ padding: 16 }}>{dbUnavailable ? 'Database unavailable.' : 'No sensors for this location.'}</div>;
                  }
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {sensorCards.map(({ key, sensor }) => {
                        const latest = sensor.readings?.[0];
                        const value = latest ? Number(latest.raw_value) : null;
                        const displayName = SENSOR_DISPLAY_LABELS[key];
                        const displayValue = value !== null
                          ? key === 'rain_intensity'
                            ? `${Number.isInteger(value) ? value : value.toFixed(1)} ${sensor.unit || 'mm'}`
                            : `${typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}${sensor.unit ? ` ${sensor.unit}` : ''}`
                          : '--';
                        return (
                          <div
                            key={sensor.sensor_id}
                            style={{
                              padding: '10px 12px',
                              background: 'rgba(255,255,255,0.015)',
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{displayName}</div>
                            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.1 }}>{displayValue}</div>
                            {latest && (
                              <div className="muted" style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                                {new Date(latest.time_stamp).toLocaleString()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {!graphsReady && (
              <div className="dashboard-section">
                <div className="panel-inner">
                  <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="muted">Loading sensor graphs...</div>
                  </div>
                </div>
              </div>
            )}

            {graphsReady && (
              <div className="dashboard-section">
                <div className="panel-inner">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div className="panel-title" style={{ fontSize: 14 }}>Water Level Surface</div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: waterLevelGraphState.isOn ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                        color: waterLevelGraphState.isOn ? '#86efac' : '#fca5a5',
                      }}
                    >
                      {waterLevelGraphState.isOn ? 'ON' : 'OFF'} - {waterLevelGraphState.reason}
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 200, position: 'relative' }}>
                    {renderWaterLevelGraph()}
                  </div>
                </div>
              </div>
            )}

            {graphsReady && graphSensors.map((sensor) => {
              const displayName = renderGraphTitle(sensor);
              const graphReadings = sensorGraphReadings(sensor);
              const sensorKey = normalizeSensorTypeKey(sensor);
              const state = graphReadings.some((reading) => typeof reading.value === 'number')
                ? { isOn: true, reason: 'Reading' }
                : { isOn: false, reason: 'No reading for 6h' };
              return (
                <div className="dashboard-section" key={`graph-${sensor.sensor_id}`}>
                  <div className="panel-inner">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{displayName}</div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: state.isOn ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                          color: state.isOn ? '#86efac' : '#fca5a5',
                        }}
                      >
                        {state.isOn ? 'ON' : 'OFF'} - {state.reason}
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 200, position: 'relative' }}>
                      {(sensorKey === 'water_surface' || sensorKey === 'water_underground')
                        ? renderWaterLevelStyleSensorGraph(
                          graphReadings,
                          sensor.unit || 'cm'
                        )
                        : renderSensorGraph(
                          graphReadings,
                          sensor.unit || (
                            sensorKey === 'rain_intensity'
                              ? 'mm'
                              : sensorKey === 'temperature'
                                ? '°C'
                                : 'cm'
                          )
                        )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>

          <aside className="dashboard-sidebar">
            <div className="card countdown-card">
              <div className="panel-title">Count Down</div>
              <CountdownTimer
                predictedHazardTs={prediction?.predicted_hazard_ts ?? null}
                onShowCaution={() => setShowCautionPopup(true)}
              />
            </div>

            <div className="card forecast-card">
              <div className="panel-title">Days Forecast</div>
              <div style={{ marginTop: 12 }}>
                {dailyForecast.slice(0, 7).map((day, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image
                        src={getForecastIcon(day.condition, day.is_day, day.temp, day.weather_code, day.wind_kmh_max)}
                        alt="Daily forecast icon"
                        width={36}
                        height={36}
                      />
                      <div className="muted">{formatDailyDate(day.date, i)}</div>
                    </div>
                    <div className="muted">{`${day.condition || 'Cloudy'} • ${day.temp}°`}</div>
                  </div>
                ))}
                {dailyForecast.length === 0 && (
                  <>
                    {['Tomorrow', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                      <div
                        key={d}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          alignItems: 'center',
                          borderBottom: '1px solid rgba(255,255,255,0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Image src={getForecastIcon('Cloudy', true, 0)} alt="Daily forecast icon" width={36} height={36} />
                          <div className="muted">{d}</div>
                        </div>
                        <div className="muted">Cloudy • --°</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
