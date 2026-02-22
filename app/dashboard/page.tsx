"use client";

import { Header } from '@/app/components/Header';
import { Container } from '@/app/components/Layout';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { mockDashboardData } from '@/app/data/mockData';

function HourCard({ t, temp }: { t: string; temp: number }) {
  return (
    <div style={{ minWidth: 64, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--panel-2)', margin: '0 auto' }} />
      <div style={{ marginTop: 8, color: 'var(--text)' }}>{t}</div>
      <div className="muted" style={{ fontSize: 12 }}>{temp}°</div>
    </div>
  );
}

function CountdownTimer({ initialTime, totalTime = 21600 }: { initialTime?: number; totalTime?: number }) {
  // totalTime: what represents a full circle (default: 6 hours = 21600 seconds)
  // initialTime: starting countdown time in seconds (defaults to totalTime if not provided)
  const [timeLeft, setTimeLeft] = useState(initialTime ?? totalTime);
  
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  
  // Calculate progress based on totalTime (1 when full time, 0 when no time left)
  const progress = timeLeft / totalTime;
  const circumference = 2 * Math.PI * 48;
  const strokeDashoffset = circumference * (1 - progress);
  
  const isSafe = timeLeft === 0;
  
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={120} height={120} viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r="48" stroke="#374151" strokeWidth={10} fill="rgba(255,255,255,0.02)" />
        <circle 
          cx="60" 
          cy="60" 
          r="48" 
          stroke="#6B7280" 
          strokeWidth={10} 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {isSafe ? (
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

export default function DashboardPage() {
  const data = mockDashboardData;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="dashboard-main" style={{ maxWidth: 1400, margin: '18px auto', width: '100%', padding: '0 18px' }}>
        <div className="dashboard-grid">
          <div className="card main-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Automated Early Warning System</div>
                <div className="panel-title" style={{ fontSize: 26 }}>Qatif</div>
                <div className="muted">Chance of flood 70%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 900 }}>31°</div>
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
                    <HourCard key={t} t={t} temp={30 - i} />
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
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>30°</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/wind.svg" alt="Wind" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Wind</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>0.2 km/h</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/Water_Drop.svg" alt="Humidity" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Humidity</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>30%</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src="/water_level.svg" alt="Water Level" width={24} height={24} />
                      <div className="muted" style={{ fontSize: 12 }}>Water Level</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginLeft: 32 }}>1 cm</div>
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
                    <div style={{ fontWeight: 700, fontSize: 16, marginLeft: 32 }}>good</div>
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
                    <div style={{ fontWeight: 700, fontSize: 16, marginLeft: 32 }}>20%</div>
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
                    <polyline points="70,115 130,95 200,125 270,105 340,120 410,100 480,95 550,125 620,70 690,105 760,120" 
                              fill="none" stroke="#6B7280" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Data points */}
                    <circle cx="70" cy="115" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="130" cy="95" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="200" cy="125" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="270" cy="105" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="340" cy="120" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="410" cy="100" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="480" cy="95" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="550" cy="125" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="620" cy="70" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="690" cy="105" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="760" cy="120" r="5" fill="#6B7280" stroke="#FFFFFF" strokeWidth="2" />
                    
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
              <CountdownTimer initialTime={10020} />
            </div>

            <div className="card forecast-card">
              <div className="panel-title">Days Forecast</div>
              <div style={{ marginTop: 12 }}>
                {['Tomorrow','Tue','Wed','Thu','Fri'].map((d) => (
                  <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <div className="muted">{d}</div>
                    <div className="muted">25°</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card stats-card">
              <div className="panel-title">Quick Stats</div>
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Image src="/temperature.svg" alt="Real Feel" width={20} height={20} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                    <div className="muted">Real Feel</div>
                    <div>30°</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Image src="/Water_Drop.svg" alt="Humidity" width={20} height={20} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                    <div className="muted">Humidity</div>
                    <div>30%</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Image src="/water_level.svg" alt="Water Level" width={20} height={20} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                    <div className="muted">Water Level</div>
                    <div>1 cm</div>
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
