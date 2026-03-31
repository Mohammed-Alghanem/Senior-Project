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
        textAlign: 'center',
        padding: '0 8px',
      }}
    >
      <div
        style={{
          width: 74,
          height: 74,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image src={iconSrc} alt="Forecast icon" width={66} height={66} />
      </div>
      <div style={{ marginTop: 0, color: 'var(--text)', fontSize: 14 }}>{time}</div>
      <div style={{ marginTop: 2, color: 'var(--text)', fontWeight: 500, fontSize: 24, lineHeight: 1 }}>{temp}°</div>
    </div>
  );
}

function CountdownTimer({
  predictedHazardTs,
  predictionId,
  onShowCaution,
  onShowFlood,
}: {
  predictedHazardTs: string | null;
  predictionId: string | null;
  onShowCaution: () => void;
  onShowFlood: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const cautionShownRef = useRef(false);
  const floodShownRef = useRef(false);
  const onShowCautionRef = useRef(onShowCaution);
  const onShowFloodRef = useRef(onShowFlood);

  useEffect(() => {
    onShowCautionRef.current = onShowCaution;
    onShowFloodRef.current = onShowFlood;
  }, [onShowCaution, onShowFlood]);

  useEffect(() => {
    cautionShownRef.current = false;
    floodShownRef.current = false;

    if (predictionId && typeof window !== 'undefined') {
      const alreadyShown = window.localStorage.getItem(`flood-popup-shown:${predictionId}`) === '1';
      floodShownRef.current = alreadyShown;
    }

    if (!predictedHazardTs) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(null);
      return;
    }
    const hazardMs = new Date(predictedHazardTs).getTime();
    const initial = Math.max(0, Math.floor((hazardMs - Date.now()) / 1000));
    setTimeLeft(initial);
  }, [predictedHazardTs, predictionId]);

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
      if (next === 0 && !floodShownRef.current) {
        floodShownRef.current = true;
        if (predictionId && typeof window !== 'undefined') {
          window.localStorage.setItem(`flood-popup-shown:${predictionId}`, '1');
        }
        onShowFloodRef.current();
      }
      setTimeLeft(next);
    }, 1000);

    return () => clearInterval(timer);
  }, [predictedHazardTs, predictionId]);

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
  const [humidity, setHumidity] = useState<number | null>(null);
  const [wind, setWind] = useState<number | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);

  // Water level graph
  const [waterLevelReadings, setWaterLevelReadings] = useState<WaterLevelReading[]>([]);

  // Prediction
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  // Per-sensor data (Al Qatif): each sensor and its readings for correct display
  const [sensorsList, setSensorsList] = useState<SensorWithReadings[]>([]);
  const [dbUnavailable, setDbUnavailable] = useState(false);

  // Popups
  const [showCautionPopup, setShowCautionPopup] = useState(false);
  const [showFloodPopup, setShowFloodPopup] = useState(false);
  const [visibleGraphCount, setVisibleGraphCount] = useState(1);
  const floodPopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const pollMs = dbUnavailable ? 30000 : 7000;
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
      }
    };
    fetchSensorsForLocation();
    const t = setInterval(fetchSensorsForLocation, pollMs);
    return () => clearInterval(t);
  }, [locationId, dbUnavailable]);

  useEffect(() => {
    if (!locationId) return;
    const pollMs = dbUnavailable ? 30000 : 7000;

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
  }, [locationId, dbUnavailable]);

  useEffect(() => {
    if (!locationId) return;
    const pollMs = dbUnavailable ? 30000 : 7000;

    const fetchWaterLevelGraph = async () => {
      try {
        const res = await fetch(`/api/water-level-graph?location_id=${locationId}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (data.dbUnavailable) setDbUnavailable(true);
        else if (res.ok) setWaterLevelReadings(data.readings ?? []);
      } catch (err) {
        console.error('Error fetching water level graph', err);
      }
    };

    fetchWaterLevelGraph();
    const graphInterval = setInterval(fetchWaterLevelGraph, pollMs);
    return () => clearInterval(graphInterval);
  }, [locationId, dbUnavailable]);

  useEffect(() => {
    if (!locationId) return;
    const pollMs = dbUnavailable ? 30000 : 7000;

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
  }, [locationId, dbUnavailable]);

  useEffect(() => {
    const fetchCurrentWeather = async () => {
      try {
        const latLon = `lat=${lat}&lon=${lon}`;
        const currentRes = await fetch(`/api/weather?type=current&${latLon}`);
        if (currentRes.ok) {
          const currentData = await currentRes.json();
          const humidityValue = Number(currentData.humidity);
          setHumidity(Number.isFinite(humidityValue) ? humidityValue : null);
          setWind(currentData.wind != null ? parseFloat(currentData.wind) : null);
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

  useEffect(() => {
    return () => {
      if (floodPopupTimeoutRef.current) {
        clearTimeout(floodPopupTimeoutRef.current);
      }
    };
  }, []);

  const handleShowFloodPopup = () => {
    setShowFloodPopup(true);
    if (floodPopupTimeoutRef.current) {
      clearTimeout(floodPopupTimeoutRef.current);
    }
    // Keep flood alert visible for 1 minute once countdown hits zero.
    floodPopupTimeoutRef.current = setTimeout(() => {
      setShowFloodPopup(false);
      floodPopupTimeoutRef.current = null;
    }, 60000);
  };

  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderSensorGraph = (readings: WaterLevelReading[], unitLabel: string) => {
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

    const plotted = readings.map((reading, index) => {
      if (typeof reading.value !== 'number') return null;
      const x = 70 + (index * (690 / Math.max(readings.length - 1, 1)));
      const normalizedValue = ((reading.value as number) - minValue) / valueRange;
      const y = 150 - (normalizedValue * 120); // Invert Y axis
      return { x, y, value: reading.value as number };
    });

    const hourLabels = readings.map((reading, index) => {
      const date = new Date(reading.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return {
        x: 70 + (index * (690 / Math.max(readings.length - 1, 1))),
        label: `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`,
      };
    });

    return (
      <svg width="100%" height="100%" viewBox="0 0 820 200" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <line x1="70" y1="60" x2="760" y2="60" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1="120" x2="760" y2="120" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <line x1="70" y1="30" x2="70" y2="150" stroke="#E5E7EB" strokeWidth="2" />

        {/* Y-axis labels */}
        <text x="20" y="65" fontSize="13" fill="#E5E7EB">{maxValue.toFixed(1)} {unitLabel}</text>
        <text x="20" y="125" fontSize="13" fill="#E5E7EB">{minValue.toFixed(1)} {unitLabel}</text>

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

  const renderWaterLevelGraph = () => renderSensorGraph(waterLevelReadings, waterLevel.unit || 'cm');

  const sensorGraphReadings = (sensor: SensorWithReadings): WaterLevelReading[] => {
    const now = Date.now();
    const fourHoursAgo = now - 4 * 60 * 60 * 1000;
    const points = (sensor.readings || [])
      .map((r) => {
        const ts = new Date(r.time_stamp).getTime();
        return {
          ts,
          iso: new Date(ts).toISOString(),
          value: Number(r.raw_value),
        };
      })
      .filter((r) => Number.isFinite(r.ts) && Number.isFinite(r.value) && r.ts >= fourHoursAgo && r.ts <= now)
      .sort((a, b) => a.ts - b.ts);

    const sampled = points.slice(-11).map((p) => ({
      hour: p.iso,
      value: p.value,
      timestamp: p.iso,
    }));

    // Keep the same graph style: append current-time tick.
    const nowIso = new Date(now).toISOString();
    return [...sampled, { hour: nowIso, value: null, timestamp: nowIso }];
  };

  const sensorPowerState = (sensor: SensorWithReadings): { isOn: boolean; reason: string } => {
    const statusRaw = (sensor.status || '').toLowerCase();
    const connected =
      statusRaw.includes('online') ||
      statusRaw.includes('active') ||
      statusRaw.includes('connected') ||
      statusRaw.includes('on');

    const latestTs = sensor.readings?.[0]?.time_stamp ? new Date(sensor.readings[0].time_stamp).getTime() : null;
    const hasRecentReading = latestTs !== null && Date.now() - latestTs <= 60 * 60 * 1000;

    if (!connected) return { isOn: false, reason: 'Disconnected' };
    if (!hasRecentReading) return { isOn: false, reason: 'No reading for 1h' };
    return { isOn: true, reason: 'Reading' };
  };

  const graphSensors = useMemo(
    () =>
      sensorsList.filter((sensor) => {
        const type = sensor.type_name || '';
        const serial = sensor.serial_no || '';
        if (type === 'Power Outage') return false;
        if (type === 'Humidity') return false;
        if (serial === 'AQ-02-Ultrasonic') return false;
        return true;
      }),
    [sensorsList]
  );

  useEffect(() => {
    if (graphSensors.length === 0) {
      setVisibleGraphCount(0);
      return;
    }
    setVisibleGraphCount(1);
    let count = 1;
    const interval = setInterval(() => {
      count += 1;
      setVisibleGraphCount(Math.min(count, graphSensors.length));
      if (count >= graphSensors.length) clearInterval(interval);
    }, 220);
    return () => clearInterval(interval);
  }, [graphSensors.length]);

  const formatHourlyTime = (timeStr: string): string => {
    const date = new Date(timeStr);
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour} ${ampm}`;
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

      {showFloodPopup && (
        <FloodPopup
          type="flood"
          onClose={() => {
            setShowFloodPopup(false);
            if (floodPopupTimeoutRef.current) {
              clearTimeout(floodPopupTimeoutRef.current);
              floodPopupTimeoutRef.current = null;
            }
          }}
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
                  {temperature.value !== null ? `${Math.round(temperature.value)}°` : '--°'}
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

            <div className="two-panel-container dashboard-section">
              <div className="panel-inner" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="panel-title" style={{ fontSize: 14, marginBottom: 16 }}>Air Conditions</div>
                <div className="air-conditions-grid" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/temperature.svg" alt="Real Feel" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Real Feel</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>
                      {temperature.value !== null ? `${Math.round(temperature.value)}°` : '--°'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/wind.svg" alt="Wind" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Wind</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>
                      {wind !== null ? `${wind.toFixed(1)} km/h` : '-- km/h'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/Water_Drop.svg" alt="Humidity" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Humidity</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>
                      {humidity !== null ? `${humidity}%` : '--%'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/water_level.svg" alt="Water Level" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Water Level</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>
                      {waterLevel.value !== null ? `${waterLevel.value.toFixed(1)} ${waterLevel.unit || 'cm'}` : '-- cm'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel-inner">
                <div className="panel-title" style={{ fontSize: 14, marginBottom: 16 }}>System Status</div>
                <div className="system-status-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/pipe.svg" alt="Infrastructure" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Infrastructure</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginLeft: 32 }}>Stable</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/raindrop.svg" alt="Rain Intensity" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Rain Intensity</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginLeft: 32 }}>
                      {rainIntensity.value !== null
                        ? `${Number.isInteger(rainIntensity.value) ? rainIntensity.value : rainIntensity.value.toFixed(1)} ${rainIntensity.unit || 'mm'}`
                        : '-- mm'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="panel-inner">
                <div className="panel-title" style={{ fontSize: 14, marginBottom: 16 }}>Water Level</div>
                <div style={{ width: '100%', height: 200, position: 'relative' }}>
                  {renderWaterLevelGraph()}
                </div>
              </div>
            </div>

            {graphSensors.slice(0, visibleGraphCount).map((sensor, index) => {
              const state = sensorPowerState(sensor);
              const displayName = sensor.type_name ?? 'Sensor';
              const graphReadings = sensorGraphReadings(sensor);
              return (
                <div className="dashboard-section" key={`graph-${sensor.sensor_id}`}>
                  <div className="panel-inner">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div className="muted" style={{ fontSize: 10 }}>{sensor.serial_no ?? `ID ${sensor.sensor_id}`}</div>
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
                      {renderSensorGraph(graphReadings, sensor.unit || (sensor.type_name === 'Rain Intensity' ? 'mm' : 'cm'))}
                    </div>
                    {visibleGraphCount < graphSensors.length && sensor === graphSensors[visibleGraphCount - 1] && (
                      <div className="muted" style={{ paddingTop: 8, textAlign: 'center', fontSize: 12 }}>
                        Loading graphs...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="dashboard-section">
              <div className="panel-inner">
                <div className="panel-title" style={{ fontSize: 14, marginBottom: 8 }}>Sensors – Al Qatif</div>
                <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>Real Feel, Water Level, Rain Intensity, Sewage Water Level.</p>
                {(() => {
                  const fourTypes = ['Temperature', 'Water Level', 'Ultrasonic', 'Rain Intensity', 'Sewage Water Level'];
                  const displayNames: Record<string, string> = {
                    'Temperature': 'Real Feel',
                    'Water Level': 'Water Level',
                    'Ultrasonic': 'Water Level',
                    'Sewage Water Level': 'Sewage Water Level',
                    'Rain Intensity': 'Rain Intensity',
                  };
                  const filtered = sensorsList.filter((s) => fourTypes.includes(s.type_name || ''));
                  if (filtered.length === 0 && !locationsLoading) {
                    return <div className="muted" style={{ padding: 16 }}>{dbUnavailable ? 'Database unavailable.' : 'No sensors for this location.'}</div>;
                  }
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {filtered.map((sensor) => {
                        const latest = sensor.readings?.[0];
                        const value = latest ? Number(latest.raw_value) : null;
                        const displayName = displayNames[sensor.type_name || ''] ?? sensor.type_name ?? 'Sensor';
                        const displayValue = value !== null
                          ? sensor.type_name === 'Rain Intensity'
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
                            <div className="muted" style={{ fontSize: 10, marginBottom: 2, opacity: 0.75 }}>{sensor.serial_no ?? `ID ${sensor.sensor_id}`}</div>
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

          </div>

          <aside className="dashboard-sidebar">
            <div className="card countdown-card">
              <div className="panel-title">Count Down</div>
              <CountdownTimer
                predictedHazardTs={prediction?.predicted_hazard_ts ?? null}
                predictionId={prediction?.prediction_id ?? null}
                onShowCaution={() => setShowCautionPopup(true)}
                onShowFlood={handleShowFloodPopup}
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
