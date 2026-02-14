'use client';

import { useParams } from 'next/navigation';
import { getCityById } from '@/app/data/mockData';
import { Header } from '@/app/components/Header';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/app/components/Map').then((m) => m.Map), { ssr: false });

function HourCard({ t, temp }: { t: string; temp: number }) {
  return (
    <div style={{ minWidth: 64, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--panel-2)', margin: '0 auto' }} />
      <div style={{ marginTop: 8, color: 'var(--text)' }}>{t}</div>
      <div className="muted" style={{ fontSize: 12 }}>{temp}°</div>
    </div>
  );
}

function CountdownTimer({ initialTime, totalTime = 21600, isSafeMode = false, countdownColor = '#6B7280' }: { initialTime?: number; totalTime?: number; isSafeMode?: boolean; countdownColor?: string }) {
  // totalTime: what represents a full circle (default: 6 hours = 21600 seconds)
  // initialTime: starting countdown time in seconds (defaults to totalTime if not provided)
  const [timeLeft, setTimeLeft] = useState(isSafeMode ? 0 : (initialTime ?? totalTime));
  
  useEffect(() => {
    if (timeLeft <= 0 || isSafeMode) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, isSafeMode]);
  
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  
  // Calculate progress based on totalTime (1 when full time, 0 when no time left)
  const progress = isSafeMode ? 1 : (timeLeft / totalTime);
  const circumference = 2 * Math.PI * 48;
  const strokeDashoffset = circumference * (1 - progress);
  
  const displaySafe = isSafeMode || timeLeft === 0;
  
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={120} height={120} viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r="48" stroke="#374151" strokeWidth={10} fill="rgba(255,255,255,0.02)" />
        <circle 
          cx="60" 
          cy="60" 
          r="48" 
          stroke={countdownColor}
          strokeWidth={10} 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {displaySafe ? (
          <text x="60" y="68" textAnchor="middle" fontSize={20} fill="#E6EEF8" fontWeight={700}>Safe</text>
        ) : (
          <text x="60" y="68" textAnchor="middle" fontSize={18} fill="#E6EEF8" fontWeight={700}>
            {`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
          </text>
        )}
      </svg>
    </div>
  );
}

export default function CityDetail() {
  const params = useParams();
  const cityId = params.id as string;
  const city = getCityById(cityId);

  if (!city) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Header />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>City Not Found</div>
          <button onClick={() => window.location.href = '/dashboard'} style={{ cursor: 'pointer' }}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // Customize data based on city
  const isRiyadh = cityId === 'riyadh';
  const isJeddah = cityId === 'jeddah';
  
  const isSafeMode = isRiyadh;
  const countdownColor = isJeddah ? '#EF4444' : '#6B7280';
  const waterChartColor = isJeddah ? '#EF4444' : '#6B7280';
  
  // Get flood risk percentage and temperature
  const floodRiskPercentage = isRiyadh ? 5 : (city.floodData.floodRisk === 'low' ? 20 : city.floodData.floodRisk === 'medium' ? 50 : 70);
  const temperature = isRiyadh ? 32 : (28 + Math.floor(Math.random() * 8));
  
  // Custom water level data for Jeddah (showing increase and danger)
  const waterLevelPoints = isJeddah 
    ? "70,140 130,130 200,125 270,115 340,105 410,95 480,85 550,75 620,50 690,30 760,20"
    : "70,115 130,95 200,125 270,105 340,120 410,100 480,95 550,125 620,70 690,105 760,120";

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="dashboard-main" style={{ maxWidth: 1400, margin: '18px auto', width: '100%', padding: '0 18px' }}>
        <div className="dashboard-grid">
          <div className="card main-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Automated Early Warning System</div>
                <div className="panel-title" style={{ fontSize: 26 }}>{city.name}</div>
                <div className="muted">Chance of flood {floodRiskPercentage}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 900 }}>{temperature}°</div>
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
                  {['6 AM','8 AM','10 AM','12 PM','2 PM','4 PM','6 PM'].map((t, i) => (
                    <HourCard key={t} t={t} temp={temperature - i} />
                  ))}
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
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>{temperature - 2}°</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/wind.svg" alt="Wind" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Wind</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>{(Math.random() * 2).toFixed(1)} km/h</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/Water_Drop.svg" alt="Humidity" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Humidity</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>{40 + Math.floor(Math.random() * 40)}%</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/water_level.svg" alt="Water Level" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Water Level</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>{isRiyadh ? 5 : city.floodData.waterLevel} cm</div>
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
                    <div style={{ fontWeight: 700, fontSize: 16, marginLeft: 32 }}>{isRiyadh ? 'good' : 'warning'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/pipe.svg" alt="Infrastructure" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Infrastructure</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginLeft: 32 }}>{isRiyadh ? 'Stable' : 'At Risk'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/raindrop.svg" alt="Rain Intensity" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Rain Intensity</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginLeft: 32 }}>{isRiyadh ? '0%' : '65%'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="panel-inner">
                <div className="panel-title" style={{ fontSize: 14, marginBottom: 16 }}>Water Level</div>
                <div style={{ width: '100%', height: 200, position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 820 200" preserveAspectRatio="xMidYMid meet">
                    {/* Horizontal dashed grid lines */}
                    <line x1="70" y1="60" x2="760" y2="60" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                    <line x1="70" y1="120" x2="760" y2="120" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                    
                    {/* Vertical dashed grid lines */}
                    <line x1="130" y1="30" x2="130" y2="150" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    <line x1="200" y1="30" x2="200" y2="150" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    <line x1="270" y1="30" x2="270" y2="150" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    <line x1="340" y1="30" x2="340" y2="150" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    <line x1="410" y1="30" x2="410" y2="150" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    <line x1="480" y1="30" x2="480" y2="150" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    <line x1="550" y1="30" x2="550" y2="150" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    <line x1="620" y1="30" x2="620" y2="150" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    <line x1="690" y1="30" x2="690" y2="150" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    
                    {/* Y-axis labels */}
                    <text x="20" y="65" fontSize="13" fill="#E5E7EB">2 cm</text>
                    <text x="20" y="125" fontSize="13" fill="#E5E7EB">1 cm</text>
                    
                    {/* Vertical axis line */}
                    <line x1="70" y1="30" x2="70" y2="150" stroke="#E5E7EB" strokeWidth="2" />
                    
                    {/* Chart line */}
                    {isJeddah ? (
                      <>
                        {/* Gray line for first 9 points */}
                        <polyline points="70,140 130,130 200,125 270,115 340,105 410,95 480,85 550,75 620,50 690,30"
                                  fill="none" stroke="#6B7280" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        {/* Red line for last 2 points showing spike */}
                        <polyline points="690,30 760,20"
                                  fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    ) : (
                      <polyline points={waterLevelPoints}
                                fill="none" stroke={waterChartColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    
                    {/* Data points */}
                    <circle cx="70" cy={isJeddah ? "140" : "115"} r="5" fill={isJeddah ? "#6B7280" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="130" cy={isJeddah ? "130" : "95"} r="5" fill={isJeddah ? "#6B7280" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="200" cy={isJeddah ? "125" : "125"} r="5" fill={isJeddah ? "#6B7280" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="270" cy={isJeddah ? "115" : "105"} r="5" fill={isJeddah ? "#6B7280" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="340" cy={isJeddah ? "105" : "120"} r="5" fill={isJeddah ? "#6B7280" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="410" cy={isJeddah ? "95" : "100"} r="5" fill={isJeddah ? "#6B7280" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="480" cy={isJeddah ? "85" : "95"} r="5" fill={isJeddah ? "#6B7280" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="550" cy={isJeddah ? "75" : "125"} r="5" fill={isJeddah ? "#6B7280" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="620" cy={isJeddah ? "50" : "70"} r="5" fill={isJeddah ? "#6B7280" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="690" cy={isJeddah ? "30" : "105"} r="5" fill={isJeddah ? "#EF4444" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="760" cy={isJeddah ? "20" : "120"} r="5" fill={isJeddah ? "#EF4444" : waterChartColor} stroke="#FFFFFF" strokeWidth="2" />
                    
                    {/* X-axis labels */}
                    <text x="70" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">5:00 AM</text>
                    <text x="130" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">6:00 AM</text>
                    <text x="200" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">7:00 AM</text>
                    <text x="270" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">8:00 AM</text>
                    <text x="340" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">9:00 AM</text>
                    <text x="410" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">10:00 AM</text>
                    <text x="480" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">11:00 AM</text>
                    <text x="550" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">12:00 PM</text>
                    <text x="620" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">1:00 PM</text>
                    <text x="690" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">2:00 PM</text>
                    <text x="760" y="175" fontSize="12" fill="#E5E7EB" textAnchor="middle">3:00 PM</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <aside className="dashboard-sidebar">
            <div className="card countdown-card">
              <div className="panel-title">Count Down</div>
              <CountdownTimer isSafeMode={isSafeMode} initialTime={isJeddah ? 5400 : undefined} countdownColor={countdownColor} />
            </div>

            <div className="card forecast-card">
              <div className="panel-title">Days Forecast</div>
              <div style={{ marginTop: 12 }}>
                {['Tomorrow','Tue','Wed','Thu','Fri'].map((d) => (
                  <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <div className="muted">{d}</div>
                    <div className="muted">{temperature - 3}°</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card stats-card">
              <div className="panel-title">Statistics</div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Affected Areas</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{isRiyadh ? 0 : city.floodData.affectedAreas}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Evacuated People</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{isRiyadh ? 0 : city.floodData.evacuatedPeople.toLocaleString()}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Damage Estimate</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>${isRiyadh ? '0' : city.floodData.damageEstimate}M</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
