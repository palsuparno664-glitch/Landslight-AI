'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserRound, Lock, LogIn, AlertTriangle, Fingerprint } from 'lucide-react';

const NER_STATES = [
  'Sikkim',
  'Meghalaya',
  'Assam',
  'Arunachal Pradesh',
  'Nagaland',
  'Mizoram',
  'Manipur',
  'Tripura',
];

const DISTRICTS_BY_STATE: Record<string, string[]> = {
  'Sikkim': ['Mangan'],
  'Meghalaya': ['East Khasi Hills'],
  'Assam': ['Dima Hasao'],
  'Arunachal Pradesh': ['Tawang'],
  'Nagaland': ['Kohima'],
  'Mizoram': ['Aizawl'],
  'Manipur': ['Tamenglong'],
  'Tripura': ['Jampui Hills'],
};

type Role = 'citizen' | 'officer';

const labelCls = 'block mb-1.5 text-[11px] font-mono font-bold uppercase tracking-widest text-paper-faint';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('citizen');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Citizen identity
  const [fullName, setFullName] = useState('');
  const [homeState, setHomeState] = useState(NER_STATES[0]);

  // Officer credentials
  const [officerState, setOfficerState] = useState(NER_STATES[0]);
  const [district, setDistrict] = useState(DISTRICTS_BY_STATE[NER_STATES[0]][0]);
  const [officerId, setOfficerId] = useState('');
  const [securityCode, setSecurityCode] = useState('');

  const handleStateChange = (value: string) => {
    setOfficerState(value);
    setDistrict(DISTRICTS_BY_STATE[value]?.[0] ?? '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === 'citizen' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (role === 'officer' && !officerId.trim()) {
      setError('Please enter your officer ID.');
      return;
    }
    if (role === 'officer' && !securityCode.trim()) {
      setError('Please enter your access code.');
      return;
    }

    setSubmitting(true);
    try {
      const payload =
        role === 'citizen'
          ? { role: 'citizen' as const, full_name: fullName.trim(), home_state: homeState }
          : {
              role: 'officer' as const,
              officer_id: officerId.trim(),
              district,
              security_code: securityCode.trim(),
            };

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');

      const target = new URLSearchParams(window.location.search).get('next') || '/';
      router.push(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col justify-center mt-6">
      <div className="topo-panel p-7 sm:p-9">
        {/* Header */}
        <div className="mb-7">
          <span className="field-tag field-tag--clay mb-3 inline-flex">Identity Verification</span>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-paper">
            Verify your <span className="text-clay">field role</span>
          </h1>
          <p className="text-sm text-paper-dim mt-1.5 leading-relaxed">
            Sign in as a Citizen or a Field Officer to access the LANDSIGHT operations grid.
          </p>
        </div>

        {/* Role toggle */}
        <div className="grid grid-cols-2 gap-2 mb-7">
          {(['citizen', 'officer'] as Role[]).map((r) => {
            const active = role === r;
            const Icon = r === 'citizen' ? UserRound : ShieldCheck;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-lg border text-xs font-bold font-mono uppercase tracking-widest transition-all ${
                  active
                    ? r === 'officer'
                      ? 'bg-clay/15 border-clay/60 text-clay shadow-[inset_2px_0_0_var(--clay)]'
                      : 'bg-teal/15 border-teal/60 text-teal shadow-[inset_2px_0_0_var(--teal)]'
                    : 'bg-ink-900/60 border-ink-700 text-paper-faint hover:text-paper hover:bg-ink-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {r === 'citizen' ? 'Citizen' : 'Field Officer'}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'citizen' ? (
            <>
              <div>
                <label htmlFor="full-name" className={labelCls}>Full Name</label>
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Anamika Das"
                  className="topo-input"
                />
              </div>
              <div>
                <label htmlFor="home-state" className={labelCls}>Home State</label>
                <select
                  id="home-state"
                  value={homeState}
                  onChange={(e) => setHomeState(e.target.value)}
                  className="topo-input"
                >
                  {NER_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="officer-state" className={labelCls}>State</label>
                  <select
                    id="officer-state"
                    value={officerState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="topo-input"
                  >
                    {NER_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="officer-district" className={labelCls}>District</label>
                  <select
                    id="officer-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="topo-input"
                  >
                    {(DISTRICTS_BY_STATE[officerState] ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="officer-id" className={labelCls}>Officer ID</label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600 pointer-events-none" />
                  <input
                    id="officer-id"
                    type="text"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    placeholder="e.g. OFF-SKM-001"
                    className="topo-input pl-9"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="security-code" className={labelCls}>Access Code</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600 pointer-events-none" />
                  <input
                    id="security-code"
                    type="password"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    placeholder="6-character field code"
                    className="topo-input pl-9"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-ember/10 border border-ember/40 px-3 py-2.5 text-xs text-ember">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-clay text-ink-950 font-mono text-sm font-bold uppercase tracking-widest transition-all hover:bg-ochre hover:shadow-[0_0_16px_rgba(208,120,79,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? 'Verifying…' : role === 'officer' ? 'Verify Officer' : 'Enter as Citizen'}
          </button>
        </form>
      </div>

      {/* Demo credential hint */}
      <p className="mt-4 text-center text-[11px] text-paper-faint font-mono">
        Demo officer&nbsp;&nbsp;·&nbsp;&nbsp;<span className="text-paper-dim">OFF-SKM-001</span>{' '}
        / Mangan, Sikkim / code <span className="text-teal">SKM482</span>
      </p>
    </div>
  );
}