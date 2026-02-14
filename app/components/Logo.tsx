"use client";

export const Logo = ({ size = 28 }: { size?: number }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#D1D5DB" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
        </defs>
        <path
          d="M16 10.5C16 7.462 13.538 5 10.5 5 8.87 5 7.4 5.7 6.34 6.84 3.92 9.35 4.21 13.42 7.25 15.11H16c1.38 0 2.5-1.12 2.5-2.5S17.38 10.5 16 10.5z"
          fill="url(#g1)"
        />
        <path
          d="M9 17c0 .55.45 1 1 1h6a1 1 0 000-2H10c-.55 0-1 .45-1 1z"
          fill="#E6EEF8"
          opacity="0.85"
        />
      </svg>
      <span style={{ color: 'white', fontWeight: 700, letterSpacing: 0.2 }}>FloodSense</span>
    </div>
  );
};
