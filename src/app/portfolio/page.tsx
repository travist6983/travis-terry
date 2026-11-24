import type { Metadata } from 'next';
import { person, section, t } from '@/lib/content';
import { MotionProvider } from '@/components/client';
import { Paper, SiteDock } from '@/components/LogsChrome';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { PortfolioLog, type Lane, type Row } from '@/components/Portfolio';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const metadata: Metadata = {
  title: `Portfolio | ${t(person.name)}`,
  description: t(section('portfolio').intro),
  alternates: { canonical: '/portfolio' },
};

const gh = (repo: string) => ({ label: 'GitHub ↗', href: `https://github.com/${repo}` });

/** A project's name, copy, tags, picture and links come from where the home page already shows it. */
function resolve(p: Any): Row {
  const [sec, kind, slug] = p.ref.split('.');
  const s = section(sec);
  let src: Any;
  let links: Row['links'] = [];
  let frame = '';
  if (sec === 'kit') {
    src = { name: s.title, text: s.intro, chips: p.chips, image: s.figure };
    links = [{ label: 'GitHub ↗', href: s.links[0].href }];
    frame = 'claude code · mods panel';
  } else if (kind === 'feature') {
    src = s.feature;
    links = [{ label: 'App Store ↗', href: s.feature.cta.href }];
  } else if (kind === 'sites') {
    src = s.sites.find((w: Any) => w.slug === slug);
    links = [{ label: `${src.domain} ↗`, href: src.href }];
    frame = src.domain;
  } else if (kind === 'repos') {
    src = s.repos.find((r: Any) => r.slug === slug);
    links = [gh(src.repo)];
    frame = `localhost · ${slug}`;
  } else {
    src = { ...s.site, image: p.image };
    links = [gh(s.site.repo)];
    frame = p.domain;
  }
  const img = p.image ?? src.image;
  return {
    slug: p.slug,
    lane: p.lane as Lane,
    branch: p.branch,
    date: p.date,
    status: p.status,
    state: p.state,
    head: !!p.head,
    type: p.type,
    msg: t(p.msg),
    title: t(src.name),
    text: t(src.text),
    diff: t(p.diff),
    tags: p.chips ?? src.chips ?? [],
    img: { src: img.path, alt: t(img), width: img.width, height: img.height, phone: img.height / img.width > 1.5 },
    frame,
    links: [...links, ...(p.links ?? []).map((l: Any) => ({ label: l.text, href: l.href, alt: true }))],
  };
}

export default function PortfolioPage() {
  const s = section('portfolio');
  const [l1, l2] = t(s.title).split(/(?<=branch) /);
  return (
    <MotionProvider>
      <Paper />
      <SiteHeader where="portfolio" />
      <main id="main" className="pfpage">
        <section id="top" className="wrap pf-hero" aria-labelledby="pf-title">
          <nav aria-label="Breadcrumb" className="rcrumb"><a href="/">~</a> / work</nav>
          <p className="kick">{t(s.kicker)}</p>
          <h1 id="pf-title" className="pf-hero__title">{l1}{l2 && <><br />{l2}</>}</h1>
          <p className="pf-hero__cmd"><span className="pf-hero__ps" aria-hidden="true">$</span> <span className="pf-typed">{t(s.command)}</span></p>
          <p className="pf-hero__intro">{t(s.intro)}</p>
        </section>

        <section className="wrap pf-wrap" aria-label="Projects">
          <PortfolioLog rows={s.projects.map(resolve)} labels={s.lanes} />
          <div className="pf-end">
            <div className="pf-root" aria-hidden="true"><span className="pf-main" /><i /></div>
            <p className="mono-sm">
              <b>(root)</b> {t(s.root)} · <a href={s.rootLink.href}>{t(s.rootLink)}</a>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter where="portfolio" />
      <SiteDock where="portfolio" />
    </MotionProvider>
  );
}
