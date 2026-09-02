'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePortfolioOverview } from '@/hooks/use-portfolio-overview';
import { useIncidentQuotes } from '@/hooks/use-incident-quotes';
import { useOperationsData } from '@/hooks/use-operations-data';
import { AsteraApiClient, AsteraApiError } from '@/lib/adapters/client-api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Asset, AuditEvent, Vendor } from '@/types/domain';
import {
  Activity,
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
  Cpu,
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

type AssetData = {
  id: string;
  name: string;
  estate: string;
  state: 'Attention' | 'Scheduled' | 'Healthy';
  next: string;
  location: string;
  serial: string;
  spec: string;
  lastService: string;
  telemetry: { label: string; value: string; status: 'good' | 'warning' | 'normal' }[];
  logs: { date: string; summary: string; technician: string }[];
};

const fallbackAssetList: AssetData[] = [
  {
    id: 'BLI-HVAC-04',
    name: 'Master-suite HVAC',
    estate: 'Bali Villa',
    state: 'Attention',
    next: 'Follow-up · 13 Sep',
    location: 'North Wing · Master Pavilion',
    serial: 'SN-VRV-9482-ID',
    spec: 'Daikin VRV Multi-Split 14 kW · R32 Eco-refrigerant',
    lastService: '14 Jun 2026 (Quarterly coil flush)',
    telemetry: [
      { label: 'Condensate Tray', value: 'High Level Alert', status: 'warning' },
      { label: 'Compressor Temp', value: '38.4°C', status: 'good' },
      { label: 'Air Flow Rate', value: '920 CFM', status: 'normal' },
    ],
    logs: [
      { date: '29 Aug 2026', summary: 'Emergency condensate line isolation by Estate Manager', technician: 'Staff Lead' },
      { date: '14 Jun 2026', summary: 'Routine pre-dry season chemical flush & filter change', technician: 'Bali Climate Works' },
    ],
  },
  {
    id: 'JKT-PWR-02',
    name: '80 kVA backup generator',
    estate: 'Jakarta Residence',
    state: 'Scheduled',
    next: 'Fuel inspection · 3 Sep',
    location: 'Sub-level B1 · Utility Vault',
    serial: 'SN-GEN-5510-JK',
    spec: 'Perkins 1104D Turbo Diesel · Sound-attenuated enclosure',
    lastService: '12 Aug 2026 (Monthly automated load run)',
    telemetry: [
      { label: 'Fuel Reservoir', value: '88% (420 L)', status: 'good' },
      { label: 'Battery Health', value: '26.8 V (Optimal)', status: 'good' },
      { label: 'Transfer Switch', value: 'Standby / Auto', status: 'normal' },
    ],
    logs: [
      { date: '12 Aug 2026', summary: '30-minute full transfer simulation passed without voltage sag', technician: 'Capital Power Care' },
      { date: '04 May 2026', summary: 'Engine oil filter & fuel separator replacement', technician: 'Capital Power Care' },
    ],
  },
  {
    id: 'BLI-POOL-03',
    name: 'Infinity-pool circulation pump',
    estate: 'Bali Villa',
    state: 'Scheduled',
    next: 'Seal replacement · 2 Sep',
    location: 'Lower Cliffside Pump House',
    serial: 'SN-PMP-2294-BL',
    spec: 'Hayward TriStar 3.0 HP Variable Speed Pump',
    lastService: '01 Jul 2026 (Impeller inspection)',
    telemetry: [
      { label: 'Flow Velocity', value: '145 GPM', status: 'normal' },
      { label: 'Motor Vibration', value: '2.4 mm/s (Elevated)', status: 'warning' },
      { label: 'Line Pressure', value: '18.2 PSI', status: 'good' },
    ],
    logs: [
      { date: '01 Jul 2026', summary: 'Re-greased mechanical drive bearing', technician: 'Island Estate Eng.' },
    ],
  },
  {
    id: 'JKT-SEC-03',
    name: 'Perimeter security system',
    estate: 'Jakarta Residence',
    state: 'Healthy',
    next: 'Firmware review · 18 Sep',
    location: 'Gatehouse Main & Perimeter Fence',
    serial: 'SN-SEC-8821-JK',
    spec: 'FLIR Thermal LiDAR + AI Perimeter Intrusion Hub',
    lastService: '20 Aug 2026 (Optical alignment & IR calibration)',
    telemetry: [
      { label: 'Sensors Online', value: '24 / 24 Active', status: 'good' },
      { label: 'Network Latency', value: '4 ms (Fiber Ring)', status: 'good' },
      { label: 'Tamper Alarm', value: 'Armed & Normal', status: 'normal' },
    ],
    logs: [
      { date: '20 Aug 2026', summary: 'IR illuminator cleaning and perimeter optical recalibration', technician: 'Internal Security Team' },
    ],
  },
];

type VendorData = {
  name: string;
  specialty: string;
  response: string;
  score: string;
  jobs: string;
  license: string;
  insurance: string;
  leadTech: string;
  contract: string;
  capabilities: string[];
};

const fallbackVendorList: VendorData[] = [
  {
    name: 'Bali Climate Works',
    specialty: 'HVAC & moisture control',
    response: '2h',
    score: '4.9',
    jobs: '38 jobs',
    license: 'Badan Usaha Jasa Konstruksi (BUJK) #882-BLI',
    insurance: 'Verified active · Liability coverage Rp 5,000,000,000',
    leadTech: 'I Wayan S. (Certified Master Technician)',
    contract: 'Tier-1 Priority SLA Master Agreement (Valid 2027)',
    capabilities: ['VRV multi-split systems', 'High-humidity remediation', 'Air filtration & sterilization', 'Overnight dehumidification units'],
  },
  {
    name: 'Island Estate Engineering',
    specialty: 'General maintenance',
    response: '4h',
    score: '4.7',
    jobs: '24 jobs',
    license: 'Surat Izin Usaha Perdagangan (SIUP) #419-DEN',
    insurance: 'Verified active · Liability coverage Rp 2,500,000,000',
    leadTech: 'Ketut A. (Senior MEP Engineer)',
    contract: 'Preferred Vendor Agreement (Valid 2027)',
    capabilities: ['Mechanical plumbing', 'Pool pumps & hydraulics', 'Electrical sub-panels', 'Architectural carpentry'],
  },
  {
    name: 'Capital Power Care',
    specialty: 'Power & generators',
    response: '3h',
    score: '4.8',
    jobs: '31 jobs',
    license: 'Kementerian ESDM Electrical Contractor #102-JKT',
    insurance: 'Verified active · Comprehensive Industrial Cover',
    leadTech: 'Bambang R. (High-Voltage Certified Specialist)',
    contract: 'Annual Emergency Standby Contract (Valid 2026)',
    capabilities: ['High-kVA diesel generators', 'Automatic transfer switches (ATS)', 'Solar inverter backup arrays', 'UPS power conditioning'],
  },
];

type AuditRecord = {
  id: string;
  title: string;
  actor: string;
  time: string;
  estate: string;
  hash: string;
  summary: string;
};

const fallbackAuditRecords: AuditRecord[] = [
  {
    id: 'EVT-0829-994',
    title: 'Vendor comparison prepared',
    actor: 'ASTERA Workflow Engine',
    time: '09:48 WITA · 29 Aug 2026',
    estate: 'Bali Villa',
    hash: '0x8f2a99e74cb10e42d76a',
    summary: 'Compared Bali Climate Works and Island Estate Engineering on SLA, warranty, and guest arrival lead times.',
  },
  {
    id: 'EVT-0829-982',
    title: 'Immediate risk contained',
    actor: 'Estate Manager',
    time: '09:18 WITA · 29 Aug 2026',
    estate: 'Bali Villa',
    hash: '0x3c71be9004fa92b3810c',
    summary: 'Master-suite HVAC power isolated. Valuables relocated away from condensate drainage zone.',
  },
  {
    id: 'EVT-0829-976',
    title: 'Incident evidence received',
    actor: 'Staff Lead',
    time: '09:14 WITA · 29 Aug 2026',
    estate: 'Bali Villa',
    hash: '0x18e9bc74332900fa1127',
    summary: 'Photo evidence and acoustic voice note captured via staff mobile intake.',
  },
  {
    id: 'EVT-0820-910',
    title: 'Perimeter thermal calibration logged',
    actor: 'Security Supervisor',
    time: '16:30 WIB · 20 Aug 2026',
    estate: 'Jakarta Residence',
    hash: '0x9924ba77ef0128cb5541',
    summary: 'Quarterly sensor alignment completed with 0 dead-zone anomalies recorded.',
  },
];

type Overlay =
  | 'quotes'
  | 'report'
  | 'search'
  | 'notifications'
  | 'role'
  | 'privacy'
  | 'menu'
  | 'asset-detail'
  | 'vendor-detail'
  | 'audit-detail'
  | null;

const ALL_ESTATES = 'All estates';

function mapApiAsset(asset: Asset): AssetData {
  return {
    id: asset.id,
    name: asset.name,
    estate: asset.estateLabel,
    state: asset.state,
    next: asset.nextScheduledService,
    location: asset.location,
    serial: asset.serialNumber,
    spec: asset.specifications,
    lastService: asset.lastServiceDate,
    telemetry: asset.telemetry.map(({ label, value, status }) => ({ label, value, status })),
    logs: asset.logs.map(({ date, summary, technician }) => ({ date, summary, technician })),
  };
}

function formatComplianceDate(timestamp: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(timestamp));
}

