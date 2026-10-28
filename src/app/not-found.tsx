import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Page not found | Travis Terry' };

export default function NotFound() {
  return (
    <main className="paper" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '0 16px' }}>
      <div className="glass panel" style={{ maxWidth: 520, textAlign: 'center' }}>
        <span className="kick">404</span>
        <h1 style={{ margin: '12px 0' }}>That page isn’t here.</h1>
        <p>The link may be old or mistyped. Everything lives on the home page.</p>
        <p style={{ marginTop: 20 }}>
          <a className="btn btn--accent" href="/">Go to the home page</a>
        </p>
      </div>
    </main>
  );
}
