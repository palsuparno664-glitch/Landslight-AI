'use client';

import React from 'react';
import {
  BookOpen,
  ExternalLink,
  Database,
  FileText,
  Award
} from 'lucide-react';

const REFERENCES = [
  {
    title: 'ISRO Landslide Atlas of India',
    agency: 'National Remote Sensing Centre (NRSC) / ISRO',
    url: 'https://www.isro.gov.in/Landslide_Atlas_India.html',
    description: 'Comprehensive national spatial database of landslide hazard zonation, historical inventory, and susceptibility ranking for the Indian Himalayas and Western Ghats.',
    tags: ['Satellite Remote Sensing', 'Susceptibility Zonation', 'ISRO']
  },
  {
    title: 'Bhuvan Disaster Services - Landslide Portal',
    agency: 'National Remote Sensing Centre (NRSC)',
    url: 'https://bhuvan-app1.nrsc.gov.in/disaster/disaster.php?id=landslide',
    description: 'ISRO Geo-spatial platform for real-time disaster support, satellite event mapping, and high-resolution optical / SAR terrain monitoring.',
    tags: ['Bhuvan GIS', 'Real-Time Ingestion', 'SAR Interferometry']
  },
  {
    title: 'Geological Survey of India (Bhusanket Portal)',
    agency: 'Geological Survey of India (GSI)',
    url: 'https://bhusanket.gsi.gov.in/LS_hazard.html',
    description: 'National Landslide Susceptibility Mapping (NLSM) at 1:50,000 scale, lithological shear fault databases, and rainfall threshold early warning modeling.',
    tags: ['Lithology', 'NLSM 1:50,000', 'GSI Bhusanket']
  },
  {
    title: 'India Meteorological Department (IMD API Reference)',
    agency: 'Ministry of Earth Sciences (MoES)',
    url: 'https://mausam.imd.gov.in/responsive/apis.php',
    description: 'Automated Weather Stations (AWS), Doppler Weather Radar (DWR) precipitation grids, and Quantitative Precipitation Forecast (QPF) data streams.',
    tags: ['Doppler Radar', 'AWS 24h Rain', 'IMD APIs']
  }
];

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="topo-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="instrument-glyph">
              <BookOpen className="w-5 h-5 text-teal" />
            </span>
            <h1 className="font-display text-xl font-semibold text-paper tracking-tight">
              Research Foundations & Government Reference Portals
            </h1>
            <span className="field-tag field-tag--teal">Verified References</span>
          </div>
          <div className="contour-band my-2 max-w-2xl" />
          <p className="text-xs text-paper-dim max-w-2xl">
            LANDSIGHT AI synthesizes authoritative datasets from ISRO, the Geological Survey of India, and IMD into a unified predictive early warning architecture.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-ink-900/70 px-3.5 py-2 rounded-md border border-ink-700 text-xs">
          <Award className="w-4 h-4 text-clay" />
          <span className="text-paper-dim font-medium">Verified Architecture</span>
        </div>
      </div>

      {/* Grid of Official Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REFERENCES.map((ref) => (
          <div
            key={ref.title}
            className="topo-panel p-6 space-y-4 transition-all hover:brightness-[1.06] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-clay">
                    {ref.agency}
                  </span>
                  <h2 className="font-display text-base font-semibold text-paper mt-0.5">{ref.title}</h2>
                </div>
                <div className="instrument-glyph shrink-0">
                  <Database className="w-4 h-4 text-teal" />
                </div>
              </div>

              <p className="text-xs text-paper-dim leading-relaxed">
                {ref.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-ink-700/80">
              <div className="flex flex-wrap gap-1.5">
                {ref.tags.map((t) => (
                  <span
                    key={t}
                    className="field-tag"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-md bg-ink-850 hover:bg-ink-800 text-paper-dim hover:text-paper border border-ink-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all group"
              >
                <span>View Official Government Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-paper-faint group-hover:text-teal transition-colors" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Methodology & Mathematical Formulation */}
      <div className="topo-panel p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-ink-700 pb-3">
          <FileText className="w-4 h-4 text-ochre" />
          <h2 className="font-display text-sm font-semibold text-paper">
            Mathematical Formulation: Calibrated Landslide Susceptibility Index (LSI)
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs text-paper-dim">
          <div className="p-4 rounded-md bg-ink-900/50 border border-ink-700 space-y-2">
            <strong className="text-teal font-bold block">1. Dynamic Precipitation Factor (35%)</strong>
            <p className="text-paper-faint text-[11px] leading-relaxed">
              Normalized IMD 24-hour rainfall curve. Accounts for critical antecendent moisture thresholds and cloudburst surges exceeding 70 mm/day.
            </p>
          </div>

          <div className="p-4 rounded-md bg-ink-900/50 border border-ink-700 space-y-2">
            <strong className="text-clay font-bold block">2. Topographical Shear Gradient (25%)</strong>
            <p className="text-paper-faint text-[11px] leading-relaxed">
              DEM slope angle modeled against internal friction angles for Himalayan phyllite rock strata (critical threshold: 35°–50°).
            </p>
          </div>

          <div className="p-4 rounded-md bg-ink-900/50 border border-ink-700 space-y-2">
            <strong className="text-teal font-bold block">3. Pore-Water Saturation (18%)</strong>
            <p className="text-paper-faint text-[11px] leading-relaxed">
              Subsurface soil moisture index (SMI). When SMI {`>`} 0.85, effective normal stress approaches zero, inducing liquefaction slope failure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}