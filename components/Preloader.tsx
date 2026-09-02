'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface PreloaderProps {
  minDurationMs?: number;
  onFinish?: () => void;
}

const TELEMETRY_PHASES = [
  'INITIALIZING SECURE ESTATE RUNTIME...',
  'CALIBRATING AUDIT HASH SEQUENCE...',
  'SYNCING MULTI-ESTATE ASSET MESH...',
  'ESTATE COMMAND READY · 100%',
];

export function Preloader({ minDurationMs = 1500, onFinish }: PreloaderProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    // Progress and phase steps
    const t1 = setTimeout(() => {
      setPhaseIndex(1);
      setProgress(48);
    }, 400);

    const t2 = setTimeout(() => {
      setPhaseIndex(2);
      setProgress(82);
    }, 900);

    const t3 = setTimeout(() => {
      setPhaseIndex(3);
      setProgress(100);
    }, 1300);

    const tExit = setTimeout(() => {
      setIsDismissing(true);
      setTimeout(() => {
        setIsMounted(false);
        onFinish?.();
      }, 550);
    }, minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tExit);
    };
  }, [minDurationMs, onFinish]);

  if (!isMounted) return null;

  return (
    <div
      className={`preloader-overlay ${isDismissing ? 'preloader-dismissing' : ''}`}
      aria-live="polite"
      aria-label="ASTERA System Initialization"
    >
      {/* Background ambient radial gradients */}
      <div className="preloader-backdrop-glow" aria-hidden="true" />
      <div className="preloader-grid-lines" aria-hidden="true" />

      <div className="preloader-content">
        {/* Star & Tachometer Core */}
        <div className="preloader-star-container">
          {/* Outer compass orbital ring */}
          <div className="preloader-orbit-ring" aria-hidden="true" />
          <div className="preloader-orbit-ticks" aria-hidden="true">
            <span className="tick tick-n" />
            <span className="tick tick-e" />
            <span className="tick tick-s" />
            <span className="tick tick-w" />
          </div>

          {/* Core Star with Dynamic RPM Acceleration Loop */}
          <div className="preloader-star-rpm-wrapper">
            <Image
              src="/assets/logo-star.png"
              alt="ASTERA Emblem"
              width={110}
              height={110}
              priority
              className="preloader-star-img"
            />
          </div>

          {/* Central aura glow */}
          <div className="preloader-star-glow" aria-hidden="true" />
        </div>

        {/* Brand Logo & Wordmark */}
        <div className="preloader-brand-section">
          <div className="preloader-logo-full-wrap">
            <Image
              src="/assets/logo-full.png"
              alt="ASTERA - Private Estate Operations"
              width={160}
              height={56}
              priority
              className="preloader-logo-full-img"
            />
          </div>
          <p className="preloader-brand-subtitle">
            PRIVATE ESTATE OPERATIONS · COMMAND CENTER
          </p>
        </div>

        {/* Progress Tracker & Telemetry status */}
        <div className="preloader-status-section">
          <div className="preloader-progress-track">
            <div
              className="preloader-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="preloader-telemetry-readout">
            <span className="preloader-pulse-dot" />
            <span className="preloader-telemetry-text">
              {TELEMETRY_PHASES[phaseIndex]}
            </span>
            <span className="preloader-telemetry-percentage">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
