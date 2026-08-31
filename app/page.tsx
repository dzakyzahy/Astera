'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarClock,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  Command,
  FileClock,
  FileText,
  Fingerprint,
  History,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  MapPin,
  Menu,
  Mic,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TriangleAlert,
  UserRound,
  UsersRound,
  WalletCards,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

const navigation = [
  { label: 'Overview', icon: LayoutDashboard, href: '#overview', active: true },
  { label: 'Incidents', icon: TriangleAlert, href: '#incidents' },
  { label: 'Assets', icon: Building2, href: '#assets' },
  { label: 'Vendors', icon: UsersRound, href: '#vendors' },
  { label: 'Audit', icon: FileClock, href: '#audit' },
];

const assetRows = [
  { id: 'BLI-HVAC-04', name: 'Master-suite HVAC', estate: 'Bali Villa', state: 'Attention', next: 'Follow-up · 13 Sep' },
  { id: 'JKT-PWR-02', name: '80 kVA backup generator', estate: 'Jakarta Residence', state: 'Scheduled', next: 'Fuel inspection · 3 Sep' },
  { id: 'BLI-POOL-03', name: 'Infinity-pool circulation pump', estate: 'Bali Villa', state: 'Scheduled', next: 'Seal replacement · 2 Sep' },
  { id: 'JKT-SEC-03', name: 'Perimeter security system', estate: 'Jakarta Residence', state: 'Healthy', next: 'Firmware review · 18 Sep' },
];

const vendorRows = [
  { name: 'Bali Climate Works', specialty: 'HVAC & moisture control', response: '2h', score: '4.9', jobs: '38 jobs' },
  { name: 'Island Estate Engineering', specialty: 'General maintenance', response: '4h', score: '4.7', jobs: '24 jobs' },
  { name: 'Capital Power Care', specialty: 'Power & generators', response: '3h', score: '4.8', jobs: '31 jobs' },
];

type Overlay = 'quotes' | 'report' | 'search' | 'notifications' | 'role' | 'privacy' | 'menu' | null;
type Estate = 'All estates' | 'Jakarta Residence' | 'Bali Villa';

