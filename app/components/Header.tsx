"use client";

import Link from 'next/link';
import { Logo } from './Logo';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header = ({ title, subtitle }: HeaderProps) => {
  return (
    <header style={{ padding: 18 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="topbar card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
            <Link href="/" style={{ textDecoration: 'none' }} aria-label="Home">
              <div style={{ padding: 6, borderRadius: 12, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center' }}>
                <Logo />
              </div>
            </Link>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '78%' }}>
              <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 12 }} className="search-input card">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M21 21l-4.35-4.35" stroke="rgba(156,163,175,0.9)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="11" cy="11" r="6" stroke="rgba(156,163,175,0.9)" strokeWidth={1.4} />
                </svg>
                <input aria-label="Search" placeholder="Search for cities" className="search-input" />
              </div>
            </div>
          </div>

          <div style={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {/* Dashboard link removed per design — kept Contacts */}
            <div style={{ color: 'rgba(230,238,248,0.95)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="rgba(156,163,175,0.9)" strokeWidth={1.2} />
                <path d="M12 7v5l3 3" stroke="rgba(156,163,175,0.9)" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ opacity: 0.95 }}>Contacts</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
