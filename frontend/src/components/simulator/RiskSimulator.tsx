'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Cpu,
  Droplets,
  Mountain,
  Waves,
  Gem,
  BookOpen,
  MapPin,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Languages,
} from 'lucide-react';
import { LandslideFeatureInput, RiskPredictionOutput } from '@/types';
import { clientRiskEngine } from '@/lib/ml-engine';
import { soundManager } from '@/lib/sound';

const PRESETS = [
  {
    name: 'Mangan Cloudburst (Sikkim)',
    state: 'Sikkim',
    location: 'Mangan - Chungthang Sector',
    rainfall: 145.0,
    slope: 45.0,
    moisture: 0.91,
    elevation: 1820,
    geology: 8.8,
    history: 9,
    description: 'Torrential 145mm monsoon downpour triggering massive pore pressure on metamorphic schist.'
  },
  {
    name: 'Cherrapunji Escarpment (Meghalaya)',
    state: 'Meghalaya',
    location: 'Sohra Rim Escarpment',
    rainfall: 210.0,
    slope: 52.0,
    moisture: 0.98,
    elevation: 1484,
    geology: 8.5,
    history: 12,
    description: 'Catastrophic 210mm cloudburst on steep limestone/sandstone escarpment with impending collapse.'
  },
  {
    name: 'Dima Hasao Rail Track (Assam)',
    state: 'Assam',
    location: 'Jatinga Valley Rail Line',
    rainfall: 88.0,
    slope: 33.0,
    moisture: 0.76,
    elevation: 650,
    geology: 7.5,
    history: 7,
    description: 'Erosion of railway embankment culverts and shale layer slipping.'
  },
  {
    name: 'Kohima Sinking Bypass (Nagaland)',
    state: 'Nagaland',
    location: 'Paglapahar NH-29',
    rainfall: 64.0,
    slope: 32.0,
    moisture: 0.68,
    elevation: 1440,
    geology: 7.0,
    history: 6,
    description: 'Chronic subsidence and boulder roll threatening lifeline highway.'
  },
  {
    name: 'Guwahati Plains Baseline (Assam)',
    state: 'Assam',
    location: 'Dispur Foothills',
    rainfall: 15.0,
    slope: 10.0,
    moisture: 0.32,
    elevation: 110,
    geology: 2.5,
    history: 0,
    description: 'Safe dry baseline with low slope gradient and consolidated alluvium.'
  }
];

const LANGUAGES_META = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'as', name: 'অসমীয়া (Assamese)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'ne', name: 'नेपाली (Nepali)' },
  { code: 'kha', name: 'Khasi' },
  { code: 'miz', name: 'Mizo' },
  { code: 'mni', name: 'Meiteilon (Manipuri)' },
];

