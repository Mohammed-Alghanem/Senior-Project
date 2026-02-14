"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCallback } from 'react';
import { City } from '@/app/types';
import saMap from '../../sa.svg';

interface MapProps {
  cities: City[];
}

export const Map = ({ cities }: MapProps) => {
  const router = useRouter();

  const handleClick = useCallback(
    (provinceName: string) => {
      const city =
        cities.find((c) => c.region === provinceName) ||
        cities.find((c) => c.name === provinceName);
      if (city) {
        router.push(`/city/${city.id}`);
      }
    },
    [cities, router],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push('/dashboard')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') router.push('/dashboard');
      }}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 18px 45px rgba(15,23,42,0.65)',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <Image
        src={saMap}
        alt="Saudi Arabia flood risk map"
        fill
        priority
        style={{ objectFit: 'contain', objectPosition: 'center' }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
