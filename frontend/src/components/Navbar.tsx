'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  Cpu,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { offlineStorage } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';

/* Concentric-contours survey logo mark (inline SVG, cartographic north tick) */
function LogoContours({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="39" height="39" rx="9" fill="var(--ink-950)" stroke="var(--ink-600)" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="var(--teal)" strokeOpacity="0.28" strokeWidth="0.9" />
      <circle cx="20" cy="20" r="9.5" fill="none" stroke="var(--clay)" strokeOpacity="0.4" strokeWidth="0.9" />
      <circle cx="20" cy="20" r="6" fill="none" stroke="var(--teal)" strokeOpacity="0.5" strokeWidth="0.9" />
      <circle cx="20" cy="20" r="2.4" fill="var(--clay)" />
      {/* north arrow */}
      <path d="M20 27.5 L20.9 25.6 L20 26 L19.1 25.6 Z" fill="var(--paper-faint)" opacity="0.7" />
      <circle cx="24.5" cy="12.5" r="0.9" fill="var(--paper-faint)" opacity="0.5" />
      <circle cx="15" cy="28.5" r="0.9" fill="var(--paper-faint)" opacity="0.5" />
    </svg>
  );
}

export default function Navbar() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);
  const { profile, role, logout } = useAuth();

  const activeAlerts = [
    { text: 'CRITICAL RED ALERT: Mangan - Chungthang Highway (Risk: 86.4/100) — Mandatory Evacuation Zone 4', tag: 'SIKKIM', level: 'critical' as const },
    { text: 'CRITICAL RED ALERT: Sohra Cherrapunji Escarpment (Risk: 93.2/100) — 185mm Extreme Cloudburst', tag: 'MEGHALAYA', level: 'critical' as const },
    { text: 'HIGH RISK ADVISORY: Dima Hasao Railway Section (Risk: 67.2/100) — Track Speed Limited', tag: 'ASSAM', level: 'high' as const },
    { text: 'HIGH RISK ADVISORY: Tawang - Bap Teng Kang Gorge (Risk: 74.5/100) — Rockfall Hazard', tag: 'ARUNACHAL', level: 'high' as const },
  ];

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      checkPending();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkPending = async () => {
      const pending = await offlineStorage.getPendingSyncReports();
      setPendingCount(pending.length);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    const alertTicker = setInterval(() => {
      setActiveAlertIndex((prev) => (prev + 1) % activeAlerts.length);
    }, 6000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      clearInterval(alertTicker);
    };
  }, [activeAlerts.length]);

  const handleSirenClick = () => {
    soundManager.playCriticalSiren();
  };

  const handleMuteToggle = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="sticky top-0 z-50 bg-ink-950/95 backdrop-blur-md">
      {/* Top Alert Ticker Bar — survey ink band */}
      <div className="bg-ink-900/80 border-b border-ink-800/70 px-4 py-1.5 flex items-center justify-between text-xs overflow-hidden">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-ember/50 bg-ember/15 text-ember font-mono text-[10px] font-bold tracking-widest uppercase shrink-0 animate-pulse">
            <Flame className="w-3 h-3" />
            Live Field Warning
          </span>
          <span className="shrink-0 font-mono font-semibold text-ochre">[{activeAlerts[activeAlertIndex].tag}]</span>
          <span
            className={
              activeAlerts[activeAlertIndex].level === 'critical'
                ? 'shrink-0 text-ember'
                : 'shrink-0 text-ochre'
            }
            aria-hidden="true"
          >
            {activeAlerts[activeAlertIndex].level === 'critical' ? (
              <Flame className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
          </span>
          <span className="text-paper-dim truncate font-medium">
            {activeAlerts[activeAlertIndex].text}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-3 shrink-0 font-mono text-[11px] pl-4">
          <span className="text-teal inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping"></span>
            IMD Radar: Active
          </span>
          <span className="text-ink-600">|</span>
          <span className="text-paper-dim">ISRO Bhuvan GIS Sync</span>
        </div>
      </div>

      {/* contour-wave separator */}
      <div className="contour-band contour-band--faint h-3 -mt-0 pointer-events-none" aria-hidden="true" />

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoContours className="w-10 h-10 group-hover:drop-shadow-[0_0_8px_rgba(208,120,79,0.35)] transition-all" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-black tracking-tight text-paper">
                  LANDSIGHT <span className="text-clay">AI</span>
                </span>
                <span className="field-tag field-tag--clay">
                  NER INDIA
                </span>
              </div>
              <p className="text-[11px] text-paper-faint leading-tight hidden sm:block">
                AI Early Warning & Landslide Monitoring
              </p>
            </div>
          </Link>
        </div>

        {/* System Health Indicators */}
        <div className="hidden md:flex items-center gap-2">
          {/* IoT telemetry — mono field tag */}
          <div className="field-tag hidden xl:inline-flex">
            <Radio className="w-3 h-3 text-teal" />
            <span className="text-paper-faint">IoT Nodes</span>
            <span className="text-paper font-bold">34/34</span>
          </div>

          {/* ML Inference — mono field tag */}
          <div className="field-tag field-tag--teal hidden xl:inline-flex">
            <Cpu className="w-3 h-3 text-clay" />
            <span className="text-paper-faint">XGBoost ML</span>
            <span className="text-teal font-bold">Active · 9ms</span>
          </div>

          {/* Offline / Online Sync Status */}
          <div className={`inline-flex items-center gap-1.5 rounded font-mono text-[11px] font-medium px-2.5 py-1 border ${
            isOnline
              ? pendingCount > 0
                ? 'bg-clay/10 border-clay/40 text-clay'
                : 'bg-teal/10 border-teal/35 text-teal'
              : 'bg-ember/10 border-ember/40 text-ember'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-teal" />
                <span>{pendingCount > 0 ? `Syncing (${pendingCount} queued)` : 'Online (Synced)'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-ember animate-pulse" />
                <span>Offline Mode ({pendingCount} Cached)</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Verified field role chip */}
          {role && profile && (
            <>
              <div className="hidden md:flex items-center gap-1.5 rounded-md bg-ink-800/60 border border-ink-700 px-3 py-1.5 text-[11px] font-mono">
                <span className={role === 'officer' ? 'text-clay font-bold' : 'text-teal font-bold'}>
                  {role === 'officer' ? 'Field Officer' : 'Citizen'}
                </span>
                <span className="text-ink-600">|</span>
                <span className="text-paper-dim max-w-[140px] truncate">{profile.name}</span>
                {profile.department && <span className="text-ink-600 hidden xl:inline">· {profile.department}</span>}
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-md bg-ink-800/60 border border-ink-700 text-paper-dim font-mono text-[11px] font-bold uppercase tracking-wider hover:text-paper hover:border-ink-600 transition-colors"
              >
                Sign out
              </button>
            </>
          )}
          {/* Test Siren Button */}
          <button
            onClick={handleSirenClick}
            title="Trigger Emergency Siren Sound Effect"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ember/10 text-ember border border-ember/40 text-xs font-semibold font-mono uppercase tracking-wide transition-all hover:bg-ember/20 hover:scale-105 active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-ember" />
            <span className="hidden sm:inline">Emergency Siren</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={handleMuteToggle}
            title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            className="p-2 rounded-md bg-ink-800/60 border border-ink-700 text-paper-dim hover:text-paper hover:border-ink-600 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-ember" /> : <Volume2 className="w-4 h-4 text-teal" />}
          </button>

          {/* Quick Report Action */}
          <Link
            href="/report"
            className="px-3.5 py-1.5 rounded-md bg-clay text-ink-950 font-mono text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-ochre hover:shadow-[0_0_14px_rgba(208,120,79,0.35)]"
          >
            + Report Slide
          </Link>
        </div>
      </div>
    </header>
  );
}