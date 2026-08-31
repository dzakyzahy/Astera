'use client';

import { RotateCcw, ShieldAlert } from 'lucide-react';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="standalone-state" role="alert">
        <div className="all-clear-icon"><ShieldAlert /></div>
        <p className="eyebrow">ASTERA recovery</p>
        <h1>The command center needs a quick reset.</h1>
        <p>No external action was taken. Reload this view to restore the synthetic workspace.</p>
        <button className="primary-action" onClick={reset}><RotateCcw />Reload workspace</button>
      </section>
    </main>
  );
}
