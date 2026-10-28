'use client';

import { useMemo, useState } from 'react';
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
  const result = useMemo(() => (asked ? classify(asked) : null), [asked]);
  const pending = needed(s.approvalStatus);
  const suggestions: Entry[] = ask.entries.filter((e: Entry) => !e.fallbackOnly).slice(0, 6);
  const sectionTitle = (id: string) => t(content.sections.find((x: { id: string }) => x.id === id)?.title) || id;

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
              setAsked(q);
            }}
          >
            <label htmlFor="ask-input" className="term__prompt">
              <span className="sr-only">{t(s.inputLabel)}</span>
              <span aria-hidden="true">$ ask</span>
            </label>
            <input
              id="ask-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t(s.placeholder)}
              autoComplete="off"
            />
            <button type="submit">{t(s.submit)}</button>
          </form>
          <div className="term__out" aria-live="polite">
            {result && (
              <>
                <p className="term__q">› {asked}</p>
                {result.entry ? (
                  <>
                    <p className="term__a">{result.entry.answer}</p>
                    <p className="term__src">
                      {t(s.sourceLabel)}{' '}
                      <a href={`#${result.entry.sourceSection}`}>{sectionTitle(result.entry.sourceSection)}</a>
                    </p>
                  </>
                ) : (
                  <p className="term__a">
                    {t(s.fallback).replace(/Email me\.?$/, '')}
                    <EmailLink>Email me.</EmailLink>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="chips">
          {suggestions.map((e) => (
            <button
              key={e.id}
              type="button"
              className="chip"
              onClick={() => {
                setQ(e.question);
                setAsked(e.question);
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
