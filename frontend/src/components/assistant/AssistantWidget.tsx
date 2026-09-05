'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Satellite,
  MapPin,
  Cross,
  Camera,
  Zap,
  X,
} from 'lucide-react';
import { askAssistant } from '@/api/client';
import type { AssistantSource } from '@/types';

/** small inline glyphs for source chips (rendered inside assistant bubbles) */
function SourceGlyph({ kind }: { kind: AssistantSource['kind'] }) {
  const cls = 'w-3 h-3';
  switch (kind) {
    case 'zone':
      return <MapPin className={`${cls} text-teal`} />;
    case 'shelter':
      return <Cross className={`${cls} text-ochre`} />;
    case 'report':
      return <Camera className={`${cls} text-ember`} />;
    default:
      return <MapPin className={`${cls} text-teal`} />;
  }
}

const STARTER_QUESTIONS = [
  'Where will landslides occur today?',
  'Where are the safe zones?',
  'Nearest shelter to Mangan',
  'Is Gangtok at risk?',
  'What should I do in an emergency?',
];

const FALLBACK_MESSAGE =
  "⚠️ I couldn't reach the LANDSIGHT risk engine right now.\n\n" +
  'If this is an emergency, call:\n' +
  '• NDRF / SDRF Central: **1070**\n' +
  '• State DEOC Helpline: **1077**\n' +
  '• Border Roads (BRTF): **1800-118-005**\n\n' +
  'Please try your question again in a moment.';

type Bubble = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources: AssistantSource[];
  provider?: 'offline' | 'llm';
};

let nextBubbleId = 1;

/** Renders the backend's light markdown (``**bold**`` + `•`/newlines) to safe JSX. */
function RenderAnswer({ text }: { text: string }) {
  const parts = text.split('**');
  const nodes: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      nodes.push(
        <strong key={i} className="font-semibold text-clay">
          {part}
        </strong>
      );
    } else if (part) {
      nodes.push(<span key={i}>{part}</span>);
    }
  });
  return <div className="whitespace-pre-wrap break-words">{nodes}</div>;
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [suggested, setSuggested] = useState<string[]>(STARTER_QUESTIONS);
  const [lastProvider, setLastProvider] = useState<'offline' | 'llm' | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep the thread pinned to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bubbles, pending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    setInput('');
    setPending(true);
    const history = bubbles.map((b) => ({ role: b.role, content: b.content }));
    setBubbles((prev) => [
      ...prev,
      { id: nextBubbleId++, role: 'user', content: q, sources: [] },
    ]);

    try {
      const res = await askAssistant(q, history);
      setBubbles((prev) => [
        ...prev,
        {
          id: nextBubbleId++,
          role: 'assistant',
          content: res.answer,
          sources: res.sources ?? [],
          provider: res.provider,
        },
      ]);
      setSuggested(res.suggested_questions?.length ? res.suggested_questions : STARTER_QUESTIONS);
      setLastProvider(res.provider);
    } catch {
      setBubbles((prev) => [
        ...prev,
        { id: nextBubbleId++, role: 'assistant', content: FALLBACK_MESSAGE, sources: [] },
      ]);
      setSuggested(['Where are the safe zones?', 'What should I do in an emergency?', 'Is Gangtok at risk?']);
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') send(input);
  }

  return (
    <>
      {/* Floating launch button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close LANDSIGHT assistant' : 'Ask the LANDSIGHT risk AI'}
        className="fixed right-5 bottom-5 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-clay text-ink-950 shadow-lg shadow-ember/30 transition hover:scale-105 hover:bg-ember focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
      >
        {bubbles.some((b) => b.role === 'assistant') && !open && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-ember opacity-75" />
            <span className="absolute inline-flex h-3 w-3 rounded-full bg-ember" />
          </span>
        )}
        <span aria-hidden>{open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="topo-panel fixed right-5 bottom-5 z-[1000] flex max-h-[min(88vh,640px)] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden shadow-2xl shadow-ink-950/70">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-ink-850/80 px-4 pt-3 pb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="instrument-glyph w-9 h-9">
                <Satellite className="h-4 w-4 text-teal" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[15px] font-semibold leading-tight text-paper truncate">
                  LANDSIGHT Ask-AI
                </p>
                <p className="text-[11px] leading-tight text-paper-faint">
                  Landslide risk Q&A for the North-East
                </p>
              </div>
            </div>
            <span
              className={`field-tag ${
                lastProvider === 'llm' ? 'field-tag--clay' : 'field-tag--teal'
              }`}
              title={lastProvider === 'llm' ? 'Answered by the connected LLM' : 'Running fully on-device / offline'}
            >
              {lastProvider === 'llm' ? <Zap className="w-3 h-3" /> : null}
              {lastProvider === 'llm' ? 'LLM' : 'OFFLINE ENGINE'}
            </span>
          </div>
          {/* contour header band */}
          <div className="contour-band--thin" />

          {/* Messages */}
          <div ref={scrollRef} className="flex h-[320px] flex-col gap-2.5 overflow-y-auto px-3 py-3">
            {bubbles.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-paper-dim">
                  Ask anything about landslide risk across the 8 NER states — where they can happen,
                  safe zones, shelters, roads, live rainfall and what to do.
                </p>
                <p className="text-[11px] text-paper-faint">Works fully offline — no internet or API key needed.</p>
              </div>
            ) : (
              bubbles.map((b) => (
                <div key={b.id} className={`flex flex-col ${b.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                      b.role === 'user'
                        ? 'rounded-br-sm bg-clay text-ink-950'
                        : 'rounded-bl-sm bg-ink-800 text-paper'
                    }`}
                  >
                    {b.role === 'assistant' ? (
                      <RenderAnswer text={b.content} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{b.content}</p>
                    )}
                  </div>
                  {b.role === 'assistant' && b.sources.length > 0 && (
                    <div className="mt-1 flex max-w-[85%] flex-wrap gap-1">
                      {b.sources.map((s, i) => (
                        <span
                          key={`${b.id}-${i}`}
                          title={s.detail}
                          className="flex items-center gap-1 rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 text-[10px] font-mono text-paper-dim"
                        >
                          <SourceGlyph kind={s.kind} />
                          {s.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {pending && (
              <div className="flex items-start">
                <div className="flex items-center gap-1 rounded-lg rounded-bl-sm bg-ink-800 px-3 py-2.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper-faint"
                      style={{ animationDelay: `${i * 140}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggested prompts */}
          {suggested.length > 0 && !pending && (
            <div className="flex flex-wrap gap-1.5 border-t border-ink-700/60 px-3 pt-2 pb-1">
              {suggested.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-ink-700 bg-ink-850/70 px-2.5 py-1 text-[11px] text-teal transition hover:border-teal/50 hover:text-teal"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-ink-700/60 bg-ink-900/40 px-3 py-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask the risk AI…"
              disabled={pending}
              className="topo-input min-w-0 flex-1 py-2 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-md bg-clay px-3.5 py-2 text-[13px] font-semibold text-ink-950 transition hover:bg-ember disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}