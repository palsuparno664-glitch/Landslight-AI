'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  Mic,
  Upload,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Send,
  RefreshCw,
  ShieldCheck,
  FileImage,
  ClipboardList
} from 'lucide-react';
import { CitizenReport, RiskLevel } from '@/types';
import { offlineStorage } from '@/lib/db';
import { soundManager } from '@/lib/sound';
import { INITIAL_CITIZEN_REPORTS } from '@/lib/ner-data';

export default function CitizenReportForm() {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cvAnalysisRunning, setCvAnalysisRunning] = useState(false);
  const [cvResults, setCvResults] = useState<{ score: number; hazards: string[] } | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [form, setForm] = useState({
    location_name: 'Mangan North Road, km 34',
    state: 'Sikkim',
    latitude: 27.5028,
    longitude: 88.5303,
    severity: 'Critical' as RiskLevel,
    hazard_type: 'Debris Flow & Road Blockage',
    description: 'Heavy slurry and rocks sliding down hillside after cloudburst. Retaining wall breached, road blocked.',
    reporter_name: 'Tashi Bhutia',
    reporter_phone: '+91 98765 43210',
  });

  // Load reports from storage + seed
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const loadAllReports = async () => {
      const stored = await offlineStorage.getAllReports();
      if (stored.length === 0) {
        // Seed default reports
        for (const rep of INITIAL_CITIZEN_REPORTS) {
          await offlineStorage.saveReport(rep);
        }
        setReports(INITIAL_CITIZEN_REPORTS);
      } else {
        setReports(stored);
      }
    };

    loadAllReports();

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingReports();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync function
  const syncPendingReports = async () => {
    const pending = await offlineStorage.getPendingSyncReports();
    if (pending.length > 0) {
      for (const p of pending) {
        await offlineStorage.markReportAsSynced(p.id);
      }
      const updated = await offlineStorage.getAllReports();
      setReports(updated);
      soundManager.playSuccessTone();
    }
  };

  // GPS Auto-detect
  const handleDetectLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4)),
            location_name: 'Detected GPS Coordinates',
          }));
          setIsLocating(false);
        },
        () => {
          // Fallback to default high-risk coordinate (Gangtok/Mangan)
          setForm((prev) => ({
            ...prev,
            latitude: 27.5028,
            longitude: 88.5303,
            location_name: 'Mangan North Road (Fallback GPS)',
          }));
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Photo Upload & AI Computer Vision Analyzer Simulation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImagePreview(url);
        // Trigger simulated computer vision analysis
        setCvAnalysisRunning(true);
        setTimeout(() => {
          setCvAnalysisRunning(false);
          setCvResults({
            score: 94.2,
            hazards: ['Debris Flow Detected (96%)', 'Structural Breach (91%)', 'Roadway Inundation (89%)'],
          });
        }, 1200);
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice Note Simulator
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setVoiceNoteRecorded(true);
        setForm((p) => ({
          ...p,
          description: p.description + ' [Voice Note: Water gushing from upper slope, urgent SDRF clearance required]',
        }));
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isCurrentOnline = navigator.onLine;
    const newReport: CitizenReport = {
      id: `REP-2026-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      latitude: form.latitude,
      longitude: form.longitude,
      location_name: form.location_name,
      state: form.state,
      severity: form.severity,
      hazard_type: form.hazard_type,
      description: form.description,
      media_url: imagePreview || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop',
      reporter_name: form.reporter_name || 'Anonymous Citizen',
      reporter_phone: form.reporter_phone || '+91 98000 00000',
      cv_verification_score: cvResults ? cvResults.score : 89.5,
      cv_detected_hazards: cvResults ? cvResults.hazards : ['Slope Creep', 'Loose Debris'],
      status: isCurrentOnline ? 'Verified & Dispatched' : 'Pending Verification',
      sync_status: isCurrentOnline ? 'synced' : 'pending_sync',
      device_offline_timestamp: !isCurrentOnline ? new Date().toISOString() : undefined,
    };

    await offlineStorage.saveReport(newReport);
    const updated = await offlineStorage.getAllReports();
    setReports(updated);
    setIsSubmitting(false);

    soundManager.playSuccessTone();

    setSubmitSuccessMsg(
      isCurrentOnline
        ? '✅ Report successfully submitted and synced with State Disaster Authority!'
        : '💾 Network Offline: Report saved locally in device IndexedDB. Will auto-sync when network returns!'
    );

    setTimeout(() => setSubmitSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="topo-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="instrument-glyph">
              <Camera className="w-5 h-5 text-teal" />
            </span>
            <h1 className="font-display text-xl font-semibold text-paper tracking-tight">
              Citizen & Field Ground Incident Reporting
            </h1>
            <span className="field-tag field-tag--teal">Offline-First PWA</span>
          </div>
          <div className="contour-band my-2 max-w-2xl" />
          <p className="text-xs text-paper-dim max-w-2xl">
            Empower citizens, local panchayats, and field volunteers to capture geo-tagged landslide observations. Works 100% offline with local IndexedDB storage and auto-syncs upon network reconnection.
          </p>
        </div>

        {/* Sync Status Badge & Manual Trigger */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold ${
            isOnline
              ? 'bg-ink-850 border-ink-600 text-teal'
              : 'bg-ink-850 border-ember/50 text-ember'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4 text-teal" /> : <WifiOff className="w-4 h-4 text-ember animate-pulse" />}
            <span>{isOnline ? 'Online (Ready)' : 'Offline (Local Cache Active)'}</span>
          </div>

          <button
            onClick={syncPendingReports}
            title="Sync offline reports to authority server"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ink-850 hover:bg-ink-800 text-paper-dim border border-ink-700 text-xs font-medium transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal" />
            <span>Sync Queue</span>
          </button>
        </div>
      </div>

      {submitSuccessMsg && (
        <div className="p-4 rounded-md bg-ink-900/70 border border-teal/50 text-teal text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Incident Input (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="topo-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <h2 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-clay" /> Submit Landslide Ground Report
              </h2>
              <span className="text-[11px] text-paper-faint font-mono">Geo-Referenced Record</span>
            </div>

            {/* Geolocation Section */}
            <div className="space-y-2 bg-ink-900/50 p-3.5 rounded-md border border-ink-700">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-paper-dim flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-clay" />
                  Incident Geolocation & State
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="text-[11px] font-bold text-clay hover:text-ember flex items-center gap-1 transition-colors"
                >
                  {isLocating ? 'Acquiring GPS...' : (
                    <>
                      <MapPin className="w-3 h-3" /> Auto-Detect GPS
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Village / Road / Landmark"
                  value={form.location_name}
                  onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                  className="topo-input sm:col-span-2"
                  required
                />
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
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

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-ink-950 border border-ink-700">
                  <span className="text-paper-faint font-mono text-[10px]">Lat:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-transparent font-mono text-teal focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-ink-950 border border-ink-700">
                  <span className="text-paper-faint font-mono text-[10px]">Lng:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-transparent font-mono text-teal focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Severity Level & Hazard Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-paper-dim block mb-1.5">
                  Observed Severity Level
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['Low', 'Moderate', 'High', 'Critical'] as RiskLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setForm({ ...form, severity: lvl })}
                      className={`py-1.5 text-[10px] font-bold rounded-md border transition-all ${
                        form.severity === lvl
                          ? lvl === 'Critical'
                            ? 'bg-ember text-ink-950 border-ember'
                            : lvl === 'High'
                            ? 'bg-clay text-ink-950 border-clay'
                            : lvl === 'Moderate'
                            ? 'bg-ochre text-ink-950 border-ochre'
                            : 'bg-teal text-ink-950 border-teal'
                          : 'bg-ink-900 text-paper-faint border-ink-700 hover:text-paper'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-paper-dim block mb-1.5">
                  Hazard Classification
                </label>
                <select
                  value={form.hazard_type}
                  onChange={(e) => setForm({ ...form, hazard_type: e.target.value })}
                  className="topo-input"
                >
                  <option value="Debris Flow & Road Blockage">Debris Flow & Road Blockage</option>
                  <option value="Tension Cracks on Slope">Tension Cracks on Slope</option>
                  <option value="Mudslide & Silt Inundation">Mudslide & Silt Inundation</option>
                  <option value="Rockfall & Boulder Roll">Rockfall & Boulder Roll</option>
                  <option value="Culvert / Retaining Wall Failure">Culvert / Retaining Wall Failure</option>
                  <option value="Active Ground Subsidence (Sinking)">Active Ground Subsidence (Sinking)</option>
                </select>
              </div>
            </div>

            {/* Media Upload & AI Computer Vision Preview */}
            <div className="space-y-2 bg-ink-900/50 p-3.5 rounded-md border border-ink-700">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-paper-dim flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-teal" />
                  Site Photo & AI Vision Verification
                </label>
                <span className="text-[10px] text-paper-faint font-mono">CV Automated Triage</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-md bg-ink-850 hover:bg-ink-800 text-paper-dim border border-ink-700 text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4 text-teal" />
                  <span>Choose Photo / Camera</span>
                </button>

                {imagePreview && (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-md overflow-hidden border border-ink-700 bg-ink-950">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    {cvAnalysisRunning ? (
                      <span className="text-[11px] text-ochre font-mono flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-ochre animate-ping"></span>
                        AI Vision Analyzing...
                      </span>
                    ) : cvResults ? (
                      <div className="text-[11px] text-teal font-mono">
                        ✓ AI Verified ({cvResults.score}% Confidence)
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Multilingual Voice Note / Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-paper-dim">
                  Detailed Field Observation & Voice Note
                </label>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
                    isRecording
                      ? 'bg-ember text-ink-950 border-ember animate-pulse'
                      : voiceNoteRecorded
                      ? 'bg-teal/15 text-teal border-teal/40'
                      : 'bg-ink-900 text-paper-faint border-ink-700 hover:text-paper'
                  }`}
                >
                  {isRecording ? <Mic className="w-3 h-3 text-ink-950" /> : <Mic className="w-3 h-3" />}
                  <span>{isRecording ? 'Recording (3s)...' : voiceNoteRecorded ? 'Voice Note Attached ✓' : 'Add Voice Memo'}</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe slope condition, rock movement, crack width, damaged structures..."
                className="topo-input"
                required
              />
            </div>

            {/* Reporter Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-paper-faint block mb-1">
                  Reporter Name / Volunteer ID
                </label>
                <input
                  type="text"
                  value={form.reporter_name}
                  onChange={(e) => setForm({ ...form, reporter_name: e.target.value })}
                  className="topo-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-paper-faint block mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={form.reporter_phone}
                  onChange={(e) => setForm({ ...form, reporter_phone: e.target.value })}
                  className="topo-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-md bg-gradient-to-r from-teal via-clay to-ember hover:from-teal hover:to-ember text-ink-950 font-bold text-xs shadow-lg shadow-ink-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Report...' : 'Submit Incident Report (Offline Protected)'}</span>
            </button>
          </form>
        </div>

        {/* Right: Live Reports Feed & Sync Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="topo-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-clay" />
                <h3 className="font-display text-sm font-semibold text-paper">
                  Field Reports Queue ({reports.length})
                </h3>
              </div>
              <span className="text-[10px] text-paper-faint font-mono">Real-time Verified</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {reports.map((rep) => {
                const isSyncPending = rep.sync_status === 'pending_sync';
                return (
                  <div
                    key={rep.id}
                    className={`p-3.5 rounded-md border text-xs space-y-2 transition-all ${
                      isSyncPending
                        ? 'bg-ochre/10 border-ochre/40'
                        : 'bg-ink-900/70 border-ink-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-paper text-xs block">
                          {rep.location_name}
                        </span>
                        <span className="text-[10px] text-paper-faint">
                          {rep.state} • {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Sync Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${
                          isSyncPending
                            ? 'bg-ochre/15 text-ochre border-ochre/40 animate-pulse'
                            : 'bg-teal/15 text-teal border-teal/40'
                        }`}
                      >
                        {isSyncPending ? (
                          <>
                            <Clock className="w-2.5 h-2.5" />
                            Saved Offline (Sync Pending)
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Synced with Authority
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-paper-dim font-medium">{rep.hazard_type}</p>
                    <p className="text-[11px] text-paper-faint italic">&ldquo;{rep.description}&rdquo;</p>

                    {rep.media_url && (
                      <div className="h-24 w-full rounded-md overflow-hidden border border-ink-700 bg-ink-950">
                        <img src={rep.media_url} alt="Report scene" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="pt-2 border-t border-ink-700 flex justify-between items-center text-[10px] text-paper-faint font-mono">
                      <span>CV Score: <strong className="text-teal">{rep.cv_verification_score}%</strong></span>
                      <span>By: {rep.reporter_name.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}