'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map,
  Sliders,
  Camera,
  Send,
  BarChart3,
  BookOpen,
  PhoneCall,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'Live GIS Map',
    href: '/',
    icon: Map,
    badge: 'LIVE',
    badgeColor: 'border-teal/40 text-teal',
  },
  {
    label: 'Risk Predictor AI',
    href: '/predictor',
    icon: Sliders,
    badge: 'XGBoost',
    badgeColor: 'border-ink-600 text-paper-faint',
  },
  {
    label: 'Citizen Reporting',
    href: '/report',
    icon: Camera,
    badge: 'Offline-First',
    badgeColor: 'border-ink-600 text-paper-faint',
  },
  {
    label: 'Authority Dispatch',
    href: '/dispatch',
    icon: Send,
    badge: '8 Languages',
    badgeColor: 'border-ink-600 text-paper-faint',
  },
  {
    label: 'Sensor Analytics',
    href: '/analytics',
    icon: BarChart3,
    badge: 'Telemetry',
    badgeColor: 'border-ink-600 text-paper-faint',
  },
  {
    label: 'Research & Sources',
    href: '/research',
    icon: BookOpen,
    badge: 'ISRO/GSI',
    badgeColor: 'border-ink-600 text-paper-faint',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between bg-ink-950/80 border-r border-ink-700/60 p-4 backdrop-blur-md">
      <div className="space-y-6">
        {/* Module Nav Section */}
        <div>
          <p className="px-3 text-[11px] font-bold font-mono uppercase tracking-widest text-paper-faint mb-2">
            Field Operations · NER-8
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-ink-800/70 text-paper border border-clay/40 shadow-[inset_2px_0_0_var(--clay)]'
                      : 'text-paper-faint hover:text-paper hover:bg-ink-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-clay' : 'text-ink-600 group-hover:text-paper-dim'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono uppercase tracking-wide border ${item.badgeColor}`}
                    >
                      {item.badge === 'LIVE' && <span className="w-1 h-1 rounded-full bg-teal animate-pulse" />}
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

      {/* Emergency Control Hotlines Card */}
      <div className="rounded-lg bg-ink-900/70 border border-ember/25 p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-ember text-xs font-bold font-mono uppercase tracking-widest">
          <PhoneCall className="w-4 h-4 animate-pulse" />
          <span>Emergency Hotlines</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center text-paper-dim">
            <span>NDRF / SDRF Central:</span>
            <span className="inline-flex items-center font-mono font-bold text-ember bg-ink-950/70 px-1.5 py-0.5 rounded border border-ember/30">
              1070
            </span>
          </div>
          <div className="flex justify-between items-center text-paper-dim">
            <span>State DEOC Helpline:</span>
            <span className="inline-flex items-center font-mono font-bold text-ember bg-ink-950/70 px-1.5 py-0.5 rounded border border-ember/30">
              1077
            </span>
          </div>
          <div className="flex justify-between items-center text-paper-dim">
            <span>Border Roads (BRTF):</span>
            <span className="inline-flex items-center font-mono font-bold text-ember bg-ink-950/70 px-1.5 py-0.5 rounded border border-ember/30">
              1800-118-005
            </span>
          </div>
        </div>
      </div>
      </div>
    </aside>
  );
}