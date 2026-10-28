import type { Metadata, Viewport } from 'next';
import { content, person, t } from '@/lib/content';
import './globals.css';

const m = content.meta;

export const metadata: Metadata = {
  metadataBase: new URL(t(m.canonical)),
  title: t(m.title),
  description: t(m.description),
  alternates: {
    canonical: '/',
    // Machine-readable resumes, generated from content.json by scripts/build-resume-files.mjs
    types: { 'text/markdown': '/resume.md', 'text/plain': '/resume.txt', 'application/json': '/resume.json' },
  },
  openGraph: {
    type: 'website',
    url: t(m.canonical),
    title: t(m.og.title),
    description: t(m.og.description),
    images: [{ url: m.og.image.path, width: 1200, height: 630, alt: t(m.og.image) }],
  },
  twitter: { card: 'summary_large_image', title: t(m.og.title), description: t(m.twitter?.description ?? m.og.description), images: [m.og.image.path] },
};

export const viewport: Viewport = {
  themeColor: '#e6e9ef',
};

const beacon = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: t(person.name) || 'Travis Terry',
  jobTitle: 'Staff Software Engineer',
  url: t(m.canonical),
  sameAs: [person.linkedin?.href, person.github?.href].filter(Boolean),
  address: { '@type': 'PostalAddress', addressLocality: 'Sterling Heights', addressRegion: 'MI', addressCountry: 'US' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-motion="on" suppressHydrationWarning>
      {/* browser extensions add attributes to <body> before React hydrates */}
      <body suppressHydrationWarning>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {beacon && (
          // Cloudflare Web Analytics: cookieless page counts. Only loads once the token is configured.
          <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: beacon })} />
        )}
      </body>
    </html>
  );
}
