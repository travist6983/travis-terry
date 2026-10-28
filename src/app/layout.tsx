import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { content, person, t } from '@/lib/content';
import './globals.css';

// Downloaded at build and self-hosted: no runtime requests to Google.
const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

const m = content.meta;

export const metadata: Metadata = {
  metadataBase: new URL(t(m.canonical)),
  title: t(m.title),
  description: t(m.description),
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: t(m.canonical), title: t(m.og.title), description: t(m.og.description) },
  twitter: { card: 'summary_large_image', title: t(m.og.title), description: t(m.twitter?.description ?? m.og.description) },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

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
    <html lang="en" data-motion="on" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      {/* browser extensions add attributes to <body> before React hydrates */}
      <body suppressHydrationWarning>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
