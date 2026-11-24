import type { Metadata } from 'next';
import { person, section, t } from '@/lib/content';
import { Ask } from '@/components/Ask';
import { CopyCommand, EmailLink, MotionProvider } from '@/components/client';
import { StackTabs } from '@/components/Designed';
import { Paper, SiteDock } from '@/components/LogsChrome';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const metadata: Metadata = {
  title: `Resume | ${t(person.name)}`,
  description: t(section('resume').summary),
  alternates: { canonical: '/resume' },
};

// Tags start upper case, except names that are lower case on purpose (npm)
const cap = (s: string) => (/^npm\b/.test(s) ? s : s.charAt(0).toUpperCase() + s.slice(1));

/* The resume's skill groups (content.json sixty.stack), one tab each. */
const STACK = section('sixty').stack.map((g: Any) => ({ label: g.label, items: t(g).split(', ').map(cap) }));

function Entry({ e, first, last }: { e: Any; first: boolean; last: boolean }) {
  const loc = t(e.location);
  const note = e.context ?? e.progression;
  const bullets = e.short ?? e.highlights ?? [];
  return (
    <li className={`rentry${first ? ' rentry--head' : ''}`}>
      <span className="rentry__d" aria-hidden="true" />
      <article className="glass rentry__card">
        {(first || last || loc) && (
          <p className="rentry__top">
            {first && <span className="pill pill--run">HEAD → main</span>}
            {e.current && <span className="pill pill--branch">BRANCH: OPEN</span>}
            {loc && <span className="mono-sm">{loc}</span>}
            {last && <span className="pill pill--plan">INITIAL COMMIT</span>}
          </p>
        )}
        <h3 className="rentry__co">{t(e.company)}</h3>
        {e.roles.map((r: Any) => (
          <p key={r.id} className="rentry__role"><b>{r.title}</b> · {r.dates}</p>
        ))}
        {note && (
          <p className={e.current ? 'rentry__lead' : 'rentry__ctx'}>
            {t(note)}
            {e.current && <> <a href={section('resume').journeyLink.href}>{t(section('resume').journeyLink)}</a>.</>}
          </p>
        )}
        {bullets.length > 0 && (
          <ul className="rentry__hl">
            {bullets.map((h: Any) => <li key={h.id}>{t(h)}</li>)}
          </ul>
        )}
      </article>
    </li>
  );
}

export default function ResumePage() {
  const r = section('resume');
  const career = section('career');
  const f = section('footer');
  const h = section('header');
  const entries = career.entries;
  return (
    <MotionProvider>
      <Paper />
      <SiteHeader where="resume" />
      <main id="main" className="rpage">
        <section id="top" className="wrap rhero" aria-labelledby="name">
          <nav aria-label="Breadcrumb" className="rcrumb"><a href="/">~</a> / resume</nav>
          <div className="rhero__row">
            <div className="rhero__copy">
              <p className="kick">{t(r.kicker)}</p>
              <h1 id="name" className="rhero__name">{t(person.name)}</h1>
              <p className="rhero__title">{t(person.title)}</p>
              <p className="rhero__sum">{t(r.summary)}</p>
              <p className="mono-sm">{t(r.location)}</p>
            </div>
            <div className="rhero__get">
              <a className="btn btn--accent btn--pill" href={h.resumePdf.href}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </a>
              <p className="rhero__files">
                {f.machineReadable.filter((m: Any) => m.href.startsWith('/resume')).map((m: Any) => <a key={m.id} href={m.href}>{t(m)}</a>)}
              </p>
              <div className="rhero__curl"><CopyCommand command={t(f.curl.command)} /></div>
            </div>
          </div>
        </section>

        <section className="wrap rstack" aria-label="Stack">
          <StackTabs groups={STACK} />
        </section>

        <section className="wrap rcols">
          <div id="career" className="rlog">
            <div className="rlog__head">
              <h2 className="rlog__title">{t(r.logTitle)}</h2>
              <span className="mono-sm">git log --first-parent</span>
            </div>
            <ol className="rlog__list">
              {entries.map((e: Any, i: number) => <Entry key={e.slug} e={e} first={i === 0} last={i === entries.length - 1} />)}
            </ol>
            <p className="glass rlog__edu"><span className="kick">EDUCATION</span> {t(career.education.entry)}</p>
          </div>

          <aside className="rside" aria-label="Ask my resume and links">
            <Ask variant="side" />
            <section className="glass rbox" aria-labelledby="elsewhere-title">
              <h2 id="elsewhere-title" className="kick rbox__h">ELSEWHERE</h2>
              <ul className="rbox__links">
                <li><EmailLink>Email</EmailLink></li>
                <li><a href={person.linkedin.href} target="_blank" rel="noopener">LinkedIn</a></li>
                <li><a href={person.x.href} target="_blank" rel="noopener">X</a></li>
                <li><a href={person.github.href} target="_blank" rel="noopener">GitHub</a></li>
                <li><a href="/#work">Work and open source</a></li>
              </ul>
            </section>
          </aside>
        </section>
      </main>
      <SiteFooter where="resume" />
      <SiteDock where="resume" />
    </MotionProvider>
  );
}
