'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ask, content, needed, section, t } from '@/lib/content';
import { EmailLink } from './client';
import { Needed } from './Needed';

type Entry = {
  id: string;
  question: string;
  variants?: string[];
  keywords?: string[];
  contextKeywords?: string[];
  answer: string;
  sourceSection: string;
  fallbackOnly?: boolean;
};
type Result = { entry: Entry | null };
type Source = { id: string; title: string; section: string };
type Reply =
  | { kind: 'fixed'; entry: Entry }
  | { kind: 'ai'; answer: string; sources: Source[]; remaining?: number }
  | { kind: 'fallback'; note?: string }
  | { kind: 'loading' };

const API = process.env.NEXT_PUBLIC_ASK_API;
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/* ---------- Turnstile (bot check), loaded only when someone uses the box ---------- */
type TurnstileApi = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id: string) => void;
  getResponse: (id: string) => string | undefined;
};
declare global {
  interface Window { turnstile?: TurnstileApi }
}
let scriptPromise: Promise<void> | null = null;
function loadTurnstile() {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('turnstile failed to load'));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9%+ ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
const has = (q: string, phrase: string) => q.includes(norm(phrase));

/** Deterministic classifier: no model, only answers Travis approved. Mirrors MCP question routing. */
function classify(question: string): Result {
  const q = norm(question);
  if (q.trim().length < 2) return { entry: null };
  const entries: Entry[] = ask.entries;
  const byId = (id: string) => entries.find((e) => e.id === id) ?? null;

  if ((ask.fencedTerms ?? []).some((f: string) => has(q, f))) return { entry: null };
  for (const r of ask.departureRoutes ?? []) {
    if (r.terms.some((x: string) => has(q, x))) {
      return { entry: r.requiresAny.some((x: string) => has(q, x)) ? byId(r.entry) : null };
    }
  }

  let best: Entry | null = null;
  let bestScore = 0;
  for (const e of entries) {
    let score = 0;
    if ([e.question, ...(e.variants ?? [])].some((v) => norm(v) === q)) score += 10;
    for (const k of e.keywords ?? []) if (has(q, k)) score += 3;
    for (const k of e.contextKeywords ?? []) if (has(q, k)) score += 2;
    if (score > bestScore) {
      best = e;
      bestScore = score;
    }
  }
  if (!best || bestScore < 2 || best.fallbackOnly) return { entry: null };
  return { entry: best };
}

