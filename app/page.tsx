"use client";

import dynamic from 'next/dynamic';
import { Header } from '@/app/components/Header';
import { Container } from '@/app/components/Layout';
import { mockDashboardData } from '@/app/data/mockData';
import React from 'react';

const Map = dynamic(() => import('@/app/components/Map').then((mod) => mod.Map), {
  ssr: false,
  loading: () => <div>Loading map...</div>,
});

export default function HomeMapPage() {
  const data = mockDashboardData;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Container padding="0px">
          <div className="map-frame">
            <Map cities={data.cities} />
          </div>
        </Container>
      </main>
    </div>
  );
}
