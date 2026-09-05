'use client';

import React, { useState } from 'react';
import {
  Send,
  Radio,
  ShieldAlert,
  Users,
  CheckCircle,
  Clock,
  Languages,
  Truck,
  Building,
  Flame,
  AlertTriangle,
  FileCheck,
  Droplets,
  Mountain
} from 'lucide-react';
import { INITIAL_MONITORING_ZONES, INITIAL_DISPATCHES } from '@/lib/ner-data';
import { MonitoringZone, DispatchRecord } from '@/types';
import { soundManager } from '@/lib/sound';

const LANGUAGES_LIST = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'as', label: 'অসমীয়া (Assamese)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ne', label: 'नेपाली (Nepali)' },
  { code: 'kha', label: 'Khasi' },
  { code: 'miz', label: 'Mizo' },
  { code: 'mni', label: 'Manipuri' },
];

export default function DispatchPage() {
  const [selectedZone, setSelectedZone] = useState<MonitoringZone>(INITIAL_MONITORING_ZONES[0]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(INITIAL_DISPATCHES);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en', 'hi', 'ne', 'as']);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'SMS Cell Broadcast',
    'CAP Siren System',
    'SDRF Tactical Radio',
    'IVR Automated Call',
  ]);
  const [sdrfUnits, setSdrfUnits] = useState(3);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [previewLang, setPreviewLang] = useState('en');

  // Generate localized preview message
  const getLocalizedMessage = (lang: string, zone: MonitoringZone) => {
    if (lang === 'hi') {
      return `🚨 [अति गंभीर भूस्खलन चेतावनी] ${zone.name}, ${zone.state} में भारी भूस्खलन का तत्काल खतरा है (जोखिम स्कोर: ${zone.risk_score}/100)। ढलानों वाले इलाकों को तुरंत खाली करें। नजदीकी राहत शिविर (${zone.nearest_shelter}) में जाएं। SDRF सहायता के लिए 1070 डायल करें।`;
    }
    if (lang === 'as') {
      return `🚨 [জৰুৰী ভূমিস্খলন সতৰ্কবাৰ্তা] ${zone.name}, ${zone.state}ত ভূমিস্খলনৰ প্ৰচণ্ড আশংকা দেখা দিছে (বিপদৰ মাত্ৰা: ${zone.risk_score}/100)। পাহাৰীয়া ঢালৰ পৰা তৎক্ষণাত নিৰাপদ আশ্ৰয় শিবিৰলৈ যাওক। সহায়ৰ বাবে 1070 নম্বৰত ফোন কৰক।`;
    }
    if (lang === 'bn') {
      return `🚨 [জরুরী ভূমিধস সতর্কবার্তা] ${zone.name}, ${zone.state}-এ মারাত্মক ভূমিধসের আশঙ্কা রয়েছে (ঝুঁকি স্কোর: ${zone.risk_score}/100)। পাহাড়ি ঢাল ছেড়ে দ্রুত নিরাপদ আশ্রয়কেন্দ্রে যান। জরুরি সহায়তার জন্য ১০৭০ নম্বরে যোগাযোগ করুন।`;
    }
    if (lang === 'ne') {
      return `🚨 [अति गम्भीर पहिरो चेतावनी] ${zone.name}, ${zone.state} मा भीषण पहिरो आउने उच्च जोखिम छ (जोखिम स्तर: ${zone.risk_score}/100)। तुरुन्त भीरपाखो क्षेत्र खाली गरी सुरक्षित आश्रयस्थलमा जानुहोस्। उद्दारका लागि 1070 मा सम्पर्क गर्नुहोस्।`;
    }
    if (lang === 'kha') {
      return `🚨 [JINGMAHAM JINGTIAN KA KHYNDEW] Ka jingma kaba jur ha ${zone.name}, ${zone.state} (Risk: ${zone.risk_score}/100). Kynriah noh mardor sha ki jaka shngain. Phone sha 1070 na ka bynta ka jingiarap SDRF.`;
    }
    if (lang === 'miz') {
      return `🚨 [LEILUNG CHHIA VAUNA HLOUH] ${zone.name}, ${zone.state}-ah lei tlah hlauhawm tak a awm (Risk: ${zone.risk_score}/100). Chhim lam leh tlang thlang atangin inthiarfihlim vat rawh u. SDRF puihna atan 1070 be rawh u.`;
    }
    if (lang === 'mni') {
      return `🚨 [খুদোংথিবা চিং চুগৎপগী ৱাৰ্নিং] ${zone.name}, ${zone.state}দা য়াম্না কন্না চিং চুগৎপগী অমুক হন্না খুদোংথিবা লাকপগী ফিভম লৈরে (Risk: ${zone.risk_score}/100)। খোঙজেল য়াংনা অশোই-অঙাম থোক্তবা মফমদা চৎলু। মতেংগীদমক 1070 দা কোল তৌবীয়ু।`;
    }
    return `🚨 [CRITICAL LANDSLIDE ALERT] Imminent landslide danger at ${zone.name}, ${zone.state} (Risk Score: ${zone.risk_score}/100). Evacuate downhill slopes immediately. Move to designated relief shelter (${zone.nearest_shelter}). Dial 1070 for SDRF rescue.`;
  };

  const handleToggleLang = (code: string) => {
    if (selectedLanguages.includes(code)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((c) => c !== code));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  const handleToggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter((c) => c !== channel));
      }
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleTriggerBroadcast = () => {
    setIsBroadcasting(true);
    soundManager.playCriticalSiren();

    setTimeout(() => {
      const newDispatch: DispatchRecord = {
        dispatch_id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        zone_name: selectedZone.name,
        state: selectedZone.state,
        target_audience: `${selectedZone.estimated_population_at_risk?.toLocaleString() || '12,000'} Citizens & SDRF Platoons`,
        channels: selectedChannels,
        languages: selectedLanguages.map((c) => LANGUAGES_LIST.find((l) => l.code === c)?.label || c),
        priority: `${selectedZone.risk_level.toUpperCase()} PRIORITY`,
        message_preview: getLocalizedMessage('en', selectedZone),
        sdrf_units_deployed: sdrfUnits,
      };

      setDispatches([newDispatch, ...dispatches]);
      setIsBroadcasting(false);
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="topo-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="instrument-glyph">
              <Radio className="w-5 h-5 text-ember animate-pulse" />
            </span>
            <h1 className="font-display text-xl font-semibold text-paper tracking-tight">
              Authority Emergency Response & Multilingual Dispatch Hub
            </h1>
            <span className="field-tag field-tag--ember">NDMA / SDRF Direct Gateway</span>
          </div>
          <div className="contour-band my-2 max-w-2xl" />
          <p className="text-xs text-paper-dim max-w-2xl">
            Ranked emergency priority engine. Coordinate instantaneous multi-channel warning broadcasts (SMS Cell Broadcast, CAP, IVR Sirens) in 8 indigenous North-Eastern languages and mobilize search & rescue battalions.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-ink-900/70 px-3.5 py-2 rounded-md border border-ink-700 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-paper-faint block">SDRF Standby Units</span>
            <strong className="text-teal font-mono text-sm">18 Platoons Active</strong>
          </div>
        </div>
      </div>

      {broadcastSuccess && (
        <div className="p-4 rounded-md bg-ink-900/70 border border-teal/50 text-teal text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal shrink-0" />
            <span>Emergency Broadcast Dispatched across {selectedChannels.length} channels in {selectedLanguages.length} languages! {sdrfUnits} SDRF battalions mobilized.</span>
          </div>
          <span className="font-mono text-teal text-[11px]">DISPATCH RECORDED ✓</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Priority Risk Zones Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="topo-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-ember animate-pulse" />
                <h2 className="font-display text-sm font-semibold text-paper">Emergency Priority Queue</h2>
              </div>
              <span className="text-[10px] text-paper-faint font-mono">Ranked by Risk + Pop</span>
            </div>

            <div className="space-y-2.5">
              {INITIAL_MONITORING_ZONES.map((zone, idx) => {
                const isSelected = selectedZone.id === zone.id;
                const isCritical = zone.risk_level === 'Critical';
                const isHigh = zone.risk_level === 'High';

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-3.5 rounded-md border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-clay/10 border-clay shadow-lg shadow-clay/10'
                        : 'bg-ink-900/60 border-ink-700 hover:bg-ink-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-ink-850 text-paper-dim flex items-center justify-center font-mono font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <strong className="text-xs text-paper block">{zone.name}</strong>
                          <span className="text-[10px] text-paper-faint">{zone.state}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                          isCritical
                            ? 'bg-ember/15 text-ember border-ember/40 animate-pulse'
                            : isHigh
                            ? 'bg-clay/15 text-clay border-clay/40'
                            : 'bg-ochre/15 text-ochre border-ochre/40'
                        }`}
                      >
                        {zone.risk_score}/100
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-ink-700 flex justify-between items-center text-[10px] text-paper-dim">
                      <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-teal" /> Rain: <strong>{zone.rainfall_last_24h} mm</strong></span>
                      <span className="flex items-center gap-1"><Mountain className="w-3 h-3 text-clay" /> Slope: <strong>{zone.slope_angle}°</strong></span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3 text-teal" /> Pop: <strong className="text-teal">{zone.estimated_population_at_risk?.toLocaleString()}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Broadcast Configuration & Multilingual Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="topo-panel p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <div>
                <span className="text-[10px] text-clay font-mono font-bold uppercase tracking-wider">
                  Target Zone Selected
                </span>
                <h2 className="font-display text-base font-semibold text-paper">{selectedZone.name} ({selectedZone.state})</h2>
              </div>
              <span className={`px-2.5 py-1 rounded-md border border-ink-700 text-xs font-mono font-bold ${
                selectedZone.risk_level === 'Critical'
                  ? 'bg-ember/15 text-ember border-ember/40'
                  : selectedZone.risk_level === 'High'
                  ? 'bg-clay/15 text-clay border-clay/40'
                  : 'bg-ochre/15 text-ochre border-ochre/40'
              }`}>
                {selectedZone.risk_level.toUpperCase()} ({selectedZone.risk_score})
              </span>
            </div>

            {/* Multilingual Channel Selectors */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-paper-dim flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-clay" />
                Select Indigenous Dispatch Languages (Multi-Select)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {LANGUAGES_LIST.map((lang) => {
                  const isChecked = selectedLanguages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleToggleLang(lang.code)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        isChecked
                          ? 'bg-clay/15 text-clay border-clay/50'
                          : 'bg-ink-900 text-paper-faint border-ink-700 hover:text-paper'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-[10px]">{isChecked ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Broadcast Channel Protocols */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-paper-dim flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-teal" />
                Emergency Transmission Channels
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'SMS Cell Broadcast',
                  'CAP Siren System',
                  'SDRF Tactical Radio',
                  'IVR Automated Call',
                ].map((channel) => {
                  const isChecked = selectedChannels.includes(channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => handleToggleChannel(channel)}
                      className={`p-2.5 rounded-md text-xs font-semibold border text-left flex items-center justify-between ${
                        isChecked
                          ? 'bg-teal/15 text-teal border-teal/50'
                          : 'bg-ink-900 text-paper-faint border-ink-700'
                      }`}
                    >
                      <span>{channel}</span>
                      <span className="text-xs font-mono">{isChecked ? '● ACTIVE' : '○'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SDRF Mobilization Stepper */}
            <div className="flex items-center justify-between bg-ink-900/60 p-3.5 rounded-md border border-ink-700">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal" />
                <div>
                  <strong className="text-xs text-paper block">SDRF / NDRF Platoons Mobilization</strong>
                  <span className="text-[10px] text-paper-faint">Pre-stage heavy excavators & search dogs</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSdrfUnits(Math.max(1, sdrfUnits - 1))}
                  className="w-7 h-7 rounded-md bg-ink-850 hover:bg-ink-800 text-paper font-bold"
                >
                  -
                </button>
                <span className="w-8 text-center font-mono font-bold text-clay text-sm">{sdrfUnits}</span>
                <button
                  onClick={() => setSdrfUnits(sdrfUnits + 1)}
                  className="w-7 h-7 rounded-md bg-ink-850 hover:bg-ink-800 text-paper font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Live Message Synthesis Preview */}
            <div className="space-y-2 bg-ink-900/80 p-4 rounded-md border border-ink-700">
              <div className="flex items-center justify-between border-b border-ink-700 pb-2">
                <span className="text-xs font-bold text-paper-dim flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-clay" />
                  Live Broadcast Synthesizer Preview
                </span>
                <div className="flex items-center gap-1">
                  {selectedLanguages.map((code) => (
                    <button
                      key={code}
                      onClick={() => setPreviewLang(code)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        previewLang === code ? 'bg-clay text-ink-950' : 'bg-ink-850 text-paper-faint'
                      }`}
                    >
                      {code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs font-mono text-paper leading-relaxed">
                {getLocalizedMessage(previewLang, selectedZone)}
              </p>
            </div>

            {/* Broadcast Action Button */}
            <button
              onClick={handleTriggerBroadcast}
              disabled={isBroadcasting}
              className="w-full py-3 rounded-md bg-gradient-to-r from-ember via-clay to-ochre hover:from-ember hover:to-ochre text-ink-950 font-bold text-xs shadow-xl shadow-ember/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>
                {isBroadcasting
                  ? 'Transmitting Broadcast Signals...'
                  : `DISPATCH EMERGENCY BROADCAST (${selectedZone.name})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}