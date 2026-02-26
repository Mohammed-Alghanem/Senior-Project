'use client';

import { Header } from '@/app/components/Header';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FloodPopup } from '@/app/components/FloodPopup';

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
  icon?: string;
};

type DailyForecast = {
  date: string;
  temp: number;
  min: number;
  max: number;
};

type WaterLevelReading = {
  hour: string;
  value: number;
  timestamp: string;
};

type Prediction = {
  prediction_id: string;
  predicted_hazard_ts: string;
  risk_level: string | null;
  risk_score: number | null;
  seconds_until_hazard: number;
};

function HourCard({ time, temp }: { time: string; temp: number }) {
  return (
    <div style={{ minWidth: 64, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--panel-2)', margin: '0 auto' }} />
      <div style={{ marginTop: 8, color: 'var(--text)' }}>{time}</div>
      <div className="muted" style={{ fontSize: 12 }}>{temp}°</div>
    </div>
  );
}

function CountdownTimer({
  secondsUntilHazard,
  onShowCaution,
  onShowFlood,
}: {
  secondsUntilHazard: number | null;
  onShowCaution: () => void;
  onShowFlood: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(secondsUntilHazard);
  const [hasShownCaution, setHasShownCaution] = useState(false);
  const [hasShownFlood, setHasShownFlood] = useState(false);

  useEffect(() => {
    setTimeLeft(secondsUntilHazard);
    setHasShownCaution(false);
    setHasShownFlood(false);
  }, [secondsUntilHazard]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft !== null && timeLeft <= 0 && !hasShownFlood) {
        setHasShownFlood(true);
        onShowFlood();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        const newTime = Math.max(0, prev - 1);
        
        // Show caution popup if less than 1 hour remaining
        if (newTime < 3600 && newTime > 0 && !hasShownCaution) {
          setHasShownCaution(true);
          onShowCaution();
        }
        
        // Show flood popup if time is up
        if (newTime === 0 && !hasShownFlood) {
          setHasShownFlood(true);
          onShowFlood();
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, hasShownCaution, hasShownFlood, onShowCaution, onShowFlood]);

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

export default function DashboardPage() {
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Sensor data
  const [temperature, setTemperature] = useState<SensorData>({ value: null, unit: null });
  const [waterLevel, setWaterLevel] = useState<SensorData>({ value: null, unit: null });
  const [powerOutage, setPowerOutage] = useState<SensorData>({ value: null, unit: null });
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

  // Popups
  const [showCautionPopup, setShowCautionPopup] = useState(false);
  const [showFloodPopup, setShowFloodPopup] = useState(false);

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

    const fetchSensorData = async () => {
      try {
        // Temperature
        const tempRes = await fetch(`/api/sensors?type=Temperature&location_id=${locationId}`);
        if (tempRes.ok) {
          const tempData = await tempRes.json();
          setTemperature({ value: tempData.value, unit: tempData.unit });
        }

        // Water Level (Ultrasonic)
        const waterRes = await fetch(`/api/sensors?type=Ultrasonic&location_id=${locationId}`);
        if (waterRes.ok) {
          const waterData = await waterRes.json();
          setWaterLevel({ value: waterData.value, unit: waterData.unit });
        }

        // Power Outage
        const powerRes = await fetch(`/api/sensors?type=Power Outage&location_id=${locationId}`);
        if (powerRes.ok) {
          const powerData = await powerRes.json();
          setPowerOutage({ value: powerData.value, unit: powerData.unit });
        }

        // Rain Intensity
        const rainRes = await fetch(`/api/sensors?type=Rain Intensity&location_id=${locationId}`);
        if (rainRes.ok) {
          const rainData = await rainRes.json();
          setRainIntensity({ value: rainData.value, unit: rainData.unit });
        }
      } catch (err) {
        console.error('Error fetching sensor data', err);
      }
    };

    fetchSensorData();
    const sensorInterval = setInterval(fetchSensorData, 5000); // Refresh every 5 seconds so sensor updates (e.g. rain 54% -> 56%) show immediately
    return () => clearInterval(sensorInterval);
  }, [locationId]);

  useEffect(() => {
    if (!locationId) return;

    const fetchWaterLevelGraph = async () => {
      try {
        const res = await fetch(`/api/water-level-graph?location_id=${locationId}`);
        if (res.ok) {
          const data = await res.json();
          setWaterLevelReadings(data.readings ?? []);
        }
      } catch (err) {
        console.error('Error fetching water level graph', err);
      }
    };

    fetchWaterLevelGraph();
    const graphInterval = setInterval(fetchWaterLevelGraph, 15000); // Refresh every 15 seconds
    return () => clearInterval(graphInterval);
  }, [locationId]);

  useEffect(() => {
    if (!locationId) return;

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
    const predictionInterval = setInterval(fetchPrediction, 30000); // Refresh every 30 seconds
    return () => clearInterval(predictionInterval);
  }, [locationId]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const latLon = `lat=${lat}&lon=${lon}`;

        const currentRes = await fetch(`/api/weather?type=current&${latLon}`);
        if (currentRes.ok) {
          const currentData = await currentRes.json();
          setHumidity(currentData.humidity ?? null);
          setWind(currentData.wind != null ? parseFloat(currentData.wind) : null);
        }

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
        console.error('Error fetching weather', err);
      }
    };

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 300000);
    return () => clearInterval(weatherInterval);
  }, [lat, lon]);

  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderWaterLevelGraph = () => {
    if (waterLevelReadings.length === 0) {
      return (
        <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="muted">No water level data available</div>
        </div>
      );
    }

    const maxValue = Math.max(...waterLevelReadings.map((r) => r.value), 1);
    const minValue = Math.min(...waterLevelReadings.map((r) => r.value), 0);
    const valueRange = maxValue - minValue || 1;

    const points = waterLevelReadings.map((reading, index) => {
      const x = 70 + (index * (690 / Math.max(waterLevelReadings.length - 1, 1)));
      const normalizedValue = (reading.value - minValue) / valueRange;
      const y = 150 - (normalizedValue * 120); // Invert Y axis
      return `${x},${y}`;
    }).join(' ');

    const hourLabels = waterLevelReadings.map((reading, index) => {
      const date = new Date(reading.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return {
        x: 70 + (index * (690 / Math.max(waterLevelReadings.length - 1, 1))),
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
        <text x="20" y="65" fontSize="13" fill="#E5E7EB">{maxValue.toFixed(1)} cm</text>
        <text x="20" y="125" fontSize="13" fill="#E5E7EB">{minValue.toFixed(1)} cm</text>

        {/* Chart line */}
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke="#6B7280"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {waterLevelReadings.map((reading, index) => {
          const x = 70 + (index * (690 / Math.max(waterLevelReadings.length - 1, 1)));
          const normalizedValue = (reading.value - minValue) / valueRange;
          const y = 150 - (normalizedValue * 120);
          return (
            <circle key={index} cx={x} cy={y} r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
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

  const formatHourlyTime = (timeStr: string): string => {
    const date = new Date(timeStr);
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour} ${ampm}`;
  };

  const formatDailyDate = (dateStr: string, index: number): string => {
    if (index === 0) return 'Tomorrow';
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
          timeRemaining={formatTimeRemaining(prediction.seconds_until_hazard)}
          onClose={() => setShowCautionPopup(false)}
        />
      )}

      {showFloodPopup && (
        <FloodPopup type="flood" onClose={() => setShowFloodPopup(false)} />
      )}

      <main className="dashboard-main" style={{ maxWidth: 1400, margin: '18px auto', width: '100%', padding: '0 18px' }}>
        <div className="dashboard-grid">
          <div className="card main-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Automated Early Warning System</div>
                <div className="panel-title" style={{ fontSize: 26 }}>{locationName}</div>
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
                  {hourlyForecast.slice(0, 6).map((forecast, i) => (
                    <HourCard key={i} time={formatHourlyTime(forecast.time)} temp={forecast.temp} />
                  ))}
                  {hourlyForecast.length === 0 && (
                    <>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <HourCard key={i} time={`+${i + 1}h`} temp={0} />
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
                      <Image src="/power_meter.svg" alt="Power Outage" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Power Outage</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginLeft: 32 }}>
                      {powerOutage.value !== null ? (powerOutage.value > 0 ? 'good' : 'outage') : '--'}
                    </div>
                  </div>
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
                      {rainIntensity.value !== null ? `${Math.round(rainIntensity.value)}%` : '--%'}
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

          </div>

          <aside className="dashboard-sidebar">
            <div className="card countdown-card">
              <div className="panel-title">Count Down</div>
              <CountdownTimer
                secondsUntilHazard={prediction?.seconds_until_hazard ?? null}
                onShowCaution={() => setShowCautionPopup(true)}
                onShowFlood={() => setShowFloodPopup(true)}
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
                    <div className="muted">{formatDailyDate(day.date, i)}</div>
                    <div className="muted">{day.temp}°</div>
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
                        <div className="muted">{d}</div>
                        <div className="muted">--°</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="card stats-card">
              <div className="panel-title">Quick Stats</div>
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Image src="/temperature.svg" alt="Real Feel" width={20} height={20} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                    <div className="muted">Real Feel</div>
                    <div>{temperature.value !== null ? `${Math.round(temperature.value)}°` : '--°'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Image src="/Water_Drop.svg" alt="Humidity" width={20} height={20} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                    <div className="muted">Humidity</div>
                    <div>{humidity !== null ? `${humidity}%` : '--%'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Image src="/water_level.svg" alt="Water Level" width={20} height={20} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                    <div className="muted">Water Level</div>
                    <div>
                      {waterLevel.value !== null ? `${waterLevel.value.toFixed(1)} ${waterLevel.unit || 'cm'}` : '-- cm'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
