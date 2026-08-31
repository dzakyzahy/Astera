import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="standalone-state" aria-live="polite" aria-busy="true">
        <div className="all-clear-icon"><Loader2 className="spin" /></div>
        <p className="eyebrow">Private workspace</p>
        <h1>Preparing your estate overview.</h1>
        <p>Loading the synthetic competition workspace.</p>
      </section>
    </main>
  );
}