function mapApiVendor(vendor: Vendor): VendorData {
  const fallback = fallbackVendorList.find((item) => item.name === vendor.name);
  return {
    name: vendor.name,
    specialty: vendor.category,
    response: `${Math.round(vendor.averageSlaMinutes / 60)}h`,
    score: vendor.rating.toFixed(1),
    jobs: `${vendor.completedJobsCount} jobs`,
    license: vendor.compliance.licenseNumber,
    insurance: `${vendor.compliance.verifiedStatus === 'VERIFIED' ? 'Verified synthetic record' : 'Renewal pending'} · valid through ${formatComplianceDate(vendor.compliance.insuranceValidUntil)}`,
    leadTech: vendor.primaryContact,
    contract: `Synthetic contest vendor · ${vendor.activeStatus.toLowerCase()}`,
    capabilities: fallback?.capabilities ?? vendor.serviceRegions.map((region) => `Service region · ${region}`),
  };
}

const auditActionTitles: Record<string, string> = {
  ORGANIZATION_INITIALIZED: 'Synthetic portfolio initialized',
  INCIDENT_INTAKE_RECORDED: 'Incident intake recorded',
  VENDOR_QUOTES_NORMALIZED: 'Vendor comparison prepared',
  QUOTE_APPROVED: 'Quote approved by Principal',
  WORK_ORDER_CREATED: 'Synthetic work order created',
  WORK_ORDER_DISPATCHED: 'Simulated dispatch recorded',
};

function mapAuditEstate(event: AuditEvent) {
  const estateId = typeof event.payload.estateId === 'string' ? event.payload.estateId : '';
  if (estateId.includes('BLI') || event.aggregateId.includes('BLI')) return 'Bali Villa';
  if (estateId.includes('JKT') || event.aggregateId.includes('JKT')) return 'Jakarta Residence';
  if (event.aggregateType === 'INCIDENT' || event.aggregateType === 'QUOTE' || event.aggregateType === 'APPROVAL' || event.aggregateType === 'WORK_ORDER') return 'Bali Villa';
  return 'Portfolio';
}

function mapApiAuditEvent(event: AuditEvent): AuditRecord {
  const title = auditActionTitles[event.action] ?? event.action.toLowerCase().replaceAll('_', ' ');
  const payloadSummary = typeof event.payload.summary === 'string'
    ? event.payload.summary
    : `${event.aggregateType.toLowerCase()} ${event.aggregateId} · sequence ${event.sequenceNumber}`;
  return {
    id: event.id,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    actor: event.actorName,
    time: new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
      timeZoneName: 'short',
    }).format(new Date(event.occurredAt)),
    estate: mapAuditEstate(event),
    hash: event.hash,
    summary: payloadSummary,
  };
}

function formatMetricCount(value: number) {
  return Math.max(0, value).toString().padStart(2, '0');
}

