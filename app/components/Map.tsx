"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCallback } from 'react';
import { City } from '@/app/types';

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
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push('/dashboard')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') router.push('/dashboard');
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: 'pointer',
        }}
      >
        <Image
          src="/sa.svg"
          alt="Saudi Arabia flood risk map"
          fill
          priority
          style={{ objectFit: 'contain', objectPosition: 'center' }}
        />
      </div>

      {/* City Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 10,
        }}
      >
        {cities.slice(0, 2).map((city) => (
          <button
            key={city.id}
            onClick={() => router.push(`/city/${city.id}`)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#1E40AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E3A8A')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1E40AF')}
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
};
