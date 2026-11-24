import type { Metadata } from 'next';
import { Push } from '@/components/Buttons';

export const metadata: Metadata = { title: 'Page not found | Travis Terry' };

export default function NotFound() {
  return (
    <main className="paper" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '0 16px' }}>
      <div className="glass panel" style={{ maxWidth: 520, textAlign: 'center' }}>
        <span className="kick">404</span>
        <h1 style={{ margin: '12px 0' }}>That page isn’t here.</h1>
        <p>The link may be old or mistyped. Everything lives on the home page.</p>
        <p style={{ marginTop: 20 }}>
          <Push href="/" label="Go to the home page" cmd="$ git checkout main" done="✓ switched" />
        </p>
      </div>
    </main>
  );
}