function formatIdrCompact(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `Rp ${millions.toLocaleString('en-US', { maximumFractionDigits: 1 })}m`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function formatIdr(value: number) {
  return `Rp ${value.toLocaleString('en-US')}`;
}

function formatArrival(timestamp?: string) {
  if (!timestamp) return 'Illustrative window';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Makassar',
  }).format(new Date(timestamp));
}

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
  const panelRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <dialog
        open
        ref={panelRef}
        className="overlay-panel"
        data-wide={wide || undefined}
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
      </dialog>
    </div>
  );
}

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [estateMenuOpen, setEstateMenuOpen] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<string>(ALL_ESTATES);
  const [approved, setApproved] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [approvalAcknowledged, setApprovalAcknowledged] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('Bali Climate Works');
  const [quoteStep, setQuoteStep] = useState<'compare' | 'confirm'>('compare');
  const [showReason, setShowReason] = useState(false);
  const [reportText, setReportText] = useState('Water is pooling near the pool equipment room. The pump sounds different than usual.');
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'complete'>('idle');
  const [extraIncident, setExtraIncident] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dataRevision, setDataRevision] = useState(0);
  const [mutationState, setMutationState] = useState<'idle' | 'approving' | 'dispatching' | 'resetting'>('idle');
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [approvedWorkOrderId, setApprovedWorkOrderId] = useState<string | null>(null);
  const approvalIdempotencyKeyRef = useRef<string | null>(null);
  const dispatchIdempotencyKeyRef = useRef<string | null>(null);

  // Deep detail views
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null);
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<VendorData | null>(null);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<AuditRecord | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  const portfolioOverview = usePortfolioOverview(
    selectedEstate === ALL_ESTATES ? null : selectedEstate,
    dataRevision,
  );

  const selectedEstateId =
    selectedEstate === ALL_ESTATES
      ? undefined
      : portfolioOverview.estates.find((estate) => estate.label === selectedEstate)?.id;
  const incidentQuotes = useIncidentQuotes(selectedEstateId, dataRevision);
  const climateQuote = incidentQuotes.quotes.find(
    (quote) => quote.vendorName === 'Bali Climate Works',
  );
  const engineeringQuote = incidentQuotes.quotes.find(
    (quote) => quote.vendorName === 'Island Estate Engineering',
  );
  const selectedQuote =
    incidentQuotes.quotes.find((quote) => quote.vendorName === selectedVendor) ??
    incidentQuotes.quotes[0];
  const recommendedQuote =
    incidentQuotes.quotes.find((quote) => quote.isAiRecommended) ?? incidentQuotes.quotes[0];
  const comparisonQuote = incidentQuotes.quotes.find((quote) => quote.id !== recommendedQuote?.id);
  const recommendationLeadHours = recommendedQuote && comparisonQuote
    ? Math.max(
        0,
        Math.round(
          (new Date(comparisonQuote.estimatedArrivalTimestamp).getTime() -
            new Date(recommendedQuote.estimatedArrivalTimestamp).getTime()) /
            3_600_000,
        ),
      )
    : 2;
  const effectiveSelectedVendor = selectedQuote?.vendorName ?? selectedVendor;

  const selectedPrice = selectedQuote
    ? formatIdr(selectedQuote.totalAmountMinorUnits)
    : selectedVendor === 'Bali Climate Works'
      ? 'Rp 18,500,000'
      : 'Rp 14,200,000';
  const recommendedPrice = formatIdr(recommendedQuote?.totalAmountMinorUnits ?? 18_500_000);
  const recommendedPriceCompact = formatIdrCompact(recommendedQuote?.totalAmountMinorUnits ?? 18_500_000);
  const jakartaOnly = selectedEstate === 'Jakarta Residence';
  const baliOnly = selectedEstate === 'Bali Villa';
  const issueVisible = !jakartaOnly;

  const operationsData = useOperationsData(dataRevision);

  const assetList: AssetData[] = operationsData.assets.length
    ? operationsData.assets.map(mapApiAsset)
    : fallbackAssetList;
  const vendorList: VendorData[] = operationsData.vendors.length
    ? operationsData.vendors.map(mapApiVendor)
    : fallbackVendorList;
  const auditRecords: AuditRecord[] = operationsData.auditEvents.length
    ? operationsData.auditEvents.map(mapApiAuditEvent)
    : fallbackAuditRecords;

  const estateOptions: string[] = portfolioOverview.estates.length
    ? [ALL_ESTATES, ...portfolioOverview.estates.map((estate) => estate.label)]
    : [ALL_ESTATES, 'Jakarta Residence', 'Bali Villa'];

  const filteredAssets = assetList.filter((a) => {
    if (selectedEstate !== ALL_ESTATES) return a.estate === selectedEstate;
    return true;
  });

  const openIncidentCount =
    (portfolioOverview.kpis?.openIncidentsCount ?? (jakartaOnly ? 0 : 1)) +
    (extraIncident && !jakartaOnly ? 1 : 0);
  const pendingApprovalCount = approved
    ? 0
    : (portfolioOverview.kpis?.pendingApprovalsCount ?? (jakartaOnly ? 0 : 1));
  const costAvoidance = portfolioOverview.kpis?.costAvoidanceMinorUnits ?? (jakartaOnly ? 0 : 18_500_000);
  const portfolioStability = portfolioOverview.kpis
    ? `${Math.round(portfolioOverview.kpis.healthyAssetsPercentage)}% assets healthy`
    : approved
      ? '96% stable'
      : jakartaOnly
        ? '98% stable'
        : '92% stable';
  const dataSourceLabel =
    portfolioOverview.status === 'ready'
      ? 'API connected · synthetic contract verified'
      : portfolioOverview.status === 'loading'
        ? 'Refreshing synthetic API'
        : 'Local demo fallback · API unavailable';

  const dashboardMetrics = [
    {
      label: t.kpi.openIncidents,
      value: formatMetricCount(openIncidentCount),
      detail: openIncidentCount === 0 ? 'No active issues' : approved ? '1 dispatch plan simulated' : '1 high priority',
      tone: openIncidentCount === 0 ? 'emerald' : 'amber',
    },
    {
      label: t.kpi.slaAtRisk,
      value: formatMetricCount(portfolioOverview.kpis?.slaAtRiskCount ?? 0),
      detail: 'All within target',
      tone: 'emerald',
    },
    {
      label: t.kpi.pendingApprovals,
      value: formatMetricCount(pendingApprovalCount),
      detail: pendingApprovalCount === 0 ? 'Nothing waiting' : `${recommendedPriceCompact} awaiting`,
      tone: 'violet',
    },
    {
      label: approved ? 'Value protected' : t.kpi.costAvoidance,
      value: formatIdrCompact(costAvoidance),
      detail: approved ? 'Simulated estimate' : 'Potential · demo estimate',
      tone: 'gold',
    },
  ];

  // Global keyboard shortcut: Cmd+K / Ctrl+K for search command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOverlay((curr) => (curr === 'search' ? null : 'search'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (analysisState !== 'loading') return;
    const timer = window.setTimeout(() => setAnalysisState('complete'), 900);
    return () => window.clearTimeout(timer);
  }, [analysisState]);

  const openQuotes = () => {
    setQuoteStep('compare');
    setMutationError(null);
    setOverlay('quotes');
  };

  const getMutationErrorMessage = (error: unknown) => {
    if (error instanceof AsteraApiError) {
      return error.problem.detail || error.message;
    }
    return error instanceof Error ? error.message : 'The synthetic workflow could not be updated.';
  };

  const approveQuote = async () => {
    if (!approvalAcknowledged || !selectedQuote || !incidentQuotes.incident) return;

    setMutationState('approving');
    setMutationError(null);
    approvalIdempotencyKeyRef.current ??= crypto.randomUUID();

    try {
      const response = await AsteraApiClient.approveQuote({
        incidentId: incidentQuotes.incident.id,
        quoteId: selectedQuote.id,
        approverId: 'USR-PRIN-01',
        approverName: 'Estate Principal',
        approverRole: 'principal',
        explicitAck: true,
        notes: 'Quote reviewed and approved in the synthetic contest workflow.',
        idempotencyKey: approvalIdempotencyKeyRef.current,
      });

      if (response.meta.synthetic !== true) {
        throw new Error('Approval response is missing ASTERA synthetic-data metadata.');
      }

      setApprovedWorkOrderId(response.workOrder.id);
      setApproved(true);
      setApprovalAcknowledged(false);
      setMutationState('idle');
      setToastMessage(`Synthetic approval recorded for ${effectiveSelectedVendor}. Dispatch still requires a separate action.`);
    } catch (error) {
      setMutationState('idle');
      setMutationError(getMutationErrorMessage(error));
    }
  };

  const dispatchWorkOrder = async () => {
    if (!approvedWorkOrderId || mutationState !== 'idle') return;

    setMutationState('dispatching');
    setMutationError(null);
    dispatchIdempotencyKeyRef.current ??= crypto.randomUUID();

    try {
      const response = await AsteraApiClient.dispatchWorkOrder({
        workOrderId: approvedWorkOrderId,
        idempotencyKey: dispatchIdempotencyKeyRef.current,
        notes: 'Synthetic dispatch connector invoked for contest demonstration only.',
        actorId: 'USR-PRIN-01',
        actorRole: 'principal',
      });

      if (response.meta.synthetic !== true) {
        throw new Error('Dispatch response is missing ASTERA synthetic-data metadata.');
      }

      setDispatched(true);
      setMutationState('idle');
      setOverlay(null);
      setToastMessage('Simulated dispatch recorded. No external vendor was contacted.');
    } catch (error) {
      setMutationState('idle');
      setMutationError(getMutationErrorMessage(error));
    }
  };

  const resetDemo = async () => {
    if (mutationState !== 'idle') return;

    setMutationState('resetting');
    setMutationError(null);

    try {
      const response = await AsteraApiClient.resetDemo();
      if (response.meta.synthetic !== true) {
        throw new Error('Reset response is missing ASTERA synthetic-data metadata.');
      }

      setApproved(false);
      setDispatched(false);
      setApprovedWorkOrderId(null);
      approvalIdempotencyKeyRef.current = null;
      dispatchIdempotencyKeyRef.current = null;
      setExtraIncident(false);
      setSelectedEstate(ALL_ESTATES);
      setSelectedVendor('Bali Climate Works');
      setQuoteStep('compare');
      setApprovalAcknowledged(false);
      setAnalysisState('idle');
      setShowReason(false);
      setSelectedAsset(null);
      setSelectedVendorDetail(null);
      setSelectedAuditRecord(null);
      setSearchQuery('');
      setDataRevision((revision) => revision + 1);
      setMutationState('idle');
      setToastMessage('Synthetic demo restored to the initial awaiting-approval state.');
    } catch (error) {
      setMutationState('idle');
      setToastMessage(`Reset failed: ${getMutationErrorMessage(error)}`);
    }
  };

  const analyzeReport = () => {
    setAnalysisState('loading');
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

  const openAssetModal = (asset: AssetData) => {
    setSelectedAsset(asset);
    setOverlay('asset-detail');
  };

  const openVendorModal = (vendor: VendorData) => {
    setSelectedVendorDetail(vendor);
    setOverlay('vendor-detail');
  };

  const openAuditModal = (audit: AuditRecord) => {
    setSelectedAuditRecord(audit);
    setOverlay('audit-detail');
  };

  // Search filter logic
  const cleanQuery = searchQuery.trim().toLowerCase();
  const searchResults = {
    assets: assetList.filter(
      (a) =>
        !cleanQuery ||
        a.id.toLowerCase().includes(cleanQuery) ||
        a.name.toLowerCase().includes(cleanQuery) ||
        a.location.toLowerCase().includes(cleanQuery) ||
        a.estate.toLowerCase().includes(cleanQuery),
    ),
    vendors: vendorList.filter(
      (v) =>
        !cleanQuery ||
        v.name.toLowerCase().includes(cleanQuery) ||
        v.specialty.toLowerCase().includes(cleanQuery),
    ),
    audits: auditRecords.filter(
      (au) =>
        !cleanQuery ||
        au.id.toLowerCase().includes(cleanQuery) ||
        au.title.toLowerCase().includes(cleanQuery) ||
        au.actor.toLowerCase().includes(cleanQuery),
    ),
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
                {estateOptions.map((estate) => (
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
            <button className="topbar-icon" onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} aria-label={t.common.language} title={t.common.language}>
              <span className="text-xs font-semibold">{language === 'en' ? 'EN' : 'ID'}</span>
            </button>
            <button className="topbar-icon icon-action" aria-label="Search (Ctrl+K)" title="Quick Search (Ctrl+K)" onClick={() => setOverlay('search')}>
              <Search />
            </button>
            <button className="topbar-icon icon-action relative" aria-label="Notifications" onClick={() => setOverlay('notifications')}>
              <Bell /><span className="notification-dot" />
            </button>
            <button className="role-avatar" aria-label="Open Principal account menu" onClick={() => setOverlay('role')}>P</button>
          </div>
        </header>

        <aside className="side-rail" aria-label="Primary navigation">
          <nav className="flex flex-col gap-2">
            {navigation.map(({ label, icon: Icon, active, href }) => {
              const navKey = href.replace('#', '') as keyof typeof t.nav;
              const displayLabel = t.nav[navKey] || label;
              return (
                <a key={label} href={href} className="rail-link" data-active={active || undefined} aria-label={displayLabel}>
                  <Icon /><span>{displayLabel}</span>
                </a>
              );
            })}
          </nav>
          <button className="rail-link mt-auto" aria-label="Privacy controls" onClick={() => setOverlay('privacy')}>
            <Fingerprint /><span>Privacy</span>
          </button>
        </aside>

        <section className="workspace" id="overview">
          <div className="demo-notice">
            <span className="demo-notice-dot" />
            <span>Competition preview · all properties, people and metrics use synthetic data</span>
            <output aria-live="polite">· {dataSourceLabel}</output>
          </div>

          <div className="workspace-heading">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <CircleGauge className="size-3.5 text-primary" />Operations overview<span aria-hidden="true">·</span>31 Aug 2026, 13:07 WIB
              </div>
              <h1>{t.workspace.greeting}</h1>
              <p>
                {jakartaOnly ? (
                  <><span className="text-emerald-300">{t.workspace.allClear}</span> {t.workspace.jakartaNormal}</>
                ) : baliOnly ? (
                  <><span className="text-amber-300">{extraIncident ? t.workspace.activeIssuesTwo : t.workspace.activeIssuesOne}</span> {t.workspace.requiresDecision}</>
                ) : (
                  <><span className="text-amber-300">{extraIncident ? t.workspace.activeIssuesTwo : t.workspace.activeIssuesOne}</span> {extraIncident ? t.workspace.needAttention : t.workspace.needsAttention}</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="secondary-action hidden sm:inline-flex" onClick={resetDemo} disabled={mutationState !== 'idle'}><RotateCcw className={mutationState === 'resetting' ? 'spin' : undefined} />{mutationState === 'resetting' ? 'Resetting…' : t.common.resetDemo}</button>
              <button className="primary-action" onClick={() => setOverlay('report')}><Plus />{t.common.reportIncident}</button>
            </div>
          </div>

          <div className="command-grid">
            <section className="estate-card" aria-labelledby="estate-pulse-title">
              <div className="card-heading">
                <div>
                  <div className="eyebrow"><MapPin className="size-3.5" />{t.pulse.title}</div>
                  <h2 id="estate-pulse-title">{t.pulse.subtitle}</h2>
                </div>
                <span className="healthy-badge">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  {portfolioStability}
                </span>
              </div>

              <figure className="constellation" aria-label="Portfolio map showing Jakarta Residence stable and Bali Villa requiring attention">
                <div className="constellation-orbit orbit-one" />
                <div className="constellation-orbit orbit-two" />
                <div className="constellation-line line-one" />
                <div className="constellation-line line-two" />

                <button
                  className="estate-node jakarta-node"
                  data-selected={selectedEstate === 'Jakarta Residence' || undefined}
                  aria-label="Jakarta Residence, 96 percent healthy"
                  onClick={() => setSelectedEstate(selectedEstate === 'Jakarta Residence' ? 'All estates' : 'Jakarta Residence')}
                >
                  <span className="node-pulse node-pulse-safe" />
                  <span className="node-core"><Building2 /></span>
                  <span className="node-label"><strong>Jakarta Residence</strong><small>96% healthy · 2 tasks upcoming</small></span>
                </button>

                <button
                  className="estate-node bali-node"
                  data-selected={selectedEstate === 'Bali Villa' || undefined}
                  aria-label={`Bali Villa, ${dispatched ? 'simulated dispatch recorded' : approved ? 'approved for simulated dispatch' : 'high priority water leak'}`}
                  onClick={() => setSelectedEstate(selectedEstate === 'Bali Villa' ? 'All estates' : 'Bali Villa')}
                >
                  {!approved && <span className="node-pulse node-pulse-alert" />}
                  <span className={`node-core ${approved ? 'node-core-assigned' : 'node-core-alert'}`}>{approved ? <Wrench /> : <TriangleAlert />}</span>
                  <span className={`node-label ${approved ? '' : 'node-label-alert'}`}><strong>Bali Villa</strong><small>{dispatched ? 'Dispatch simulated · no vendor contacted' : approved ? 'Approved · dispatch action pending' : 'High priority · water leak'}</small></span>
                </button>

                <div className="workflow-hub" aria-label="ASTERA is monitoring the human-authorized estate workflow">
                  <span className="workflow-hub-icon"><ClipboardCheck /></span>
                  <div><strong>{t.pulse.humanAuthorized}</strong><small>8 {t.pulse.syntheticWorkspace}</small></div>
                </div>

                <div className="map-caption">
                  <span><span className="legend-dot bg-emerald-400" />{t.pulse.stable}</span>
                  <span><span className="legend-dot bg-amber-300" />{t.pulse.attention}</span>
                  <span className="ml-auto text-muted-foreground">{t.pulse.updatedJustNow}</span>
                </div>
              </figure>
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
                      {approved ? <CheckCircle2 /> : <TriangleAlert />}{dispatched ? 'Dispatch simulated' : approved ? 'Approval recorded' : 'High priority'}
                    </span>
                    <span className="incident-id">{incidentQuotes.incident?.referenceNumber ?? 'INC-BLI-0829-014'}</span>
                  </div>
                  <div>
                    <p className="eyebrow"><Clock3 className="size-3.5" />{dispatched ? 'Simulated dispatch recorded just now' : approved ? 'Human approval recorded just now' : 'Reported 18 minutes ago'}</p>
                    <h2 id="incident-title">{incidentQuotes.incident?.summary ?? 'Water leak beside the master-suite wardrobe'}</h2>
                    <p className="incident-description">{incidentQuotes.incident?.description ?? 'Possible HVAC condensate failure. The affected unit has been isolated and nearby valuables moved.'}</p>
                  </div>
                  <div className="evidence-row" aria-label="Available incident evidence"><span>Photo</span><span>Sensor</span><span>Service history</span></div>
                  <div className={`ai-recommendation ${approved ? 'recommendation-approved' : ''}`}>
                    <div className="ai-icon">{approved ? <CheckCircle2 /> : <Sparkles />}</div>
                    <div>
                      <p className="ai-label">{approved ? 'Approval recorded · accountable action' : 'AI suggestion · human approval required'}</p>
                      <p>{approved ? <><strong>{effectiveSelectedVendor}</strong> has an illustrative arrival window. No external vendor was contacted.</> : <><strong>{recommendedQuote?.vendorName ?? 'Bali Climate Works'}</strong> can arrive <strong>{recommendationLeadHours} hours sooner</strong> and includes the strongest synthetic coverage.</>}</p>
                      <button onClick={() => setShowReason((value) => !value)}>{showReason ? 'Hide evidence' : approved ? 'View decision evidence' : 'Why this recommendation?'}</button>
                      {showReason && <p className="reason-copy">{recommendedQuote?.aiRecommendationRationale ?? 'Compared price, verified SLA, warranty, moisture-control coverage, and guest arrival in two days.'}</p>}
                    </div>
                  </div>
                  <div className="incident-facts">
                    <div><span>Asset matched</span><strong>{incidentQuotes.incident?.assetId ?? 'BLI-HVAC-04'}</strong></div>
                    <div><span>Guest arrival</span><strong>In 2 days</strong></div>
                    <div><span>{approved ? 'Approved spend' : 'Recommended quote'}</span><strong>{approved ? selectedPrice : recommendedPrice}</strong></div>
                  </div>
                  <button className={`review-action ${approved ? 'dispatch-action' : ''}`} onClick={openQuotes}>
                    {dispatched ? 'View simulated dispatch' : approved ? 'Continue to simulated dispatch' : 'Review vendor quotes'}<span aria-hidden="true">→</span>
                  </button>
                  <p className="approval-note"><ShieldCheck className="size-3.5" />{dispatched ? 'Synthetic dispatch and accountable approval are recorded.' : approved ? 'Approval recorded; dispatch remains a separate explicit action.' : 'No vendor is dispatched without accountable approval.'}</p>
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
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden md:inline">Showing: <strong className="text-foreground">{selectedEstate}</strong> ({filteredAssets.length})</span>
                <span className="data-stamp" title={portfolioOverview.error ?? undefined}>
                  <LockKeyhole /> {dataSourceLabel}
                </span>
              </div>
            </div>
            <div className="asset-table" aria-label="Critical estate assets">
              <div className="asset-row asset-header" aria-hidden="true">
                <span>Asset</span><span>Estate</span><span>Condition</span><span>Next action</span>
              </div>
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  className="asset-row"
                  aria-label={`${asset.name}, ${asset.estate}, ${dispatched && asset.id === 'BLI-HVAC-04' ? 'simulated dispatch plan' : asset.state}, ${asset.next}`}
                  onClick={() => openAssetModal(asset)}
                >
                  <span><strong>{asset.name}</strong><small>{asset.id} · {asset.location}</small></span>
                  <span>{asset.estate}</span>
                  <span><i data-state={asset.state.toLowerCase()} />{dispatched && asset.id === 'BLI-HVAC-04' ? 'Dispatch simulated' : approved && asset.id === 'BLI-HVAC-04' ? 'Approved' : asset.state}</span>
                  <span>{asset.next}<ChevronRight /></span>
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
                {vendorList.map((vendor, index) => (
                  <button key={vendor.name} className="vendor-row" onClick={() => openVendorModal(vendor)}>
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
                <span className="audit-count">{approved ? auditRecords.length + 1 : auditRecords.length} events</span>
              </div>
              <ol className="audit-list">
                {approved && (
                  <li className="audit-new">
                    <span><Check /></span>
                    <div>
                      <strong>Quote approved by Principal</strong>
                      <small>{selectedPrice} · Bali Villa · simulated decision · just now</small>
                    </div>
                  </li>
                )}
                {auditRecords.map((record) => (
                  <li key={record.id}>
                    <button className="audit-row-btn" onClick={() => openAuditModal(record)} aria-label={`View audit details for ${record.title}`}>
                      <span><ClipboardCheck /></span>
                      <div>
                        <strong>{record.title}</strong>
                        <small>{record.actor} · {record.estate} · {record.time}</small>
                      </div>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <footer className="product-footer">
            <span>ASTERA · Competition prototype</span>
            <span>AI assists. Accountable people decide.</span>
          </footer>
        </section>

        {toastMessage && (
          <output className="app-toast" aria-live="polite">
            <CheckCircle2 /><span>{toastMessage}</span><button onClick={() => setToastMessage(null)} aria-label="Dismiss notification"><X /></button>
          </output>
        )}

        {/* Vendor Quotes Modal */}
        <OverlayPanel
          open={overlay === 'quotes'}
          onClose={() => setOverlay(null)}
          title={dispatched ? 'Simulated dispatch recorded' : approved ? 'Approval recorded · dispatch checkpoint' : quoteStep === 'confirm' ? 'Confirm accountable approval' : 'Compare verified vendors'}
          description={approved ? 'Prototype state only. Dispatch remains explicit, synthetic, and unable to contact an external vendor.' : 'Choose on evidence, not urgency. Every decision becomes part of the synthetic audit trail.'}
          wide
        >
          {approved ? (
            <div className="dispatch-panel">
              <div className="dispatch-success"><CheckCircle2 /><div><strong>{effectiveSelectedVendor} · {dispatched ? 'simulated dispatch recorded' : 'human approval recorded'}</strong><span>{dispatched ? 'Illustrative arrival window only · no external action' : 'Server-enforced approval complete · no vendor contacted'}</span></div></div>
              <div className="dispatch-steps">
                <div data-done><span><Check /></span><strong>Approval recorded</strong><small>Principal · synthetic event</small></div>
                <div data-done={dispatched || undefined} data-active={!dispatched || undefined}><span><Wrench /></span><strong>{dispatched ? 'Dispatch simulated' : 'Dispatch checkpoint'}</strong><small>No vendor contacted</small></div>
                <div><span><Camera /></span><strong>Completion evidence</strong><small>Pending</small></div>
                <div><span><ShieldCheck /></span><strong>Manager sign-off</strong><small>Pending</small></div>
              </div>
              {mutationError && <p className="mutation-error" role="alert">{mutationError}</p>}
              {dispatched ? (
                <button className="primary-action full-action" onClick={() => { setOverlay(null); scrollTo('audit'); }}>View recorded decision <ChevronRight /></button>
              ) : (
                <button className="primary-action full-action" onClick={dispatchWorkOrder} disabled={mutationState !== 'idle'}>
                  {mutationState === 'dispatching' ? <><Loader2 className="spin" /> Recording simulated dispatch…</> : <><Wrench /> Record simulated dispatch</>}
                </button>
              )}
            </div>
          ) : quoteStep === 'compare' ? (
            <div className="quote-workspace">
              <div className="quote-summary">
                <span className="priority-badge"><TriangleAlert /> High priority</span>
                <h3>{incidentQuotes.incident?.summary ?? 'Master-suite HVAC containment'}</h3>
                <p>Guest arrival in two days. Estate Manager approval limit: Rp 5,000,000.</p>
                <div><span>Asset</span><strong>{incidentQuotes.incident?.assetId ?? 'BLI-HVAC-04'}</strong></div>
                <div><span>Required response</span><strong>Within 4 hours</strong></div>
                <div><span>Data source</span><strong>{incidentQuotes.status === 'ready' && incidentQuotes.quotes.length ? 'Synthetic API' : 'Local fallback'}</strong></div>
              </div>
              <fieldset className="quote-options">
                <legend className="sr-only">Vendor quotations</legend>
                <button className="quote-option" data-selected={effectiveSelectedVendor === 'Bali Climate Works' || undefined} aria-pressed={effectiveSelectedVendor === 'Bali Climate Works'} onClick={() => setSelectedVendor('Bali Climate Works')}>
                  <div className="quote-option-head"><span><strong>Bali Climate Works</strong><small><BadgeCheck /> Verified · {climateQuote?.vendorRating ?? '4.9'}</small></span><span className="recommended-label"><Sparkles /> Recommended</span></div>
                  <strong className="quote-price">{formatIdr(climateQuote?.totalAmountMinorUnits ?? 18_500_000)}</strong>
                  <div className="quote-grid"><span><small>Arrival</small><strong>{formatArrival(climateQuote?.estimatedArrivalTimestamp)}</strong></span><span><small>Warranty</small><strong>{climateQuote ? `${climateQuote.warrantyMonths} months` : '3 months'}</strong></span><span><small>Risk</small><strong>{climateQuote?.riskRating ?? 'LOW'}</strong></span></div>
                  <p>{climateQuote?.aiRecommendationRationale ?? 'Fastest containment and includes overnight dehumidifier.'}</p>
                </button>
                <button className="quote-option" data-selected={effectiveSelectedVendor === 'Island Estate Engineering' || undefined} aria-pressed={effectiveSelectedVendor === 'Island Estate Engineering'} onClick={() => setSelectedVendor('Island Estate Engineering')}>
                  <div className="quote-option-head"><span><strong>Island Estate Engineering</strong><small><BadgeCheck /> Verified · {engineeringQuote?.vendorRating ?? '4.7'}</small></span><span className="lowest-label">Lowest cost</span></div>
                  <strong className="quote-price">{formatIdr(engineeringQuote?.totalAmountMinorUnits ?? 14_200_000)}</strong>
                  <div className="quote-grid"><span><small>Arrival</small><strong>{formatArrival(engineeringQuote?.estimatedArrivalTimestamp)}</strong></span><span><small>Warranty</small><strong>{engineeringQuote ? `${engineeringQuote.warrantyMonths} months` : '2 months'}</strong></span><span><small>Risk</small><strong>{engineeringQuote?.riskRating ?? 'MEDIUM'}</strong></span></div>
                  <p>{engineeringQuote?.aiRecommendationRationale ?? 'Lower price, but later containment and no overnight moisture control.'}</p>
                </button>
                <div className="quote-actions">
                  <button className="secondary-action" onClick={() => { setOverlay(null); setToastMessage('Revision requested from both verified vendors.'); }}>Request revision</button>
                  <button className="primary-action" onClick={() => { setApprovalAcknowledged(false); setMutationError(null); setQuoteStep('confirm'); }} disabled={!selectedQuote || incidentQuotes.status !== 'ready'}>Approve {selectedPrice}<ChevronRight /></button>
                </div>
              </fieldset>
            </div>
          ) : (
            <div className="confirm-approval">
              <div className="confirm-icon"><ShieldCheck /></div>
              <h3>Authorize {selectedPrice}?</h3>
              <p>This exceeds the Estate Manager&apos;s Rp 5,000,000 limit. You are approving <strong>{effectiveSelectedVendor}</strong> for Bali Villa.</p>
              <dl>
                <div><dt>Property</dt><dd>Bali Villa · Master suite</dd></div>
                <div><dt>Work order</dt><dd>WO-BLI-0829-027</dd></div>
                <div><dt>Accountable role</dt><dd>Principal</dd></div>
              </dl>
              <label className="approval-check"><input type="checkbox" checked={approvalAcknowledged} onChange={(event) => setApprovalAcknowledged(event.target.checked)} /> I reviewed the quote, scope, arrival time, and warranty.</label>
              {mutationError && <p className="mutation-error" role="alert">{mutationError}</p>}
              <div className="quote-actions">
                <button className="secondary-action" onClick={() => setQuoteStep('compare')}>Back to comparison</button>
                <button className="primary-action" onClick={approveQuote} disabled={!approvalAcknowledged || mutationState !== 'idle'} aria-disabled={!approvalAcknowledged || mutationState !== 'idle'}>{mutationState === 'approving' ? <><Loader2 className="spin" /> Recording approval…</> : <><Check /> Confirm approval</>}</button>
              </div>
            </div>
          )}
        </OverlayPanel>

        {/* Report Modal */}
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

        {/* Deep Asset Detail Modal */}
        <OverlayPanel
          open={overlay === 'asset-detail' && selectedAsset !== null}
          onClose={() => setOverlay(null)}
          title={selectedAsset?.name || 'Asset details'}
          description={`${selectedAsset?.id} · ${selectedAsset?.estate} (${selectedAsset?.location})`}
          wide
        >
          {selectedAsset && (
            <div className="asset-detail-view flex flex-col gap-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
                  <span className="text-[10px] uppercase text-muted-foreground block mb-1">Status</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <span className={`size-2 rounded-full ${selectedAsset.state === 'Healthy' ? 'bg-emerald-400' : selectedAsset.state === 'Scheduled' ? 'bg-indigo-400' : 'bg-amber-400'}`} />
                    {approved && selectedAsset.id === 'BLI-HVAC-04' ? 'Dispatch simulated' : selectedAsset.state}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
                  <span className="text-[10px] uppercase text-muted-foreground block mb-1">Serial number</span>
                  <span className="font-mono text-xs text-foreground">{selectedAsset.serial}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
                  <span className="text-[10px] uppercase text-muted-foreground block mb-1">Next milestone</span>
                  <span className="font-medium text-foreground">{selectedAsset.next}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02] flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5"><Cpu className="size-3.5 text-primary" /> Technical Specification</span>
                <p className="text-foreground text-xs leading-relaxed">{selectedAsset.spec}</p>
                <span className="text-[11px] text-muted-foreground mt-1">Last serviced: {selectedAsset.lastService}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2 flex items-center gap-1.5"><Activity className="size-3.5 text-emerald-400" /> Real-time telemetry simulation</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {selectedAsset.telemetry.map((t) => (
                    <div key={t.label} className="p-3 rounded-lg border border-white/6 bg-white/[0.015] flex flex-col gap-1">
                      <span className="text-[9px] text-muted-foreground">{t.label}</span>
                      <strong className={`text-xs ${t.status === 'warning' ? 'text-amber-300' : 'text-foreground'}`}>{t.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2 flex items-center gap-1.5"><History className="size-3.5 text-indigo-400" /> Maintenance event log</span>
                <div className="flex flex-col gap-2">
                  {selectedAsset.logs.map((log, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-white/6 bg-white/[0.015] flex items-start justify-between gap-3 text-xs">
                      <div>
                        <p className="font-medium text-foreground text-xs">{log.summary}</p>
                        <span className="text-[10px] text-muted-foreground">Logged by: {log.technician}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{log.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/8">
                <button className="secondary-action" onClick={() => { setOverlay(null); setToastMessage(`Service request drafted for ${selectedAsset.id}`); }}>Request routine care</button>
                <button className="primary-action" onClick={() => { setOverlay('report'); setReportText(`Issue inquiry regarding ${selectedAsset.name} (${selectedAsset.id}): `); }}>Report issue</button>
              </div>
            </div>
          )}
        </OverlayPanel>

        {/* Deep Vendor Detail Modal */}
        <OverlayPanel
          open={overlay === 'vendor-detail' && selectedVendorDetail !== null}
          onClose={() => setOverlay(null)}
          title={selectedVendorDetail?.name || 'Vendor Profile'}
          description={`${selectedVendorDetail?.specialty} · Verified Estate Partner`}
          wide
        >
          {selectedVendorDetail && (
            <div className="vendor-detail-view flex flex-col gap-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
                  <span className="text-[10px] uppercase text-muted-foreground block mb-1">Response SLA</span>
                  <strong className="text-foreground text-sm font-semibold">{selectedVendorDetail.response} emergency guarantee</strong>
                </div>
                <div className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
                  <span className="text-[10px] uppercase text-muted-foreground block mb-1">Quality rating</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                    <Star className="size-3.5 fill-amber-300" /> {selectedVendorDetail.score} ({selectedVendorDetail.jobs})
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
                  <span className="text-[10px] uppercase text-muted-foreground block mb-1">Account Lead</span>
                  <span className="font-medium text-foreground text-xs">{selectedVendorDetail.leadTech}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02] flex flex-col gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1"><BadgeCheck className="size-3.5 text-emerald-400" /> Commercial Licensing</span>
                  <p className="text-foreground text-xs">{selectedVendorDetail.license}</p>
                </div>
                <div className="border-t border-white/6 pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1"><ShieldCheck className="size-3.5 text-indigo-400" /> Liability Insurance</span>
                  <p className="text-foreground text-xs">{selectedVendorDetail.insurance}</p>
                </div>
                <div className="border-t border-white/6 pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1"><FileText className="size-3.5 text-amber-400" /> Master Agreement</span>
                  <p className="text-foreground text-xs">{selectedVendorDetail.contract}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">Verified Estate Capabilities</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedVendorDetail.capabilities.map((cap) => (
                    <div key={cap} className="p-2.5 rounded-lg border border-white/6 bg-white/[0.015] flex items-center gap-2 text-xs">
                      <Check className="size-3.5 text-emerald-400" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/8">
                <button className="secondary-action" onClick={() => { setOverlay(null); setToastMessage(`Synthetic quote request prepared for ${selectedVendorDetail.name}. No message was sent.`); }}>Prepare quote request</button>
                <button className="primary-action" onClick={() => { setOverlay('quotes'); }}>View demo quotes</button>
              </div>
            </div>
          )}
        </OverlayPanel>

        {/* Deep Audit Modal */}
        <OverlayPanel
          open={overlay === 'audit-detail' && selectedAuditRecord !== null}
          onClose={() => setOverlay(null)}
          title={selectedAuditRecord?.title || 'Audit event'}
          description={`${selectedAuditRecord?.id} · ${selectedAuditRecord?.estate}`}
        >
          {selectedAuditRecord && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02] flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recorded time</span>
                  <span className="font-mono text-foreground">{selectedAuditRecord.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accountable actor</span>
                  <span className="font-semibold text-foreground">{selectedAuditRecord.actor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cryptographic hash</span>
                  <span className="font-mono text-primary">{selectedAuditRecord.hash}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold block mb-1.5">Action summary</span>
                <p className="text-foreground leading-relaxed">{selectedAuditRecord.summary}</p>
              </div>

              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2 text-emerald-400 text-[11px]">
                <ShieldCheck className="size-4 shrink-0" />
                <span>Tamper-evident record verified against the synthetic estate ledger.</span>
              </div>
            </div>
          )}
        </OverlayPanel>

        {/* Global Search / Command Palette */}
        <OverlayPanel open={overlay === 'search'} onClose={() => { setOverlay(null); setSearchQuery(''); }} title="Search the private workspace" description="Find an estate, asset, vendor, or recorded decision.">
          <div className="command-search">
            <Search />
            <input
              aria-label="Search private workspace"
              placeholder="Type to filter: BLI-HVAC-04, generator, Bali Climate Works..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="command-results">
            {searchResults.assets.length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 pt-2">Assets ({searchResults.assets.length})</div>
                {searchResults.assets.map((asset) => (
                  <button key={asset.id} onClick={() => { setOverlay(null); openAssetModal(asset); }}>
                    <Building2 />
                    <span><strong>{asset.name}</strong><small>{asset.id} · {asset.estate}</small></span>
                    <Command />
                  </button>
                ))}
              </>
            )}

            {searchResults.vendors.length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 pt-2">Vendors ({searchResults.vendors.length})</div>
                {searchResults.vendors.map((vendor) => (
                  <button key={vendor.name} onClick={() => { setOverlay(null); openVendorModal(vendor); }}>
                    <UsersRound />
                    <span><strong>{vendor.name}</strong><small>{vendor.specialty} · {vendor.score} rating</small></span>
                    <ChevronRight />
                  </button>
                ))}
              </>
            )}

            {searchResults.audits.length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 pt-2">Audit trail ({searchResults.audits.length})</div>
                {searchResults.audits.map((record) => (
                  <button key={record.id} onClick={() => { setOverlay(null); openAuditModal(record); }}>
                    <History />
                    <span><strong>{record.title}</strong><small>{record.id} · {record.actor}</small></span>
                    <ChevronRight />
                  </button>
                ))}
              </>
            )}

            {searchResults.assets.length === 0 && searchResults.vendors.length === 0 && searchResults.audits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No matching assets, vendors, or decisions found for &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>
        </OverlayPanel>

        <OverlayPanel open={overlay === 'notifications'} onClose={() => setOverlay(null)} title="Attention queue" description="Only changes that need a person are shown here.">
          <div className="notification-list">
            <button onClick={openQuotes}><span className="notification-icon warning"><TriangleAlert /></span><span><strong>{dispatched ? 'Simulated dispatch recorded' : approved ? 'Dispatch action available' : `Approval required · ${selectedPrice}`}</strong><small>Bali Villa · {approved ? 'no external vendor contacted' : 'reported 18 minutes ago'}</small></span><ChevronRight /></button>
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
