'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/app/components/Header';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type CityRow = {
  id: string;
  city: string;
  name: string;
  risk_class: string | null;
  coordinates: string | null;
  location_id?: string;
};

const COUNTRY_NAMES: Record<string, string> = {
  'saudi-arabia': 'Saudi Arabia',
  uae: 'United Arab Emirates',
  kuwait: 'Kuwait',
};

const RISK_STYLES: Record<string, { bg: string; text: string }> = {
  none: { bg: 'rgba(156,163,175,0.2)', text: 'rgba(230,238,248,0.9)' },
  low: { bg: 'rgba(252,211,77,0.25)', text: '#fcd34d' },
  medium: { bg: 'rgba(251,146,60,0.25)', text: '#fb923c' },
  high: { bg: 'rgba(248,113,113,0.25)', text: '#f87171' },
};

export default function CountryCitiesPage() {
  const params = useParams();
  const country = (params?.country as string) || '';

  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!country) return;

    const fetchCities = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/countries/${country}/cities`);
        if (!res.ok) throw new Error('Failed to load cities');
        const data = await res.json();
        setCities(data.cities ?? []);
      } catch (err) {
        console.error(err);
        setError('Could not load cities.');
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [country]);

  const countryName = COUNTRY_NAMES[country] || country.replace(/-/g, ' ');
  const isSaudi = country === 'saudi-arabia';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#050506' }}>
      <Header />

      <main style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '24px 20px 48px' }}>
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/"
            style={{
              fontSize: 14,
              color: 'rgba(156,163,175,0.95)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 16,
            }}
          >
            ← Back to countries
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            {countryName}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(156,163,175,0.9)' }}>
            Select a city to view flood monitoring and dashboard
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(156,163,175,0.9)' }}>
            Loading cities…
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: 24, background: 'rgba(248,113,113,0.1)', borderRadius: 12, color: '#f87171' }}>
            {error}
          </div>
        )}

        {!loading && !error && cities.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(156,163,175,0.8)' }}>
            No cities available for this country yet.
          </div>
        )}

        {!loading && !error && cities.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {cities.map((city) => {
              const risk = (city.risk_class || 'none').toLowerCase();
              const style = RISK_STYLES[risk] || RISK_STYLES.none;

              return (
                <Link
                  key={city.id}
                  href={isSaudi ? '/dashboard' : '#'}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      background: 'rgba(252,252,252,0.1)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 16,
                      padding: 24,
                      transition: 'all 0.2s ease',
                      cursor: isSaudi ? 'pointer' : 'default',
                    }}
                    onMouseEnter={isSaudi ? (e) => {
                      e.currentTarget.style.background = 'rgba(252,252,252,0.16)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                    } : undefined}
                    onMouseLeave={isSaudi ? (e) => {
                      e.currentTarget.style.background = 'rgba(252,252,252,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    } : undefined}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: 0 }}>
                        {city.city}
                      </h2>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: style.bg,
                          color: style.text,
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {risk}
                      </span>
                    </div>
                    {city.name !== city.city && (
                      <p style={{ fontSize: 13, color: 'rgba(156,163,175,0.8)', marginTop: 8 }}>
                        {city.name}
                      </p>
                    )}
                    {isSaudi && (
                      <p style={{ fontSize: 13, color: 'rgba(156,163,175,0.6)', marginTop: 12 }}>
                        View dashboard →
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
