import { content, needed, person, section, t } from '@/lib/content';
import { Ask } from '@/components/Ask';
import { AvailableToday, CopyCommand, CountUp, EmailAddress, EmailLink, KillSwitch, MotionProvider, ScrollSpy, SmoothScroll } from '@/components/client';
import { Needed } from '@/components/Needed';
import { CommitJourney, TicketJourney } from '@/components/Journeys';
import { Pipeline } from '@/components/Pipeline';
import { Reveal } from '@/components/Reveal';
import { McpDemo, PlatformTabs, ReleaseBar, StackTabs, TopFive, type TopItem } from '@/components/Designed';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const strip = (s: string) => s.replace(/^NEEDED FROM TRAVIS:\s*/, '');

/** A CTA that is either a real link or a loud placeholder saying what is missing. */
function Cta({ item, className }: { item: Any; className: string }) {
  const need = needed(item);
  if (item.hrefFrom === 'person.email') return <EmailLink className={className}>{t(item)}</EmailLink>;
  const href = item.href ?? (item.hrefFrom ? content.person[item.hrefFrom.split('.')[1]]?.href : null);
  if (need || !href) {
    return (
      <span className={`${className} is-needed`}>
        {t(item)} <Needed inline>{strip(need ?? 'link')}</Needed>
      </span>
    );
  }
  const external = /^https?:/.test(href);
  return (
    <a className={className} href={href} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
      {t(item)}
    </a>
  );
}

function Header() {
  const h = section('header');
  const show = ['sixty', 'pipeline', 'career', 'contact'];
  return (
    <header className="nav">
      <a className="skip" href="#main">{t(h.skipLink)}</a>
      <div className="nav__inner">
        <a className="glass pillx nav__mark" href="#top">{t(h.wordmark)}</a>
        <nav aria-label="Sections" className="glass nav__group">
          {h.nav
            .filter((n: Any) => show.includes(n.href.slice(1)))
            .map((n: Any) => (
              <a key={n.href} href={n.href} data-spy={n.href.slice(1)}>{t(n)}</a>
            ))}
        </nav>
        <div className="nav__end">
          <KillSwitch />
          <a className="btn btn--accent btn--pill" href={h.resumePdf.href}>
            <DownloadIcon />
            Resume
          </a>
        </div>
      </div>
    </header>
  );
}

function DownloadIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="glass badge"><span className="badge__dot" aria-hidden="true" />{children}</span>;
}

function Hero() {
  const s = section('hero');
  const headshot = needed(person.headshot);
  return (
    <section id="top" className="hero" aria-labelledby="hero-title" data-ticket="New" data-ticket-kind="bug">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <p className="hero__title">{t(s.titleLine).replace(' | ', ' · ')}</p>
          <h1 id="hero-title" className="hero__name">{t(s.h1)}</h1>
          <p className="hero__value">{t(s.value)}</p>
          <div className="hero__ctas">
            {s.ctas.map((c: Any, i: number) => (
              <Cta key={c.id} item={c} className={i === 0 ? 'btn btn--accent' : 'btn btn--glass glass'} />
            ))}
          </div>
          <p className="hero__meta">
            <a className="link-accent" href={s.sixtyLink.href}>{t(s.sixtyLink)} ›</a>
            <span>{t(s.location)}</span>
          </p>
        </div>
        <div className="hero__side">
          {headshot ? <div className="glass headshot"><Needed>{strip(headshot)}</Needed></div> : null}
          <div className="backlog" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span
                key={i}
                className={`backlog__card ${i === 2 ? 'backlog__card--bug' : 'glass'}`}
                {...(i === 2 ? { 'data-ticket-start': '', 'data-route': 'el' } : {})}
              >
                {i === 2 ? <><b>bug</b><i /><i /></> : <><i /><i /></>}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="wrap">
        <span className="route-anchor" data-route="margin" data-route-at="top" />
        <ul className="glass rail" data-reveal>
          {s.proof.items.map((p: Any, i: number) => (
            <li key={p.id} className="rail__item">
              <span className="kick">0{i + 1}</span>
              <span className="rail__num">
                {p.prefix && <span className="pre">{p.prefix}</span>}
                <CountUp to={p.num} suffix={p.suffix} />
                <span className="sr-only">{p.value}</span>
              </span>
              <span className="rail__label">{p.label}</span>
            </li>
          ))}
        </ul>
        <p className="fine rail__note">{t(s.proof.context)} {t(s.visualLabel)} for all diagrams.</p>
      </div>
    </section>
  );
}

