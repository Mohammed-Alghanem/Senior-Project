"use client";

import React, { useState } from 'react';
import { Header } from '@/app/components/Header';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const handleSignOut = () => {
    document.cookie = 'auth_token=; path=/; max-age=0; samesite=lax';
    router.replace('/login');
  };

  return (
    <div className="profile-page">
      <Header />

      <main className="profile-main">
        <div className="card profile-card">
          <div className="panel-title profile-title">
            Profile
          </div>

          <div className="panel-inner profile-inner">
            <div className="profile-field">
              <div className="muted profile-label">Full Name</div>
              <div className="profile-value">Floodsense User</div>
            </div>

            <div className="profile-field">
              <div className="muted profile-label">Email</div>
              <div className="profile-value profile-value-secondary">user@floodsense.sa</div>
            </div>

            <div className="profile-field">
              <div className="muted profile-label">Role</div>
              <div className="profile-value profile-value-secondary">Operator</div>
            </div>

            <div className="profile-signout-row">
              <button
                type="button"
                onClick={() => setShowLogoutPopup(true)}
                className="profile-signout-button"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </main>

      {showLogoutPopup && (
        <div
          onClick={() => setShowLogoutPopup(false)}
          className="profile-modal-overlay"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="card profile-modal-card"
          >
            <h2 className="profile-modal-title">
              Confirm Sign Out
            </h2>
            <p className="muted profile-modal-text">
              Are you sure you want to sign out?
            </p>

            <div className="profile-modal-actions">
              <button
                type="button"
                onClick={() => setShowLogoutPopup(false)}
                className="profile-modal-button"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="profile-modal-button profile-modal-button-danger"
              >
                Yes, Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
