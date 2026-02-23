'use client';

import { useParams } from 'next/navigation';
import { getCityById } from '@/app/data/mockData';
import { Header } from '@/app/components/Header';
import { AreasList } from '@/app/components/AreasList';

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
          <button onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="dashboard-main" style={{ maxWidth: 1400, margin: '18px auto', width: '100%', padding: '0 18px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'white' }}>{city.name}</h1>
          <div className="muted" style={{ fontSize: 14 }}>Select an area to view details</div>
        </div>

        <AreasList areas={city.areas} cityId={cityId} />
      </main>
    </div>
  );
}