function OverlayPanel({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className="overlay-panel"
        data-wide={wide || undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-title"
        aria-describedby={description ? 'overlay-description' : undefined}
        tabIndex={-1}
      >
        <div className="overlay-heading">
          <div>
            <p className="eyebrow"><Sparkles className="size-3.5" />ASTERA command layer</p>
            <h2 id="overlay-title">{title}</h2>
            {description && <p id="overlay-description">{description}</p>}
          </div>
          <button className="overlay-close" onClick={onClose} aria-label="Close dialog"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [estateMenuOpen, setEstateMenuOpen] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<Estate>('All estates');
  const [approved, setApproved] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<'Bali Climate Works' | 'Island Estate Engineering'>('Bali Climate Works');
  const [quoteStep, setQuoteStep] = useState<'compare' | 'confirm'>('compare');
  const [showReason, setShowReason] = useState(false);
  const [reportText, setReportText] = useState('Water is pooling near the pool equipment room. The pump sounds different than usual.');
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'complete'>('idle');
  const [extraIncident, setExtraIncident] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedPrice = selectedVendor === 'Bali Climate Works' ? 'Rp 8,300,000' : 'Rp 6,850,000';
  const jakartaOnly = selectedEstate === 'Jakarta Residence';
  const issueVisible = !jakartaOnly;
  const dashboardMetrics = [
    { label: 'Open incidents', value: jakartaOnly ? '00' : extraIncident ? '02' : '01', detail: jakartaOnly ? 'No active issues' : approved ? '1 vendor assigned' : '1 high priority', tone: jakartaOnly ? 'emerald' : 'amber' },
    { label: 'SLA at risk', value: '00', detail: 'All within target', tone: 'emerald' },
    { label: 'Pending approvals', value: jakartaOnly || approved ? '00' : '01', detail: jakartaOnly || approved ? 'Nothing waiting' : 'Rp 8.3m awaiting', tone: 'violet' },
    { label: approved ? 'Value protected' : 'Cost avoidance', value: jakartaOnly ? 'Rp 0' : 'Rp 18.5m', detail: approved ? 'Simulated estimate' : 'Potential · demo estimate', tone: 'gold' },
  ];

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const openQuotes = () => {
    setQuoteStep('compare');
    setOverlay('quotes');
  };

  const approveQuote = () => {
    setApproved(true);
    setOverlay(null);
    setToastMessage('Approval recorded. Bali Climate Works has been dispatched.');
  };

  const resetDemo = () => {
    setApproved(false);
    setExtraIncident(false);
    setSelectedEstate('All estates');
    setSelectedVendor('Bali Climate Works');
    setQuoteStep('compare');
    setAnalysisState('idle');
    setShowReason(false);
    setToastMessage('Demo restored to the initial incident state.');
  };

  const analyzeReport = () => {
    setAnalysisState('loading');
    window.setTimeout(() => setAnalysisState('complete'), 900);
  };

  const createIncident = () => {
    setExtraIncident(true);
    setOverlay(null);
    setAnalysisState('idle');
    setToastMessage('Draft incident created and routed to the Bali Villa manager.');
  };

  const scrollTo = (id: string) => {
    setOverlay(null);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="app-shell">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setOverlay('menu')}>
              <Menu className="size-5" />
            </button>
            <div className="brand-mark" aria-hidden="true"><span /></div>
            <div className="min-w-0">
              <p className="brand-wordmark">ASTERA</p>
              <p className="brand-subtitle">Private estate operations</p>
            </div>
          </div>

          <div className="estate-menu-wrap">
            <button
              className="estate-switcher"
              aria-label="Switch estate"
              aria-expanded={estateMenuOpen}
              onClick={() => setEstateMenuOpen((value) => !value)}
            >
              <span className="estate-switcher-icon"><Building2 className="size-4" /></span>
              <span className="hidden text-left sm:block">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Portfolio</span>
                <span className="block text-sm font-medium">{selectedEstate}</span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
            {estateMenuOpen && (
              <div className="estate-menu" role="menu">
                {(['All estates', 'Jakarta Residence', 'Bali Villa'] as Estate[]).map((estate) => (
                  <button
                    key={estate}
                    role="menuitem"
                    data-selected={selectedEstate === estate || undefined}
                    onClick={() => { setSelectedEstate(estate); setEstateMenuOpen(false); }}
                  >
                    <span>{estate}</span>{selectedEstate === estate && <Check />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="private-status hidden lg:flex"><ShieldCheck className="size-3.5" />Private workspace</div>
            <button className="topbar-icon icon-action" aria-label="Search" onClick={() => setOverlay('search')}><Search /></button>
            <button className="topbar-icon icon-action relative" aria-label="Notifications" onClick={() => setOverlay('notifications')}>
              <Bell /><span className="notification-dot" />
            </button>
            <button className="role-avatar" aria-label="Open Principal account menu" onClick={() => setOverlay('role')}>P</button>
          </div>
        </header>

        <aside className="side-rail" aria-label="Primary navigation">
          <nav className="flex flex-col gap-2">
            {navigation.map(({ label, icon: Icon, active, href }) => (
              <a key={label} href={href} className="rail-link" data-active={active || undefined} aria-label={label}>
                <Icon /><span>{label}</span>
              </a>
            ))}
          </nav>
          <button className="rail-link mt-auto" aria-label="Privacy controls" onClick={() => setOverlay('privacy')}>
            <Fingerprint /><span>Privacy</span>
          </button>
        </aside>

        <section className="workspace" id="overview">
          <div className="demo-notice">
            <span className="demo-notice-dot" />
            Competition preview · all properties, people and metrics use synthetic data
          </div>

          <div className="workspace-heading">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <CircleGauge className="size-3.5 text-primary" />Operations overview<span aria-hidden="true">·</span>31 Aug 2026, 13:07 WIB
              </div>
              <h1>Good afternoon, Principal.</h1>
              <p>
                {jakartaOnly ? <><span className="text-emerald-300">All clear.</span> Jakarta Residence is operating normally.</> : <><span className="text-amber-300">{extraIncident ? 'Two issues' : 'One issue'}</span> need{extraIncident ? '' : 's'} your attention across two estates.</>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="secondary-action hidden sm:inline-flex" onClick={resetDemo}><RotateCcw />Reset demo</button>
              <button className="primary-action" onClick={() => setOverlay('report')}><Plus />Report incident</button>
            </div>
          </div>

          <div className="command-grid">
            <section className="estate-card" aria-labelledby="estate-pulse-title">
              <div className="card-heading">
                <div>
                  <div className="eyebrow"><MapPin className="size-3.5" />Live estate pulse</div>
                  <h2 id="estate-pulse-title">Your private world, clearly organized.</h2>
                </div>
                <span className="healthy-badge"><span className="size-1.5 rounded-full bg-emerald-400" />{approved ? '96% stable' : '92% stable'}</span>
              </div>

              <div className="constellation" role="img" aria-label="Portfolio map showing Jakarta Residence stable and Bali Villa requiring attention">
                <div className="constellation-orbit orbit-one" />
                <div className="constellation-orbit orbit-two" />
                <div className="constellation-line line-one" />
                <div className="constellation-line line-two" />

                <button
                  className="estate-node jakarta-node"
                  data-selected={selectedEstate === 'Jakarta Residence' || undefined}
                  aria-label="Jakarta Residence, 96 percent healthy"
                  onClick={() => setSelectedEstate('Jakarta Residence')}
                >
                  <span className="node-pulse node-pulse-safe" />
                  <span className="node-core"><Building2 /></span>
                  <span className="node-label"><strong>Jakarta Residence</strong><small>96% healthy · 2 tasks upcoming</small></span>
                </button>

                <button
                  className="estate-node bali-node"
                  data-selected={selectedEstate === 'Bali Villa' || undefined}
                  aria-label={`Bali Villa, ${approved ? 'vendor dispatched' : 'high priority water leak'}`}
                  onClick={() => setSelectedEstate('Bali Villa')}
                >
                  {!approved && <span className="node-pulse node-pulse-alert" />}
                  <span className={`node-core ${approved ? 'node-core-assigned' : 'node-core-alert'}`}>{approved ? <Wrench /> : <TriangleAlert />}</span>
                  <span className={`node-label ${approved ? '' : 'node-label-alert'}`}><strong>Bali Villa</strong><small>{approved ? 'Vendor assigned · arrival 10:45' : 'High priority · water leak'}</small></span>
                </button>

                <div className="concierge-orb" aria-label="Astera concierge is monitoring two estates">
                  <img src="/og.png" alt="Original ASTERA concierge character" />
                  <span className="concierge-spark"><Sparkles /></span>
                  <span className="concierge-ring" />
                  <div className="concierge-copy"><strong>ASTERA Concierge</strong><small>Monitoring 8 critical assets</small></div>
                </div>

                <div className="map-caption">
                  <span><span className="legend-dot bg-emerald-400" />Stable</span>
                  <span><span className="legend-dot bg-amber-300" />Attention</span>
                  <span className="ml-auto text-muted-foreground">Updated just now</span>
                </div>
              </div>
            </section>

            <section className="incident-card" id="incidents" aria-labelledby="incident-title">
              {issueVisible ? (
                <>
                  {extraIncident && (
                    <button className="new-incident-banner" onClick={() => setOverlay('report')}>
                      <Zap /> New draft · Pool equipment noise <ChevronRight />
                    </button>
                  )}
                  <div className="incident-topline">
                    <span className={`priority-badge ${approved ? 'assigned-badge' : ''}`}>
                      {approved ? <CheckCircle2 /> : <TriangleAlert />}{approved ? 'Vendor assigned' : 'High priority'}
                    </span>
                    <span className="incident-id">INC-BLI-0829-014</span>
                  </div>
                  <div>
                    <p className="eyebrow"><Clock3 className="size-3.5" />{approved ? 'Dispatch confirmed at 09:55 WITA' : 'Reported 18 minutes ago'}</p>
                    <h2 id="incident-title">Water leak beside the master-suite wardrobe</h2>
                    <p className="incident-description">Possible HVAC condensate failure. The affected unit has been isolated and nearby valuables moved.</p>
                  </div>
                  <div className="evidence-row" aria-label="Available incident evidence"><span>Photo</span><span>Sensor</span><span>Service history</span></div>
                  <div className={`ai-recommendation ${approved ? 'recommendation-approved' : ''}`}>
                    <div className="ai-icon">{approved ? <CheckCircle2 /> : <Sparkles />}</div>
                    <div>
                      <p className="ai-label">{approved ? 'Approval recorded · accountable action' : 'AI suggestion · human approval required'}</p>
                      <p>{approved ? <><strong>Bali Climate Works</strong> is en route. Arrival window: 10:35–10:50 WITA.</> : <>Bali Climate Works can arrive <strong>3 hours sooner</strong> and includes overnight moisture control.</>}</p>
                      <button onClick={() => setShowReason((value) => !value)}>{showReason ? 'Hide evidence' : approved ? 'View decision evidence' : 'Why this recommendation?'}</button>
                      {showReason && <p className="reason-copy">Compared price, verified SLA, 90-day warranty, moisture-control coverage, and guest arrival in two days.</p>}
                    </div>
                  </div>
                  <div className="incident-facts">
                    <div><span>Asset matched</span><strong>BLI-HVAC-04</strong></div>
                    <div><span>Guest arrival</span><strong>In 2 days</strong></div>
                    <div><span>{approved ? 'Approved spend' : 'Recommended quote'}</span><strong>Rp 8,300,000</strong></div>
                  </div>
                  <button className={`review-action ${approved ? 'dispatch-action' : ''}`} onClick={openQuotes}>
                    {approved ? 'View dispatch plan' : 'Review vendor quotes'}<span aria-hidden="true">→</span>
                  </button>
                  <p className="approval-note"><ShieldCheck className="size-3.5" />{approved ? 'Approval, role, amount, and timestamp are recorded.' : 'No vendor is dispatched without accountable approval.'}</p>
                </>
              ) : (
                <div className="all-clear-state">
                  <div className="all-clear-icon"><ShieldCheck /></div>
                  <p className="eyebrow">Jakarta Residence</p>
                  <h2 id="incident-title">All systems are operating normally.</h2>
                  <p>No active incidents. Two preventive-maintenance tasks are scheduled for the next seven days.</p>
                  <button className="secondary-action" onClick={() => scrollTo('assets')}>Review upcoming care <ChevronRight /></button>
                </div>
              )}
            </section>
          </div>

          <section className="metrics-grid" aria-label="Portfolio performance metrics">
            {dashboardMetrics.map((metric) => (
              <article key={metric.label} className="metric-card" data-tone={metric.tone}>
                <div className="metric-icon">
                  {metric.tone === 'amber' && <TriangleAlert />}
                  {metric.tone === 'emerald' && <ShieldCheck />}
                  {metric.tone === 'violet' && <WalletCards />}
                  {metric.tone === 'gold' && <Wrench />}
                </div>
                <div><p>{metric.label}</p><strong>{metric.value}</strong><small>{metric.detail}</small></div>
              </article>
            ))}
          </section>

          <section className="operations-section" id="assets" aria-labelledby="assets-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow"><Building2 /> Asset registry</p>
                <h2 id="assets-title">Critical assets and upcoming care</h2>
              </div>
              <span className="data-stamp"><LockKeyhole /> Role-based view · synthetic data</span>
            </div>
            <div className="asset-table" role="table" aria-label="Critical estate assets">
              <div className="asset-row asset-header" role="row">
                <span role="columnheader">Asset</span><span role="columnheader">Estate</span><span role="columnheader">Condition</span><span role="columnheader">Next action</span>
              </div>
              {assetRows.map((asset) => (
                <button key={asset.id} className="asset-row" role="row" onClick={() => setToastMessage(`${asset.id} opened in the asset workspace.`)}>
                  <span role="cell"><strong>{asset.name}</strong><small>{asset.id}</small></span>
                  <span role="cell">{asset.estate}</span>
                  <span role="cell"><i data-state={asset.state.toLowerCase()} />{approved && asset.id === 'BLI-HVAC-04' ? 'Vendor assigned' : asset.state}</span>
                  <span role="cell">{asset.next}<ChevronRight /></span>
                </button>
              ))}
            </div>
          </section>

          <div className="lower-grid">
            <section className="operations-section" id="vendors" aria-labelledby="vendors-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow"><BadgeCheck /> Approved network</p>
                  <h2 id="vendors-title">Trusted estate partners</h2>
                </div>
                <button className="text-action" onClick={openQuotes}>Compare quotes <ChevronRight /></button>
              </div>
              <div className="vendor-list">
                {vendorRows.map((vendor, index) => (
                  <button key={vendor.name} className="vendor-row" onClick={() => setToastMessage(`${vendor.name} profile opened.`)}>
                    <span className="vendor-monogram">{vendor.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span>
                    <span><strong>{vendor.name}</strong><small>{vendor.specialty}</small></span>
                    <span className="vendor-proof"><BadgeCheck /> Verified</span>
                    <span><small>Response</small><strong>{vendor.response}</strong></span>
                    <span><small>Rating</small><strong><Star /> {vendor.score}</strong></span>
                    <span className="hidden xl:flex"><small>History</small><strong>{vendor.jobs}</strong></span>
                    {index === 0 && <span className="recommended-dot" aria-label="Recommended vendor" />}
                  </button>
                ))}
              </div>
            </section>

            <section className="operations-section" id="audit" aria-labelledby="audit-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow"><History /> Accountable record</p>
                  <h2 id="audit-title">Decision trail</h2>
                </div>
                <span className="audit-count">{approved ? '19' : '18'} events</span>
              </div>
              <ol className="audit-list">
                {approved && (
                  <li className="audit-new"><span><Check /></span><div><strong>Quote approved by Principal</strong><small>Rp 8,300,000 · 09:55 WITA · just now</small></div></li>
                )}
                <li><span><ClipboardCheck /></span><div><strong>Vendor comparison prepared</strong><small>ASTERA Concierge · 09:48 WITA</small></div></li>
                <li><span><ShieldCheck /></span><div><strong>Immediate risk contained</strong><small>Estate Manager · 09:18 WITA</small></div></li>
                <li><span><Camera /></span><div><strong>Incident evidence received</strong><small>Photo + voice note · 09:14 WITA</small></div></li>
              </ol>
            </section>
          </div>

          <footer className="product-footer">
            <span>ASTERA · Competition prototype</span>
            <span>AI assists. Accountable people decide.</span>
          </footer>
        </section>

        {toastMessage && (
          <div className="app-toast" role="status" aria-live="polite">
            <CheckCircle2 /><span>{toastMessage}</span><button onClick={() => setToastMessage(null)} aria-label="Dismiss notification"><X /></button>
          </div>
        )}

        <OverlayPanel
          open={overlay === 'quotes'}
          onClose={() => setOverlay(null)}
          title={approved ? 'Dispatch plan' : quoteStep === 'confirm' ? 'Confirm accountable approval' : 'Compare verified vendors'}
          description={approved ? 'The selected vendor has been notified and is en route.' : 'Choose on evidence, not urgency. Every decision becomes part of the audit trail.'}
          wide
        >
          {approved ? (
            <div className="dispatch-panel">
              <div className="dispatch-success"><CheckCircle2 /><div><strong>Bali Climate Works dispatched</strong><span>Arrival window 10:35–10:50 WITA</span></div></div>
              <div className="dispatch-steps">
                <div data-done><span><Check /></span><strong>Approval recorded</strong><small>09:55</small></div>
                <div data-active><span><Wrench /></span><strong>Vendor en route</strong><small>ETA 10:42</small></div>
                <div><span><Camera /></span><strong>Completion evidence</strong><small>Pending</small></div>
                <div><span><ShieldCheck /></span><strong>Manager sign-off</strong><small>Pending</small></div>
              </div>
              <button className="primary-action full-action" onClick={() => { setOverlay(null); scrollTo('audit'); }}>View recorded decision <ChevronRight /></button>
            </div>
          ) : quoteStep === 'compare' ? (
            <div className="quote-workspace">
              <div className="quote-summary">
                <span className="priority-badge"><TriangleAlert /> High priority</span>
                <h3>Master-suite HVAC containment</h3>
                <p>Guest arrival in two days. Estate Manager approval limit: Rp 5,000,000.</p>
                <div><span>Asset</span><strong>BLI-HVAC-04</strong></div>
                <div><span>Required response</span><strong>Within 4 hours</strong></div>
                <div><span>Warranty</span><strong>Parts covered</strong></div>
              </div>
              <div className="quote-options" role="radiogroup" aria-label="Vendor quotations">
                <button className="quote-option" data-selected={selectedVendor === 'Bali Climate Works' || undefined} role="radio" aria-checked={selectedVendor === 'Bali Climate Works'} onClick={() => setSelectedVendor('Bali Climate Works')}>
                  <div className="quote-option-head"><span><strong>Bali Climate Works</strong><small><BadgeCheck /> Verified · 4.9 · 38 jobs</small></span><span className="recommended-label"><Sparkles /> Recommended</span></div>
                  <strong className="quote-price">Rp 8,300,000</strong>
                  <div className="quote-grid"><span><small>Arrival</small><strong>10:35–10:50</strong></span><span><small>Warranty</small><strong>90 days</strong></span><span><small>Coverage</small><strong>Moisture control</strong></span></div>
                  <p>Fastest containment and includes overnight dehumidifier.</p>
                </button>
                <button className="quote-option" data-selected={selectedVendor === 'Island Estate Engineering' || undefined} role="radio" aria-checked={selectedVendor === 'Island Estate Engineering'} onClick={() => setSelectedVendor('Island Estate Engineering')}>
                  <div className="quote-option-head"><span><strong>Island Estate Engineering</strong><small><BadgeCheck /> Verified · 4.7 · 24 jobs</small></span><span className="lowest-label">Lowest cost</span></div>
                  <strong className="quote-price">Rp 6,850,000</strong>
                  <div className="quote-grid"><span><small>Arrival</small><strong>14:00–15:00</strong></span><span><small>Warranty</small><strong>60 days</strong></span><span><small>Coverage</small><strong>Basic cleanup</strong></span></div>
                  <p>Lower price, but later containment and no overnight moisture control.</p>
                </button>
                <div className="quote-actions">
                  <button className="secondary-action" onClick={() => { setOverlay(null); setToastMessage('Revision requested from both verified vendors.'); }}>Request revision</button>
                  <button className="primary-action" onClick={() => setQuoteStep('confirm')}>Approve {selectedPrice}<ChevronRight /></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="confirm-approval">
              <div className="confirm-icon"><ShieldCheck /></div>
              <h3>Authorize {selectedPrice}?</h3>
              <p>This exceeds the Estate Manager&apos;s Rp 5,000,000 limit. You are approving <strong>{selectedVendor}</strong> for Bali Villa.</p>
              <dl>
                <div><dt>Property</dt><dd>Bali Villa · Master suite</dd></div>
                <div><dt>Work order</dt><dd>WO-BLI-0829-027</dd></div>
                <div><dt>Accountable role</dt><dd>Principal</dd></div>
              </dl>
              <label className="approval-check"><input type="checkbox" defaultChecked /> I reviewed the quote, scope, arrival time, and warranty.</label>
              <div className="quote-actions">
                <button className="secondary-action" onClick={() => setQuoteStep('compare')}>Back to comparison</button>
                <button className="primary-action" onClick={approveQuote}><Check /> Confirm approval</button>
              </div>
            </div>
          )}
        </OverlayPanel>

        <OverlayPanel open={overlay === 'report'} onClose={() => setOverlay(null)} title="Report an estate incident" description="Send a message, photo, or voice note. ASTERA prepares the incident record; a person still decides what happens next.">
          <div className="report-form">
            <label htmlFor="incident-report">What needs attention?</label>
            <textarea id="incident-report" value={reportText} onChange={(event) => setReportText(event.target.value)} rows={5} />
            <div className="attachment-row"><button onClick={() => setToastMessage('Demo photo attached to the draft report.')}><Camera /> Add photo</button><button onClick={() => setToastMessage('Demo voice note attached to the draft report.')}><Mic /> Record voice</button></div>
            {analysisState === 'complete' && (
              <div className="analysis-result"><Sparkles /><div><strong>Likely match: Infinity-pool circulation pump</strong><span>Medium priority · isolate pump if vibration increases · manager review required.</span></div></div>
            )}
            <button className="primary-action full-action" onClick={analysisState === 'complete' ? createIncident : analyzeReport} disabled={!reportText.trim() || analysisState === 'loading'}>
              {analysisState === 'loading' ? <><Loader2 className="spin" /> Analyzing report…</> : analysisState === 'complete' ? <><ClipboardCheck /> Create draft incident</> : <><Sparkles /> Analyze report</>}
            </button>
          </div>
        </OverlayPanel>

        <OverlayPanel open={overlay === 'search'} onClose={() => setOverlay(null)} title="Search the private workspace" description="Find an estate, asset, vendor, or recorded decision.">
          <div className="command-search"><Search /><input autoFocus placeholder="Try BLI-HVAC-04 or Bali Climate Works" /></div>
          <div className="command-results">
            <button onClick={() => scrollTo('assets')}><Building2 /><span><strong>BLI-HVAC-04</strong><small>Master-suite HVAC · Bali Villa</small></span><Command /></button>
            <button onClick={() => scrollTo('vendors')}><UsersRound /><span><strong>Bali Climate Works</strong><small>Verified HVAC vendor</small></span><ChevronRight /></button>
            <button onClick={() => scrollTo('audit')}><History /><span><strong>INC-BLI-0829-014</strong><small>Water leak decision trail</small></span><ChevronRight /></button>
          </div>
        </OverlayPanel>

        <OverlayPanel open={overlay === 'notifications'} onClose={() => setOverlay(null)} title="Attention queue" description="Only changes that need a person are shown here.">
          <div className="notification-list">
            <button onClick={openQuotes}><span className="notification-icon warning"><TriangleAlert /></span><span><strong>{approved ? 'Vendor dispatched' : 'Approval required · Rp 8,300,000'}</strong><small>Bali Villa · {approved ? 'arrival 10:35–10:50' : 'reported 18 minutes ago'}</small></span><ChevronRight /></button>
            <button onClick={() => scrollTo('assets')}><span className="notification-icon"><CalendarClock /></span><span><strong>Generator fuel inspection</strong><small>Jakarta Residence · due 3 Sep</small></span><ChevronRight /></button>
          </div>
        </OverlayPanel>

        <OverlayPanel open={overlay === 'role'} onClose={() => setOverlay(null)} title="Principal workspace" description="The demo uses role labels instead of personal identities.">
          <div className="role-card"><span className="role-avatar large">P</span><div><strong>Principal</strong><small>Portfolio oversight · approval authority</small></div><span className="verified-role"><ShieldCheck /> Verified role</span></div>
          <div className="role-permissions"><span><Check /> Review every estate</span><span><Check /> Approve spend above manager limits</span><span><Check /> View the complete audit trail</span></div>
        </OverlayPanel>

        <OverlayPanel open={overlay === 'privacy'} onClose={() => setOverlay(null)} title="Private by design" description="This competition preview contains no real resident, property, staff, or financial data.">
          <div className="privacy-grid"><div><LockKeyhole /><strong>Synthetic dataset</strong><span>No real-world identities or addresses.</span></div><div><UserRound /><strong>Role-based views</strong><span>Principal, Manager, and Vendor see only what they need.</span></div><div><History /><strong>Accountable actions</strong><span>Every approval records the role, amount, and timestamp.</span></div></div>
        </OverlayPanel>

        <OverlayPanel open={overlay === 'menu'} onClose={() => setOverlay(null)} title="Navigate ASTERA">
          <nav className="mobile-nav-list">{navigation.map(({ label, icon: Icon, href }) => <button key={label} onClick={() => scrollTo(href.slice(1))}><Icon />{label}<ChevronRight /></button>)}</nav>
        </OverlayPanel>
      </div>
    </main>
  );
}
