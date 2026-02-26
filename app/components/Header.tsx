"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Logo } from './Logo';
import { useState } from 'react';
import { UserCircle2 } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header = ({ title, subtitle }: HeaderProps) => {
  const [showContactPopup, setShowContactPopup] = useState(false);
  const topbarActionStyle = {
    background: 'transparent',
    border: 'none',
    color: 'rgba(230,238,248,0.95)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'background 0.2s',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 1.2,
  } as const;

  return (
    <>
    <header className="header-responsive" style={{ padding: 18, position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'var(--bg, #050506)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="topbar card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 10 }}>
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
            <Link href="/" style={{ textDecoration: 'none' }} aria-label="Home - Choose country">
              <div style={{ padding: 6, borderRadius: 12, background: 'transparent', display: 'flex', alignItems: 'center' }}>
                <Logo />
              </div>
            </Link>
          </div>

          <div className="search-container" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: 12 }}>
            <div style={{ width: '95%' }}>
                <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'transparent' }} className="search-input card">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M21 21l-4.35-4.35" stroke="rgba(156,163,175,0.9)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="11" cy="11" r="6" stroke="rgba(156,163,175,0.9)" strokeWidth={1.4} />
                </svg>
                <input aria-label="Search" placeholder="Search for cities" className="search-input" style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: 'rgba(230,238,248,0.95)' }} />
                </div>
            </div>
          </div>

          <div className="contacts-container" style={{ minWidth: 240, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: 0, gap: 8 }}>
            <Link
              href="/dashboard"
              style={{ ...topbarActionStyle, textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label="Dashboard"
            >
              <span className="contacts-text" style={{ opacity: 0.95 }}>Dashboard</span>
            </Link>
            <button 
              onClick={() => setShowContactPopup(true)}
              style={topbarActionStyle}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Image
                src="/contact.svg"
                alt="Contacts"
                width={18}
                height={18}
              />
              <span className="contacts-text" style={{ opacity: 0.95 }}>Contacts</span>
            </button>

            <Link
              href="/profile"
              style={{
                ...topbarActionStyle,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label="Profile"
            >
              <UserCircle2 size={18} color="#AAAAAA" />
              <span className="contacts-text" style={{ opacity: 0.95 }}>Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </header>

    {/* Contact Popup Modal */}
    {showContactPopup && (
      <div 
        onClick={() => setShowContactPopup(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="card"
          style={{
            maxWidth: 400,
            width: 'min(400px, calc(100vw - 24px))',
            padding: 24,
            position: 'relative',
          }}
        >
          <button
            onClick={() => setShowContactPopup(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'transparent',
              border: 'none',
              color: 'rgba(230,238,248,0.7)',
              fontSize: 24,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <Image
              src="/contact.svg"
              alt="Contact"
              width={32}
              height={32}
            />
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'rgba(230,238,248,0.95)' }}>Contact Information</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Emergency Section */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'rgba(156,163,175,0.9)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Emergency Hotline</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'rgba(230,238,248,0.95)' }}>911</div>
            </div>
            
            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />
            
            {/* Support Team Section */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'rgba(156,163,175,0.9)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support Team</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(230,238,248,0.95)' }}>050-XXX-XXXX</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: 'rgba(156,163,175,0.95)' }}>support@floodsense.sa</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
