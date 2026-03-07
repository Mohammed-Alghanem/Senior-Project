"use client";

import { useEffect, useState } from "react";

const DISCLAIMER_TEXT =
  "Floodsense is an informational platform designed to notify users of potential flood risks based on collected sensor data. It does not issue official meteorological warnings. Official warnings and alerts are issued only by the authorized meteorological center.";

const STORAGE_KEY = "floodsense_disclaimer_seen";

export default function DisclaimerNotice() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = window.localStorage.getItem(STORAGE_KEY);

    if (!hasSeenDisclaimer) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div className="disclaimer-overlay" onClick={handleClose}>
          <div
            className="disclaimer-modal card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Floodsense disclaimer"
          >
            <h2 className="disclaimer-title">Important Disclaimer</h2>
            <p className="disclaimer-text">{DISCLAIMER_TEXT}</p>
            <button className="disclaimer-button" onClick={handleClose}>
              I Understand
            </button>
          </div>
        </div>
      )}

      <footer className="site-footer" aria-label="Floodsense disclaimer footer">
        <p className="site-footer-text">{DISCLAIMER_TEXT}</p>
      </footer>
    </>
  );
}