import { person, section, t } from '@/lib/content';
import { posts } from '@/lib/logs';
import { MotionProvider, ScrollSpy, SmoothScroll } from '@/components/client';
import { CommitId, Paper, SiteDock } from '@/components/LogsChrome';
import { CommitJourney, TicketJourney } from '@/components/Journeys';
import { Accent } from '@/components/Accent';
import { Checkout, Cmd, Fetch, Push } from '@/components/Buttons';
import { Remote } from '@/components/Remotes';
import { Pipeline } from '@/components/Pipeline';
import { Reveal } from '@/components/Reveal';
import { SectionRail, SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { LoopBar } from '@/components/LoopBar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;


function Chips({ items, className = 'chip2' }: { items: string[]; className?: string }) {
  return (
    <ul className="chips2">
      {items.map((c) => <li key={c} className={className}>{c}</li>)}
    </ul>
  );
}

/** A small mono "commit" line that marks a section on the act 2 git graph. */
const ext = { target: '_blank', rel: 'noopener' } as const;

function CommitLine({ item, tag }: { item: Any; tag?: boolean }) {
  return (
    <p className="chash" data-commit>
      {tag && <span className="chash__tag" data-tag aria-hidden="true" />}
      {t(item)}
    </p>
  );
}

function Hero() {
  const s = section('hero');
  const term = s.term;
  const loop = s.loop;
  return (
    <section id="top" className="hero hero3" aria-labelledby="hero-title" data-ticket="New" data-ticket-kind="bug">
      <div className="wrap">
        <div className="hero3__head" data-reveal>
          {person.headshot?.path && (
            <img className="hero3__face" src={person.headshot.path} alt={t(person.headshot)} width={72} height={72} />
          )}
          <p className="hero__now">
            <span className="pill pill--run"><span className="pill__dot" aria-hidden="true" />HEAD</span>
            {t(s.now)} · {t(s.place)}
          </p>
        </div>
        <h1 id="hero-title" className="hero3__name">{t(s.h1)}</h1>
        <div className="hero3__grid">
          <div className="hero__copy hero3__copy">
            <p className="hero3__lede"><Accent item={s.value} /></p>
            <div className="hero3__ctas">
              {s.ctas.map((c: Any) =>
                c.kind === 'cmd' ? (
                  <Cmd key={c.id} href={c.href} cmd={t(c).replace(/\s*→$/, '')} />
                ) : (
                  <Push key={c.id} href={c.href} label={t(c)} cmd={c.cmd} done={c.done} />
                ),
              )}
            </div>
          </div>
          <figure className="hero3__term" data-reveal>
            <div className="hero3__termbar" aria-hidden="true"><i /><i /><i /><span>{t(term.title)}</span></div>
            <pre className="hero3__pre">
              <span className="y">HEAD</span> <span className="b">→ main</span>{'\n'}
              <span className="m">Author:</span> {t(person.name)}{'\n'}
              <span className="m">Date:</span>   {t(term.date)}{'\n\n'}
              {'    '}{t(term.subject)}{'\n\n'}
              {term.rows.map((r: Any) => (
                <span key={r.id}>
                  {' '}{t(r).padEnd(18)} | {String(r.value).padStart(2)} <span className="g">{'+'.repeat(r.bar)}</span>
                  {r.note && <> <span className="m">{r.note}</span></>}
                  {'\n'}
                </span>
              ))}
            </pre>
            <figcaption className="sr-only">
              {term.rows.map((r: Any) => `${r.value} ${t(r).replace(/-/g, ' ')}`).join(', ')}
            </figcaption>
          </figure>
        </div>
        <div className="glass loopbar" data-reveal>
          <div className="loopbar__head">
            <p className="kick">{t(loop.kicker)}</p>
            <p className="mono-sm">{t(loop.note)}</p>
          </div>
          <LoopBar stages={loop.stages} status={loop.status} from={loop.from} to={loop.to} />
        </div>
        <p className="fine rail__note">{t(loop.foot)}</p>
      </div>
      <span className="route-anchor" data-route="margin" data-route-at="bottom" />
    </section>
  );
}

function Kit() {
  const s = section('kit');
  return (
    <section id="kit" className="sec sec--tight kit" aria-labelledby="kit-title" data-ticket-away>
      <div className="wrap">
        <div className="kit__card" data-reveal>
          <div className="kit__grid">
            <div className="kit__copy">
              <p className="kick kit__kick">{t(s.kicker)}</p>
              <h2 id="kit-title" className="h2 kit__title">{t(s.title)}</h2>
              <p className="kit__intro">{t(s.intro)}</p>
              <p className="kit__loop">
                {s.loop.map((step: string, i: number) => (
                  <span key={step} className="kit__stepwrap">
                    {i > 0 && <span className="kit__arrow" aria-hidden="true">→</span>}
                    <span className="kit__step">{step}</span>
                  </span>
                ))}
              </p>
              <dl className="kit__stats">
                {s.stats.map((x: Any) => (
                  <div key={x.id} className="kit__stat">
                    <dt>{t(x)}</dt>
                    <dd>{x.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="kit__safety">{t(s.safety)}</p>
              <div className="kit__ctas">
                {s.links.map((l: Any) =>
                  l.cmd ? (
                    <Push key={l.id} href={l.href} label={t(l)} cmd={l.cmd} done={l.done} />
                  ) : (
                    <Checkout key={l.id} href={l.href} color="#0a6fd6">{t(l)}</Checkout>
                  ),
                )}
              </div>
            </div>
            <figure className="kit__fig">
              <img src={s.figure.path} alt={t(s.figure)} width={s.figure.width} height={s.figure.height} loading="lazy" />
              <figcaption>{s.figure.caption}</figcaption>
            </figure>
          </div>
        </div>
      </div>
      <span className="route-anchor" data-route="gutter" data-route-at="bottom" />
    </section>
  );
}

const SAFETY_UI = [
  { title: 'Approval gates', chips: ['billing / auth', 'human approval'], icon: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M16 11l2 2 4-4" /> },
  { title: 'Risk-tiered retries', chips: ['retry cap by risk tier'], icon: <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5" /> },
  { title: 'Verifier agent', chips: ['fresh context'], icon: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4" /> },
  { title: 'Global kill switch', chips: [], icon: <path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.77.04" /> },
];

function Safety() {
  const s = section('safety');
  return (
    <section id="safety" className="sec safety" aria-labelledby="safety-title" data-ticket="At the safety gate" data-ticket-kind="pr">
      <span className="route-anchor" data-route="0.9" data-route-at="top" />
      <div className="wrap">
        <div className="sec__head">
          <span className="glass badge"><span className="badge__dot" aria-hidden="true" />4 safeguards</span>
          <h2 id="safety-title" className="h2">{t(s.title)}</h2>
          <p className="lede"><Accent item={s.intro} /></p>
        </div>
        <span className="route-anchor" data-route="0.9" data-route-at="top" />
        <ol className="stations">
          {s.items.map((it: Any, i: number) => {
            const ui = SAFETY_UI[i];
            return (
              <li key={it.id} className={`station station--${i % 2 ? 'r' : 'l'}`} data-station data-route="0.5" {...(i === 3 ? { 'data-ticket': 'Approved', 'data-ticket-kind': 'pr' } : {})}>
                <span className="station__dot" aria-hidden="true" />
                <div className={`station__card ${i === 0 ? 'station__card--ink' : 'glass'}`} data-reveal>
                  <div className="station__top">
                    <span className="icon-box" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{ui.icon}</svg>
                    </span>
                    <span className="kick kick--mute">0{i + 1}</span>
                  </div>
                  <h3>{ui.title}</h3>
                  <p>{t(it)}</p>
                  {ui.chips.length > 0 && (
                    <div className="tags tags--sm">
                      {ui.chips.map((c, j) => <span key={c} className={`tag ${i === 0 && j === 0 ? 'tag--orange' : ''}`}>{c}</span>)}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="fine">{t(s.visualNote)}</p>
      </div>
      <span className="route-anchor route-anchor--end" data-route="gutter" data-route-at="bottom" />
      <p className="handoff wrap" aria-hidden="true"><span className="handoff__dot" /> {t(s.handoff)}</p>
    </section>
  );
}

const STATUS_CLS: Record<string, string> = { run: 'pill--run', next: 'pill--next', plan: 'pill--plan' };

function Journey() {
  const s = section('journey');
  return (
    <section id="journey" className="sec sec--v2" aria-labelledby="journey-title">
      <div className="wrap graph-col graph-col--v2">
        <CommitLine item={s.commit} />
        <p className="kick">{t(s.kicker)}</p>
        <h2 id="journey-title" className="h2 v2__title">{t(s.title)}</h2>
        <p className="lede v2__lede">{t(s.intro)}</p>
        <div className="glass jstages" data-reveal>
          <ol className="jstages__list">
            <li className="jstages__rail" aria-hidden="true" />
            {s.stages.map((st: Any) => (
              <li key={st.id} className={`jstage jstage--${st.status}`}>
                <span className="jstage__dot" aria-hidden="true" />
                <span className={`pill ${STATUS_CLS[st.status]}`}>{s.statusLabels[st.status]}</span>
                <h3 className="jstage__h">{st.label}</h3>
                <p className="jstage__p">{t(st)}</p>
              </li>
            ))}
          </ol>
          <div className="jstages__foot">
            <span>{t(s.foot)}</span>
            <a href={s.rss.href}>{t(s.rss)}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

const shortDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function BuildLog() {
  const s = section('buildlog');
  // The newest post is featured; the next two cards are older posts, then the planned ones.
  const [latest, ...older] = posts();
  const rest = older.slice(0, 2);
  const upcoming = s.upcoming.slice(0, Math.max(0, 2 - rest.length));
  return (
    <section id="log" className="sec sec--v2" aria-labelledby="log-title">
      <div className="wrap graph-col graph-col--v2">
        <CommitLine item={s.commit} />
        <div className="v2__headrow">
          <div>
            <p className="kick">{t(s.kicker)}</p>
            <h2 id="log-title" className="h2 v2__title">{t(s.title)}</h2>
          </div>
          <Checkout href={s.all.href}>{t(s.all)}</Checkout>
        </div>
        <div className={`hposts${latest ? ' hposts--feat' : ''}`}>
          {latest && (
            <article className="glass hpost hpost--feat" data-reveal>
              <p className="hpost__meta">
                <span className="pill pill--run">HEAD → main</span>
                <span className="hpost__kick">{s.latest.kicker}</span>
                <CommitId commit={latest.commit} /> · {shortDate(latest.date)}
              </p>
              <h3 className="hpost__t"><a href={`/logs/${latest.slug}`}>{latest.title}</a></h3>
              <p className="hpost__s">{latest.summary}</p>
              {latest.tags.length > 0 && (
                <ul className="ltags hpost__tags" aria-label="Tags">
                  {latest.tags.map((tag) => <li key={tag} className="ltag">{tag}</li>)}
                </ul>
              )}
              <div className="hpost__cta">
                <Push href={`/logs/${latest.slug}`} label={t(s.latest)} cmd={s.latest.cmd} done={s.latest.done} />
                <span className="hpost__foot">{latest.mins} min read</span>
              </div>
            </article>
          )}
          {rest.map((p) => (
            <article key={p.slug} className="glass hpost" data-reveal>
              <p className="hpost__meta">
                <CommitId commit={p.commit} /> · {shortDate(p.date)}
              </p>
              <h3 className="hpost__t"><a href={`/logs/${p.slug}`}>{p.title}</a></h3>
              <p className="hpost__s">{p.summary}</p>
              <p className="hpost__foot">{p.mins} min read · <a href={`/logs/${p.slug}`}>git show →</a></p>
            </article>
          ))}
          {upcoming.map((u: Any) => (
            <article key={u.id} className="hpost hpost--soon" data-reveal>
              <p className="hpost__meta"><span className={`pill ${STATUS_CLS[u.status]}`}>{u.status === 'next' ? 'UPCOMING' : 'PLANNED'}</span> {u.stage}</p>
              <h3 className="hpost__t">{t(u)}</h3>
              <p className="hpost__s">{u.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Work() {
  const s = section('work');
  const f = s.feature;
  return (
    <section id="work" className="sec sec--v2" aria-labelledby="work-title">
      <div className="wrap graph-col graph-col--v2">
        <CommitLine item={s.commit} />
        <p className="kick">{t(s.kicker)}</p>
        <h2 id="work-title" className="h2 v2__title">{t(s.title)}</h2>
        <p className="lede v2__lede">{t(s.intro)}</p>
        <div className="work">
          <article className="work__feat" data-reveal>
            <div className="work__featcopy">
              <p className="kick work__featkick">{t(f.kicker)}</p>
              <h3 className="work__featname">{t(f.name)}</h3>
              <p className="work__feattext">{t(f.text)}</p>
              <Chips items={f.chips} className="chip2 chip2--dark" />
              <div><Fetch href={f.cta.href} ink>{t(f.cta)}</Fetch></div>
            </div>
            <div className="work__phone">
              <img src={f.image.path} alt={t(f.image)} width={f.image.width} height={f.image.height} loading="lazy" />
            </div>
          </article>
          {s.sites.map((w: Any) => (
            <article key={w.slug} className="glass work__card" data-reveal>
              <div className="browser">
                <div className="browser__bar" aria-hidden="true"><i /><i /><i /><span>{w.domain}</span></div>
                <img src={w.image.path} alt={t(w.image)} width={w.image.width} height={w.image.height} loading="lazy" />
              </div>
              <div className="work__body">
                <p className="kick">{t(w.kicker)}</p>
                <h3 className="work__name">{t(w.name)}</h3>
                <p className="work__text">{t(w.text)}</p>
                <Chips items={w.chips} />
                <div><Fetch href={w.href}>{w.domain}</Fetch></div>
              </div>
            </article>
          ))}
        </div>
        <p className="work__all"><Checkout href={s.all.href} color="#0a6fd6">{t(s.all).replace(/\s*→$/, '')}</Checkout></p>
      </div>
    </section>
  );
}

function OpenSource() {
  const s = section('oss');
  return (
    <section id="oss" className="sec sec--v2" aria-labelledby="oss-title">
      <div className="wrap graph-col graph-col--v2">
        <CommitLine item={s.commit} />
        <p className="kick">{t(s.kicker)}</p>
        <h2 id="oss-title" className="h2 v2__title">{t(s.title)}</h2>
        <p className="lede v2__lede">{t(s.intro)}</p>
        <div className="oss">
          {s.repos.map((r: Any) => (
            <article key={r.slug} className="glass repo" data-reveal>
              <div className={`repo__thumb ${r.image.fit === 'contain' ? 'repo__thumb--contain' : ''}`}>
                <img src={r.image.path} alt={t(r.image)} width={r.image.width} height={r.image.height} loading="lazy" />
              </div>
              <p className="repo__row">
                <a className="repo__path" href={`https://github.com/${r.repo}`} {...ext}>{r.repo}</a>
                {r.pill && <span className={`pill ${STATUS_CLS[r.pillKind]}`}>{r.pill}</span>}
              </p>
              <h3 className="repo__name">{t(r.name)}</h3>
              <p className="repo__text">{t(r.text)}</p>
              <Chips items={r.chips} />
            </article>
          ))}
          <article className="glass repo repo--wide" data-reveal>
            <div className="repo__site">
              <div className="repo__sitecopy">
                <a className="repo__path" href={`https://github.com/${s.site.repo}`} {...ext}>{s.site.repo}</a>
                <h3 className="repo__name">{t(s.site.name)}</h3>
                <p className="repo__text">{t(s.site.text)}</p>
                <Chips items={s.site.chips} />
              </div>
              <p className="repo__term">
                <span className="repo__ps">$</span> {t(section('footer').curl.command)}
                <br />
                <span className="repo__out">{t(person.name)} · {t(person.title)}</span>
              </p>
            </div>
          </article>
          <a className="glass repo repo--more" href={s.more.href} {...ext}>
            <span className="mono-sm">github.com/travist6983</span>
            <span className="repo__name">{t(s.more)}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const s = section('contact');
  return (
    <section id="contact" className="sec sec--v2 contact2" aria-labelledby="contact-title">
      <div className="wrap graph-col graph-col--v2">
        <CommitLine item={s.commit} tag />
        <div className="glass contact2__card" data-reveal>
          <div className="contact2__copy">
            <h2 id="contact-title" className="contact2__title">{t(s.heading)}</h2>
            <p>{t(s.intro)}</p>
          </div>
          <nav className="remotes" aria-label="Contact and social links">
            <p className="remotes__head"><span><span className="repo__ps">$</span> git remote -v</span><span>contact and socials</span></p>
            <ul>
              {s.remotes.map((r: Any) => <li key={r.id}><Remote r={r} /></li>)}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <MotionProvider>
      <Paper />
      <SmoothScroll />
      <ScrollSpy />
      <Reveal />
      <SiteHeader where="home" />
      <SectionRail />
      <main id="main">
        <div id="act1" className="act">
          <TicketJourney />
          <Hero />
          <Kit />
          <Pipeline />
          <Safety />
        </div>
        <div id="act2" className="act">
          <CommitJourney />
          <Journey />
          <BuildLog />
          <Work />
          <OpenSource />
          <Contact />
        </div>
      </main>
      <SiteFooter where="home" />
      <SiteDock where="home" />
    </MotionProvider>
  );
}