/* Top-five selector metadata: stats come from the resume lines behind each achievement. */
const TOP_META = [
  { title: 'Agentic engineering system', stat: '30+', statLabel: 'Claude Code skills, sole author' },
  { title: 'Six-week bug sweep', stat: '100+', statLabel: 'bugs cleared in about six weeks, roughly 95% accepted without being bounced back' },
  { title: 'Safety model', stat: '4', statLabel: 'safeguards: verifier agent, risk-tiered retries, human stop on billing and auth, kill switch' },
  { title: 'Production MCP server', stat: '3', statLabel: 'LLMs connected: Claude, ChatGPT, Grok' },
  { title: 'Vue frontend platform', stat: '10,000', prefix: 'about', statLabel: 'monthly active users on EOS One' },
];
const STACK = [
  { label: 'Agentic AI', items: ['MCP server development', 'Claude Code skills', 'Custom commands', 'Autonomous loops', 'Cursor', 'Verifier agents', 'LLM code review', 'AI-driven test execution', 'Multi-provider model routing'] },
  { label: 'Frontend', items: ['Vue 2 and 3', 'JavaScript', 'HTML5', 'CSS3 and SCSS', 'Vite', 'npm monorepo', 'Design tokens', 'Accessibility', 'Swift (iOS)'] },
  { label: 'Backend', items: ['C# and .NET REST APIs', 'SignalR', 'Python', 'FastAPI', 'Node.js', 'PostgreSQL', 'Redis', 'Cosmos DB', 'SQL Server'] },
  { label: 'Cloud, CI/CD, testing', items: ['Azure DevOps Pipelines', 'GitHub Actions', 'Fly.io', 'Neon', 'Playwright', 'Vitest', 'TestRail'] },
];

