import type { Metadata } from 'next';
import { person, section, t } from '@/lib/content';
import { Ask } from '@/components/Ask';
import { RemotesLight } from '@/components/Remotes';
import { Push } from '@/components/Buttons';
import { CopyCommand, MotionProvider, SmoothScroll } from '@/components/client';
import { Reveal } from '@/components/Reveal';
import { CareerHead } from '@/components/GraphHead';
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

// Stagger for the hero's entrance
const rd = (i: number) => ({ style: { '--rd': `${i * 0.08}s` } as React.CSSProperties });

function Entry({ e, first, last }: { e: Any; first: boolean; last: boolean }) {
  const loc = t(e.location);
  const note = e.context ?? e.progression;
  const bullets = e.short ?? e.highlights ?? [];
  return (
    <li className={`rentry${first ? ' rentry--head' : ''}`} data-reveal>
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
      <SmoothScroll />
      <Reveal />
      <SiteHeader where="resume" />
      <main id="main" className="rpage">
        <section id="top" className="wrap rhero" aria-labelledby="name">
          <nav aria-label="Breadcrumb" className="rcrumb" data-reveal {...rd(0)}><a href="/">~</a> / resume</nav>
          <div className="rhero__row">
            <div className="rhero__copy">
              <p className="kick" data-reveal {...rd(1)}>{t(r.kicker)}</p>
              <h1 id="name" className="rhero__name" data-reveal {...rd(2)}>{t(person.name)}</h1>
              <p className="rhero__title" data-reveal {...rd(3)}>{t(person.title)}</p>
              <p className="rhero__sum" data-reveal {...rd(4)}>{t(r.summary)}</p>
              <p className="mono-sm" data-reveal {...rd(5)}>{t(r.location)}</p>
            </div>
            <div className="rhero__get" data-reveal {...rd(4)}>
              <Push href={h.resumePdf.href} label="Download PDF" cmd={h.resumePdf.cmd} done={h.resumePdf.done} />
              <p className="rhero__files">
                {f.machineReadable.filter((m: Any) => m.href.startsWith('/resume')).map((m: Any) => <a key={m.id} href={m.href}>{t(m)}</a>)}
              </p>
              <div className="rhero__curl"><CopyCommand command={t(f.curl.command)} /></div>
            </div>
          </div>
        </section>

        <section className="wrap rstack" aria-label="Stack" data-reveal>
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
              <CareerHead />
            </ol>
            <p className="glass rlog__edu" data-reveal><span className="kick">EDUCATION</span> {t(career.education.entry)}</p>
          </div>

          <aside className="rside" aria-label="Ask my resume and links" data-reveal {...rd(2)}>
            <Ask variant="side" />
            <section className="glass rbox rbox--remotes" aria-labelledby="elsewhere-title">
              <h2 id="elsewhere-title" className="rbox__h rbox__rh">
                <span className="kick">{t(r.elsewhere).toUpperCase()}</span>
                <span className="rbox__cmd" aria-hidden="true"><span className="repo__ps">$</span> {r.elsewhere.cmd}</span>
              </h2>
              <RemotesLight extra={{ name: t(r.portfolioRemote), sub: r.portfolioRemote.detail, href: r.portfolioRemote.href }} />
            </section>
          </aside>
        </section>
      </main>
      <SiteFooter where="resume" />
      <SiteDock where="resume" />
    </MotionProvider>
  );
}
