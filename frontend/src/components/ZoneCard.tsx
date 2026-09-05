import React from 'react';
import { MapPin, Droplets, Mountain, AlertTriangle, ChevronRight } from 'lucide-react';
import type { Zone } from '../types';

/* topo palette per risk level — frame tint, gauge ink, readout color */
const RISK_META: Record<
  string,
  { tag: string; frame: string; marker: string; bar: string; score: string }
> = {
  low:      { tag: 'field-tag--teal',  frame: '',                  marker: '#76b383', bar: 'rgba(118,179,131,0.16)', score: 'text-teal' },
  moderate: { tag: 'field-tag--ochre', frame: 'topo-panel--moderate', marker: '#d9a441', bar: 'rgba(217,164,65,0.16)', score: 'text-ochre' },
  high:     { tag: 'field-tag--clay',  frame: 'topo-panel--high',  marker: '#d9804b', bar: 'rgba(217,128,75,0.18)', score: 'text-clay' },
  critical: { tag: 'field-tag--ember', frame: 'topo-panel--critical', marker: '#e0524d', bar: 'rgba(224,82,77,0.20)', score: 'text-ember' },
};

export function ZoneCard({ zone, onClick }: { zone: Zone; onClick?: () => void }) {
  const riskKey = zone.risk_level.toLowerCase();
  const meta = RISK_META[riskKey] ?? RISK_META.low;
  const isCritical = riskKey === 'critical';
  const score = Math.max(0, Math.min(100, zone.risk_score));

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden topo-panel ${meta.frame} p-5 transition-all duration-300 hover:scale-[1.02] hover:brightness-[1.08] cursor-pointer group`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-paper flex items-center gap-2">
            <MapPin size={18} className="text-clay" />
            {zone.name}
          </h3>
          <p className="text-sm text-paper-faint mt-1">{zone.state}</p>
        </div>
        <span className={`field-tag ${meta.tag}`}>{zone.risk_level}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex items-center gap-2 text-paper-dim">
          <Droplets size={15} className="text-teal shrink-0" />
          <span className="font-mono text-xs">{zone.rainfall_last_24h} mm (24h)</span>
        </div>
        <div className="flex items-center gap-2 text-paper-dim">
          <Mountain size={15} className="text-clay shrink-0" />
          <span className="font-mono text-xs">{zone.slope_angle}° Slope</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="font-mono uppercase tracking-widest text-paper-faint">Risk Score</span>
          <span className={`font-mono font-bold ${meta.score}`}>
            {zone.risk_score.toFixed(1)}/100
          </span>
        </div>
        <div className="contour-gauge">
          <div
            className="contour-gauge__fill"
            style={{
              width: `${score}%`,
              backgroundColor: meta.bar,
              borderRight: `1px solid ${meta.marker}`,
              boxShadow: `0 0 10px ${meta.marker}55`,
            }}
          />
          <div
            className="contour-gauge__marker"
            style={{ left: `${score}%`, backgroundColor: meta.marker }}
          />
        </div>
      </div>

      {isCritical && (
        <div className="mt-4 p-3 rounded-md border border-ember/30 bg-ember/10 flex items-start gap-3">
          <AlertTriangle size={16} className="text-ember mt-0.5 shrink-0" />
          <p className="text-xs text-ember/90 leading-relaxed">{zone.active_alert}</p>
        </div>
      )}

      <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
        <ChevronRight size={24} className="text-paper-faint" />
      </div>
    </div>
  );
}