'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { MonitoringZone, CitizenReport } from '@/types';

interface MapWrapperProps {
  zones: MonitoringZone[];
  citizenReports: CitizenReport[];
  selectedZone: MonitoringZone | null;
  onSelectZone: (zone: MonitoringZone | null) => void;
  onDispatchTrigger?: (zone: MonitoringZone) => void;
}

const DynamicMap = dynamic(() => import('./LandslideMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[620px] rounded-lg bg-ink-950 border border-ink-700 flex flex-col items-center justify-center gap-3 text-paper-dim">
      <div className="w-10 h-10 border-4 border-clay/20 border-t-clay rounded-full animate-spin" />
      <p className="text-xs font-mono tracking-widest">Initializing GIS Spatial Engine for NER India...</p>
    </div>
  ),
});

export default function MapWrapper(props: MapWrapperProps) {
  return <DynamicMap {...props} />;
}
