"use client";

import { Area } from '@/app/types';
import { useRouter } from 'next/navigation';

const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  none: { bg: 'rgba(163, 162, 155, 0.15)', text: '#a3a29b', label: 'No Risk' },
  low: { bg: 'rgba(255, 200, 0, 0.15)', text: '#ffc800', label: 'Low' },
  medium: { bg: 'rgba(255, 140, 0, 0.15)', text: '#ff8c00', label: 'Medium' },
  high: { bg: 'rgba(255, 60, 60, 0.15)', text: '#ff3c3c', label: 'High' },
};

interface AreasListProps {
  areas: Area[];
  cityId: string;
}

export const AreasList = ({ areas, cityId }: AreasListProps) => {
  const router = useRouter();

  const handleAreaClick = (areaId: string) => {
    router.push(`/dashboard?area=${areaId}`);
  };

  return (
    <div style={{ marginTop: 32, marginBottom: 32 }} className="card">
      <div className="panel-inner">
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'white', margin: 0 }}>
          Areas
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          {areas.map((area) => {
            const riskColor = RISK_COLORS[area.floodRisk] || RISK_COLORS.none;
            return (
              <button
                key={area.id}
                onClick={() => handleAreaClick(area.id)}
                style={{
                  background: 'var(--panel-2)',
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  borderRadius: 12,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: 'white',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--panel-3)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--panel-2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>{area.name}</h4>
                  <span
                    style={{
                      background: riskColor.bg,
                      color: riskColor.text,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {riskColor.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
