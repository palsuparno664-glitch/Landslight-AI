import React, { useState } from 'react';
import { X, Send, AlertCircle, Camera } from 'lucide-react';
import { submitReport } from '../api/client';
import type { CitizenReportInput } from '../types';

export function ReportIncidentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CitizenReportInput>({
    latitude: 27.3389,
    longitude: 88.6065,
    location_name: 'Gangtok - Sevoke Road (NH-10)',
    state: 'Sikkim',
    severity: 'High',
    hazard_type: 'Tension Cracks on Slope',
    description: '',
    reporter_name: 'Anonymous',
    reporter_phone: 'Not provided',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitReport(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setFormData({ ...formData, description: '' });
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit report. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="topo-panel w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-4 border-b border-ink-700 flex justify-between items-center bg-ink-900/60">
          <h2 className="font-display text-lg font-semibold text-paper flex items-center gap-2">
            <AlertCircle className="text-ember" />
            Report Incident
          </h2>
          <button onClick={onClose} className="text-paper-faint hover:text-paper transition-colors">
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-teal/15 rounded-full flex items-center justify-center mb-4">
              <Send size={32} className="text-teal" />
            </div>
            <h3 className="font-display text-xl font-semibold text-paper mb-2">Report Submitted</h3>
            <p className="text-sm text-paper-dim">Your report has been forwarded to the local SDRF authority.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-paper-faint mb-1.5">Description of Hazard</label>
              <textarea
                required
                rows={3}
                className="topo-input"
                placeholder="Describe what you see (e.g. soil creeping, road block, retaining wall breach...)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-paper-faint mb-1.5">Severity</label>
                <select
                  className="topo-input"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option>Low</option>
                  <option>Moderate</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-paper-faint mb-1.5">State</label>
                <input
                  type="text"
                  readOnly
                  value={formData.state}
                  className="topo-input opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            <button type="button" className="w-full py-3 border border-ink-700 border-dashed rounded-md flex items-center justify-center gap-2 text-paper-faint hover:text-clay hover:border-clay/50 hover:bg-clay/5 transition-all">
              <Camera size={20} />
              <span>Attach Image (Simulated)</span>
            </button>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-ember to-clay hover:from-ember hover:to-clay text-ink-950 rounded-md font-semibold shadow-lg shadow-ember/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : 'Submit to Authority'}
                {!loading && <Send size={18} />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}