import { ArrowLeft, MapPinOff } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="standalone-state">
        <div className="all-clear-icon"><MapPinOff /></div>
        <p className="eyebrow">Workspace route not found</p>
        <h1>This estate view does not exist.</h1>
        <p>Return to the ASTERA command center to continue the demonstration.</p>
        <Link className="primary-action" href="/"><ArrowLeft />Return to overview</Link>
      </section>
    </main>
  );
}
