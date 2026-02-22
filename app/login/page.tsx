"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/app/components/Logo';
import { RotateCcw } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hasToken = document.cookie
      .split('; ')
      .some((cookie) => cookie.startsWith('auth_token='));

    if (hasToken) {
      router.replace('/');
    }
  }, [router]);

  const handleLoginStep = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setShowOtp(true);
  };

  const handleEditCredentials = () => {
    setShowOtp(false);
    setOtp('');
    setError('');
  };

  const handleSubmitStep = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!otp) {
      setError('Please enter the OTP code.');
      return;
    }

    document.cookie = `auth_token=demo-token; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    router.replace('/');
  };

  return (
    <main className="auth-page">
      <div className="auth-logo-top">
        <Logo />
      </div>

      <div className="auth-shell">
        <div className="auth-card card">
          <h1 className="panel-title auth-title">
            Login
          </h1>
          <p className="muted auth-subtitle">
            Sign in to continue to Floodsense
          </p>
          <div className="auth-header-divider" />

          <form onSubmit={showOtp ? handleSubmitStep : handleLoginStep} className="auth-form">
            {!showOtp && (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input"
                  autoComplete="email"
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-input"
                  autoComplete="current-password"
                  required
                />
              </>
            )}

            {showOtp && (
              <>
                <div className="auth-step-summary">
                  <span className="auth-email-preview">{email}</span>
                  <button
                    type="button"
                    className="auth-retry-button"
                    onClick={handleEditCredentials}
                    aria-label="Retry credentials"
                    title="Edit email and password"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  className="auth-input auth-otp-input"
                  inputMode="numeric"
                  required
                />
              </>
            )}

            {error && <div className="auth-error">{error}</div>}

            {!showOtp ? (
              <button type="submit" className="auth-button">Log in</button>
            ) : (
              <button type="submit" className="auth-button">Submit</button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