export default function RiskSimulator() {
  const [input, setInput] = useState<LandslideFeatureInput>({
    location_name: 'Mangan - Chungthang Sector',
    latitude: 27.5028,
    longitude: 88.5303,
    state: 'Sikkim',
    rainfall_last_24h: 145.0,
    slope_angle: 45.0,
    soil_moisture_index: 0.91,
    elevation: 1820,
    geological_formation_score: 8.8,
    historical_landslide_count: 9,
  });

  const [result, setResult] = useState<RiskPredictionOutput | null>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [isInferencing, setIsInferencing] = useState(false);

  // Recalculate ML Risk on parameter change
  useEffect(() => {
    setIsInferencing(true);
    const prediction = clientRiskEngine.predict(input);
    setResult(prediction);
    const timer = setTimeout(() => setIsInferencing(false), 50);
    return () => clearTimeout(timer);
  }, [input]);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setInput({
      location_name: preset.location,
      latitude: 27.5028,
      longitude: 88.5303,
      state: preset.state,
      rainfall_last_24h: preset.rainfall,
      slope_angle: preset.slope,
      soil_moisture_index: preset.moisture,
      elevation: preset.elevation,
      geological_formation_score: preset.geology,
      historical_landslide_count: preset.history,
    });
  };

  const getRiskBadgeStyles = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'field-tag--ember animate-pulse';
      case 'High':
        return 'field-tag--clay';
      case 'Moderate':
        return 'field-tag--ochre';
      default:
        return 'field-tag--teal';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="topo-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="instrument-glyph">
              <Cpu className="w-5 h-5 text-teal" />
            </span>
            <h1 className="font-display text-xl font-semibold text-paper tracking-tight">
              AI Risk Predictor & XGBoost Heuristic Sandbox
            </h1>
            <span className="field-tag field-tag--clay">Calibrated ML Model</span>
          </div>
          <div className="contour-band my-2 max-w-2xl" />
          <p className="text-xs text-paper-dim max-w-2xl">
            Simulate geological, meteorological, and topographical conditions in real-time. The calibrated ensemble engine computes continuous risk scores (0–100) with SHAP-style feature explainability and instant multilingual emergency dispatch.
          </p>
        </div>

        {/* Quick Test Presets */}
        <div className="flex flex-wrap gap-1.5 self-stretch md:self-auto">
          {PRESETS.slice(0, 3).map((p) => (
            <button
              key={p.name}
              onClick={() => handlePresetSelect(p)}
              className="px-2.5 py-1.5 rounded-md bg-ink-850 hover:bg-ink-800 text-paper-dim hover:text-paper text-xs font-medium border border-ink-700 hover:border-ink-600 transition-all text-left flex items-center gap-1.5"
            >
              <MapPin className="w-3 h-3 text-teal shrink-0" />
              {p.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameter Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="topo-panel p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-clay" />
                <h2 className="font-display text-sm font-semibold text-paper">Geospatial & Sensor Inputs</h2>
              </div>
              <span className="field-tag field-tag--teal">Live Dynamic Feed</span>
            </div>

            {/* Location & State */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-paper-faint block mb-1.5">
                  Target Location Name
                </label>
                <input
                  type="text"
                  value={input.location_name}
                  onChange={(e) => setInput({ ...input, location_name: e.target.value })}
                  className="topo-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-paper-faint block mb-1.5">
                  NER State
                </label>
                <select
                  value={input.state}
                  onChange={(e) => setInput({ ...input, state: e.target.value })}
                  className="topo-input"
                >
                  <option value="Sikkim">Sikkim</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Assam">Assam</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Tripura">Tripura</option>
                </select>
              </div>
            </div>

            {/* Slider 1: Rainfall Last 24h */}
            <div className="space-y-1.5 bg-ink-900/50 p-3 rounded-md border border-ink-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-paper-dim flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-teal" /> 24h Cumulative Rainfall
                </span>
                <span className="font-mono font-bold text-teal text-sm">
                  {input.rainfall_last_24h} mm
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="1"
                value={input.rainfall_last_24h}
                onChange={(e) => setInput({ ...input, rainfall_last_24h: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-ink-700 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#58bca0' }}
              />
              <div className="flex justify-between text-[10px] text-paper-faint font-mono">
                <span>0mm (Dry)</span>
                <span>65mm (Mod)</span>
                <span>140mm (Heavy)</span>
                <span>300mm (Cloudburst)</span>
              </div>
            </div>

            {/* Slider 2: Slope Angle */}
            <div className="space-y-1.5 bg-ink-900/50 p-3 rounded-md border border-ink-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-paper-dim flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-clay" /> Hill Slope Angle (DEM)
                </span>
                <span className="font-mono font-bold text-clay text-sm">
                  {input.slope_angle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="75"
                step="0.5"
                value={input.slope_angle}
                onChange={(e) => setInput({ ...input, slope_angle: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-ink-700 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#d0784f' }}
              />
              <div className="flex justify-between text-[10px] text-paper-faint font-mono">
                <span>0° (Plains)</span>
                <span>25° (Moderate)</span>
                <span>45° (Critical Shear)</span>
                <span>75° (Cliff)</span>
              </div>
            </div>

            {/* Slider 3: Soil Moisture Index */}
            <div className="space-y-1.5 bg-ink-900/50 p-3 rounded-md border border-ink-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-paper-dim flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-teal" /> Soil Moisture / Pore Saturation
                </span>
                <span className="font-mono font-bold text-teal text-sm">
                  {Math.round(input.soil_moisture_index * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={input.soil_moisture_index}
                onChange={(e) => setInput({ ...input, soil_moisture_index: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-ink-700 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#58bca0' }}
              />
              <div className="flex justify-between text-[10px] text-paper-faint font-mono">
                <span>0% (Parched)</span>
                <span>50% (Damp)</span>
                <span>80% (Near Saturation)</span>
                <span>100% (Liquid Limit)</span>
              </div>
            </div>

            {/* Slider 4: Geological Formation Score */}
            <div className="space-y-1.5 bg-ink-900/50 p-3 rounded-md border border-ink-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-paper-dim flex items-center gap-1.5">
                  <Gem className="w-3.5 h-3.5 text-ochre" /> Geological Instability Score
                </span>
                <span className="font-mono font-bold text-ochre text-sm">
                  {input.geological_formation_score} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={input.geological_formation_score}
                onChange={(e) => setInput({ ...input, geological_formation_score: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-ink-700 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#d9a441' }}
              />
              <div className="flex justify-between text-[10px] text-paper-faint font-mono">
                <span>1 (Hard Granite)</span>
                <span>5 (Sandstone)</span>
                <span>10 (Fractured Shale/Phyllite)</span>
              </div>
            </div>

            {/* Slider 5: Historical Landslide Count */}
            <div className="space-y-1.5 bg-ink-900/50 p-3 rounded-md border border-ink-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-paper-dim flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-ember" /> Historical Landslides in Grid
                </span>
                <span className="font-mono font-bold text-ember text-sm">
                  {input.historical_landslide_count} events
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={input.historical_landslide_count}
                onChange={(e) => setInput({ ...input, historical_landslide_count: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-ink-700 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#e0524d' }}
              />
              <div className="flex justify-between text-[10px] text-paper-faint font-mono">
                <span>0 (No records)</span>
                <span>5 (Occasional)</span>
                <span>15+ (Chronic Scars)</span>
              </div>
            </div>

            {/* Slider 6: Elevation */}
            <div className="space-y-1.5 bg-ink-900/50 p-3 rounded-md border border-ink-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-paper-dim flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-paper-dim" /> Elevation (MSL)
                </span>
                <span className="font-mono font-bold text-paper text-sm">
                  {input.elevation} m
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="4500"
                step="50"
                value={input.elevation}
                onChange={(e) => setInput({ ...input, elevation: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-ink-700 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#a3b0a4' }}
              />
              <div className="flex justify-between text-[10px] text-paper-faint font-mono">
                <span>100m (Plains)</span>
                <span>1800m (Mid-Himalaya)</span>
                <span>4500m (High Alpine)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Output Risk Score, Explainability & Mitigation (7 cols) */}
        {result && (
          <div className="lg:col-span-7 space-y-5">
            {/* Score & Urgency Card */}
            <div className={`topo-panel p-6 ${
              result.risk_level === 'Critical'
                ? 'topo-panel--critical shadow-2xl shadow-ember/15'
                : result.risk_level === 'High'
                ? 'topo-panel--high'
                : result.risk_level === 'Moderate'
                ? 'topo-panel--moderate'
                : ''
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink-700/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`field-tag ${getRiskBadgeStyles(result.risk_level)}`}>
                      {result.risk_level} Risk Zone
                    </span>
                    <span className="text-xs text-paper-faint font-mono">
                      Confidence: {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-paper mt-1">
                    {result.input_data.location_name}, {result.input_data.state}
                  </h3>
                </div>

                {/* Big Score Display */}
                <div className="text-right">
                  <div className="text-4xl font-black font-mono tracking-tight" style={{ color: result.risk_color }}>
                    {result.risk_score}
                    <span className="text-lg font-normal text-paper-faint"> / 100</span>
                  </div>
                  <span className="text-[11px] text-paper-faint font-mono">Calibrated Risk Index</span>
                </div>
              </div>

              {/* Evacuation Urgency Pill */}
              <div className="mt-4 flex items-center gap-2 p-3 rounded-md bg-ink-900/60 border border-ink-700 text-xs">
                <AlertTriangle className="w-4 h-4 text-ember shrink-0" />
                <span className="text-paper-faint">Evacuation Timeline:</span>
                <strong className="text-paper font-mono">{result.evacuation_urgency}</strong>
              </div>
            </div>

            {/* Explainability (SHAP Factor Contributions) */}
            <div className="topo-panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-ink-700 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal" />
                  <h3 className="font-display text-sm font-semibold text-paper">
                    Explainable AI (XAI) Feature Contributions
                  </h3>
                </div>
                <span className="text-[11px] text-paper-faint">Primary Risk Triggers</span>
              </div>

              <div className="space-y-3">
                {result.top_contributors.map((factor, idx) => (
                  <div key={factor.feature_key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-paper">
                        {idx + 1}. {factor.factor_name}
                      </span>
                      <span className="font-mono text-teal font-bold">
                        {factor.contribution_percentage}% impact ({factor.value} {factor.unit})
                      </span>
                    </div>

                    <div className="w-full h-2 bg-ink-900 rounded-full overflow-hidden border border-ink-700">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, factor.contribution_percentage * 2.2)}%`,
                          backgroundColor:
                            factor.risk_level_impact === 'Critical'
                              ? '#e0524d'
                              : factor.risk_level_impact === 'High'
                              ? '#d9804b'
                              : factor.risk_level_impact === 'Moderate'
                              ? '#d9a441'
                              : '#76b383',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-paper-faint italic">
                      {factor.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mitigation Protocols */}
            <div className="topo-panel p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-ink-700 pb-2">
                <CheckCircle className="w-4 h-4 text-teal" />
                <h3 className="font-display text-sm font-semibold text-paper">
                  Actionable Emergency Mitigation Protocol (SDRF / DEOC)
                </h3>
              </div>

              <div className="space-y-2">
                {result.mitigation_actions.map((act, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-md bg-ink-900/60 border border-ink-700/80 text-xs text-paper-dim flex items-start gap-2"
                  >
                    <span className="shrink-0">{act.slice(0, 2)}</span>
                    <span className="leading-relaxed">{act.slice(2).trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Multilingual Broadcast Preview */}
            <div className="topo-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-ink-700 pb-2">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-clay" />
                  <h3 className="font-display text-sm font-semibold text-paper">
                    Automated Multilingual Warning Message
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {LANGUAGES_META.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLang(lang.code)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        selectedLang === lang.code
                          ? 'bg-clay text-ink-950'
                          : 'bg-ink-900 text-paper-faint hover:text-paper border border-ink-700'
                      }`}
                    >
                      {lang.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-ink-900 border border-ink-700 text-xs font-mono leading-relaxed text-paper">
                {result.multilingual_alerts[selectedLang] || result.multilingual_alerts['en']}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}