"use client";

import { Header } from '@/app/components/Header';
import { Container } from '@/app/components/Layout';
import React from 'react';
import dynamic from 'next/dynamic';
import { mockDashboardData } from '@/app/data/mockData';

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

export default function DashboardPage() {
  const data = mockDashboardData;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: '18px auto', width: '100%', padding: '0 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>
          <div className="card">
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

            <div style={{ marginTop: 18 }}>
              <div className="panel-inner">
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
                  {['6 AM','8 AM','10 AM','12 PM','2 PM','4 PM','6 PM'].map((t, i) => (
                    <HourCard key={t} t={t} temp={30 - i} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div className="panel-inner">
                <div className="panel-title" style={{ fontSize: 14, marginBottom: 8 }}>Air Conditions</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div className="muted">Real Feel</div>
                    <div style={{ fontWeight: 700 }}>30°</div>
                  </div>
                  <div>
                    <div className="muted">Wind</div>
                    <div style={{ fontWeight: 700 }}>0.2 km/h</div>
                  </div>
                  <div>
                    <div className="muted">Humidity</div>
                    <div style={{ fontWeight: 700 }}>30%</div>
                  </div>
                  <div>
                    <div className="muted">Water Level</div>
                    <div style={{ fontWeight: 700 }}>1 cm</div>
                  </div>
                </div>
              </div>

              <div className="panel-inner">
                <div className="panel-title" style={{ fontSize: 14, marginBottom: 8 }}>Water Level</div>
                <div style={{ height: 140 }}>
                  <svg width="100%" height="140" viewBox="0 0 600 140" preserveAspectRatio="none" aria-hidden>
                    <polyline points="0,80 60,60 120,70 180,55 240,65 300,45 360,75 420,58 480,70 540,62 600,70" fill="none" stroke="#9CA3AF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Map cities={data.cities} />
            </div>
          </div>

          <aside style={{ display: 'grid', gap: 20 }}>
            <div className="card">
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

            <div className="card">
              <div className="panel-title">Count Down</div>
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={120} height={120} viewBox="0 0 120 120" aria-hidden>
                  <circle cx="60" cy="60" r="48" stroke="#374151" strokeWidth={10} fill="rgba(255,255,255,0.02)" />
                  <path d="M60 12a48 48 0 1048 48" stroke="#6B7280" strokeWidth={10} fill="none" strokeLinecap="round" />
                  <text x="60" y="68" textAnchor="middle" fontSize={20} fill="#E6EEF8" fontWeight={700}>Safe</text>
                </svg>
              </div>
            </div>

            <div className="card">
              <div className="panel-title">Quick Stats</div>
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><div className="muted">Real Feel</div><div>30°</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><div className="muted">Humidity</div><div>30%</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><div className="muted">Water Level</div><div>1 cm</div></div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