export function Ask() {
  const s = section('ask');
  const [q, setQ] = useState('');
  const [asked, setAsked] = useState<string | null>(null);
  const [reply, setReply] = useState<Reply | null>(null);
  const widgetEl = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetId = useRef<string | null>(null);
  const pending = needed(s.approvalStatus);
  const suggestions: Entry[] = ask.entries.filter((e: Entry) => !e.fallbackOnly).slice(0, 6);
  const sectionTitle = (id: string) => t(content.sections.find((x: { id: string }) => x.id === id)?.title) || id;
  const live = Boolean(API && SITE_KEY);

  const prepare = useCallback(async () => {
    if (!live || widgetId.current || !widgetEl.current) return;
    await loadTurnstile();
    if (window.turnstile && widgetEl.current && !widgetId.current) {
      widgetId.current = window.turnstile.render(widgetEl.current, { sitekey: SITE_KEY, appearance: 'interaction-only', 'refresh-expired': 'auto' });
    }
  }, [live]);

  const token = async () => {
    for (let i = 0; i < 40; i++) {
      let v: string | undefined;
      try {
        v = window.turnstile?.getResponse(widgetId.current ?? undefined as unknown as string);
      } catch {
        v = undefined;
      }
      if (v) return v;
      await new Promise((r) => setTimeout(r, 150));
    }
    return undefined;
  };

  useEffect(() => {
    if (!live) return;
    const el = document.getElementById('ask');
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (prepare(), io.disconnect()), { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [live, prepare]);

  async function run(question: string) {
    setAsked(question);
    setQ('');
    const local = classify(question);
    if (!live) return setReply(local.entry ? { kind: 'fixed', entry: local.entry } : { kind: 'fallback' });
    setReply({ kind: 'loading' });
    try {
      await prepare();
      const send = async () =>
        fetch(API!, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question, token: await token() }) });
      let r = await send();
      if (r.status === 403 && widgetId.current) {
        // token expired or was used: get a fresh one and try once more
        window.turnstile?.reset(widgetId.current);
        await new Promise((res) => setTimeout(res, 400));
        r = await send();
      }
      const d = await r.json();
      if (d.mode === 'ai') {
        const seen = new Set<string>();
        const sources = (d.sources as Source[]).filter((x) => !seen.has(x.title) && seen.add(x.title));
        setReply({ kind: 'ai', answer: d.answer, sources, remaining: d.remaining });
      }
      else if (d.mode === 'limited') setReply({ kind: 'fallback', note: d.answer });
      else if (d.mode === 'off' && local.entry) setReply({ kind: 'fixed', entry: local.entry });
      else setReply({ kind: 'fallback' });
    } catch {
      setReply(local.entry ? { kind: 'fixed', entry: local.entry } : { kind: 'fallback' });
    } finally {
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  return (
    <section id="ask" className="sec ask" aria-labelledby="ask-title">
      <div className="wrap wrap--narrow">
        <h2 id="ask-title" className="display display--sm">{t(s.title)}</h2>
        <p className="lede">{t(s.intro)}</p>
        <p className="fine">
          {t(s.classifierLine)} {t(s.noLiveModel)}
        </p>
        {pending && <Needed>{pending.replace(/^NEEDED FROM TRAVIS:\s*/, '')}</Needed>}

        <div className="term">
          <form
            className="term__form"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) run(q.trim());
            }}
          >
            <label htmlFor="ask-input" className="term__prompt">
              <span className="sr-only">{t(s.inputLabel)}</span>
              <span aria-hidden="true">$ ask</span>
            </label>
            <input
              id="ask-input"
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={prepare}
              maxLength={300}
              placeholder={t(s.placeholder)}
              autoComplete="off"
            />
            <button type="submit">{t(s.submit)}</button>
          </form>
          <div className="term__out" aria-live="polite">
            {reply && asked && (
              <>
                <p className="term__q">› {asked}</p>
                {reply.kind === 'loading' && <p className="term__a term__loading">Searching my resume<span>...</span></p>}
                {reply.kind === 'fixed' && (
                  <>
                    <p className="term__a">{reply.entry.answer}</p>
                    <p className="term__src">
                      {t(s.sourceLabel)} <a href={`#${reply.entry.sourceSection}`}>{sectionTitle(reply.entry.sourceSection)}</a> · approved answer
                    </p>
                  </>
                )}
                {reply.kind === 'ai' && (
                  <>
                    <p className="term__a">{reply.answer}</p>
                    <p className="term__src">
                      AI answer from {reply.sources.length} source{reply.sources.length > 1 ? 's' : ''}:{' '}
                      {reply.sources.map((src, i) => (
                        <span key={src.id}>
                          {i > 0 && ', '}
                          <a href={`#${src.section}`}>{src.title}</a>
                        </span>
                      ))}
                    </p>
                  </>
                )}
                {reply.kind === 'fallback' && (
                  <p className="term__a">
                    {reply.note ? `${reply.note.replace(/Email me\.?$/, '')}` : t(s.fallback).replace(/Email me\.?$/, '')}
                    <EmailLink>Email me.</EmailLink>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <div ref={widgetEl} className="turnstile" />
        {live && <p className="fine">Rate limited and checked for bots by Cloudflare Turnstile. If the AI is unavailable, my approved answers fill in.</p>}
        <div className="chips">
          {suggestions.map((e) => (
            <button
              key={e.id}
              type="button"
              className="chip"
              onClick={() => {
                setQ(e.question);
                run(e.question);
              }}
            >
              {e.question}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