function Sixty() {
  const s = section('sixty');
  const top: TopItem[] = s.achievements.map((a: Any, i: number) => ({ ...TOP_META[i], text: t(a) }));
  return (
    <section id="sixty" className="sec" aria-labelledby="sixty-title" data-route="margin" data-route-at="bottom">
      <div className="wrap">
        <div className="sec__head">
          <Badge>60 sec read</Badge>
          <h2 id="sixty-title" className="h2">{t(s.title)}</h2>
          <p className="lede">15+ years building production web applications, now focused on making AI agents do <span className="accent">real, verified</span> engineering and product work.</p>
        </div>
        <TopFive items={top} />
        <StackTabs groups={STACK} />
        <div className="glass avail">
          <span className="avail__dot" aria-hidden="true" />
          <div className="avail__copy">
            <span className="avail__h">Available now<AvailableToday /></span>
            <span>Sterling Heights, MI. Open to remote, or on-site and hybrid in Metro Detroit.</span>
          </div>
          <div className="avail__ctas">
            <a className="btn btn--accent" href={s.resumeLink.href}>{t(s.resumeLink)}</a>
            <a className="btn btn--soft" href="https://cal.com/travis-terry-vwjxkq/30min" target="_blank" rel="noopener">Book a Call</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Release() {
  const st = section('pipeline').stages.find((x: Any) => x.stage === 'regression');
  return (
    <section id="release" className="sec sec--tight release" aria-labelledby="release-title" data-ticket="Release regression" data-ticket-kind="pr">
      <span className="route-anchor" data-route="0.9" data-route-at="top" />
      <div className="wrap">
        <div className="glass card-xl" data-reveal>
          <span className="glow glow--orange" aria-hidden="true" style={{ left: -120, bottom: -200, width: 420, height: 420 }} />
          <div className="release__grid">
            <div className="release__copy">
              <span className="kick">{t(st.aside.label).toUpperCase()}</span>
              <h2 id="release-title" className="release__big">
                <span className="release__from">about a week</span>
                <span className="release__to">8 to 10 hours</span>
              </h2>
            </div>
            <p className="release__text">{t(st.aside.text)}</p>
          </div>
          <ReleaseBar />
        </div>
      </div>
      <span className="route-anchor" data-route="0.9" data-route-at="bottom" />
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
  const ks = s.killSwitchControl;
  return (
    <section id="safety" className="sec safety" aria-labelledby="safety-title" data-ticket="At the safety gate" data-ticket-kind="pr">
      <div className="wrap">
        <div className="sec__head">
          <Badge>4 safeguards</Badge>
          <h2 id="safety-title" className="h2">{t(s.title)}</h2>
          <p className="lede">I designed the safety model, and <span className="accent">every automated action</span> ran inside it.</p>
        </div>
        <ol className="stations">
          {s.items.map((it: Any, i: number) => {
            const ui = SAFETY_UI[i];
            return (
              <li key={it.id} className={`station station--${i % 2 ? 'r' : 'l'}`} data-station data-route="0.5">
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
        <div className="glass panel killpanel" data-reveal data-ticket="Approved" data-ticket-kind="pr">
          <div>
            <h3 className="h3">{t(ks.heading)}</h3>
            <p>{t(ks.text)}</p>
          </div>
          <KillSwitch variant="panel" />
        </div>
        <p className="fine">{t(s.visualNote)}</p>
      </div>
    </section>
  );
}

function Mcp() {
  const s = section('mcp');
  const L = s.visualLabels;
  return (
    <section id="mcp" className="sec mcp" aria-labelledby="mcp-title" data-ticket="Routed to a safe tool" data-ticket-kind="pr">
      <span className="route-anchor" data-route="gutter" data-route-at="top" />
      <div className="wrap mcp__grid">
        <div className="sec__head">
          <Badge>EOS One · production</Badge>
          <h2 id="mcp-title" className="h2">{t(s.title)}</h2>
          <p className="lede">I was a core contributor on the team that built a production MCP server for EOS One. It let customers connect <span className="accent">Claude, ChatGPT, and Grok</span> to their EOS One data.</p>
          <div className="mcp__notes">
            <div className="glass note-row">
              <span className="icon-box icon-box--sm" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3M15 9l6-6" /></svg>
              </span>
              <p><b>Routing.</b> {t(s.classifier)}</p>
            </div>
            <div className="glass note-row">
              <span className="icon-box icon-box--sm icon-box--danger" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </span>
              <p><b>No deletes.</b> {t(s.destructive)}</p>
            </div>
          </div>
        </div>
        <McpDemo caption={`${t(L.deleteLane)}. ${t(s.visualLabel)}.`} />
      </div>
      <span className="route-anchor route-anchor--end" data-route="gutter" data-route-at="bottom" />
      <p className="handoff wrap" aria-hidden="true"><span className="handoff__dot" /> PR merged into main</p>
    </section>
  );
}

function Platform() {
  const s = section('platform');
  const P = [['Ownership', 'vue'], ['Stack', 'stack'], ['Monorepo and tokens', 'monorepo'], ['Component library', 'library'], ['Shipping', 'shipping']];
  const LD = [['Code review', 'review'], ['Direct reports', 'mentoring'], ['Mentorship', 'mentorship'], ['AI adoption', 'adoption'], ['Standards as code', 'standards'], ['Retention', 'retention']];
  const pick = (arr: string[][]) => arr.map(([title, k]) => ({ title, text: t(s[k]) }));
  return (
    <section id="platform" className="sec platform" aria-labelledby="platform-title">
      <div className="wrap graph-col">
        <div className="sec__head">
          <Badge>EOS One · Atlas UP</Badge>
          <h2 id="platform-title" className="h2">{t(s.title)}</h2>
          <p className="lede">I owned the Vue frontend platform for EOS One, an AI business operating system with <span className="accent">about 10,000 monthly active users</span>.</p>
        </div>
        <div className="stat3" data-commit>
          <div className="glass statc" data-reveal>
            <span className="glow glow--accent" aria-hidden="true" style={{ right: -90, bottom: -110, width: 260, height: 260, opacity: 0.18 }} />
            <span className="statc__num"><span className="pre">about</span>10,000</span>
            <span className="statc__label">monthly active users on EOS One</span>
          </div>
          <div className="glass statc" data-reveal>
            <span className="statc__num">150+</span>
            <span className="statc__label">components in the library I built</span>
            <div className="comps" aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <span key={i} className={i < 24 ? 'on' : ''} />)}</div>
            <span className="mono-sm">roughly 80% moved to design tokens</span>
          </div>
          <div className="glass statc" data-reveal>
            <span className="statc__num"><span className="mute">35</span><span className="arrow">→</span>9</span>
            <span className="statc__label">retained as one of three staff engineers</span>
            <div className="team" aria-hidden="true">{Array.from({ length: 35 }, (_, i) => <span key={i} className={i < 3 ? 'lead' : i < 9 ? 'on' : ''} />)}</div>
          </div>
        </div>
        <PlatformTabs platform={pick(P)} leadership={pick(LD)} />
        <p className="fine">{t(s.visualNote)}</p>
      </div>
    </section>
  );
}

function Independent() {
  const s = section('independent');
  return (
    <section id="independent" className="sec independent" aria-labelledby="independent-title">
      <div className="wrap graph-col">
        <div className="sec__head">
          <Badge>2 products, built solo</Badge>
          <h2 id="independent-title" className="h2">{t(s.title)}</h2>
          <p className="lede">{t(s.intro)}</p>
        </div>
        <div className="projects">
          {s.cards.map((c: Any) => {
            const dateNeed = needed(c.dates);
            const retired = c.slug === 'pocket-chronicle';
            return (
              <article key={c.slug} className={`glass project project--${c.slug}`} data-branch={retired ? 'retired' : 'open'} data-reveal>
                <span className="glow glow--accent" aria-hidden="true" style={{ right: -100, top: -120, width: 320, height: 320, opacity: 0.14 }} />
                <div className="project__top">
                  <span className="kick" data-commit>{retired ? 'BRANCH: RETIRED' : 'BRANCH: OPEN · PRE-LAUNCH'}</span>
                  <span className="kick kick--mute">{t(c.role ?? c.type)} · {t(c.dates)}</span>
                </div>
                {dateNeed && <Needed>{strip(dateNeed)}</Needed>}
                <h3 className="project__name">{t(c.name)}</h3>
                <p className="project__status"><span className={`dot ${retired ? 'dot--mute' : 'dot--green'}`} aria-hidden="true" />{t(c.status)}</p>
                <p className="project__sum">{t(c.summary)}</p>
                <div className="project__stats">
                  {(c.stats ?? []).map((x: Any) => (
                    <div key={x.id}><span className="statc__num statc__num--sm">{x.value}</span><span className="statc__label">{x.label}</span></div>
                  ))}
                </div>
                <ul className="notes notes--one">
                  {(c.points ?? []).map((p: Any) => <li key={p.id} className="note" data-commit>{t(p)}</li>)}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Career() {
  const s = section('career');
  const entries = [...s.entries].reverse();
  return (
    <section id="career" className="sec career" aria-labelledby="career-title">
      <div className="wrap graph-col">
        <div className="sec__head">
          <Badge>2006 → 2026</Badge>
          <h2 id="career-title" className="h2">{t(s.title)}</h2>
          <p className="lede">{t(s.intro)}</p>
        </div>
        <p className="glass log__edu" data-commit><span className="kick">INITIAL COMMIT</span> <b>{t(s.education.heading)}.</b> {t(s.education.entry)}</p>
        <ol className="log">
          {entries.map((e: Any) => (
            <li key={e.slug} className="glass log__item" data-branch="merge" data-reveal>
              <span className="kick">{e.roles[e.roles.length - 1].dates.split(' to ')[0]} → {e.roles[0].dates.split(' to ')[1]}</span>
              <h3 className="log__co">{t(e.company)} <span className="log__loc">{t(e.location)}</span></h3>
              <div className="log__roles">
                {e.roles.map((r: Any) => (
                  <p key={r.id} className="log__role"><b>{r.title}</b> <span className="mono-sm">{r.dates}</span></p>
                ))}
              </div>
              {e.context && <p className="log__ctx">{t(e.context)}</p>}
              {e.progression && <p className="log__ctx">{t(e.progression)}</p>}
              <ul className="notes notes--one">{(e.highlights ?? []).map((h: Any) => <li key={h.id} className="note" data-commit>{t(h)}</li>)}</ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Contact() {
  const s = section('contact');
  return (
    <section id="contact" className="sec contact" aria-labelledby="contact-title">
      <div className="wrap graph-col graph-col--center">
        <div className="glass contact__card">
          <span className="glow glow--accent" aria-hidden="true" style={{ left: -140, top: -220, width: 520, height: 520, opacity: 0.28 }} />
          <span className="glow glow--orange" aria-hidden="true" style={{ right: -140, bottom: -240, width: 480, height: 480, opacity: 0.3 }} />
          <div className="contact__inner">
            <span className="merge" data-tag aria-hidden="true">
              <span className="merge__light" />
              <span className="merge__text">HEAD → main · {t(s.mergedStatus)}</span>
            </span>
            <h2 id="contact-title" className="contact__title">{t(s.heading)}</h2>
            <p className="lede">{t(s.intro)}</p>
            <div className="contact__ctas">
              {s.links.filter((l: Any) => !/github/.test(l.id)).map((l: Any, i: number) => (
                <Cta key={l.id} item={l} className={i === 0 ? 'btn btn--accent btn--lg' : 'btn btn--soft btn--lg'} />
              ))}
            </div>
            <a className="mono-link" href="https://github.com/travist6983" target="_blank" rel="noopener">github.com/travist6983</a>
            <p className="fine"><EmailAddress /></p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const s = section('footer');
  const body = (x: Any) => t(x).replace(/^(Privacy|Accessibility):\s*/, '');
  const access = body(s.accessibility).replace(/email me\.?$/i, '');
  return (
    <footer className="foot">
      <div className="wrap foot__grid">
        <div className="foot__term">
          <span className="kick foot__kick">{t(s.curl.lead).toUpperCase()}</span>
          <CopyCommand command={t(s.curl.command)} />
          <div className="foot__files">
            {s.machineReadable.map((m: Any) => <a key={m.id} href={m.href}>{t(m)}</a>)}
          </div>
        </div>
        <div className="glass foot__legal">
          <div className="foot__cols">
            <div>
              <h3>Privacy</h3>
              <p>{body(s.privacy)}</p>
            </div>
            <div>
              <h3>Accessibility</h3>
              <p>{access}<EmailLink className="foot__mail">email me</EmailLink>.</p>
            </div>
          </div>
          <div className="foot__names">
            <h3>Names</h3>
            <p>{t(s.disclosure)}</p>
          </div>
        </div>
        <div className="glass foot__bar">
          <span className="foot__who"><b>Travis Terry</b> <span>{t(s.copyright).replace('Travis Terry', '').trim()}</span></span>
          <nav className="foot__nav" aria-label="Footer">
            <EmailLink>Email</EmailLink>
            <a href={person.linkedin?.href} target="_blank" rel="noopener">LinkedIn</a>
            <a href="https://github.com/travist6983" target="_blank" rel="noopener">GitHub</a>
            <a href="#top" className="foot__top">
              Back to top
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function MobileBar() {
  const h = section('header');
  return (
    <nav className="mbar" aria-label="Quick contact">
      <EmailLink>{t(h.mobileBar[0])}</EmailLink>
      <a href={person.linkedin?.href} target="_blank" rel="noopener">{t(h.mobileBar[1])}</a>
      <a href={h.mobileBar[2].href}>{t(h.mobileBar[2])}</a>
    </nav>
  );
}

export default function Page() {
  return (
    <MotionProvider>
      <div className="paper" aria-hidden="true">
        <span className="blob blob--a" />
        <span className="blob blob--b" />
        <span className="blob blob--c" />
        <span className="blob blob--d" />
      </div>
      <SmoothScroll />
      <ScrollSpy />
      <Reveal />
      <Header />
      <main id="main">
        <div id="act1" className="act">
          <TicketJourney />
          <Hero />
          <Sixty />
          <Pipeline />
          <Release />
          <Safety />
          <Mcp />
        </div>
        <div id="act2" className="act">
          <CommitJourney />
          <Career />
          <Platform />
          <Independent />
          <Ask />
          <Contact />
        </div>
      </main>
      <Footer />
      <MobileBar />
    </MotionProvider>
  );
}
