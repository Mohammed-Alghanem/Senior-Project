'use client';

import Link from 'next/link';
import { Header } from '@/app/components/Header';

// Saudi Arabia is the only available country; Al Qatif (a city in Saudi Arabia) has flood monitoring.
const COUNTRIES = [
  { id: 'saudi-arabia', name: 'Saudi Arabia', initials: 'SA', available: true },
  { id: 'uae', name: 'United Arab Emirates', initials: 'AE', available: false },
  { id: 'kuwait', name: 'Kuwait', initials: 'KW', available: false },
];

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#000',
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(24px, 5vw, 64px) clamp(20px, 4vw, 48px)',
          width: '100%',
          boxSizing: 'border-box',
          background: '#000',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 960,
            textAlign: 'center',
            marginBottom: 'clamp(32px, 4vw, 48px)',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 700,
              color: '#f1f5f9',
              letterSpacing: '-0.03em',
              marginBottom: 10,
            }}
          >
            FloodSense
          </h1>
          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 17px)',
              color: '#94a3b8',
              lineHeight: 1.5,
            }}
          >
            Choose your country to view flood monitoring and alerts
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            width: '100%',
            maxWidth: 960,
          }}
        >
          {COUNTRIES.map((country) => {
            const isAvailable = country.available;

            const content = (
              <div
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  opacity: isAvailable ? 1 : 0.65,
                  cursor: isAvailable ? 'pointer' : 'default',
                  background: 'var(--panel)',
                  border: isAvailable
                    ? '1px solid rgba(148,163,184,0.18)'
                    : '1px solid rgba(148,163,184,0.08)',
                  boxShadow: isAvailable
                    ? '0 4px 20px rgba(0,0,0,0.25)'
                    : 'none',
                }}
                onMouseEnter={
                  isAvailable
                    ? (e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow =
                          '0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(56,189,248,0.15)';
                        e.currentTarget.style.borderColor =
                          'rgba(56,189,248,0.25)';
                      }
                    : undefined
                }
                onMouseLeave={
                  isAvailable
                    ? (e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow =
                          '0 4px 20px rgba(0,0,0,0.25)';
                        e.currentTarget.style.borderColor =
                          'rgba(148,163,184,0.18)';
                      }
                    : undefined
                }
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(16px, 3vw, 24px)',
                    padding: 'clamp(16px, 3vw, 24px) clamp(20px, 4vw, 28px)',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      minWidth: 56,
                      minHeight: 56,
                      borderRadius: 14,
                      background: 'var(--panel-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: '#fff',
                        lineHeight: 1,
                        padding: 0,
                        margin: 0,
                      }}
                      aria-hidden
                    >
                      {country.initials}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <h2
                      style={{
                        fontSize: 'clamp(17px, 2vw, 19px)',
                        fontWeight: 600,
                        color: isAvailable ? '#f1f5f9' : '#94a3b8',
                        margin: 0,
                      }}
                    >
                      {country.name}
                    </h2>
                  </div>
                  {isAvailable ? (
                    <span
                      style={{
                        fontSize: 'clamp(13px, 1.5vw, 14px)',
                        fontWeight: 600,
                        color: '#38bdf8',
                        flexShrink: 0,
                      }}
                    >
                      View cities →
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#64748b',
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(100,116,139,0.2)',
                        flexShrink: 0,
                      }}
                    >
                      Soon
                    </span>
                  )}
                </div>
              </div>
            );

            if (isAvailable) {
              return (
                <Link
                  key={country.id}
                  href={`/country/${country.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  {content}
                </Link>
              );
            }

            return <div key={country.id}>{content}</div>;
          })}
        </div>

        <p
          style={{
            marginTop: 'clamp(32px, 4vw, 48px)',
            fontSize: 13,
            color: '#475569',
          }}
        >
          More countries will be added as we expand coverage.
        </p>
      </main>
    </div>
  );
}
