'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Activity, Users, RadioTower } from 'lucide-react';
import { getZones } from '../api/client';
import type { Zone, MonitoringZone } from '../types';
import { INITIAL_MONITORING_ZONES, INITIAL_CITIZEN_REPORTS } from '../lib/ner-data';
import { ZoneCard } from './ZoneCard';
import { ReportIncidentModal } from './ReportIncidentModal';
import MapWrapper from './map/MapWrapper';

export function Dashboard() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<MonitoringZone | null>(null);

  const router = useRouter();
  const handleDispatchTrigger = useCallback(() => {
    router.push('/dispatch');
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getZones();
        setZones(response.zones || []);
      } catch (err) {
        console.error('Failed to load zones:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const criticalCount = zones.filter(z => z.risk_level.toLowerCase() === 'critical').length;
  const highCount = zones.filter(z => z.risk_level.toLowerCase() === 'high').length;

  const instrumentTiles = [
    { label: 'Monitored Zones', value: zones.length, icon: Activity, accent: 'text-teal' },
    { label: 'Critical Alerts', value: criticalCount, icon: ShieldAlert, accent: 'text-ember' },
    { label: 'High Risk Zones', value: highCount, icon: RadioTower, accent: 'text-ochre' },
    { label: 'Citizens Connected', value: 0, icon: Users, accent: 'text-teal' },
  ];

  return (
    <div className="min-h-screen text-paper font-sans selection:bg-clay/30">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Live GIS Landslide Map */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-paper flex items-center gap-2">
              Live GIS Landslide Map
            </h2>
            <span className="field-tag hidden sm:inline-flex">
              INTERACTIVE · NER INDIA · 8 STATES
            </span>
          </div>
          <MapWrapper
            zones={INITIAL_MONITORING_ZONES}
            citizenReports={INITIAL_CITIZEN_REPORTS}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            onDispatchTrigger={handleDispatchTrigger}
          />
        </section>

        {/* Instrument tiles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {instrumentTiles.map(tile => {
            const Icon = tile.icon;
            return (
              <div key={tile.label} className="topo-panel p-4">
                <div className="flex items-center gap-4">
                  <div className="instrument-glyph">
                    <Icon size={20} className={tile.accent} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-paper-faint leading-none">
                      {tile.label}
                    </p>
                    <p className={`font-mono text-2xl font-bold leading-tight mt-1.5 ${tile.accent}`}>
                      {tile.value}
                    </p>
                  </div>
                </div>
                <div className="contour-band contour-band--thin mt-3" aria-hidden="true" />
              </div>
            );
          })}
        </div>

        {/* Zones Grid */}
        <div>
          <h2 className="font-display text-xl font-bold text-paper mb-6 flex items-center gap-2">
            Regional Risk Overview
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="topo-panel h-48 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zones.map(zone => (
                <ZoneCard key={zone.id} zone={zone} />
              ))}
            </div>
          )}
        </div>
      </main>

      <ReportIncidentModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}