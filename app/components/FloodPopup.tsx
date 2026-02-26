'use client';

import Image from 'next/image';

interface FloodPopupProps {
  type: 'caution' | 'flood';
  timeRemaining?: string;
  onClose: () => void;
}

export function FloodPopup({ type, timeRemaining, onClose }: FloodPopupProps) {
  if (type === 'caution') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            borderRadius: 16,
            padding: '32px 40px',
            maxWidth: 500,
            border: '2px solid #FFC800',
            boxShadow: '0 8px 32px rgba(255, 200, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(255, 200, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 28 }}>⚠️</span>
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#FFC800', margin: 0 }}>
                Flood Remaining Time
              </h2>
              <p style={{ fontSize: 16, color: '#FFFFFF', margin: '8px 0 0 0' }}>
                Evacuate!
              </p>
            </div>
          </div>
          <p style={{ fontSize: 18, color: '#E5E7EB', marginBottom: 24 }}>
            A flood will occur within <strong style={{ color: '#FFC800' }}>{timeRemaining}</strong>
          </p>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: '#FFC800',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Acknowledge
          </button>
        </div>
      </div>
    );
  }

  // Flood is occurring
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          borderRadius: 16,
          padding: '32px 40px',
          maxWidth: 500,
          border: '2px solid #FF3C3C',
          boxShadow: '0 8px 32px rgba(255, 60, 60, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255, 60, 60, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 28 }}>🚨</span>
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#FF3C3C', margin: 0 }}>
              Flood Alert
            </h2>
            <p style={{ fontSize: 16, color: '#FFFFFF', margin: '8px 0 0 0' }}>
              Flood is occurring!
            </p>
          </div>
        </div>
        <p style={{ fontSize: 18, color: '#E5E7EB', marginBottom: 24 }}>
          A flood is currently occurring. Please evacuate immediately and follow emergency procedures.
        </p>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: '#FF3C3C',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
