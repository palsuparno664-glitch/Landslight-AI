'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Droplets,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { SIMULATED_TELEMETRY_SERIES, INITIAL_MONITORING_ZONES } from '@/lib/ner-data';

export default function AnalyticsPage() {
  const districtRiskData = INITIAL_MONITORING_ZONES.map((z) => ({
    name: z.name.split(' (')[0].split(' - ')[0],
    state: z.state,
    risk: z.risk_score,
    rainfall: z.rainfall_last_24h,
    slope: z.slope_angle,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="topo-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="instrument-glyph">
              <BarChart3 className="w-5 h-5 text-teal" />
            </span>
            <h1 className="font-display text-xl font-semibold text-paper tracking-tight">
              Hydro-Meteorological & IoT Sensor Telemetry Analytics
            </h1>
            <span className="field-tag field-tag--teal">Live Sensor Bus</span>
          </div>
          <div className="contour-band my-2 max-w-2xl" />
          <p className="text-xs text-paper-dim max-w-2xl">
            Real-time correlation analysis between IMD precipitation rates, pore-water pressure, MEMS tiltmeter displacements, and calibrated dynamic landslide risk across North East India.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-ink-900/70 px-3.5 py-2 rounded-md border border-ink-700 text-xs font-mono">
          <span className="text-teal">● 99.8% Uptime</span>
          <span className="text-ink-600">|</span>
          <span className="text-teal">Sampling: 10s</span>
        </div>
      </div>

      {/* Top 4 Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="topo-panel p-4 space-y-2">
          <div className="flex items-center justify-between text-paper-faint text-xs">
            <span className="font-mono uppercase tracking-widest text-[10px]">Peak 24h Precipitation</span>
            <Droplets className="w-4 h-4 text-teal" />
          </div>
          <p className="text-2xl font-black font-mono text-teal">
            210.0 <span className="text-xs font-normal text-paper-faint">mm (Cherrapunji)</span>
          </p>
          <span className="text-[10px] text-ember font-semibold">Extreme Cloudburst Hazard</span>
        </div>

        <div className="topo-panel p-4 space-y-2">
          <div className="flex items-center justify-between text-paper-faint text-xs">
            <span className="font-mono uppercase tracking-widest text-[10px]">Max Inclinometer Shear</span>
            <Activity className="w-4 h-4 text-clay" />
          </div>
          <p className="text-2xl font-black font-mono text-clay">
            12.4 <span className="text-xs font-normal text-paper-faint">mm displacement</span>
          </p>
          <span className="text-[10px] text-clay font-semibold">Active Subsurface Creep</span>
        </div>

        <div className="topo-panel p-4 space-y-2">
          <div className="flex items-center justify-between text-paper-faint text-xs">
            <span className="font-mono uppercase tracking-widest text-[10px]">Pore-Water Saturation</span>
            <Droplets className="w-4 h-4 text-teal" />
          </div>
          <p className="text-2xl font-black font-mono text-teal">
            64.2 <span className="text-xs font-normal text-paper-faint">kPa</span>
          </p>
          <span className="text-[10px] text-teal font-semibold">96% Liquid Limit</span>
        </div>

        <div className="topo-panel p-4 space-y-2">
          <div className="flex items-center justify-between text-paper-faint text-xs">
            <span className="font-mono uppercase tracking-widest text-[10px]">Critical Alert Sectors</span>
            <ShieldAlert className="w-4 h-4 text-ember animate-pulse" />
          </div>
          <p className="text-2xl font-black font-mono text-ember">
            2 <span className="text-xs font-normal text-paper-faint">of 10 Zones</span>
          </p>
          <span className="text-[10px] text-ember font-semibold">Sikkim &amp; Meghalaya</span>
        </div>
      </div>

      {/* Chart 1: Rainfall vs Landslide Risk Correlation Curve */}
      <div className="topo-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-ink-700 pb-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal" />
              24h Temporal Trend: Rainfall Surge vs Calibrated Risk Score
            </h2>
            <p className="text-xs text-paper-dim">
              Demonstrating the non-linear coupling when rainfall crosses the 70mm critical slope failure threshold.
            </p>
          </div>
          <span className="field-tag field-tag--clay">Pore Infiltration Model</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SIMULATED_TELEMETRY_SERIES}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e0524d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#e0524d" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#58bca0" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#58bca0" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#20352c" />
              <XAxis dataKey="time" stroke="#a3b0a4" textAnchor="end" fontSize={11} />
              <YAxis stroke="#a3b0a4" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0e1915', borderColor: '#20352c', borderRadius: '0.375rem', fontSize: '12px', color: '#e9e7d8' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="risk_score" name="Landslide Risk (0-100)" stroke="#e0524d" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} />
              <Area type="monotone" dataKey="rainfall_mm" name="Precipitation (mm)" stroke="#58bca0" fillOpacity={1} fill="url(#colorRain)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: District Landslide Susceptibility Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="topo-panel p-6 space-y-4">
          <div className="border-b border-ink-700 pb-3">
            <h2 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-ochre" />
              NER Zone Risk Score Ranking
            </h2>
            <p className="text-xs text-paper-dim">
              Comparative analysis across Sikkim, Meghalaya, Assam, and Nagaland sectors.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtRiskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20352c" />
                <XAxis dataKey="name" stroke="#a3b0a4" fontSize={10} angle={-20} textAnchor="end" height={50} />
                <YAxis stroke="#a3b0a4" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0e1915', borderColor: '#20352c', borderRadius: '0.375rem', fontSize: '12px', color: '#e9e7d8' }}
                />
                <Bar dataKey="risk" name="Risk Score (0-100)" fill="#d0784f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subsurface Sensor Displacement Chart */}
        <div className="topo-panel p-6 space-y-4">
          <div className="border-b border-ink-700 pb-3">
            <h2 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal" />
              Borehole MEMS Inclinometer & Pore Pressure
            </h2>
            <p className="text-xs text-paper-dim">
              Subsurface shear plane deformation indicating structural slope movement.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SIMULATED_TELEMETRY_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20352c" />
                <XAxis dataKey="time" stroke="#a3b0a4" fontSize={11} />
                <YAxis stroke="#a3b0a4" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0e1915', borderColor: '#20352c', borderRadius: '0.375rem', fontSize: '12px', color: '#e9e7d8' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="inclinometer_displacement_mm" name="Tilt Displacement (mm)" stroke="#e0524d" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pore_water_pressure_kpa" name="Pore Pressure (kPa)" stroke="#76b383" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}