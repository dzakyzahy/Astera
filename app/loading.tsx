import Image from 'next/image';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <section className="preloader-content flex flex-col items-center justify-center text-center" aria-live="polite" aria-busy="true">
        <div className="preloader-star-container">
          <div className="preloader-orbit-ring" aria-hidden="true" />
          <div className="preloader-star-rpm-wrapper">
            <Image
              src="/assets/logo-star.png"
              alt="ASTERA Emblem"
              width={90}
              height={90}
              priority
              className="preloader-star-img"
            />
          </div>
          <div className="preloader-star-glow" aria-hidden="true" />
        </div>

        <div className="mt-6 flex flex-col items-center">
          <p className="eyebrow">Estate runtime</p>
          <h1 className="text-xl font-medium tracking-tight text-foreground mt-1">Preparing estate overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Synchronizing telemetry & audit records...</p>
        </div>
      </section>
    </main>
  );
}
