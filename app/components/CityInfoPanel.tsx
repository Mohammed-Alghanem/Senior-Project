'use client';

import Image from 'next/image';
import { floodRiskColors, waterLevelColors } from '@/app/styles/colors';
import { FloodData } from '@/app/types';

interface InfoCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

const InfoCard = ({ label, value, icon, color, size = 'medium' }: InfoCardProps) => {
  const sizes = {
    small: { padding: '12px 16px', fontSize: '13px' },
    medium: { padding: '16px 20px', fontSize: '14px' },
    large: { padding: '20px 24px', fontSize: '16px' },
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `2px solid ${color || '#E5E7EB'}`,
        borderRadius: '8px',
        ...sizes[size],
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
      }}
    >
      {icon && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image src={icon} alt={label} width={20} height={20} style={{ filter: `invert(${color === '#6B7280' ? '0' : '100%'})` }} />
        </div>
      )}
      <div>
        <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
          {label}
        </p>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', marginTop: '4px' }}>
          {value}
        </p>
      </div>
    </div>
  );
};

interface CityInfoPanelProps {
  cityName: string;
  region: string;
  population: number;
  floodData: FloodData;
}

export const CityInfoPanel = ({
  cityName,
  region,
  population,
  floodData,
}: CityInfoPanelProps) => {
  const getRiskColor = (risk: string) => {
    return floodRiskColors[risk as keyof typeof floodRiskColors] || '#6B7280';
  };

  const getWaterLevelColor = (status: string) => {
    return waterLevelColors[status as keyof typeof waterLevelColors] || '#6B7280';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
          {cityName}
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          {region} • Population: {population.toLocaleString()}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <InfoCard
          label="Flood Risk"
          value={floodData.floodRisk.toUpperCase()}
          icon="/raindrop.svg"
          color={getRiskColor(floodData.floodRisk)}
          size="small"
        />
        <InfoCard
          label="Water Level"
          value={`${floodData.waterLevel} cm`}
          icon="/water_level.svg"
          color={getWaterLevelColor(floodData.waterLevelStatus)}
          size="small"
        />
      </div>

      <div
        style={{
          background: '#F9FAFB',
          borderRadius: '8px',
          padding: '16px',
          borderLeft: `4px solid ${getRiskColor(floodData.floodRisk)}`,
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '12px' }}>
          Current Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              Affected Areas
            </p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937' }}>
              {floodData.affectedAreas}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              Evacuated People
            </p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937' }}>
              {floodData.evacuatedPeople.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              Damage Estimate
            </p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937' }}>
              ₽{floodData.damageEstimate}M
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#F0F9FF',
          borderRadius: '8px',
          padding: '16px',
          borderLeft: `4px solid #0EA5E9`,
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1F2937',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Image src="/wind.svg" alt="Forecast" width={18} height={18} />
          Forecast
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              Expected Rainfall
            </p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>
              {floodData.forecast.rainfall} mm
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              Expected Water Level
            </p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>
              {floodData.forecast.expectedWaterLevel} cm
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              Forecast Confidence
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${floodData.forecast.confidence}%`,
                    height: '100%',
                    background: '#0EA5E9',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937', minWidth: '35px' }}>
                {floodData.forecast.confidence}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
        Last updated: {new Date(floodData.lastUpdated).toLocaleString()}
      </p>
    </div>
  );
};
