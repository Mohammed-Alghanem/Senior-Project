"use client";

import Image from 'next/image';

export const Logo = ({ size = 28 }: { size?: number }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Image
        src="/LOGO.svg"
        alt="FloodSense"
        width={size}
        height={size}
        priority
      />
      <span className="logo-text" style={{ color: 'white', fontWeight: 700, letterSpacing: 0.2 }}>FloodSense</span>
    </div>
  );
};
