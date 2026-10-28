import { content, needed, person, section, t } from '@/lib/content';
import { Ask } from '@/components/Ask';
import { AvailableToday, CountUp, EmailAddress, EmailLink, KillSwitch, MotionProvider, SmoothScroll } from '@/components/client';
import { Needed } from '@/components/Needed';
import { CommitJourney, TicketJourney } from '@/components/Journeys';
import { Pipeline } from '@/components/Pipeline';
import { Reveal } from '@/components/Reveal';

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
  const show = ['sixty', 'pipeline', 'safety', 'independent', 'career', 'ask', 'contact'];
  return (
    <header className="nav">
      <a className="skip" href="#main">{t(h.skipLink)}</a>
      <div className="nav__inner">
        <a className="nav__mark" href="#top">{t(h.wordmark)}</a>
        <nav aria-label="Sections">
          <ul className="nav__links">
            {h.nav
              .filter((n: Any) => show.includes(n.href.slice(1)))
              .map((n: Any) => (
                <li key={n.href}><a href={n.href}>{t(n)}</a></li>
              ))}
          </ul>
        </nav>
        <div className="nav__end">
          <KillSwitch />
          <a className="pill pill--sm" href={h.resumePdf.href}>{t(h.resumePdf)}</a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const s = section('hero');
  const headshot = needed(person.headshot);
  return (
    <section id="top" className="hero" aria-labelledby="hero-title" data-ticket="New" data-ticket-kind="bug">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <p className="eyebrow">{t(s.titleLine)}</p>
          <h1 id="hero-title" className="hero__name">{t(s.h1)}</h1>
          <p className="hero__value">{t(s.value)}</p>
          <div className="hero__ctas">
            {s.ctas.map((c: Any, i: number) => (
              <Cta key={c.id} item={c} className={i === 0 ? 'pill pill--primary' : 'pill'} />
            ))}
          </div>
          <p className="hero__meta">
            <a className="link-arrow" href={s.sixtyLink.href}>{t(s.sixtyLink)}</a>
            <span>{t(s.location)}</span>
          </p>
        </div>
        <div className="hero__side" aria-hidden={headshot ? undefined : true}>
          {headshot ? (
            <div className="headshot"><Needed>{strip(headshot)}</Needed></div>
          ) : null}
          <div className="backlog" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                className={`backlog__card ${i === 3 ? 'backlog__card--bug' : ''}`}
                style={{ ['--i' as string]: i }}
                {...(i === 3 ? { 'data-ticket-start': '', 'data-route': 'el' } : {})}
              >
                {i === 3 ? <><b>bug</b><i /><i /></> : <><i /><i /></>}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="wrap">
        <span className="route-anchor" data-route="margin" data-route-at="top" />
        <ul className="rail" data-reveal>
          {s.proof.items.map((p: Any, i: number) => (
            <li key={p.id} className="rail__item">
              <span className="rail__idx">0{i + 1}</span>
              <span className="rail__num">
                {p.prefix && <span className="rail__pre">{p.prefix}</span>}
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

function Sixty() {
  const s = section('sixty');
  return (
    <section id="sixty" className="sec sixty" aria-labelledby="sixty-title" data-route="margin" data-route-at="bottom">
      <div className="wrap">
        <h2 id="sixty-title" className="display display--sm">{t(s.title)}</h2>
        <p className="lede">{t(s.focus)}</p>
        <div className="sixty__grid">
          <div className="tile tile--wide" data-reveal>
            <h3 className="tile__h">{t(s.achievementsHeading)}</h3>
            <ol className="top5">
              {s.achievements.map((a: Any) => <li key={a.id}>{t(a)}</li>)}
            </ol>
          </div>
          <div className="tile" data-reveal>
            <h3 className="tile__h">{t(s.stackHeading)}</h3>
            <dl className="stack">
              {s.stack.map((x: Any) => (
                <div key={x.id}><dt>{x.label}</dt><dd>{t(x)}</dd></div>
              ))}
            </dl>
          </div>
          <div className="tile" data-reveal>
            <h3 className="tile__h">{t(s.availabilityHeading)}</h3>
            <p className="avail"><span className="dot dot--green" aria-hidden="true" />{t(s.availability)}<AvailableToday /></p>
            <a className="pill pill--primary" href={s.resumeLink.href}>{t(s.resumeLink)}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Release() {
  const st = section('pipeline').stages.find((x: Any) => x.stage === 'regression');
  return (
    <section className="sec sec--dark release" aria-label={t(st.aside.label)} data-ticket="Release regression" data-ticket-kind="pr">
      <span className="route-anchor" data-route="0.9" data-route-at="top" />
      <div className="wrap release__inner">
        <p className="eyebrow">{t(st.aside.label)}</p>
        <p className="release__big">
          <span className="release__from">about a week</span>
          <span className="release__to">8 to 10 hours</span>
        </p>
        <p className="lede lede--dark">{t(st.aside.text)}</p>
      </div>
      <span className="route-anchor" data-route="0.9" data-route-at="bottom" />
    </section>
  );
}

function Safety() {
  const s = section('safety');
  const ks = s.killSwitchControl;
  const icons = ['✋', '↻', '◎', '⏻'];
  return (
    <section id="safety" className="sec safety" aria-labelledby="safety-title" data-ticket="At the safety gate" data-ticket-kind="pr">
      <div className="wrap">
        <h2 id="safety-title" className="display display--sm">{t(s.title)}</h2>
        <p className="lede">{t(s.intro)}</p>
        <ol className="stations">
          {s.items.map((it: Any, i: number) => (
            <li key={it.id} className={`station station--${i % 2 ? 'r' : 'l'}`} data-station data-route="0.5">
              <span className="station__dot" aria-hidden="true" />
              <div className={`station__card ${i === 0 ? 'station__card--gate' : ''}`} data-reveal>
                <span className="tile__icon" aria-hidden="true">{icons[i]}</span>
                <p>{t(it)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="tile tile--wide tile--kill" data-reveal data-ticket="Approved" data-ticket-kind="pr">
          <div>
            <h3 className="tile__h">{t(ks.heading)}</h3>
            <p>{t(ks.text)}</p>
          </div>
          <KillSwitch variant="panel" />
        </div>
      </div>
    </section>
  );
}

function Mcp() {
  const s = section('mcp');
  const L = s.visualLabels;
  return (
    <section id="mcp" className="sec sec--soft mcp" aria-labelledby="mcp-title" data-ticket="Routed to a safe tool" data-ticket-kind="pr">
      <span className="route-anchor" data-route="gutter" data-route-at="top" />
      <div className="wrap mcp__grid">
        <div>
          <h2 id="mcp-title" className="display display--sm">{t(s.title)}</h2>
          <p className="lede">{t(s.intro)}</p>
          <p>{t(s.classifier)}</p>
          <p>{t(s.destructive)}</p>
        </div>
        <figure className="mcp__fig" data-reveal>
          <svg viewBox="0 0 420 300" role="img" aria-label="A question goes to a classifier. It starts toward the delete lane, is blocked by the fence, and is rerouted to a tool lane.">
            <rect x="10" y="125" width="100" height="50" rx="25" className="n n--q" />
            <text x="60" y="155" textAnchor="middle" className="t--q">{t(L.question)}</text>
            <path d="M110 150 H160" className="e e--on" />
            <rect x="160" y="120" width="110" height="60" rx="14" className="n n--c" />
            <text x="215" y="155" textAnchor="middle" className="t--c">{t(L.classifier)}</text>
            <path d="M270 150 C300 150 300 50 330 50" className="e" />
            <path d="M270 150 H330" className="e" />
            <path d="M270 150 C300 150 300 250 330 250" className="e" />
            <path d="M270 150 C300 150 300 250 322 250" className="e e--try" pathLength={1} />
            <path d="M270 150 H330" className="e e--good" pathLength={1} />
            {[50, 150].map((y, i) => (
              <g key={y}>
                <rect x="330" y={y - 20} width="80" height="40" rx="10" className={`n ${i === 1 ? 'n--hit' : ''}`} />
                <text x="370" y={y + 5} textAnchor="middle">{t(L.toolLane)}</text>
              </g>
            ))}
            <rect x="322" y="222" width="96" height="56" rx="12" className="fence" />
            <rect x="330" y="230" width="80" height="40" rx="10" className="n n--off" />
            <text x="370" y="255" textAnchor="middle" className="t--off">delete</text>
            <g className="blocked"><circle cx="312" cy="250" r="11" /><path d="M306 244 L318 256 M318 244 L306 256" /></g>
          </svg>
          <figcaption className="fine">{t(L.deleteLane)}. {t(s.visualLabel)}.</figcaption>
        </figure>
      </div>
      <span className="route-anchor route-anchor--end" data-route="gutter" data-route-at="bottom" />
      <p className="handoff wrap" aria-hidden="true"><span className="handoff__dot" /> PR merged into main</p>
    </section>
  );
}

function Platform() {
  const s = section('platform');
  return (
    <section id="platform" className="sec platform" aria-labelledby="platform-title">
      <div className="wrap graph-col">
        <h2 id="platform-title" className="display display--sm">{t(s.title)}</h2>
        <div className="bento bento--3">
          <div className="tile tile--stat" data-reveal><span className="stat">about 10,000</span><span>monthly active users on EOS One</span></div>
          <div className="tile tile--stat" data-reveal><span className="stat">150+</span><span>components in the library I built</span></div>
          <div className="tile tile--stat" data-reveal><span className="stat">35 → 9</span><span>retained as one of three staff engineers</span></div>
        </div>
        <div className="cols">
          <div data-reveal>
            <h3 className="tile__h" data-commit>{t(s.platformHeading)}</h3>
            {['vue', 'stack', 'monorepo', 'library', 'shipping'].map((k) => <p key={k}>{t(s[k])}</p>)}
          </div>
          <div data-reveal>
            <h3 className="tile__h" data-commit>{t(s.leadershipHeading)}</h3>
            {['review', 'mentoring', 'mentorship', 'adoption', 'standards', 'retention'].map((k) => <p key={k}>{t(s[k])}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Independent() {
  const s = section('independent');
  return (
    <section id="independent" className="sec sec--soft independent" aria-labelledby="independent-title">
      <div className="wrap graph-col">
        <h2 id="independent-title" className="display display--sm">{t(s.title)}</h2>
        <p className="lede">{t(s.intro)}</p>
        <div className="projects">
          {s.cards.map((c: Any) => {
            const dateNeed = needed(c.dates);
            const retired = c.slug === 'pocket-chronicle';
            return (
              <article key={c.slug} className={`project project--${c.slug}`} data-branch={retired ? 'retired' : 'open'} data-reveal>
                <p className="eyebrow mono" data-commit>{retired ? 'branch: retired' : 'branch: open, in pre-launch'}</p>
                <p className="eyebrow">{t(c.role ?? c.type)} · {t(c.dates)}</p>
                {dateNeed && <Needed>{strip(dateNeed)}</Needed>}
                <h3 className="project__name">{t(c.name)}</h3>
                <p className="project__status">{t(c.status)}</p>
                <p>{t(c.summary)}</p>
                <div className="project__stats">
                  {(c.stats ?? []).map((x: Any) => (
                    <div key={x.id}><span className="stat stat--sm">{x.value}</span><span>{x.label}</span></div>
                  ))}
                </div>
                <ul className="ticks">
                  {(c.points ?? []).map((p: Any) => <li key={p.id} data-commit>{t(p)}</li>)}
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
        <h2 id="career-title" className="display display--sm">{t(s.title)}</h2>
        <p className="lede">{t(s.intro)}</p>
        <p className="log__edu" data-commit><span className="mono">initial commit</span> <b>{t(s.education.heading)}.</b> {t(s.education.entry)}</p>
        <ol className="log">
          {entries.map((e: Any) => (
            <li key={e.slug} className="log__item" data-branch="merge" data-reveal>
              <p className="mono log__branch">{e.roles[e.roles.length - 1].dates.split(' to ')[0]} to {e.roles[0].dates.split(' to ')[1]}</p>
              <h3 className="log__co">{t(e.company)} <span className="log__loc">{t(e.location)}</span></h3>
              {e.roles.map((r: Any) => (
                <p key={r.id} className="log__role"><b>{r.title}</b> <span>{r.dates}</span></p>
              ))}
              {e.context && <p className="log__ctx">{t(e.context)}</p>}
              {e.progression && <p className="log__ctx">{t(e.progression)}</p>}
              <ul>{(e.highlights ?? []).map((h: Any) => <li key={h.id} data-commit>{t(h)}</li>)}</ul>
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
    <section id="contact" className="sec sec--dark contact" aria-labelledby="contact-title">
      <div className="wrap contact__inner graph-col graph-col--center">
        <div className="merge" data-tag aria-hidden="true">
          <span className="merge__light" />
          <span className="merge__text">HEAD → main · {t(s.mergedStatus)}</span>
        </div>
        <h2 id="contact-title" className="display contact__title">{t(s.heading)}</h2>
        <p className="lede lede--dark">{t(s.intro)}</p>
        <div className="contact__ctas">
          {s.links.map((l: Any, i: number) => (
            <Cta key={l.id} item={l} className={i === 0 ? 'pill pill--primary pill--lg' : 'pill pill--ghost pill--lg'} />
          ))}
        </div>
        <p className="fine fine--dark"><EmailAddress /></p>
      </div>
    </section>
  );
}

function Footer() {
  const s = section('footer');
  return (
    <footer className="foot">
      <div className="wrap foot__grid">
        <p><span className="fine">{t(s.curl.lead)}</span> <code>{t(s.curl.command)}</code></p>
        <p className="foot__links">
          {s.machineReadable.map((m: Any) => <a key={m.id} href={m.href}>{t(m)}</a>)}
        </p>
        <p className="fine">{t(s.privacy)}</p>
        <p className="fine">{t(s.accessibility)}</p>
        <p className="fine">{t(s.disclosure)}</p>
        <p className="fine">{t(s.copyright)}</p>
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
      <SmoothScroll />
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
