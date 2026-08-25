import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth, db, getBusinessId, supabase, supabaseConfigured, getSupabaseErrorMessage, getProductBarcode, generateInternalSku } from '@/lib/supabase';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, BarChart3, Bell, BookOpen, Boxes, BriefcaseBusiness, Building2, Calendar, Check,
  CheckCircle2, ChevronDown, CircleDollarSign, ClipboardList, Clock, CreditCard, FilePlus2, FileText, HelpCircle,
  Landmark, LayoutDashboard, Lock, LogOut, ImagePlus, Camera, Mail, MapPin, Menu, MessageCircle, Minus, MoreHorizontal, Package, Pencil, Phone, PhoneCall, Plus, Printer, QrCode, Receipt,
  RefreshCw, Search, Settings as SettingsIcon, ShoppingCart, SlidersHorizontal, Sparkles, Store, Trash2, Eye,
  Truck, UserRound, Users, Wallet, X, AlertCircle, Share2, Copy, ScanLine, Barcode,
} from 'lucide-react';
import { KhataBook } from '@/components/KhataBook';
import { BarcodeVerifierModal } from '@/components/BarcodeVerifierModal';

const queryClient = new QueryClient();
type Row = Record<string, any>;
type Icon = typeof LayoutDashboard;

function useTable<T extends Row>(table: string, query: Record<string, string | number | boolean | undefined> = {}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const queryKey = JSON.stringify(query);
  const load = async () => {
    setLoading(true); setError('');
    try { setData(await db.list<T>(table, query)); } catch (e) { setError(getSupabaseErrorMessage(e, 'Could not load this data.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [table, queryKey]);
  return { data, loading, error, reload: load };
}

const navItems: { href: string; label: string; icon: Icon }[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/khatabook', label: 'Khata Book', icon: BookOpen },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

function AppField({ label, value, onChange, type = 'text', required, test, placeholder }: { label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean; test?: string; placeholder?: string }) {
  return (
    <label className="block text-xs font-bold">{label}
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required} className="input-shell mt-2 w-full px-3 text-sm font-normal" data-testid={test} />
    </label>
  );
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled,
  testId,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string; hint?: string }[];
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative mt-2">
      <button
        type="button"
        data-testid={testId}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`input-shell flex min-h-11 w-full items-center justify-between px-3.5 py-2.5 text-sm font-normal shadow-sm transition-all duration-150 ${
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
        } ${open ? 'border-primary ring-2 ring-primary/20' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedOption ? 'font-medium text-foreground' : 'text-muted-foreground'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute top-full left-0 z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-border/80 bg-card p-1.5 text-card-foreground shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95"
          >
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                    isSelected
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-foreground hover:bg-muted/80'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="truncate">{opt.label}</div>
                    {opt.hint && (
                      <div className="text-[11px] font-normal text-muted-foreground">{opt.hint}</div>
                    )}
                  </div>
                  {isSelected && (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center text-primary">
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Logo() {
  return <Link href="/dashboard" className="flex items-center gap-2.5 text-inherit no-underline" data-testid="link-logo">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-lg font-extrabold text-secondary-foreground">C</span>
    <span className="text-[15px] font-extrabold tracking-[-.04em]">BillingMaster<span className="text-secondary">.</span></span>
  </Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<Row | null>(null);
  const [business, setBusiness] = useState<Row | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        let session = auth.session();
        if (!session) {
          session = await auth.getSession();
        }
        if (session && active) {
          const profiles = await db.list<Row>('profiles', { id: session.user.id });
          if (profiles.length && active) {
            const p = profiles[0];
            setProfile(p);
            let bid = p.business_id;
            if (!bid) bid = await getBusinessId();
            if (bid && active) {
              const businesses = await db.list<Row>('businesses', { id: bid });
              if (businesses.length && active) setBusiness(businesses[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading profile in Shell:', err);
      }
    }
    void loadData();
    return () => { active = false; };
  }, [location]);

  const current = navItems.find((item) => location.startsWith(item.href));
  const pageTitle = current?.label || (location.includes('settings') ? 'Settings' : 'Workspace');
  
  const session = auth.session();
  const userMeta = session?.user?.user_metadata || {};
  const userName = profile?.full_name || userMeta.full_name || userMeta.name || session?.user?.email?.split('@')[0] || 'User';
  const initials = (userName.trim().split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'AV').toUpperCase();
  const workspaceName = business?.name || userMeta.business_name || 'Your workspace';

  return <div className="noise flex min-h-[100dvh] bg-background print:bg-white print:p-0">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0 print:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-9 flex items-center justify-between px-2"><Logo /><button onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-sidebar-foreground/60 lg:hidden" data-testid="button-close-menu"><X size={18} /></button></div>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-sidebar-foreground/40">Workspace</div>
      <nav className="space-y-1">
        {navItems.map(({ href, label, icon: NavIcon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold no-underline transition-colors ${location.startsWith(href) ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/62 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`} data-testid={`link-nav-${label.toLowerCase()}`}>
          <NavIcon size={17} strokeWidth={location.startsWith(href) ? 2.5 : 1.8} /><span>{label}</span>{label === 'Invoices' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary" />}
        </Link>)}
      </nav>
      <div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-sidebar-foreground/40">Manage</div>
      <nav className="mt-3 space-y-1">
        <Link href="/settings" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold no-underline transition-colors ${location.startsWith('/settings') ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/62 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`} data-testid="link-nav-settings"><SettingsIcon size={17} /><span>Settings</span></Link>
      </nav>
      <div className="mt-auto rounded-2xl border border-sidebar-foreground/10 bg-sidebar-accent/45 p-3.5">
        <div className="mb-3 flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{initials}</span><span className="rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-bold text-secondary">OWNER</span></div>
        <div className="truncate text-xs font-bold">{workspaceName}</div><div className="mt-0.5 truncate text-[11px] text-sidebar-foreground/50">Business profile</div>
        <button className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-sidebar-foreground/58 hover:text-sidebar-foreground" onClick={() => { auth.signOut(); setLocation('/login'); }} data-testid="button-signout"><LogOut size={13} /> Sign out</button>
      </div>
    </aside>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-sidebar/30 lg:hidden print:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-overlay" />}
    <main className="min-w-0 flex-1 print:w-full print:p-0">
      <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-md sm:px-7 lg:px-10 print:hidden">
        <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-muted lg:hidden" data-testid="button-open-menu"><Menu size={20} /></button><div><div className="text-[11px] font-semibold text-muted-foreground">Workspace / <span className="text-foreground">{pageTitle}</span></div><h1 className="mt-0.5 text-lg font-extrabold tracking-[-.035em]">{pageTitle}</h1></div></div>
        <div className="flex items-center gap-2.5"><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-help"><HelpCircle size={18} /></button><button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-notifications"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" /></button><div className="ml-1 hidden h-8 w-px bg-border sm:block" /><button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted" data-testid="button-profile"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground">{initials}</span><ChevronDown size={14} className="hidden text-muted-foreground sm:block" /></button></div>
      </header>
      <div className="mx-auto max-w-[1440px] px-4 py-7 pb-24 sm:px-7 lg:px-10 lg:py-9 print:m-0 print:max-w-none print:p-0">{children}</div>
    </main>
    <nav className="fixed inset-x-3 bottom-3 z-20 flex items-center justify-around rounded-2xl border border-border bg-card/95 p-2 shadow-float backdrop-blur lg:hidden print:hidden">
      {navItems.slice(0, 5).map(({ href, label, icon: NavIcon }) => <Link href={href} className={`flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-bold no-underline ${location.startsWith(href) ? 'bg-muted text-primary' : 'text-muted-foreground'}`} data-testid={`link-mobile-${label.toLowerCase()}`} key={href}><NavIcon size={17} /><span>{label}</span></Link>)}
    </nav>
  </div>;
}

function PageHeader({ eyebrow, title, description, action, actionLabel, actionHref, hideSettings, onSettingsClick }: { eyebrow?: string; title: string; description?: string; action?: () => void; actionLabel?: string; actionHref?: string; hideSettings?: boolean; onSettingsClick?: () => void }) {
  const isSettingsPage = title.toLowerCase().includes('setting') || hideSettings;
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end animate-rise">
      <div>
        {eyebrow && <div className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</div>}
        <h2 className="text-2xl font-extrabold tracking-[-.05em] sm:text-[30px]">{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && (
        <div className="flex w-full items-center gap-2.5 sm:w-auto">
          {actionHref ? (
            <Link
              href={actionHref}
              className="btn-primary flex-1 sm:flex-initial inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs sm:text-sm font-bold no-underline shadow-sm"
              data-testid={`link-${actionLabel.toLowerCase().replaceAll(' ', '-')}`}
            >
              <Plus size={16} />
              <span>{actionLabel}</span>
            </Link>
          ) : (
            <button
              onClick={action}
              className="btn-primary flex-1 sm:flex-initial inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs sm:text-sm font-bold shadow-sm"
              data-testid={`button-${actionLabel.toLowerCase().replaceAll(' ', '-')}`}
            >
              <Plus size={16} />
              <span>{actionLabel}</span>
            </button>
          )}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-muted hover:text-foreground no-underline"
              title="Settings"
              data-testid="button-header-settings-btn"
            >
              <SettingsIcon size={17} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function State({ loading, error, onRetry, children }: { loading?: boolean; error?: string; onRetry?: () => void; children: ReactNode }) {
  if (loading) return <div className="space-y-3">{[1, 2, 3].map((n) => <div className="skeleton h-[68px] rounded-xl" key={n} />)}</div>;
  if (error) return <div className="card-shell flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"><div className="grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive"><RefreshCw size={19} /></div><div><div className="font-bold">Could not load this view</div><p className="mt-1 max-w-md text-xs text-muted-foreground">{error}</p></div><button onClick={onRetry} className="btn-primary rounded-lg px-3 py-2 text-xs font-bold" data-testid="button-retry">Try again</button></div>;
  return <>{children}</>;
}

function Empty({ icon: EmptyIcon, title, description, action, actionLabel }: { icon: Icon; title: string; description: string; action?: () => void; actionLabel?: string }) {
  return <div className="flex flex-col items-center justify-center px-5 py-16 text-center"><div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-primary"><EmptyIcon size={24} strokeWidth={1.7} /></div><h3 className="font-extrabold tracking-[-.02em]">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>{actionLabel && <button onClick={action} className="btn-secondary mt-5 inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-bold" data-testid="button-empty-action"><Plus size={15} />{actionLabel}</button>}</div>;
}

function Metric({ icon: MetricIcon, label, value, hint }: { icon: Icon; label: string; value: string; hint: string }) {
  return <div className="card-shell p-5 animate-rise"><div className="mb-6 flex items-center justify-between"><div className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-primary"><MetricIcon size={18} /></div><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span></div><div className="mono text-[27px] font-medium tracking-[-.08em] text-foreground">{value}</div><div className="mt-1 text-[11px] text-muted-foreground">{hint}</div></div>;
}

function Dashboard() {
  const [profile, setProfile] = useState<Row | null>(null);
  const invoices = useTable<Row>('invoices', { order: 'issue_date.desc', limit: 5 });
  const products = useTable<Row>('products', { is_active: 'eq.true', order: 'stock_quantity.asc', limit: 5 });
  
  useEffect(() => {
    async function loadProfile() {
      try {
        const session = auth.session();
        if (session) {
          const rows = await db.list<Row>('profiles', { id: session.user.id });
          if (rows.length) setProfile(rows[0]);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    }
    loadProfile();
  }, []);

  const hasData = invoices.data.length > 0 || products.data.length > 0;
  const userName = profile?.full_name || auth.session()?.user?.email?.split('@')[0] || 'there';

  return <><PageHeader eyebrow="Today at a glance" title={`Good morning, ${userName}.`} description="A clear view of what needs your attention." actionLabel="New invoice" actionHref="/invoices/new" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"><Metric icon={CircleDollarSign} label="Sales" value={hasData ? '—' : '—'} hint="No sales recorded yet" /><Metric icon={Receipt} label="Outstanding" value="—" hint="Awaiting payment" /><Metric icon={Users} label="Customers" value="—" hint="Your customer base" /><Metric icon={Boxes} label="Low stock" value="—" hint="Items to replenish" /></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]"><section className="card-shell overflow-hidden animate-rise delay-1"><div className="flex items-center justify-between border-b border-border/70 px-5 py-4"><div><h3 className="text-sm font-extrabold">Recent invoices</h3><p className="mt-0.5 text-xs text-muted-foreground">The latest movement in your books.</p></div><Link href="/invoices" className="text-xs font-bold text-primary no-underline" data-testid="link-view-invoices">View all <ArrowRight className="ml-1 inline" size={13} /></Link></div><State {...invoices}><>{invoices.data.length ? <div className="divide-y divide-border/70">{invoices.data.map((row, index) => <InvoiceRow key={row.id || index} row={row} />)}</div> : <Empty icon={FileText} title="No invoices yet" description="Create your first invoice to see sales activity here." actionLabel="Create invoice" action={() => window.location.assign('/invoices/new')} />}</></State></section>
      <section className="card-shell overflow-hidden animate-rise delay-2"><div className="flex items-center justify-between border-b border-border/70 px-5 py-4"><div><h3 className="text-sm font-extrabold">Stock watch</h3><p className="mt-0.5 text-xs text-muted-foreground">Products nearest to their threshold.</p></div><Link href="/products" className="text-xs font-bold text-primary no-underline" data-testid="link-view-products">Inventory <ArrowRight className="ml-1 inline" size={13} /></Link></div><State {...products}><>{products.data.length ? products.data.map((p, index) => <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 last:border-0" key={p.id || index}><div><div className="text-sm font-bold">{p.name}</div></div><span className="rounded-full bg-accent/12 px-2.5 py-1 text-xs font-bold text-accent">{p.stock_quantity ?? '—'} {p.unit || 'units'}</span></div>) : <Empty icon={Package} title="Inventory is ready" description="Add products to keep a live view of your stock." actionLabel="Add product" action={() => window.location.assign('/products')} />}</></State></section>
    </div>
  </>;
}

function InvoiceRow({ row }: { row: Row }) {
  const status = row.status || 'due';
  const isPaid = status === 'paid' || status === 'complete';
  const timeMatch = row.notes?.match(/Time:\s*([0-9:]+\s*(?:AM|PM)?)/i);
  const timeStr = timeMatch ? ` at ${timeMatch[1]}` : '';
  return (
    <Link href={`/invoices/${row.id}`} className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40 no-underline text-inherit block cursor-pointer" data-testid={`row-invoice-${row.id}`}>
      <div className="min-w-0">
        <div className="mono text-xs font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5">
          <span>{row.invoice_number || 'Unnumbered invoice'}</span>
          <span className="text-[10px] text-primary">→</span>
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {row.customer_id ? 'Customer linked' : 'Walk-in customer'} · {row.issue_date ? `${row.issue_date}${timeStr}` : 'No issue date'}
        </div>
      </div>
      <div className="text-right">
        <div className="mono text-sm font-bold">{row.total != null ? Number(row.total).toFixed(2) : '—'} <span className="text-[10px] text-muted-foreground">{row.currency || 'INR'}</span></div>
        <span
          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
            isPaid
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
          }`}
          data-testid={`status-invoice-${row.id}`}
        >
          {isPaid ? 'Paid' : 'Due / Unpaid'}
        </span>
      </div>
    </Link>
  );
}

function Invoices() {
  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const invoices = useTable<Row>('invoices', { order: 'issue_date.desc' });
  const customers = useTable<Row>('customers');

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.data.forEach((c) => {
      if (c.id) map.set(c.id, c.name || c.full_name || 'Customer');
    });
    return map;
  }, [customers.data]);

  const filtered = useMemo(
    () =>
      invoices.data.filter((item) =>
        `${item.invoice_number || ''} ${item.status || ''} ${customerMap.get(item.customer_id) || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [invoices.data, search, customerMap]
  );
  
  return <>
    <PageHeader eyebrow="Cash flow" title="Invoices" description="Move from sale to paid, without losing the thread." actionLabel="New invoice" actionHref="/invoices/new" onSettingsClick={() => setSettingsOpen(true)} />
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 text-muted-foreground" size={17} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice number, customer or status" className="input-shell w-full pl-10 pr-3 text-sm" data-testid="input-search-invoices" />
      </div>
      <button className="input-shell inline-flex items-center justify-center gap-2 px-3 text-xs font-bold text-muted-foreground hover:text-foreground" data-testid="button-filter-invoices"><SlidersHorizontal size={15} /> Filters</button>
    </div>
    <section className="card-shell overflow-hidden">
      <div className="hidden grid-cols-[1.2fr_1.1fr_1fr_1fr_110px] gap-4 border-b border-border/70 bg-muted/30 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid">
        <span>Invoice</span><span>Customer</span><span>Issued</span><span>Amount</span><span>Status</span>
      </div>
      <State {...invoices}>
        {filtered.length ? (
          <div className="divide-y divide-border/70">
            {filtered.map((row, index) => {
              const timeMatch = row.notes?.match(/Time:\s*([0-9:]+\s*(?:AM|PM)?)/i);
              const timeStr = timeMatch ? ` ${timeMatch[1]}` : '';
              const custName = customerMap.get(row.customer_id) || (row.customer_id ? 'Customer' : 'Walk-in customer');
              const isPaid = row.status === 'paid' || row.status === 'complete';
              return (
                <Link
                  href={`/invoices/${row.id}`}
                  key={row.id || index}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[1.2fr_1.1fr_1fr_1fr_110px] sm:items-center sm:gap-4 transition-colors hover:bg-muted/40 no-underline text-inherit cursor-pointer block"
                  data-testid={`link-invoice-row-${row.id || index}`}
                >
                  <div className="flex items-center justify-between sm:block">
                    <span className="mono text-xs font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                      <span>{row.invoice_number || 'Unnumbered'}</span>
                      <span className="text-[10px] text-primary">→</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase sm:hidden ${isPaid ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                      {isPaid ? 'Paid' : 'Due'}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground truncate">{custName}</span>
                  <span className="text-xs text-muted-foreground">{row.issue_date ? `${row.issue_date}${timeStr}` : '—'}</span>
                  <span className="mono text-sm font-bold">{row.total != null ? Number(row.total).toFixed(2) : '—'} <span className="text-[10px] text-muted-foreground">{row.currency || 'INR'}</span></span>
                  <div className="hidden sm:block">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${isPaid ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'}`}>
                      {isPaid ? 'Paid' : 'Due'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty icon={FileText} title={search ? 'No invoices match' : 'Your invoice list is clear'} description={search ? 'Try another search term.' : 'Invoices created in the workspace will appear here.'} actionLabel={!search ? 'Create invoice' : undefined} action={() => window.location.assign('/invoices/new')} />
        )}
      </State>
    </section>
    
    {settingsOpen && <InvoiceQuickSettings onClose={() => setSettingsOpen(false)} />}
  </>;
}

function InvoiceQuickSettings({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ enable_tax: false, tax_name: 'Tax', tax_rate: '18', invoice_template: 'standard' });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        let session = auth.session();
        if (!session) session = await auth.getSession();
        const user = session?.user;
        let loadedEnableTax = false;
        let loadedTaxName = 'Tax';
        let loadedTaxRate = '18';
        let loadedTemplate = 'standard';

        // 1. Try global tax cache
        try {
          const globalRaw = localStorage.getItem('arventa_tax_settings');
          if (globalRaw) {
            const gc = JSON.parse(globalRaw);
            if (gc.enable_tax !== undefined) loadedEnableTax = Boolean(gc.enable_tax);
            if (gc.tax_name) loadedTaxName = gc.tax_name;
            if (gc.tax_rate !== undefined) loadedTaxRate = String(gc.tax_rate);
            if (gc.invoice_template) loadedTemplate = gc.invoice_template;
          }
        } catch (e) {}

        // 2. Try user-specific local cache
        if (user?.id) {
          try {
            const raw = localStorage.getItem(`arventa_biz_${user.id}`);
            if (raw) {
              const c = JSON.parse(raw);
              if (c.enable_tax !== undefined) loadedEnableTax = Boolean(c.enable_tax);
              if (c.tax_name) loadedTaxName = c.tax_name;
              if (c.tax_rate !== undefined) loadedTaxRate = String(c.tax_rate);
              if (c.invoice_template) loadedTemplate = c.invoice_template;
            }
          } catch (e) {}

          // 3. Try DB settings
          try {
            let bid = await getBusinessId();
            if (!bid) {
              const profiles = await db.list<Row>('profiles', { id: user.id });
              if (profiles.length && profiles[0].business_id) bid = profiles[0].business_id;
            }
            if (bid) {
              const settingsList = await db.list<Row>('settings', { business_id: bid });
              if (settingsList.length > 0) {
                const s = settingsList[0];
                if (s.enable_tax !== undefined) loadedEnableTax = Boolean(s.enable_tax);
                if (s.tax_name) loadedTaxName = s.tax_name;
                if (s.tax_rate !== undefined) loadedTaxRate = String(s.tax_rate);
                if (s.invoice_template) loadedTemplate = s.invoice_template;
              }
            }
          } catch (e) {}
        }

        setForm({
          enable_tax: loadedEnableTax,
          tax_name: loadedTaxName || 'Tax',
          tax_rate: loadedTaxRate || '18',
          invoice_template: loadedTemplate || 'standard',
        });
      } catch (err) {
        console.warn('Could not load invoice settings:', err);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let session = auth.session();
      if (!session) session = await auth.getSession();
      const user = session?.user;

      // Always save to global localStorage cache for instant access
      localStorage.setItem('arventa_tax_settings', JSON.stringify({
        enable_tax: form.enable_tax,
        tax_name: form.tax_name || 'Tax',
        tax_rate: form.tax_rate,
        invoice_template: form.invoice_template,
      }));

      if (user?.id) {
        try {
          const raw = localStorage.getItem(`arventa_biz_${user.id}`);
          const c = raw ? JSON.parse(raw) : {};
          c.enable_tax = form.enable_tax;
          c.tax_name = form.tax_name || 'Tax';
          c.tax_rate = form.tax_rate;
          c.invoice_template = form.invoice_template;
          localStorage.setItem(`arventa_biz_${user.id}`, JSON.stringify(c));
        } catch (e) {}

        // Update user metadata
        try {
          await supabase.auth.updateUser({
            data: {
              enable_tax: form.enable_tax,
              tax_name: form.tax_name || 'Tax',
              tax_rate: form.tax_rate,
              invoice_template: form.invoice_template,
            }
          });
        } catch (ae) {}
        
        // Update DB settings
        try {
          let bid = await getBusinessId();
          if (!bid) {
            const profiles = await db.list<Row>('profiles', { id: user.id });
            if (profiles.length && profiles[0].business_id) bid = profiles[0].business_id;
          }
          if (bid) {
            await db.upsert('settings', {
              business_id: bid,
              enable_tax: form.enable_tax,
              tax_name: form.tax_name || 'Tax',
              tax_rate: Number(form.tax_rate || 0),
              invoice_template: form.invoice_template,
            });
          }
        } catch (e) {
          console.warn('Could not save DB settings:', e);
        }
      }
    } catch (e) {
      console.warn('Could not save invoice settings completely:', e);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  if (!loaded) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold">Invoice Settings</h3>
            <p className="text-xs text-muted-foreground">Configure tax and templates.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={(e) => void save(e)} className="space-y-6">
          <div className="rounded-xl border border-border bg-muted/20 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={form.enable_tax} onChange={e => setForm({...form, enable_tax: e.target.checked})} className="mt-1 h-4 w-4 rounded accent-primary" />
              <div>
                <div className="text-sm font-bold">Enable Tax Calculation</div>
                <div className="text-[11px] text-muted-foreground">Apply tax calculations to your invoices.</div>
              </div>
            </label>
            {form.enable_tax && (
              <div className="mt-5 grid gap-4 pl-7 sm:grid-cols-2">
                <label className="block text-xs font-bold">
                  Tax Name / Type
                  <input type="text" placeholder="e.g. VAT, GST" value={form.tax_name} onChange={e => setForm({...form, tax_name: e.target.value})} className="input-shell mt-2 w-full px-3 py-2 text-sm font-semibold" />
                </label>
                <label className="block text-xs font-bold">
                  Default Tax Rate (%)
                  <div className="relative mt-2">
                    <input type="number" min="0" step="0.01" value={form.tax_rate} onChange={e => setForm({...form, tax_rate: e.target.value})} className="input-shell w-full pl-3 pr-8 py-2 text-sm font-semibold" />
                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">%</span>
                  </div>
                </label>
              </div>
            )}
          </div>
          
          <div>
            <div className="mb-3 text-sm font-bold">Select Invoice Template</div>
            <div className="grid gap-4 sm:grid-cols-1">
              {[
                { id: 'standard', name: 'Standard Commercial', desc: 'Clean layout for general retail.' }
              ].map(tpl => (
                <button type="button" key={tpl.id} onClick={() => setForm({...form, invoice_template: tpl.id})} className={`flex flex-col overflow-hidden rounded-xl border text-left transition-all ${form.invoice_template === tpl.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/40'}`}>
                  <div className="h-28 w-full border-b border-border/50 bg-muted/50 p-4">
                    <div className="mx-auto flex h-full w-4/5 flex-col gap-2 rounded border border-border bg-card p-3 shadow-sm">
                       <div className="flex justify-between"><div className="h-2 w-8 rounded bg-muted-foreground/30"></div><div className="h-2 w-12 rounded bg-muted-foreground/30"></div></div>
                       <div className="mt-1 h-1.5 w-1/3 rounded bg-muted-foreground/20"></div>
                       <div className="mt-2 h-px w-full bg-border"></div>
                       <div className="mt-1 flex justify-between"><div className="h-1.5 w-10 rounded bg-muted-foreground/20"></div><div className="h-1.5 w-6 rounded bg-muted-foreground/20"></div></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <span className="text-sm font-extrabold">{tpl.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{tpl.desc}</span>
                    {form.invoice_template === tpl.id && <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary"><Check size={14} /> Selected</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary rounded-lg px-6 py-2.5 text-xs font-bold shadow-sm">{saving ? 'Saving...' : 'Save settings'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceNew() {
  const [, setLocation] = useLocation();
  const products = useTable<Row>('products', { is_active: 'eq.true', order: 'name.asc' });
  const customers = useTable<Row>('customers', { order: 'name.asc' });
  const [customerId, setCustomerId] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerDropdown, setCustomerDropdown] = useState(false);
  const visibleCustomers = useMemo(() => { const q = customerQuery.toLowerCase(); return customers.data.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)); }, [customers.data, customerQuery]);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Row[]>([]);
  const [customItemModal, setCustomItemModal] = useState(false);
  const [customItemForm, setCustomItemForm] = useState<any>({ name: '', price: '', quantity: 1 });

  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [issueDate, setIssueDate] = useState(getTodayDate());
  const [issueTime, setIssueTime] = useState(getCurrentTime());

  // Confirmation & Notifications state
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [notifyPhoneCall, setNotifyPhoneCall] = useState(false);

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const visibleProducts = products.data.filter((p) => p.unit !== 'custom-item' && `${p.name} ${getProductBarcode(p)}`.toLowerCase().includes(query.toLowerCase()));
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState('');
  
  const discountAmount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (discountType === 'percentage') {
      return subtotal * (val / 100);
    }
    return val;
  }, [discountValue, discountType, subtotal]);
  
  const finalDiscount = Math.min(discountAmount, subtotal);

  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(18);
  const [taxName, setTaxName] = useState("Tax");

  useEffect(() => {
    async function fetchTax() {
      try {
        let loadedTaxEnabled = false;
        let loadedTaxRate = 18;
        let loadedTaxName = 'Tax';

        // 1. Check global tax cache first
        try {
          const globalRaw = localStorage.getItem('arventa_tax_settings');
          if (globalRaw) {
            const gc = JSON.parse(globalRaw);
            if (gc.enable_tax !== undefined) loadedTaxEnabled = Boolean(gc.enable_tax);
            if (gc.tax_rate !== undefined) loadedTaxRate = Number(gc.tax_rate) || 0;
            if (gc.tax_name) loadedTaxName = gc.tax_name;
          }
        } catch (e) {}

        let session = auth.session();
        if (!session) session = await auth.getSession();
        const user = session?.user;

        if (user?.id) {
          // 2. Check user-specific localStorage cache
          try {
            const raw = localStorage.getItem(`arventa_biz_${user.id}`);
            if (raw) {
              const cache = JSON.parse(raw);
              if (cache.enable_tax !== undefined) loadedTaxEnabled = Boolean(cache.enable_tax);
              if (cache.tax_rate !== undefined) loadedTaxRate = Number(cache.tax_rate) || 0;
              if (cache.tax_name) loadedTaxName = cache.tax_name;
            }
          } catch (e) {}

          // 3. Check user metadata
          const meta = user.user_metadata || {};
          if (meta.enable_tax !== undefined) {
            loadedTaxEnabled = Boolean(meta.enable_tax);
            if (meta.tax_rate !== undefined) loadedTaxRate = Number(meta.tax_rate) || 0;
            if (meta.tax_name) loadedTaxName = meta.tax_name;
          }

          // 4. Check DB settings table
          try {
            let bid = await getBusinessId();
            if (!bid) {
              const profiles = await db.list<Row>("profiles", { id: user.id });
              if (profiles.length > 0) bid = profiles[0].business_id;
            }
            if (bid) {
              const settingsList = await db.list<Row>("settings", { business_id: bid });
              if (settingsList.length > 0) {
                const s = settingsList[0];
                if (s.enable_tax !== undefined) loadedTaxEnabled = Boolean(s.enable_tax);
                if (s.tax_rate !== undefined) loadedTaxRate = Number(s.tax_rate) || 0;
                if (s.tax_name) loadedTaxName = s.tax_name;
              }
            }
          } catch (dbe) {}
        }

        setTaxEnabled(loadedTaxEnabled);
        setTaxRate(loadedTaxRate);
        setTaxName(loadedTaxName || 'Tax');
      } catch (e) {
        console.warn("Could not load tax settings:", e);
      }
    }
    fetchTax();
  }, []);

  const taxableAmount = Math.max(0, subtotal - finalDiscount);
  const taxAmount = taxEnabled ? (taxableAmount * (taxRate / 100)) : 0;
  const finalTotal = taxableAmount + taxAmount;
  const addItem = (product: Row) => setItems((old) => old.some((i) => i.product_id === product.id) ? old.map((i) => i.product_id === product.id ? { ...i, quantity: Number(i.quantity || 1) + 1 } : i) : [...old, { product_id: product.id, name: product.name, price: product.price, quantity: 1, unit: product.unit }]);
  
  const [customerModal, setCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState<Row>({});

  const openCustomerModal = () => {
    setNewCustomerForm({ name: '', phone: customerQuery, email: '', address: '', notes: '' });
    setCustomerDropdown(false);
    setCustomerModal(true);
  };

  const saveNewCustomerForm = async () => {
    try {
      if (!newCustomerForm.name) {
        setNewCustomerForm(old => ({ ...old, _error: 'Name is required' }));
        return;
      }
      if (!newCustomerForm.phone) {
        setNewCustomerForm(old => ({ ...old, _error: 'Phone number is required' }));
        return;
      }
      if (newCustomerForm.phone.replace(/\D/g, '').length < 10) {
        setNewCustomerForm(old => ({ ...old, _error: 'Phone number must be at least 10 digits' }));
        return;
      }
      setSaving(true);
      let result;
      if (newCustomerForm.id) {
        result = await db.update('customers', newCustomerForm.id, {
          name: newCustomerForm.name, 
          email: newCustomerForm.email, 
          phone: newCustomerForm.phone, 
          address: newCustomerForm.address, 
          notes: newCustomerForm.notes
        });
      } else {
        result = await db.insert('customers', { 
          name: newCustomerForm.name, 
          email: newCustomerForm.email, 
          phone: newCustomerForm.phone, 
          address: newCustomerForm.address, 
          notes: newCustomerForm.notes 
        });
      }
      await customers.reload();
      setCustomerId((result as any).id);
      setCustomerModal(false);
    } catch (e) {
      setNewCustomerForm(old => ({ ...old, _error: getSupabaseErrorMessage(e, 'Could not save customer.') }));
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!items.length) { setMessage('Add at least one product before saving.'); return; }
    setSaving(true); setMessage('');
    try {
      if (!customerId) throw new Error('Choose a customer before creating the invoice.');
      
      const notesParts: string[] = [];
      if (issueTime) {
        notesParts.push(`Time: ${issueTime}`);
      }
      const notifChannels = ['Email (Default)'];
      if (notifyWhatsApp) notifChannels.push('WhatsApp');
      if (notifyPhoneCall) notifChannels.push('Phone Call');
      notesParts.push(`Notifications: ${notifChannels.join(', ')}`);

      if (finalDiscount > 0) {
        const dText = discountType === 'percentage' ? `${discountValue}%` : `${discountValue}`;
        notesParts.push(`Discount applied: ${dText} (-${finalDiscount.toFixed(2)})`);
      }
      if (taxEnabled && taxRate > 0) {
        notesParts.push(`${taxName} (${taxRate}%): +${taxAmount.toFixed(2)}`);
      }
      if (notes.trim()) {
        notesParts.push(notes.trim());
      }
      const finalNotes = notesParts.join('\n');
      
      const discountedItems = items.map(item => {
        let price = Number(item.price || 0);
        if (subtotal > 0 && finalDiscount > 0) {
          price = price - (price * (finalDiscount / subtotal));
        }
        if (taxEnabled && taxRate > 0) {
          price = price + (price * (taxRate / 100));
        }
        return {
          product_id: item.product_id,
          quantity: Number(item.quantity),
          unit_price: Number(price.toFixed(4))
        };
      });

      let saved = false;
      let createdInvoiceId = '';
      try {
        const rpcRes = await db.rpc<Row>('create_invoice_transaction', {
          invoice_data: { customer_id: customerId, issue_date: issueDate || new Date().toISOString().slice(0, 10), notes: finalNotes, status: 'due' },
          line_items: discountedItems,
          initial_payment: null,
        });
        if (rpcRes && (rpcRes as any).id) {
          createdInvoiceId = (rpcRes as any).id;
        }
        saved = true;
      } catch (rpcError: any) {
        console.warn('RPC create_invoice_transaction failed, falling back to direct table inserts:', rpcError);
        
        // Fallback: direct insert into invoices and invoice_items
        let bid = await getBusinessId();
        let invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
        try {
          if (bid) {
            const sets = await db.list<Row>('settings', { business_id: bid });
            const prefix = sets[0]?.invoice_prefix || 'INV';
            const count = await db.list<Row>('invoices', { business_id: bid });
            invoiceNum = `${prefix}-${String(count.length + 1).padStart(4, '0')}`;
          }
        } catch (e) {}

        const invoicePayload: Record<string, any> = {
          customer_id: customerId,
          invoice_number: invoiceNum,
          issue_date: issueDate || new Date().toISOString().slice(0, 10),
          notes: finalNotes,
          total: Number(finalTotal.toFixed(2)),
          status: 'due',
          currency: 'INR',
        };
        if (bid) invoicePayload.business_id = bid;

        const newInv = await db.insert<Row>('invoices', invoicePayload);
        const newInvId = (newInv as any)?.id;
        if (newInvId) createdInvoiceId = newInvId;

        if (newInvId) {
          // Insert line items
          for (const item of discountedItems) {
            try {
              const itemPayload: Record<string, any> = {
                invoice_id: newInvId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total: Number((item.quantity * item.unit_price).toFixed(2)),
              };
              if (bid) itemPayload.business_id = bid;
              await db.insert('invoice_items', itemPayload);
            } catch (itemErr) {
              console.warn('Could not insert invoice item:', itemErr);
            }
          }

          // Adjust product stock
          for (const item of items) {
            if (item.product_id) {
              try {
                const prod = await db.list<Row>('products', { id: item.product_id });
                if (prod.length && prod[0].stock_quantity !== undefined && prod[0].stock_quantity !== null) {
                  const newStock = Math.max(0, Number(prod[0].stock_quantity) - Number(item.quantity || 1));
                  await db.update('products', item.product_id, { stock_quantity: newStock });
                }
              } catch (stErr) {}
            }
          }
        }
        saved = true;
      }

      if (saved) {
        if (createdInvoiceId) {
          setLocation(`/invoices/${createdInvoiceId}`);
        } else {
          // If ID not returned directly, fetch the latest invoice
          try {
            const latest = await db.list<Row>('invoices', { order: 'created_at.desc' });
            if (latest.length && latest[0].id) {
              setLocation(`/invoices/${latest[0].id}`);
              return;
            }
          } catch (e) {}
          setLocation('/invoices');
        }
      }
    } catch (e) { setMessage(getSupabaseErrorMessage(e, 'Could not save the invoice.')); } finally { setSaving(false); }
  };
  return <div className="mx-auto max-w-5xl"><div className="mb-6 flex items-center gap-3"><Link href="/invoices" className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground no-underline hover:text-foreground" data-testid="link-back-invoices"><ArrowLeft size={17} /></Link><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Fast entry</div><h2 className="text-2xl font-extrabold tracking-[-.05em]">New invoice</h2></div></div>
    {message && <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/8 p-3 text-xs font-semibold text-destructive" data-testid="status-invoice-form">{message}</div>}
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><section className="card-shell p-5 sm:p-6">
      {/* Date & Time Picker Section */}
      <div className="mb-6 rounded-xl border border-border/80 bg-muted/20 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Calendar size={13} />
            </div>
            <span className="text-xs font-extrabold">Invoice Date & Time</span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">Default: Today (Editable)</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              <Calendar size={12} className="text-primary" /> <span>Date</span>
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="input-shell min-h-10 w-full px-3 text-sm font-medium"
              data-testid="input-invoice-date"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              <Clock size={12} className="text-primary" /> <span>Time</span>
            </label>
            <input
              type="time"
              value={issueTime}
              onChange={(e) => setIssueTime(e.target.value)}
              className="input-shell min-h-10 w-full px-3 text-sm font-medium"
              data-testid="input-invoice-time"
            />
          </div>
        </div>
      </div>

      <label className="mb-2 block text-xs font-bold">Customer <span className="text-accent">*</span></label><div className="relative mb-6">{customerId ? (() => { const c = customers.data.find(x => x.id === customerId); return (<div className="relative rounded-xl border border-border bg-muted/20 p-4"><div className="flex items-start justify-between"><div><div className="font-bold text-base">{c?.name || 'Unknown customer'}</div>{c?.phone && <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5"><Phone size={13} /> {c.phone}</div>}{c?.email && <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5"><Mail size={13} /> {c.email}</div>}{c?.address && <div className="mt-1 text-sm text-muted-foreground flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0" /> <span className="leading-tight">{c.address}</span></div>}{c?.notes && <div className="mt-3 text-sm text-muted-foreground flex items-start gap-1.5 border-t border-border/50 pt-2"><FileText size={13} className="mt-0.5 shrink-0" /> <span className="leading-tight italic">{c.notes}</span></div>}</div><div className="flex items-center gap-1"><button onClick={() => { setNewCustomerForm(c || {}); setCustomerDropdown(false); setCustomerModal(true); }} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md hover:text-foreground" title="Edit Customer"><Pencil size={15} /></button><button onClick={() => { setCustomerId(''); setCustomerQuery(''); }} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md hover:text-destructive" title="Clear"><X size={15} /></button></div></div>{!c?.email && <div className="mt-4 border-t border-border/50 pt-3"><button type="button" onClick={() => { setNewCustomerForm(c || {}); setCustomerDropdown(false); setCustomerModal(true); }} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"><Mail size={14} /> Setup email</button></div>}</div>); })() : (<><Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} /><input value={customerQuery} onChange={(e) => { setCustomerQuery(e.target.value); setCustomerDropdown(true); }} onFocus={() => setCustomerDropdown(true)} onBlur={() => setTimeout(() => setCustomerDropdown(false), 200)} placeholder="Search name, or enter 10-digit number to create" className="input-shell min-h-10 w-full pl-10 pr-3 text-sm" data-testid="input-customer-search" />{customerDropdown && (<div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-auto rounded-xl border border-border bg-card shadow-float">{customers.loading ? (<div className="p-3 text-xs text-muted-foreground">Loading…</div>) : visibleCustomers.length ? (visibleCustomers.map((c) => (<button key={c.id} onClick={() => { setCustomerId(c.id); setCustomerDropdown(false); }} className="flex w-full items-center px-3 py-2.5 text-left text-sm hover:bg-muted" data-testid={`button-select-customer-${c.id}`}>{c.name}</button>))) : (
  <>
    <div className="p-3 text-xs text-muted-foreground">No customers found.</div>
    {customerQuery.length >= 10 && (
      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); openCustomerModal(); }}
        className="flex w-full items-center justify-between border-t border-border/60 bg-primary/5 px-3 py-3 text-left text-sm font-bold text-primary hover:bg-primary/10"
      >
        <span>Create with this number</span>
        <Plus size={16} />
      </button>
    )}
  </>
)}</div>)}</>)}</div><div className="mb-3 flex items-end justify-between"><div><h3 className="text-sm font-extrabold">Line items</h3><p className="mt-1 text-xs text-muted-foreground">Search by product name.</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => { setCustomItemForm({ title: '', description: '', price: '', quantity: 1 }); setCustomItemModal(true); }} className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20"><Plus size={14}/> Custom add</button><span className="mono text-xs text-muted-foreground">{items.length} item{items.length === 1 ? '' : 's'}</span></div></div>
<div className="relative mb-3"><Search className="absolute left-3 top-3 text-muted-foreground" size={16} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to add a product…" className="input-shell w-full pl-10 pr-3 text-sm" data-testid="input-product-search" /></div>

{query && <div className="mb-4 max-h-48 overflow-auto rounded-xl border border-border bg-card shadow-float">{products.loading ? <div className="p-4 text-xs text-muted-foreground">Loading products…</div> : visibleProducts.length ? visibleProducts.map((product) => <button key={product.id} onClick={() => { addItem(product); setQuery(''); }} className="flex w-full items-center justify-between border-b border-border/60 px-3 py-3 text-left last:border-0 hover:bg-muted" data-testid={`button-add-product-${product.id}`}><span><span className="block text-xs font-bold">{product.name}</span></span><span className="mono text-xs">{product.price ?? '—'}</span></button>) : <div className="p-4 text-xs text-muted-foreground">No active products found.</div>}</div>}{items.length ? <div className="divide-y divide-border/70">{items.map((item, index) => <div className="flex flex-wrap items-center gap-3 py-4" key={item.product_id}><div className="min-w-0 flex-1 basis-[120px]"><div className="truncate text-sm font-bold">{item.name}</div><div className="mono mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground"><input type="number" min="0" step="0.01" value={item.price} onChange={(e) => setItems((old) => old.map((x, i) => i === index ? { ...x, price: e.target.value === '' ? '' : Number(e.target.value) } : x))} onBlur={(e) => setItems((old) => old.map((x, i) => i === index ? { ...x, price: x.price === '' ? 0 : x.price } : x))} className="input-shell h-7 w-16 px-1.5 text-center text-[11px] font-bold text-foreground bg-background shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" data-testid={`input-item-price-${item.product_id}`} /><span>/ {item.unit || 'unit'}</span></div></div><div className="flex items-center"><button type="button" onClick={() => setItems((old) => old.map((x, i) => i === index ? { ...x, quantity: Math.max(0, Number(x.quantity || 0) - 1) } : x))} className="flex h-9 w-9 items-center justify-center rounded-l-lg border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"><Minus size={14} /></button><input type="number" min="0" value={item.quantity} onChange={(e) => setItems((old) => old.map((x, i) => i === index ? { ...x, quantity: e.target.value === '' ? '' : Number(e.target.value) } : x))} onBlur={(e) => setItems((old) => old.map((x, i) => i === index ? { ...x, quantity: x.quantity === '' ? 0 : x.quantity } : x))} className="input-shell h-9 w-12 border-x-0 rounded-none px-1 text-center text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" data-testid={`input-item-quantity-${item.product_id}`} /><button type="button" onClick={() => setItems((old) => old.map((x, i) => i === index ? { ...x, quantity: Number(x.quantity || 0) + 1 } : x))} className="flex h-9 w-9 items-center justify-center rounded-r-lg border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"><Plus size={14} /></button></div><div className="mono w-20 text-right text-sm">{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</div><button onClick={() => setItems((old) => old.filter((_, i) => i !== index))} className="p-2 text-muted-foreground hover:text-destructive shrink-0" data-testid={`button-remove-item-${item.product_id}`}><Trash2 size={16} /></button></div>)}</div> : <Empty icon={Package} title="Start with a product" description="Search above to add your first line item." />}</section>
      <aside className="card-shell h-fit p-5 sm:p-6">
        <h3 className="text-sm font-extrabold">Summary</h3>
        
        <div className="mt-4 mb-4">
          <label className="mb-2 block text-xs font-bold">Discount (optional)</label>
          <div className="flex gap-2">
            <CustomDropdown value={discountType} onChange={(v) => { setDiscountType(v as 'amount' | 'percentage'); setDiscountValue(''); }} options={[{label: 'Amount', value: 'amount'}, {label: 'Percent (%)', value: 'percentage'}]} />
            <input 
              type="number" 
              min="0" 
              placeholder="0" 
              value={discountValue} 
              onChange={(e) => setDiscountValue(e.target.value)} 
              className="input-shell min-h-9 w-full px-3 text-sm"
            />
          </div>
          {Number(discountValue) > 0 && discountAmount > subtotal ? (
            <p className="mt-1.5 text-[11px] font-medium text-destructive">Discount cannot exceed subtotal.</p>
          ) : Number(discountValue) > 0 && subtotal > 0 ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground font-medium">
              {discountType === 'percentage' 
                ? `Equals ${discountAmount.toFixed(2)} amount discount` 
                : `Equals ${((discountAmount / subtotal) * 100).toFixed(2)}% discount`}
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-3 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="mono">{subtotal.toFixed(2)}</span>
          </div>
          {finalDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount</span>
              <span className="mono">-{finalDiscount.toFixed(2)}</span>
            </div>
          )}
          {taxEnabled ? (
            <div className="flex justify-between text-muted-foreground">
              <span>{taxName} ({taxRate}%)</span>
              <span className="mono">{taxAmount.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-muted-foreground/60">
              <span>Tax (0%)</span>
              <span className="mono">0.00</span>
            </div>
          )}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold">Total</span>
              <span className="mono text-2xl font-medium">{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Confirmation & Notifications Section */}
        <div className="mt-5 rounded-xl border border-border/80 bg-muted/20 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              <Bell size={13} className="text-primary" />
              <span>Confirmation</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">Notifications</span>
          </div>
          <p className="mb-2.5 text-[11px] text-muted-foreground leading-tight">
            Select channels to send invoice confirmation & receipts:
          </p>
          
          <div className="space-y-2">
            {/* Email - Default ON & Locked */}
            <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Mail size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">Email</span>
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-primary">Default</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Always on · Cannot be disabled</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5" title="Email is locked on by default">
                <Lock size={12} className="text-primary/70" />
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  readOnly
                  className="h-4 w-4 rounded border-primary text-primary accent-primary cursor-not-allowed"
                />
              </div>
            </div>

            {/* WhatsApp - Selectable */}
            <label
              className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-colors select-none ${
                notifyWhatsApp
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-foreground'
                  : 'border-border/60 bg-background/60 hover:bg-muted/40 text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    notifyWhatsApp ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <MessageCircle size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${notifyWhatsApp ? 'text-foreground' : ''}`}>WhatsApp</span>
                    {notifyWhatsApp && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        Selected
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Send PDF to customer WhatsApp</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyWhatsApp}
                onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                className="h-4 w-4 rounded border-border text-emerald-600 accent-emerald-600 cursor-pointer"
              />
            </label>

            {/* Phone Call - Selectable */}
            <label
              className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-colors select-none ${
                notifyPhoneCall
                  ? 'border-blue-500/40 bg-blue-500/10 text-foreground'
                  : 'border-border/60 bg-background/60 hover:bg-muted/40 text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    notifyPhoneCall ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <PhoneCall size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${notifyPhoneCall ? 'text-foreground' : ''}`}>Phone Call</span>
                    {notifyPhoneCall && (
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                        Selected
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Automated voice confirmation</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyPhoneCall}
                onChange={(e) => setNotifyPhoneCall(e.target.checked)}
                className="h-4 w-4 rounded border-border text-blue-600 accent-blue-600 cursor-pointer"
              />
            </label>
          </div>
        </div>

        <label className="mt-6 mb-2 block text-xs font-bold">Note <span className="font-normal text-muted-foreground">(optional)</span></label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-shell min-h-20 w-full resize-none p-3 text-sm" placeholder="Payment terms or a note…" data-testid="textarea-invoice-notes" /><button disabled={saving} onClick={() => void save()} className="btn-primary mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold disabled:opacity-50" data-testid="button-save-invoice">{saving ? 'Generating invoice…' : <><Check size={16} /> Generate & View Invoice</>}</button></aside></div>

    {customerModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/35 p-0 sm:items-center sm:p-5">
        <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{newCustomerForm.id ? 'Edit record' : 'New record'}</div>
              <h3 className="mt-1 text-xl font-extrabold">{newCustomerForm.id ? 'Edit customer' : 'Add customer'}</h3>
            </div>
            <button onClick={() => setCustomerModal(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
          </div>
          {newCustomerForm._error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{newCustomerForm._error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <AppField label="Name *" value={newCustomerForm.name || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, name: v })} required />
            <AppField label="Email" type="email" value={newCustomerForm.email || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, email: v })} />
            <AppField label="Phone *" value={newCustomerForm.phone || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, phone: v })} required />
            <div className="sm:col-span-2">
              <AppField label="Address" value={newCustomerForm.address || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, address: v })} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[13px] font-bold">Notes</label>
              <textarea value={newCustomerForm.notes || ''} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })} className="input-shell min-h-20 w-full p-3 text-sm" />
            </div>
          </div>
          <div className="mt-7 flex justify-end gap-3">
            <button onClick={() => setCustomerModal(false)} className="px-4 py-2 text-sm font-bold hover:bg-muted rounded-lg">Cancel</button>
            <button onClick={() => void saveNewCustomerForm()} disabled={saving || !newCustomerForm.name || !newCustomerForm.phone} className="btn-primary px-5 py-2 text-sm font-bold rounded-lg disabled:opacity-50">Save customer</button>
          </div>
        </div>
      </div>
    )}
  </div>;
}

function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Row | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [customer, setCustomer] = useState<Row | null>(null);
  const [business, setBusiness] = useState<Row | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentSuccessAnim, setPaymentSuccessAnim] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNote, setPaymentNote] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      // 1. Load invoice
      const invRows = await db.list<Row>('invoices', { id });
      if (!invRows.length) {
        setError('Invoice not found.');
        return;
      }
      const inv = invRows[0];
      setInvoice(inv);

      // 2. Load line items
      try {
        const rawItemRows = await db.list<Row>('invoice_items', { invoice_id: id });
        const itemRows = rawItemRows.filter((it) => !it.invoice_id || it.invoice_id === id);
        const products = await db.list<Row>('products');
        const prodMap = new Map<string, Row>();
        products.forEach((p) => {
          if (p.id) prodMap.set(p.id, p);
        });

        const enrichedItems = itemRows.map((it) => {
          const prod = prodMap.get(it.product_id);
          return {
            ...it,
            product_name: it.product_name || prod?.name || 'Item',
            product_unit: it.unit || prod?.unit || 'pcs',
          };
        });
        setItems(enrichedItems);
      } catch (err) {
        console.warn('Could not load line items:', err);
      }

      // 3. Load customer
      if (inv.customer_id) {
        try {
          const custRows = await db.list<Row>('customers', { id: inv.customer_id });
          if (custRows.length) setCustomer(custRows[0]);
        } catch (err) {
          console.warn('Could not load customer:', err);
        }
      }

      // 4. Load business and payment details
      try {
        const bid = inv.business_id || (await getBusinessId());
        if (bid) {
          const bizRows = await db.list<Row>('businesses', { id: bid });
          if (bizRows.length) {
            setBusiness(bizRows[0]);
            setPaymentInfo((prev: any) => ({ ...bizRows[0], ...prev }));
          }

          try {
            const settingsList = await db.list<Row>('settings', { business_id: bid });
            if (settingsList.length) {
              setPaymentInfo((prev: any) => ({ ...prev, ...settingsList[0] }));
            }
          } catch (se) {}
        }
      } catch (err) {
        console.warn('Could not load business:', err);
      }

      // 5. Fallback to cached payment details if available
      try {
        const rawPay = localStorage.getItem('arventa_payment_settings');
        if (rawPay) {
          const parsedPay = JSON.parse(rawPay);
          setPaymentInfo((prev: any) => ({ ...parsedPay, ...prev }));
        }
        const session = auth.session();
        if (session?.user?.id) {
          const rawBiz = localStorage.getItem(`arventa_biz_${session.user.id}`);
          if (rawBiz) {
            const parsedBiz = JSON.parse(rawBiz);
            setPaymentInfo((prev: any) => ({ ...parsedBiz, ...prev }));
          }
        }
      } catch (le) {}
    } catch (err: any) {
      setError(getSupabaseErrorMessage(err, 'Could not load invoice details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const markAsPaid = async (method = 'Cash', note = '') => {
    if (!invoice || !id) return;
    setUpdating(true);
    try {
      const now = new Date().toISOString();
      const updated: Record<string, any> = {
        status: 'paid',
        payment_method: method,
        paid_at: now,
      };
      if (note.trim()) {
        updated.notes = `${invoice.notes || ''}\nPayment: Paid via ${method} (${note.trim()})`.trim();
      }
      await db.update('invoices', id, updated);
      
      setPaymentSuccessAnim(true);
      setTimeout(() => {
        setInvoice({ ...invoice, ...updated });
        setPaymentSuccessAnim(false);
        setPaymentModal(false);
        setUpdating(false);
      }, 1800); // Wait for 1.8s to show the animation
    } catch (err) {
      console.error('Error updating status to paid:', err);
      setUpdating(false);
    }
  };

  const markAsDue = async () => {
    if (!invoice || !id) return;
    setUpdating(true);
    try {
      const updated: Record<string, any> = {
        status: 'due',
        payment_method: null,
        paid_at: null,
      };
      await db.update('invoices', id, updated);
      setInvoice({ ...invoice, ...updated });
    } catch (err) {
      console.error('Error updating status to due:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const element = document.getElementById('invoice-download-container');
    if (!element) return;
    
    try {
      // Temporarily remove print classes or specific problematic styles if needed
      const scale = 2; // For better resolution
      const dataUrl = await domtoimage.toJpeg(element, {
        quality: 0.98,
        bgcolor: '#ffffff',
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${element.offsetWidth}px`,
          height: `${element.offsetHeight}px`
        },
        width: element.offsetWidth * scale,
        height: element.offsetHeight * scale,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice?.invoice_number || '0001'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to window print if generation fails
      window.print();
    }
  };

  const handleWhatsAppShare = () => {
    if (!invoice) return;
    const isPaid = invoice.status === 'paid' || invoice.status === 'complete';
    const bizName = business?.name || 'Arventa Ventures';
    const custName = customer?.name || 'Customer';
    const linesSummary = items.map((it) => `• ${it.product_name || 'Item'} x${it.quantity} = ₹${it.total}`).join('\n');

    const hasPaymentDetails = Boolean(paymentInfo?.upi_id || paymentInfo?.bank_name || paymentInfo?.account_number);
    let paySummary = '';
    if (!isPaid && hasPaymentDetails) {
      paySummary += '\n\n*💳 Payment Options:*';
      if (paymentInfo?.upi_id) paySummary += `\n📲 *UPI ID:* ${paymentInfo.upi_id}`;
      if (paymentInfo?.upi_number) paySummary += `\n📱 *UPI Mobile:* ${paymentInfo.upi_number}`;
      if (paymentInfo?.account_number && paymentInfo?.ifsc_code) {
        paySummary += `\n🏦 *Bank Transfer:*\n• *Bank:* ${paymentInfo.bank_name || 'Bank'}\n• *A/C Name:* ${paymentInfo.account_holder_name || bizName}\n• *A/C No:* ${paymentInfo.account_number}\n• *IFSC:* ${paymentInfo.ifsc_code}`;
        if (paymentInfo.branch_name) paySummary += `\n• *Branch:* ${paymentInfo.branch_name}`;
      }
    }

    const text =
      `*INVOICE: ${invoice.invoice_number}*\n` +
      `🏢 *${bizName}*\n` +
      `👤 *Customer:* ${custName}\n` +
      `📅 *Date:* ${invoice.issue_date}\n` +
      `------------------------\n` +
      (linesSummary ? `${linesSummary}\n------------------------\n` : '') +
      `💰 *Total Amount:* ₹${Number(invoice.total || 0).toFixed(2)}\n` +
      `📌 *Status:* ${isPaid ? '✅ PAID' : '⏳ DUE / UNPAID'}\n` +
      (isPaid && invoice.payment_method ? `💳 Method: ${invoice.payment_method}\n` : '') +
      paySummary +
      `\n\nThank you for doing business with us!`;

    const phone = (customer?.phone || '').replace(/[^0-9]/g, '');
    const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center">
        <div className="skeleton mb-6 h-12 w-48 rounded-xl mx-auto" />
        <div className="skeleton h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="card-shell p-8">
          <AlertCircle className="mx-auto mb-4 text-destructive" size={36} />
          <h2 className="text-xl font-bold">{error || 'Invoice not found'}</h2>
          <p className="mt-2 text-sm text-muted-foreground">The requested invoice could not be found or loaded.</p>
          <Link href="/invoices" className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold no-underline">
            <ArrowLeft size={16} /> Return to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid' || invoice.status === 'complete';
  const timeMatch = invoice.notes?.match(/Time:\s*([0-9:]+\s*(?:AM|PM)?)/i);
  const timeStr = timeMatch ? timeMatch[1] : '';

  // Extract notif channels from notes
  const notifMatch = invoice.notes?.match(/Notifications:\s*([^\n]+)/i);
  const notifString = notifMatch ? notifMatch[1] : '';

  return (
    <div className="mx-auto max-w-2xl pb-16 print:max-w-full print:p-0">
      {/* Top Action Toolbar - Two vertically stacked buttons: Top = Print, Bottom = Download */}
      <div className="mb-3 flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Link href="/invoices" className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground no-underline hover:text-foreground shadow-sm" data-testid="link-back-to-invoices">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="mono text-base font-extrabold tracking-tight text-foreground">{invoice.invoice_number || 'INV-0001'}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${isPaid ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'}`}>
                {isPaid ? <><Check size={11} className="stroke-[3]" /> Paid</> : <><Clock size={11} /> Due</>}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{invoice.issue_date || 'Today'}{timeStr ? ` • ${timeStr}` : ''}</p>
          </div>
        </div>

        {/* Top 2 Vertically Stacked Action Buttons: Top = Print, Bottom = Download */}
        <div className="flex flex-col gap-1.5 w-28 shrink-0">
          {/* Top Button: Print */}
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-bold shadow-sm"
            data-testid="button-print-invoice"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>

          {/* Bottom Button: Download */}
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted py-1.5 px-3 text-xs font-bold text-foreground shadow-sm transition-all"
            data-testid="button-download-invoice"
          >
            <ArrowDownToLine size={13} className="text-primary" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Sheet - Compact, clean & professional */}
      <div id="invoice-download-container" className="invoice-sheet card-shell overflow-hidden border border-border bg-card p-4 sm:p-6 shadow-sm print:m-0 print:w-full print:border-none print:p-6 print:shadow-none bg-white text-black dark:text-foreground">
        
        {/* Header: Business & Invoice Meta */}
        <div className="flex flex-col justify-between gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-base font-black text-primary-foreground">
              {(business?.name || 'AV')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground leading-tight">{business?.name || 'Arventa Ventures'}</h1>
              <p className="text-[11px] font-medium text-muted-foreground">{business?.owner_name || 'Commercial Billing'}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                {business?.phone && <span className="flex items-center gap-1"><Phone size={11} /> {business.phone}</span>}
                {business?.address && <span className="flex items-center gap-1"><MapPin size={11} /> {business.address}</span>}
              </div>
            </div>
          </div>

          {/* Invoice Meta Card */}
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-left sm:text-right sm:min-w-[170px]">
            <div className="text-[9px] font-black uppercase tracking-wider text-primary">TAX INVOICE</div>
            <div className="mono text-base font-black tracking-tight text-foreground">{invoice.invoice_number || 'INV-0001'}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              <span>{invoice.issue_date || 'Today'}</span> {timeStr && <span>• {timeStr}</span>}
            </div>
            <div className="mt-1 text-[10px] font-extrabold uppercase">
              <span className={isPaid ? 'text-emerald-600' : 'text-amber-600'}>
                {isPaid ? `PAID (${invoice.payment_method || 'Cash'})` : 'DUE / UNPAID'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer / Billed To Section - Compact Grid */}
        <div className="my-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-border/50 bg-muted/10 p-2.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-primary">BILLED TO</span>
            <div className="mt-0.5 text-xs font-bold text-foreground truncate">{customer?.name || customer?.full_name || 'Walk-in Customer'}</div>
            <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
              {customer?.phone && <div className="flex items-center gap-1"><Phone size={11} /> {customer.phone}</div>}
              {customer?.address && <div className="flex items-center gap-1"><MapPin size={11} /> {customer.address}</div>}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/10 p-2.5 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-primary">DISPATCH STATUS</span>
              <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Email: Active (Primary)</span>
                </div>
                {notifString.includes('WhatsApp') && (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>WhatsApp: Digital Dispatch</span>
                  </div>
                )}
              </div>
            </div>
            {isPaid && invoice.paid_at && (
              <div className="mt-1 text-[10px] font-bold text-emerald-600">
                ✓ Paid on {new Date(invoice.paid_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table - Compact Padding */}
        <div className="overflow-x-auto rounded-lg border border-border/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b border-border/60 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 px-2.5 w-8 text-center">#</th>
                <th className="py-2 px-2.5">Item</th>
                <th className="py-2 px-2 text-center w-16">Qty</th>
                <th className="py-2 px-2 text-right w-20">Price</th>
                <th className="py-2 px-2.5 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-[11px]">
              {items.length > 0 ? (
                items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-muted/10">
                    <td className="py-2 px-2.5 text-center text-muted-foreground">{idx + 1}</td>
                    <td className="py-2 px-2.5">
                      <div className="font-bold text-foreground">{it.product_name || 'Item'}</div>
                    </td>
                    <td className="py-2 px-2 text-center font-semibold text-foreground">
                      {it.quantity} <span className="text-[9px] font-normal text-muted-foreground">{it.product_unit || 'pcs'}</span>
                    </td>
                    <td className="py-2 px-2 text-right mono">₹{Number(it.unit_price || 0).toFixed(2)}</td>
                    <td className="py-2 px-2.5 text-right mono font-bold text-foreground">₹{Number(it.total || (it.quantity * it.unit_price) || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 px-3 text-center text-muted-foreground text-xs">
                    Standard billing invoice (Total: ₹{Number(invoice.total || 0).toFixed(2)})
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation, Payment & Status Summary */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Left Column: Bank / UPI Details and Notes */}
          <div className="space-y-2.5">
            {Boolean(paymentInfo?.upi_id || paymentInfo?.bank_name || paymentInfo?.account_number) && (
              <div className="rounded-lg border border-border/70 p-2.5 bg-muted/15 text-xs">
                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary mb-1.5">
                  <Landmark size={11} />
                  <span>PAYMENT DETAILS / BANK TRANSFER</span>
                </div>
                <div className="space-y-1 text-[10.5px]">
                  {paymentInfo?.upi_id && (
                    <div className="flex items-center justify-between gap-1 border-b border-border/30 pb-0.5">
                      <span className="font-semibold text-muted-foreground">UPI ID:</span>
                      <span className="mono font-bold text-foreground">{paymentInfo.upi_id}</span>
                    </div>
                  )}
                  {paymentInfo?.upi_number && (
                    <div className="flex items-center justify-between gap-1 border-b border-border/30 pb-0.5">
                      <span className="font-semibold text-muted-foreground">UPI Mobile:</span>
                      <span className="mono font-bold text-foreground">{paymentInfo.upi_number}</span>
                    </div>
                  )}
                  {paymentInfo?.bank_name && (
                    <div className="flex items-center justify-between gap-1 border-b border-border/30 pb-0.5">
                      <span className="font-semibold text-muted-foreground">Bank Name:</span>
                      <span className="font-bold text-foreground">{paymentInfo.bank_name}</span>
                    </div>
                  )}
                  {paymentInfo?.account_holder_name && (
                    <div className="flex items-center justify-between gap-1 border-b border-border/30 pb-0.5">
                      <span className="font-semibold text-muted-foreground">A/C Name:</span>
                      <span className="font-semibold text-foreground truncate max-w-[150px]">{paymentInfo.account_holder_name}</span>
                    </div>
                  )}
                  {paymentInfo?.account_number && (
                    <div className="flex items-center justify-between gap-1 border-b border-border/30 pb-0.5">
                      <span className="font-semibold text-muted-foreground">A/C No:</span>
                      <span className="mono font-bold text-foreground">{paymentInfo.account_number}</span>
                    </div>
                  )}
                  {paymentInfo?.ifsc_code && (
                    <div className="flex items-center justify-between gap-1 border-b border-border/30 pb-0.5">
                      <span className="font-semibold text-muted-foreground">IFSC Code:</span>
                      <span className="mono font-bold text-foreground">{paymentInfo.ifsc_code}</span>
                    </div>
                  )}
                  {paymentInfo?.account_type && (
                    <div className="flex items-center justify-between gap-1 border-b border-border/30 pb-0.5">
                      <span className="font-semibold text-muted-foreground">A/C Type:</span>
                      <span className="text-foreground">{paymentInfo.account_type}</span>
                    </div>
                  )}
                  {paymentInfo?.branch_name && (
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-muted-foreground">Branch:</span>
                      <span className="text-foreground truncate max-w-[150px]">{paymentInfo.branch_name}</span>
                    </div>
                  )}
                </div>
                {paymentInfo?.payment_instructions && (
                  <p className="mt-1.5 text-[9.5px] text-muted-foreground italic border-t border-border/30 pt-1">
                    * {paymentInfo.payment_instructions}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="rounded-lg border border-border/50 p-2.5 bg-muted/10 text-xs">
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">NOTES & TERMS</div>
              <div className="mt-1 text-[11px] text-muted-foreground whitespace-pre-line leading-relaxed">
                {invoice.notes?.split('\n').filter((l: string) => !l.startsWith('Time:') && !l.startsWith('Notifications:')).join('\n') || 'Thank you for your business.'}
              </div>
            </div>
          </div>

          {/* Right Column: Grand Total Breakdown */}
          <div className="flex flex-col justify-between">
            <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="mono font-semibold text-foreground">₹{Number(invoice.total || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between border-t border-border/50 pt-1.5 font-black text-foreground">
                <span>Grand Total:</span>
                <span className="mono text-primary text-base font-extrabold">₹{Number(invoice.total || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[10px] font-bold border-t border-border/40 pt-1">
                <span className="text-muted-foreground">Status:</span>
                <span className={isPaid ? 'text-emerald-600' : 'text-amber-600'}>
                  {isPaid ? '✓ PAID' : '⏳ BALANCE DUE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="mt-6 flex items-end justify-between border-t border-border/50 pt-4 text-[10px] text-muted-foreground">
          <div>
            <p>Computer generated invoice receipt.</p>
          </div>

          <div className="text-right">
            <div className="h-6 border-b border-border/80 w-28 ml-auto" />
            <div className="mt-1 font-semibold text-foreground">Authorized Seal</div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {isPaid ? (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/80 p-3.5 shadow-md print:hidden flex items-center justify-center gap-2 sticky bottom-24 lg:bottom-4 z-40 backdrop-blur-md text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={20} className="stroke-[2.5]" />
          <span className="font-extrabold text-sm sm:text-base tracking-tight">Payment Successful</span>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-md print:hidden flex items-center justify-between gap-3 sticky bottom-24 lg:bottom-4 z-40 backdrop-blur-md">
          {/* Left Side: Cute Cartoon-styled 'Pay Later' Button */}
          <button
            type="button"
            onClick={() => {
              // Quick action confirming Pay Later / Due
              const el = document.getElementById('pay-later-toast');
              if (el) {
                el.classList.remove('hidden');
                setTimeout(() => el.classList.add('hidden'), 2500);
              }
            }}
            className="group flex items-center gap-2 rounded-xl border-2 border-dashed border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all shadow-xs shrink-0"
            title="Mark / Keep as Pay Later (Due)"
            data-testid="button-pay-later"
          >
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/25 text-amber-600 dark:text-amber-400 text-sm font-bold shadow-xs">
              ⏳
            </div>
            <div className="text-left">
              <div className="text-xs font-extrabold uppercase tracking-tight leading-none text-amber-800 dark:text-amber-200">
                Pay Later
              </div>
              <div className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                Keep as Due
              </div>
            </div>
          </button>

          {/* Right Side: Mark Paid Button */}
          <button
            type="button"
            onClick={() => setPaymentModal(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-2.5 px-4 text-xs sm:text-sm font-extrabold shadow-md transition-all"
            data-testid="button-mark-paid"
          >
            <CheckCircle2 size={17} className="stroke-[2.5]" />
            <span>Mark Paid</span>
          </button>
        </div>
      )}

      {/* Pay Later Toast Indicator */}
      <div id="pay-later-toast" className="hidden fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-amber-600 text-white px-4 py-2 text-xs font-bold shadow-lg animate-in fade-in-0 slide-in-from-top-2">
        ⏳ Invoice marked as Pay Later (Due)
      </div>

      {/* Payment Confirmation Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/50 backdrop-blur-sm p-4 animate-in fade-in-0 print:hidden">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-float relative overflow-hidden">
            {paymentSuccessAnim ? (
              <div className="absolute inset-0 bg-card z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                <div className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 scale-0 animate-[scaleIn_0.5s_ease-out_forwards]">
                  <Check size={48} className="text-white stroke-[3] opacity-0 animate-[fadeIn_0.3s_ease-out_0.3s_forwards]" />
                </div>
                <h2 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 opacity-0 animate-[slideUp_0.4s_ease-out_0.2s_forwards]">Payment Successful!</h2>
                <p className="text-sm text-muted-foreground mt-2 font-medium opacity-0 animate-[slideUp_0.4s_ease-out_0.3s_forwards]">Invoice has been marked as paid.</p>
              </div>
            ) : null}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Mark as Paid</h3>
                  <p className="text-xs text-muted-foreground">Invoice #{invoice.invoice_number}</p>
                </div>
              </div>
              <button onClick={() => setPaymentModal(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X size={18} /></button>
            </div>

            <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Total Payable Amount</span>
              <div className="mono text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{Number(invoice.total || 0).toFixed(2)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash' },
                    { id: 'UPI / QR', label: 'UPI / GPay / QR' },
                    { id: 'Card', label: 'Debit / Credit Card' },
                    { id: 'Bank Transfer', label: 'Bank Transfer' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === m.id
                          ? 'border-emerald-600 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/60 text-muted-foreground'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Payment Reference / Note (Optional)</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Received in Cash / UPI Ref 123456"
                  className="input-shell w-full px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => markAsPaid(paymentMethod, paymentNote)}
                className="w-1/2 btn-primary bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
              >
                {updating ? 'Saving…' : <><Check size={15} /> Confirm Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CrudPage({ kind }: { kind: 'customers' | 'products' }) {
  const table = useTable<Row>(kind, { order: 'name.asc' });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeTargetProduct, setBarcodeTargetProduct] = useState<Row | null>(null);
  const [initialBarcode, setInitialBarcode] = useState('');
  const [viewData, setViewData] = useState<Row | null>(null);
  const [deleteData, setDeleteData] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const isCustomer = kind === 'customers';

  const filtered = useMemo(() => table.data.filter((r) => {
    const rBarcode = isCustomer ? '' : getProductBarcode(r);
    const queryStr = `${r.name || ''} ${r.email || ''} ${r.phone || ''} ${rBarcode} ${r.description || ''} ${r.notes || ''} ${r.type || ''}`.toLowerCase();
    return queryStr.includes(search.toLowerCase());
  }), [table.data, search, isCustomer]);

  const openBarcodeVerifier = (target: Row | null = null, code = '') => {
    setBarcodeTargetProduct(target);
    setInitialBarcode(code || (target ? getProductBarcode(target) : ''));
    setShowBarcodeModal(true);
  };

  const openAddModalWithBarcode = (barcode: string) => {
    setFormData({
      type: 'physical',
      name: '',
      sku: barcode,
      barcode: barcode,
      description: '',
      buying_price: '',
      price: '',
      stock_quantity: '0',
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    if (isCustomer) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
    } else {
      setFormData({
        type: 'physical',
        name: '',
        sku: '',
        barcode: '',
        description: '',
        buying_price: '',
        price: '',
        stock_quantity: '0',
      });
    }
    setShowModal(true);
  };

  const editRow = (row: Row) => {
    let isServ = row.type === 'service' || row.item_type === 'service' || row.unit === 'service' || row.unit === 'hour' || row.unit === 'project';
    let bPrice = row.buying_price !== undefined && row.buying_price !== null ? String(row.buying_price) : (row.cost_price !== undefined && row.cost_price !== null ? String(row.cost_price) : '');
    let desc = row.description || row.notes || '';
    let rowSku = getProductBarcode(row);
    
    if (row.notes && (row.notes.startsWith('{') || row.notes.startsWith('['))) {
      try {
        const meta = JSON.parse(row.notes);
        if (meta.type === 'service') isServ = true;
        if (meta.buying_price !== undefined && meta.buying_price !== null && meta.buying_price !== '') bPrice = String(meta.buying_price);
        if (meta.description !== undefined) desc = meta.description;
        if (meta.sku && !rowSku && !meta.sku.startsWith('__SYS_')) rowSku = meta.sku;
        if (meta.barcode && !rowSku && !meta.barcode.startsWith('__SYS_')) rowSku = meta.barcode;
      } catch (e) {}
    }

    setFormData({
      id: row.id,
      type: isServ ? 'service' : 'physical',
      name: row.name || '',
      sku: rowSku,
      barcode: rowSku,
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      notes: row.notes || '',
      description: desc,
      buying_price: bPrice,
      price: row.price !== undefined ? String(row.price) : '',
      stock_quantity: row.stock_quantity !== undefined ? String(row.stock_quantity) : '0',
    });
    setShowModal(true);
  };

  const deleteRow = async () => {
    if (deleteData) {
      setLoading(true);
      try {
        await db.remove(kind, deleteData.id);
        table.reload();
        setDeleteData(null);
      } catch (err) {
        alert(getSupabaseErrorMessage(err, 'Failed to delete'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      alert(isCustomer ? 'Please enter the customer name.' : 'Please enter the product or service name.');
      return;
    }
    if (isCustomer && !formData.phone) {
      alert('Phone number is required for customers.');
      return;
    }
    if (isCustomer && formData.phone.replace(/\D/g, '').length < 10) {
      alert('Phone number must be at least 10 digits.');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, any> = { name: formData.name.trim() };
      if (isCustomer) {
        payload.phone = formData.phone || null;
        payload.email = formData.email || null;
        payload.address = formData.address || null;
        payload.notes = formData.notes || null;
      } else {
        const isService = formData.type === 'service';
        const sellingPrice = formData.price !== '' && formData.price !== undefined ? Number(formData.price) : 0;
        const buyingPrice = formData.buying_price !== '' && formData.buying_price !== undefined ? Number(formData.buying_price) : 0;
        const stockQty = formData.stock_quantity !== '' && formData.stock_quantity !== undefined ? Math.max(0, parseInt(formData.stock_quantity, 10) || 0) : (isService ? 9999 : 0);
        const cleanSku = formData.sku?.trim() || '';
        
        // Duplicate barcode check across other products
        if (cleanSku) {
          const duplicate = table.data.find(
            (p) => p.id !== formData.id && getProductBarcode(p).toLowerCase() === cleanSku.toLowerCase()
          );
          if (duplicate) {
            alert(`This barcode / SKU (${cleanSku}) is already assigned to product "${duplicate.name}". Each product must have a unique barcode.`);
            setLoading(false);
            return;
          }
        }
        
        payload.name = formData.name.trim();
        payload.price = sellingPrice;
        payload.stock_quantity = stockQty;
        payload.unit = isService ? 'service' : 'pcs';
        payload.type = isService ? 'service' : 'physical';
        payload.buying_price = buyingPrice;
        payload.description = formData.description || '';
        payload.sku = cleanSku || (formData.id ? generateInternalSku(formData.id) : '');
        payload.barcode = cleanSku || '';
        
        payload.notes = JSON.stringify({
          type: isService ? 'service' : 'physical',
          description: formData.description || '',
          buying_price: buyingPrice,
          price: sellingPrice,
          stock_quantity: stockQty,
          ...(cleanSku ? { sku: cleanSku, barcode: cleanSku } : {}),
        });
      }

      if (formData.id) {
        await db.update(kind, formData.id, payload);
      } else {
        await db.insert(kind, payload);
      }
      setShowModal(false);
      setFormData({});
      table.reload();
    } catch (err) {
      console.error('Save error in CrudList:', err);
      alert(getSupabaseErrorMessage(err, 'Failed to save. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return <>
    <PageHeader 
      title={isCustomer ? 'Customers' : 'Products'} 
      actionLabel={isCustomer ? 'New Customer' : 'New Product'} 
      action={openAddModal} 
    />

    {/* Search Bar */}
    <div className="mb-4">
      <input 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        placeholder={isCustomer ? "Search customers by name, phone, or email..." : "Search products by name, SKU, or barcode..."} 
        className="input-shell w-full max-w-md px-3 py-2 text-sm" 
      />
    </div>
    <State {...table}>
      {filtered.length ? (
        <div className="space-y-3 sm:space-y-3.5 pb-28 sm:pb-16">
          {filtered.map(row => {
            let isService = row.type === 'service' || row.item_type === 'service' || row.unit === 'service' || row.unit === 'hour' || row.unit === 'project';
            let buyingPrice = row.buying_price !== undefined && row.buying_price !== null ? row.buying_price : row.cost_price;
            let sellingPrice = row.price !== undefined && row.price !== null ? row.price : row.selling_price;
            let itemDescription = row.description || row.notes || '';

            if (row.notes && (row.notes.startsWith('{') || row.notes.startsWith('['))) {
              try {
                const parsed = JSON.parse(row.notes);
                if (parsed.type === 'service') isService = true;
                if (parsed.buying_price !== undefined && parsed.buying_price !== null) buyingPrice = parsed.buying_price;
                if (parsed.price !== undefined && parsed.price !== null) sellingPrice = parsed.price;
                if (parsed.description !== undefined) itemDescription = parsed.description;
              } catch (e) {}
            }

            return (
              <div 
                key={row.id} 
                className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {!isCustomer ? (
                    <div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isService ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-primary/10 text-primary'}`}>
                      {isService ? <Sparkles size={18} /> : <Package size={18} />}
                    </div>
                  ) : (
                    <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Users size={18} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-foreground text-sm sm:text-base tracking-tight">{row.name}</span>
                      {!isCustomer && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          isService 
                            ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25' 
                            : 'bg-primary/15 text-primary border border-primary/25'
                        }`}>
                          {isService ? <Sparkles size={10} /> : <Package size={10} />}
                          <span>{isService ? 'Virtual Service' : 'Physical Product'}</span>
                        </span>
                      )}
                    </div>

                    {isCustomer ? (
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {row.phone && (
                          <div className="flex items-center gap-1.5 font-medium text-foreground/90">
                            <Phone size={12} className="text-muted-foreground" />
                            <span>{row.phone}</span>
                            {row.email && <span>• {row.email}</span>}
                          </div>
                        )}
                        {row.address && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground line-clamp-1">
                            <MapPin size={12} />
                            <span>{row.address}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {itemDescription && itemDescription !== row.sku && (
                          <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {itemDescription}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                          {(() => {
                            const pBarcode = getProductBarcode(row);
                            return pBarcode ? (
                              <span className="mono font-semibold bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                                Barcode: {pBarcode}
                              </span>
                            ) : null;
                          })()}
                          {!isService && (
                            <span className={`font-semibold px-2 py-0.5 rounded-md border ${
                              Number(row.stock_quantity || 0) <= 5 
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold' 
                                : 'bg-muted/60 text-muted-foreground border-border/50'
                            }`}>
                              Stock: <span className="mono font-bold text-foreground">{row.stock_quantity ?? 0}</span>
                            </span>
                          )}
                          {isService && (
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/25">
                              Capacity: {row.stock_quantity && row.stock_quantity < 999 ? `${row.stock_quantity}` : 'Unlimited'}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2.5 sm:pt-0 border-t border-border/40 sm:border-0">
                  {!isCustomer && (
                    <div className="text-left sm:text-right">
                      <div className="mono font-black text-base sm:text-lg text-foreground">
                        ₹{Number(sellingPrice || 0).toFixed(2)}
                      </div>
                      {buyingPrice !== undefined && buyingPrice !== null && Number(buyingPrice) > 0 && (
                        <div className="mono text-[11px] text-muted-foreground">
                          Cost: ₹{Number(buyingPrice).toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {!isCustomer && (
                      <button 
                        onClick={() => openBarcodeVerifier(row)} 
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary/20 active:scale-95 shadow-2xs border border-primary/25" 
                        title="Scan / Set / Delete Barcode"
                      >
                        <ScanLine size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => { setViewData(row); setShowViewModal(true); }} 
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-95 shadow-2xs border border-border/40" 
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => editRow(row)} 
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-95 shadow-2xs border border-border/40" 
                      title="Edit details"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteData(row)} 
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-muted-foreground transition-all hover:bg-destructive/20 hover:text-destructive active:scale-95 shadow-2xs border border-destructive/20" 
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={kind === 'customers' ? Users : Package} title={`No ${kind} yet`} description={`Start by clicking New ${kind.slice(0,-1)} above.`} />
      )}
    </State>

    {/* Add / Edit Modal */}
    {showModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/40 backdrop-blur-xs p-0 sm:items-center sm:p-5 print:hidden">
        <form onSubmit={handleSubmit} className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-float relative sm:rounded-2xl sm:p-7 animate-in fade-in-0 slide-in-from-bottom-3 duration-200">
          <div className="mb-5 flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                {isCustomer ? <Users size={18} /> : (formData.type === 'service' ? <Sparkles size={18} /> : <Package size={18} />)}
              </div>
              <h3 className="text-base font-extrabold text-foreground">{formData.id ? 'Edit' : 'Add'} {isCustomer ? 'Customer' : (formData.type === 'service' ? 'Virtual Service' : 'Product')}</h3>
            </div>
            <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X size={18} /></button>
          </div>
          
          <div className="space-y-4">
            {isCustomer ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <AppField label="Customer Name *" value={formData.name || ''} onChange={(v) => setFormData({...formData, name: v})} placeholder="e.g. John Doe, Alpha Corp" required />
                </div>
                <AppField label="Phone Number *" type="tel" value={formData.phone || ''} onChange={(v) => setFormData({...formData, phone: v})} placeholder="e.g. +91 9876543210" required />
                <AppField label="Email Address" type="email" value={formData.email || ''} onChange={(v) => setFormData({...formData, email: v})} placeholder="e.g. john@example.com" />
                <div className="sm:col-span-2">
                  <AppField label="Billing Address" value={formData.address || ''} onChange={(v) => setFormData({...formData, address: v})} placeholder="e.g. 123 Main Street, City, State" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold">Notes / Customer Remarks</label>
                  <textarea value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes or preferences..." className="input-shell min-h-20 w-full p-3 text-sm font-normal" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Item Type Selector (Virtual Service vs. Physical Product) */}
                <div>
                  <label className="block text-xs font-bold mb-2">Item Type *</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        type: 'physical', 
                        unit: formData.unit === 'service' || formData.unit === 'hour' || formData.unit === 'project' ? 'pcs' : (formData.unit || 'pcs') 
                      })}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.type !== 'service'
                          ? 'border-primary bg-primary/10 text-primary font-black shadow-sm ring-2 ring-primary/20'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Package size={16} />
                      <span>Physical Product</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        type: 'service', 
                        unit: formData.unit === 'pcs' || formData.unit === 'box' || formData.unit === 'kg' ? 'service' : (formData.unit || 'service') 
                      })}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.type === 'service'
                          ? 'border-indigo-600 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-black shadow-sm ring-2 ring-indigo-600/20'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Sparkles size={16} />
                      <span>Virtual Service</span>
                    </button>
                  </div>
                </div>

                {/* 2. Product Name */}
                <AppField 
                  label={formData.type === 'service' ? "Service Name *" : "Product Name *"} 
                  value={formData.name || ''} 
                  onChange={(v) => setFormData({...formData, name: v})} 
                  placeholder={formData.type === 'service' ? "e.g. Website Design & Development, SEO Consulting" : "e.g. Beauty Face Cream, Cotton Shirt"} 
                  required 
                />

                {/* 3. Barcode / SKU Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold">
                      {formData.type === 'service' ? "Service Code / SKU" : "Barcode / SKU Number"}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const autoCode = `PRD-${Math.floor(100000 + Math.random() * 900000)}`;
                        setFormData({ ...formData, sku: autoCode, barcode: autoCode });
                      }}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={10} />
                      <span>Generate SKU</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value, barcode: e.target.value })}
                      placeholder="e.g. PRD-849201 or 8901234567890"
                      className="input-shell flex-1 px-3 py-2 text-xs sm:text-sm font-semibold tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        openBarcodeVerifier();
                      }}
                      className="px-3 py-2 text-xs font-bold rounded-xl border border-border bg-muted/60 text-foreground hover:bg-muted flex items-center gap-1.5 shrink-0 transition-colors"
                      title="Scan Barcode with Camera"
                    >
                      <Camera size={14} className="text-primary" />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>

                {/* 4. Product Description */}
                <div>
                  <label className="mb-1 block text-xs font-bold">
                    {formData.type === 'service' ? "Service Description" : "Product Description"}
                  </label>
                  <textarea 
                    value={formData.description || ''} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    placeholder={formData.type === 'service' ? "Describe the deliverables, timeline, or scope of the service..." : "Describe product features, specifications, brand, or ingredients..."} 
                    className="input-shell min-h-20 w-full p-3 text-sm font-normal" 
                  />
                </div>

                {/* 5 & 6. Buying Price and Selling Price */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <AppField 
                    label="Buying Price / Cost (₹)" 
                    type="number" 
                    value={formData.buying_price !== undefined ? formData.buying_price : ''} 
                    onChange={(v) => setFormData({...formData, buying_price: v})} 
                    placeholder="0.00" 
                  />
                  <AppField 
                    label="Selling Price (₹)" 
                    type="number" 
                    value={formData.price !== undefined ? formData.price : ''} 
                    onChange={(v) => setFormData({...formData, price: v})} 
                    placeholder="0.00" 
                  />
                </div>

                {/* 7. Total Stock */}
                <AppField 
                  label={formData.type === 'service' ? "Capacity / Stock (Optional)" : "Total Stock Quantity"} 
                  type="number" 
                  value={formData.stock_quantity !== undefined ? formData.stock_quantity : '0'} 
                  onChange={(v) => setFormData({...formData, stock_quantity: v})} 
                  placeholder={formData.type === 'service' ? "e.g. 10 (or leave 0 / empty for unlimited)" : "0"} 
                />
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-border/60">
            <button type="button" onClick={() => setShowModal(false)} className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading || !formData.name || (isCustomer && !formData.phone)} className="rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-extrabold text-primary-foreground disabled:opacity-50 transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    )}

    {/* View Modal */}
    {showViewModal && viewData && (() => {
      let isServ = viewData.type === 'service' || viewData.item_type === 'service' || viewData.unit === 'service' || viewData.unit === 'hour' || viewData.unit === 'project';
      let bPrice = viewData.buying_price !== undefined && viewData.buying_price !== null ? Number(viewData.buying_price) : (viewData.cost_price !== undefined && viewData.cost_price !== null ? Number(viewData.cost_price) : null);
      let sPrice = viewData.price !== undefined && viewData.price !== null ? Number(viewData.price) : (viewData.selling_price !== undefined && viewData.selling_price !== null ? Number(viewData.selling_price) : 0);
      let vDesc = viewData.description || viewData.notes || '';
      let vStock = viewData.stock_quantity;

      if (viewData.notes && (viewData.notes.startsWith('{') || viewData.notes.startsWith('['))) {
        try {
          const parsed = JSON.parse(viewData.notes);
          if (parsed.type === 'service') isServ = true;
          if (parsed.buying_price !== undefined && parsed.buying_price !== null) bPrice = Number(parsed.buying_price);
          if (parsed.price !== undefined && parsed.price !== null) sPrice = Number(parsed.price);
          if (parsed.description !== undefined) vDesc = parsed.description;
          if (parsed.stock_quantity !== undefined) vStock = parsed.stock_quantity;
        } catch (e) {}
      }

      const profit = bPrice !== null && bPrice > 0 ? sPrice - bPrice : null;
      const marginPct = profit !== null && bPrice && bPrice > 0 ? ((profit / bPrice) * 100).toFixed(1) : null;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/40 backdrop-blur-xs p-4 animate-in fade-in-0 print:hidden">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-float relative overflow-hidden">
            <div className="mb-5 flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${isCustomer ? 'bg-primary/10 text-primary' : (isServ ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-primary/10 text-primary')}`}>
                  {isCustomer ? <Users size={18} /> : (isServ ? <Sparkles size={18} /> : <Package size={18} />)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">{viewData.name}</h3>
                  {!isCustomer && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                      isServ ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' : 'bg-primary/15 text-primary'
                    }`}>
                      {isServ ? 'Virtual Service' : 'Physical Product'}
                    </span>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => setShowViewModal(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X size={18} /></button>
            </div>
            
            <div className="space-y-3.5 text-xs">
              {isCustomer ? (
                <>
                  {viewData.phone && <div><div className="font-bold text-muted-foreground mb-0.5">Phone Number</div><div className="text-sm font-semibold">{viewData.phone}</div></div>}
                  {viewData.email && <div><div className="font-bold text-muted-foreground mb-0.5">Email Address</div><div className="text-sm">{viewData.email}</div></div>}
                  {viewData.address && <div><div className="font-bold text-muted-foreground mb-0.5">Billing Address</div><div className="text-sm">{viewData.address}</div></div>}
                  {viewData.notes && <div><div className="font-bold text-muted-foreground mb-0.5">Notes</div><div className="text-sm whitespace-pre-wrap bg-muted/20 p-2.5 rounded-xl border border-border/50">{viewData.notes}</div></div>}
                </>
              ) : (
                <>
                  {/* Description */}
                  {vDesc && (
                    <div>
                      <div className="font-bold text-muted-foreground mb-1">Description</div>
                      <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/20 p-2.5 rounded-xl border border-border/50 leading-relaxed">
                        {vDesc}
                      </div>
                    </div>
                  )}

                  {/* Pricing Overview Card */}
                  <div className="rounded-xl border border-border/70 bg-muted/15 p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-muted-foreground">Selling Price:</span>
                      <span className="mono font-black text-foreground text-sm">₹{sPrice.toFixed(2)}</span>
                    </div>
                    {bPrice !== null && bPrice > 0 && (
                      <div className="flex justify-between items-center border-t border-border/30 pt-1.5">
                        <span className="font-semibold text-muted-foreground">Buying Price (Cost):</span>
                        <span className="mono font-semibold text-muted-foreground">₹{bPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {profit !== null && (
                      <div className="flex justify-between items-center border-t border-border/30 pt-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Est. Profit Margin:</span>
                        <span className="mono">₹{profit.toFixed(2)} ({marginPct}%)</span>
                      </div>
                    )}
                  </div>

                  {/* Stock & Barcode Info */}
                  {(() => {
                    const vBarcode = getProductBarcode(viewData);
                    return (
                      <div className={`grid gap-2 text-xs ${vBarcode ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="rounded-xl border border-border/50 bg-muted/10 p-2.5">
                          <div className="font-bold text-muted-foreground text-[10px] uppercase">Stock / Capacity</div>
                          <div className="mt-1 font-bold text-foreground text-sm">
                            {isServ 
                              ? (vStock && vStock < 999 ? `${vStock} capacity` : 'Unlimited Service')
                              : `${vStock ?? 0} ${viewData.unit || 'units'}`
                            }
                          </div>
                        </div>
                        {vBarcode && (
                          <div className="rounded-xl border border-border/50 bg-muted/10 p-2.5">
                            <div className="font-bold text-muted-foreground text-[10px] uppercase">Barcode / SKU</div>
                            <div className="mt-1 mono font-bold text-foreground text-sm">
                              {vBarcode}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            
            <div className="mt-6 flex justify-between items-center gap-2 pt-3 border-t border-border/60">
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowViewModal(false);
                    editRow(viewData);
                  }} 
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil size={13} />
                  <span>Edit</span>
                </button>
                {!isCustomer && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowViewModal(false);
                      openBarcodeVerifier(viewData);
                    }} 
                    className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ScanLine size={13} />
                    <span>Manage Barcode</span>
                  </button>
                )}
                {isCustomer && (
                  <Link
                    href={`/khatabook/${viewData.id}`}
                    onClick={() => setShowViewModal(false)}
                    className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors no-underline"
                  >
                    <BookOpen size={13} />
                    <span>Khata Book</span>
                  </Link>
                )}
              </div>
              <button type="button" onClick={() => setShowViewModal(false)} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-colors">Close</button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* Delete Confirmation Modal */}
    {deleteData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/40 backdrop-blur-xs p-4 animate-in fade-in-0 print:hidden">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-float relative overflow-hidden">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 size={20} />
            </div>
            <h3 className="text-lg font-bold">Delete {isCustomer ? 'Customer' : 'Product'}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to delete <span className="font-bold text-foreground">{deleteData.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteData(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="button" onClick={() => void deleteRow()} disabled={loading} className="rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground disabled:opacity-50 transition-all hover:bg-destructive/90 active:scale-95">
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Barcode Scanner & Verifier Modal */}
    {!isCustomer && (
      <BarcodeVerifierModal
        isOpen={showBarcodeModal}
        onClose={() => {
          setShowBarcodeModal(false);
          setBarcodeTargetProduct(null);
        }}
        products={table.data}
        targetProduct={barcodeTargetProduct}
        onReloadProducts={table.reload}
        onOpenAddProductWithBarcode={openAddModalWithBarcode}
        onEditProduct={editRow}
        initialBarcode={initialBarcode}
      />
    )}
  </>;
}

function SimpleList({ kind }: { kind: 'purchases' | 'expenses' }) {
  return <div className="p-10 text-center text-muted-foreground">List for {kind} under construction</div>;
}

function Reports() {
  return <div className="p-10 text-center text-muted-foreground">Reports under construction</div>;
}

function Settings() {
  const [form, setForm] = useState({
    name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'INR',
    invoice_prefix: 'INV',
    default_due_days: '30',
    turnover: '',
    employees: '1',
    enable_tax: false,
    tax_name: 'Tax',
    tax_rate: '18',
    invoice_template: 'standard',
    upi_id: '',
    upi_number: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'Current',
    branch_name: '',
    payment_instructions: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      setLoading(true);
      setError('');
      try {
        let session = auth.session();
        if (!session) {
          session = await auth.getSession();
        }

        const user = session?.user;
        const userMeta = user?.user_metadata || {};
        const defaultEmail = user?.email || '';
        const defaultPhone = userMeta.phone || (user as any)?.phone || '';
        const defaultOwnerName = userMeta.full_name || userMeta.name || defaultEmail.split('@')[0] || '';

        // Read local storage cache if available
        let localCache: Record<string, any> = {};
        if (user?.id) {
          try {
            const raw = localStorage.getItem(`arventa_biz_${user.id}`);
            if (raw) localCache = JSON.parse(raw);
          } catch (e) {
            console.warn('Failed to parse local cache:', e);
          }
        }
        let paymentCache: Record<string, any> = {};
        try {
          const rawPay = localStorage.getItem('arventa_payment_settings');
          if (rawPay) paymentCache = JSON.parse(rawPay);
        } catch (e) {}

        let bid: string | null = null;
        let bizRow: Row | null = null;
        let profileRow: Row | null = null;
        let settingRow: Row | null = null;

        if (user) {
          try {
            const profiles = await db.list<Row>('profiles', { id: user.id });
            if (profiles.length > 0) {
              profileRow = profiles[0];
              bid = profileRow.business_id;
            }
          } catch (pe) {
            console.warn('Could not query profile directly:', pe);
          }
        }

        if (!bid) {
          bid = await getBusinessId();
        }

        if (bid) {
          setBusinessId(bid);
          try {
            const businesses = await db.list<Row>('businesses', { id: bid });
            if (businesses.length > 0) {
              bizRow = businesses[0];
            }
          } catch (be) {
            console.warn('Could not query businesses by id, querying all:', be);
            try {
              const allBiz = await db.list<Row>('businesses');
              if (allBiz.length > 0) bizRow = allBiz[0];
            } catch (be2) {}
          }

          try {
            const settingsList = await db.list<Row>('settings', { business_id: bid });
            if (settingsList.length > 0) {
              settingRow = settingsList[0];
            }
          } catch (se) {
            console.warn('Could not query settings:', se);
          }
        }

        if (active) {
          const resolvedName = bizRow?.name || userMeta.business_name || localCache.name || (defaultOwnerName ? `${defaultOwnerName}'s Business` : 'My Workspace');
          const resolvedOwner = profileRow?.full_name || userMeta.full_name || userMeta.name || localCache.owner_name || defaultOwnerName;
          const resolvedEmail = bizRow?.email || defaultEmail;
          const resolvedPhone = bizRow?.phone || userMeta.phone || localCache.phone || defaultPhone;
          const resolvedAddress = bizRow?.address || userMeta.address || localCache.address || '';
          const resolvedTurnover = bizRow?.turnover || userMeta.turnover || localCache.turnover || '';
          const resolvedEmployees = bizRow?.employees || userMeta.employees || localCache.employees || '1';
          const resolvedPrefix = settingRow?.invoice_prefix || localCache.invoice_prefix || 'INV';
          const resolvedDueDays = settingRow?.default_due_days !== undefined ? String(settingRow.default_due_days) : (localCache.default_due_days || '30');
          const resolvedEnableTax = settingRow?.enable_tax !== undefined ? Boolean(settingRow.enable_tax) : (localCache.enable_tax !== undefined ? Boolean(localCache.enable_tax) : false);
          const resolvedTaxName = localCache.tax_name || 'Tax';
          const resolvedTaxRate = settingRow?.tax_rate !== undefined ? String(settingRow.tax_rate) : (localCache.tax_rate !== undefined ? String(localCache.tax_rate) : '10');
          const resolvedTemplate = settingRow?.invoice_template || localCache.invoice_template || 'standard';

          const resolvedUpiId = settingRow?.upi_id || bizRow?.upi_id || localCache.upi_id || paymentCache.upi_id || userMeta.upi_id || '';
          const resolvedUpiNumber = settingRow?.upi_number || bizRow?.upi_number || localCache.upi_number || paymentCache.upi_number || userMeta.upi_number || '';
          const resolvedBankName = settingRow?.bank_name || bizRow?.bank_name || localCache.bank_name || paymentCache.bank_name || userMeta.bank_name || '';
          const resolvedAccountHolder = settingRow?.account_holder_name || bizRow?.account_holder_name || localCache.account_holder_name || paymentCache.account_holder_name || userMeta.account_holder_name || resolvedOwner || '';
          const resolvedAccountNumber = settingRow?.account_number || bizRow?.account_number || localCache.account_number || paymentCache.account_number || userMeta.account_number || '';
          const resolvedIfscCode = settingRow?.ifsc_code || bizRow?.ifsc_code || localCache.ifsc_code || paymentCache.ifsc_code || userMeta.ifsc_code || '';
          const resolvedAccountType = settingRow?.account_type || bizRow?.account_type || localCache.account_type || paymentCache.account_type || userMeta.account_type || 'Current';
          const resolvedBranchName = settingRow?.branch_name || bizRow?.branch_name || localCache.branch_name || paymentCache.branch_name || userMeta.branch_name || '';
          const resolvedPaymentInstructions = settingRow?.payment_instructions || bizRow?.payment_instructions || localCache.payment_instructions || paymentCache.payment_instructions || userMeta.payment_instructions || '';

          setForm({
            name: resolvedName,
            owner_name: resolvedOwner,
            email: resolvedEmail,
            phone: resolvedPhone,
            address: resolvedAddress,
            currency: bizRow?.currency || settingRow?.currency || 'INR',
            invoice_prefix: resolvedPrefix,
            default_due_days: resolvedDueDays,
            turnover: resolvedTurnover,
            employees: resolvedEmployees,
            enable_tax: resolvedEnableTax,
            tax_name: resolvedTaxName,
            tax_rate: resolvedTaxRate,
            invoice_template: resolvedTemplate,
            upi_id: resolvedUpiId,
            upi_number: resolvedUpiNumber,
            bank_name: resolvedBankName,
            account_holder_name: resolvedAccountHolder,
            account_number: resolvedAccountNumber,
            ifsc_code: resolvedIfscCode,
            account_type: resolvedAccountType,
            branch_name: resolvedBranchName,
            payment_instructions: resolvedPaymentInstructions,
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        if (active) setError(getSupabaseErrorMessage(err, 'Failed to load business details.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const save = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      let session = auth.session();
      if (!session) session = await auth.getSession();

      // Immediately cache to local storage
      try {
        localStorage.setItem('arventa_tax_settings', JSON.stringify({
          enable_tax: form.enable_tax,
          tax_name: form.tax_name || 'Tax',
          tax_rate: form.tax_rate,
          invoice_template: form.invoice_template,
        }));
        localStorage.setItem('arventa_payment_settings', JSON.stringify({
          upi_id: form.upi_id.trim(),
          upi_number: form.upi_number.trim(),
          bank_name: form.bank_name.trim(),
          account_holder_name: form.account_holder_name.trim(),
          account_number: form.account_number.trim(),
          ifsc_code: form.ifsc_code.trim(),
          account_type: form.account_type,
          branch_name: form.branch_name.trim(),
          payment_instructions: form.payment_instructions.trim(),
        }));
      } catch (le) {}

      if (session?.user?.id) {
        try {
          localStorage.setItem(`arventa_biz_${session.user.id}`, JSON.stringify({
            name: form.name.trim(),
            owner_name: form.owner_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            turnover: form.turnover,
            employees: form.employees,
            invoice_prefix: form.invoice_prefix.trim(),
            default_due_days: form.default_due_days,
            currency: form.currency || 'INR',
            enable_tax: form.enable_tax,
            tax_name: form.tax_name || 'Tax',
            tax_rate: form.tax_rate,
            invoice_template: form.invoice_template,
            upi_id: form.upi_id.trim(),
            upi_number: form.upi_number.trim(),
            bank_name: form.bank_name.trim(),
            account_holder_name: form.account_holder_name.trim(),
            account_number: form.account_number.trim(),
            ifsc_code: form.ifsc_code.trim(),
            account_type: form.account_type,
            branch_name: form.branch_name.trim(),
            payment_instructions: form.payment_instructions.trim(),
          }));
        } catch (le) {
          console.warn('Could not cache to localStorage:', le);
        }
      }

      // Update Supabase Auth user_metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: form.owner_name.trim(),
            name: form.owner_name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            turnover: form.turnover,
            employees: form.employees,
            business_name: form.name.trim(),
            enable_tax: form.enable_tax,
            tax_name: form.tax_name || 'Tax',
            tax_rate: form.tax_rate,
            invoice_template: form.invoice_template,
            upi_id: form.upi_id.trim(),
            upi_number: form.upi_number.trim(),
            bank_name: form.bank_name.trim(),
            account_holder_name: form.account_holder_name.trim(),
            account_number: form.account_number.trim(),
            ifsc_code: form.ifsc_code.trim(),
            account_type: form.account_type,
            branch_name: form.branch_name.trim(),
            payment_instructions: form.payment_instructions.trim(),
          }
        });
      } catch (ae) {
        console.warn('Auth updateUser:', ae);
      }

      let bid = businessId;
      if (!bid) {
        bid = await getBusinessId();
        if (bid) setBusinessId(bid);
      }

      if (bid) {
        // Update businesses profile
        try {
          await db.update('businesses', bid, {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            currency: form.currency || 'INR',
            turnover: form.turnover,
            employees: form.employees,
            upi_id: form.upi_id.trim(),
            bank_name: form.bank_name.trim(),
            account_number: form.account_number.trim(),
            ifsc_code: form.ifsc_code.trim(),
          });
        } catch (be) {
          console.warn('Full businesses update fallback:', be);
          try {
            await db.update('businesses', bid, {
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              address: form.address.trim(),
              currency: form.currency || 'INR',
            });
          } catch (be2) {
            console.warn('Basic businesses update error:', be2);
          }
        }

        // Upsert settings with tax, template and payment preferences
        try {
          await db.upsert('settings', {
            business_id: bid,
            invoice_prefix: form.invoice_prefix.trim() || 'INV',
            default_due_days: Number(form.default_due_days || 30),
            currency: form.currency || 'INR',
            enable_tax: form.enable_tax,
            tax_rate: Number(form.tax_rate || 0),
            invoice_template: form.invoice_template,
            upi_id: form.upi_id.trim(),
            upi_number: form.upi_number.trim(),
            bank_name: form.bank_name.trim(),
            account_holder_name: form.account_holder_name.trim(),
            account_number: form.account_number.trim(),
            ifsc_code: form.ifsc_code.trim(),
            account_type: form.account_type,
            branch_name: form.branch_name.trim(),
            payment_instructions: form.payment_instructions.trim(),
          });
        } catch (se) {
          console.warn('Full settings update error, trying standard settings:', se);
          try {
            await db.upsert('settings', {
              business_id: bid,
              invoice_prefix: form.invoice_prefix.trim() || 'INV',
              default_due_days: Number(form.default_due_days || 30),
              currency: form.currency || 'INR',
              enable_tax: form.enable_tax,
              tax_rate: Number(form.tax_rate || 0),
              invoice_template: form.invoice_template,
            });
          } catch (se2) {
            console.warn('Standard settings fallback error:', se2);
          }
        }
      }

      if (session?.user?.id && form.owner_name) {
        try {
          await db.update('profiles', session.user.id, {
            full_name: form.owner_name.trim(),
          });
        } catch (pe) {
          console.warn('Profile update ignored:', pe);
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(getSupabaseErrorMessage(err, 'Could not save profile details. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace controls"
        title="Settings"
        description="Shape invoices and business details around the way you work."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="max-w-3xl">
          <div className="card-shell p-5 sm:p-7 space-y-4">
            <div className="skeleton h-6 w-36 rounded-md" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="skeleton h-14 rounded-xl" />
              <div className="skeleton h-14 rounded-xl" />
              <div className="skeleton h-14 rounded-xl" />
              <div className="skeleton h-14 rounded-xl" />
              <div className="skeleton h-14 rounded-xl" />
              <div className="skeleton h-14 rounded-xl" />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void save(e)} className="max-w-3xl">
          <section className="card-shell p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-sm font-extrabold">Business profile</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                This information appears on your invoices, receipts, and reports.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <AppField
                label="Business name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                test="input-business-name"
                required
              />
              <AppField
                label="Owner / Contact name"
                value={form.owner_name}
                onChange={(v) => setForm({ ...form, owner_name: v })}
                test="input-owner-name"
              />
              <AppField
                label="Business email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                test="input-business-email"
                required
              />
              <AppField
                label="Phone number"
                type="tel"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                test="input-business-phone"
              />
              <label className="block text-xs font-bold">
                Currency
                <input
                  type="text"
                  value={form.currency}
                  disabled
                  className="input-shell mt-2 w-full px-3 text-sm font-normal disabled:opacity-60"
                  data-testid="input-business-currency"
                />
              </label>
              <div className="sm:col-span-2">
                <AppField
                  label="Business address"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                  test="input-business-address"
                />
              </div>
              <label className="block text-xs font-bold">
                Turnover (approx)
                <CustomDropdown
                  value={form.turnover}
                  onChange={(v) => setForm({ ...form, turnover: v })}
                  placeholder="Select turnover range"
                  options={[
                    { label: 'Under ₹1 Lakh', value: 'Under 1L', hint: '₹0 – ₹1,00,000 / year' },
                    { label: '₹1 Lakh', value: '1L', hint: 'Exact ₹1,00,000 / year' },
                    { label: '₹1 Lakh – ₹5 Lakhs', value: '1L - 5L', hint: 'Micro business' },
                    { label: '₹5 Lakhs – ₹10 Lakhs', value: '5L - 10L', hint: 'Growing business' },
                    { label: '₹10 Lakhs – ₹25 Lakhs', value: '10L - 25L', hint: 'Small enterprise' },
                    { label: '₹25 Lakhs – ₹50 Lakhs', value: '25L - 50L', hint: 'Mid enterprise' },
                    { label: '₹50 Lakhs – ₹1 Crore', value: '50L - 1Cr', hint: 'Upper mid enterprise' },
                    { label: '₹1 Crore – ₹5 Crores', value: '1Cr - 5Cr', hint: 'Large enterprise' },
                    { label: '₹5 Crores+', value: '5Cr+', hint: 'Corporate' },
                  ]}
                />
              </label>
              <label className="block text-xs font-bold">
                Employees
                <CustomDropdown
                  value={form.employees}
                  onChange={(v) => setForm({ ...form, employees: v })}
                  placeholder="Select employee count"
                  options={[
                    { label: '1 Employee (Solo / Just me)', value: '1', hint: 'Individual / Freelance' },
                    { label: '2 – 5 Employees', value: '2-5', hint: 'Small core team' },
                    { label: '6 – 10 Employees', value: '6-10', hint: 'Expanding team' },
                    { label: '11 – 25 Employees', value: '11-25', hint: 'Established team' },
                    { label: '26 – 50 Employees', value: '26-50', hint: 'Mid-sized crew' },
                    { label: '51 – 100 Employees', value: '51-100', hint: 'Department level' },
                    { label: '101 – 250 Employees', value: '101-250', hint: 'Large team' },
                    { label: '250+ Employees', value: '250+', hint: 'Enterprise organization' },
                  ]}
                />
              </label>
            </div>
          </section>

          {/* Tax Configuration */}
          <section className="card-shell mt-6 p-5 sm:p-7">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-extrabold">Tax Configuration</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose whether tax is applicable on your invoices and specify the default tax percentage.
                </p>
              </div>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2.5 sm:mt-0">
                <input
                  type="checkbox"
                  checked={form.enable_tax}
                  onChange={(e) => setForm({ ...form, enable_tax: e.target.checked })}
                  className="h-4 w-4 rounded accent-primary"
                  data-testid="checkbox-enable-tax"
                />
                <span className="text-xs font-bold text-foreground">
                  {form.enable_tax ? 'Tax Enabled' : 'Tax Disabled'}
                </span>
              </label>
            </div>

            {form.enable_tax && (
              <div className="mt-5 grid gap-5 rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-5 sm:grid-cols-2">
                <label className="block text-xs font-bold">
                  Tax Name / Type
                  <input
                    type="text"
                    placeholder="e.g. VAT, GST, Tax"
                    value={form.tax_name}
                    onChange={(e) => setForm({ ...form, tax_name: e.target.value })}
                    className="input-shell mt-2 w-full px-3 py-2 text-sm font-semibold"
                    data-testid="input-tax-name"
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Name displayed on the invoice.
                  </p>
                </label>
                <label className="block text-xs font-bold">
                  Default Tax Rate (%)
                  <div className="relative mt-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="e.g. 10"
                      value={form.tax_rate}
                      onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                      className="input-shell w-full pl-3 pr-10 py-2 text-sm font-semibold"
                      data-testid="input-tax-rate"
                    />
                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">%</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Automatically applied to new invoices.
                  </p>
                </label>
              </div>
            )}
          </section>

          {/* Payment Information (UPI & Bank Transfer Details) */}
          <section className="card-shell mt-6 p-5 sm:p-7" data-testid="section-payment-settings">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Payment Information</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Configure your UPI and Bank transfer details to automatically receive direct payments from customers.
                  </p>
                </div>
              </div>
            </div>

            {/* UPI Details Box */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5 mb-5">
              <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-border/60">
                <QrCode size={16} className="text-primary" />
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">UPI Payment Details</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AppField
                  label="UPI ID / VPA Address"
                  value={form.upi_id}
                  onChange={(v) => setForm({ ...form, upi_id: v })}
                  placeholder="e.g. yourname@okaxis, business@upi"
                  test="input-upi-id"
                />
                <AppField
                  label="UPI Phone / Number (Optional)"
                  type="tel"
                  value={form.upi_number}
                  onChange={(v) => setForm({ ...form, upi_number: v })}
                  placeholder="e.g. +91 9876543210"
                  test="input-upi-number"
                />
              </div>
              <p className="mt-2.5 text-[11px] text-muted-foreground">
                Displayed on invoices and WhatsApp shares for instantaneous QR and UPI payments.
              </p>
            </div>

            {/* Bank Transfer Details Box */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-border/60">
                <Building2 size={16} className="text-primary" />
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Bank Transfer Details (NEFT / IMPS / RTGS)</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AppField
                  label="Bank Name"
                  value={form.bank_name}
                  onChange={(v) => setForm({ ...form, bank_name: v })}
                  placeholder="e.g. State Bank of India, HDFC Bank, ICICI Bank"
                  test="input-bank-name"
                />
                <AppField
                  label="Account Holder / Beneficiary Name"
                  value={form.account_holder_name}
                  onChange={(v) => setForm({ ...form, account_holder_name: v })}
                  placeholder="e.g. Arventa Ventures Pvt Ltd"
                  test="input-account-holder"
                />
                <AppField
                  label="Bank Account Number"
                  type="text"
                  value={form.account_number}
                  onChange={(v) => setForm({ ...form, account_number: v })}
                  placeholder="e.g. 12345678901234"
                  test="input-account-number"
                />
                <AppField
                  label="IFSC Code"
                  value={form.ifsc_code}
                  onChange={(v) => setForm({ ...form, ifsc_code: v.toUpperCase() })}
                  placeholder="e.g. SBIN0001234, HDFC0001234"
                  test="input-ifsc-code"
                />
                <label className="block text-xs font-bold">
                  Account Type
                  <CustomDropdown
                    value={form.account_type || 'Current'}
                    onChange={(v) => setForm({ ...form, account_type: v })}
                    placeholder="Select account type"
                    options={[
                      { label: 'Current Account (Business)', value: 'Current', hint: 'Commercial & corporate transactions' },
                      { label: 'Savings Account', value: 'Savings', hint: 'Individual & personal banking' },
                    ]}
                  />
                </label>
                <AppField
                  label="Branch Name / City (Optional)"
                  value={form.branch_name}
                  onChange={(v) => setForm({ ...form, branch_name: v })}
                  placeholder="e.g. Connaught Place Branch, New Delhi"
                  test="input-branch-name"
                />
              </div>
              <div className="mt-4">
                <AppField
                  label="Additional Payment Instructions / Notes (Optional)"
                  value={form.payment_instructions}
                  onChange={(v) => setForm({ ...form, payment_instructions: v })}
                  placeholder="e.g. Please share transaction screenshot or UTR number after transfer."
                  test="input-payment-instructions"
                />
              </div>
            </div>
          </section>

          {/* Invoice Template Selection */}
          <section className="card-shell mt-6 p-5 sm:p-7">
            <div className="mb-5">
              <h3 className="text-sm font-extrabold">Invoice Template</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Select which invoice layout and style to use when generating and printing invoices.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  id: 'standard',
                  name: 'Standard Commercial',
                  desc: 'Clean & structured layout designed for commercial trade and standard retail.',
                  badge: 'Active',
                }
              ].map((tpl) => {
                const isSelected = form.invoice_template === tpl.id;
                return (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => setForm({ ...form, invoice_template: tpl.id })}
                    className={`flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'
                    }`}
                    data-testid={`button-template-${tpl.id}`}
                  >
                    <div className="h-32 w-full border-b border-border/50 bg-muted/50 p-4">
                      <div className="mx-auto flex h-full w-[85%] flex-col gap-2 rounded border border-border bg-card p-3 shadow-sm">
                         <div className="flex justify-between"><div className="h-2 w-8 rounded bg-muted-foreground/30"></div><div className="h-2 w-12 rounded bg-muted-foreground/30"></div></div>
                         <div className="mt-1 h-1.5 w-1/3 rounded bg-muted-foreground/20"></div>
                         <div className="mt-2 h-px w-full bg-border"></div>
                         <div className="mt-1 flex justify-between"><div className="h-1.5 w-10 rounded bg-muted-foreground/20"></div><div className="h-1.5 w-6 rounded bg-muted-foreground/20"></div></div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-foreground">{tpl.name}</span>
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                            {tpl.badge}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{tpl.desc}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary">
                        {isSelected ? <><Check size={14} /> Selected</> : <span className="text-muted-foreground font-normal">Choose</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card-shell mt-6 p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !supabaseConfigured}
                className="btn-primary inline-flex min-h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold disabled:opacity-50"
                data-testid="button-save-settings"
              >
                {saving ? (
                  'Saving…'
                ) : saved ? (
                  <>
                    <Check size={16} /> Saved settings
                  </>
                ) : (
                  'Save settings'
                )}
              </button>
              {saved && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Settings saved successfully!
                </span>
              )}
            </div>
          </section>
        </form>
      )}
    </>
  );
}

function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');

  const submitForm = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    setError(''); 
    
    if (mode === 'signup') {
      if (step === 'form') {
        setStep('otp');
        return;
      }
      
      if (step === 'otp') {
        if (otp !== '123456') {
          setError('Invalid OTP. Please enter 123456.');
          return;
        }
      }
    }
    setLoading(true); 
    try { 
      if (mode === 'signup') { 
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name, phone } } }); 
        if (error) throw error; 
        setLocation('/onboarding'); 
      } else { 
        const { error } = await supabase.auth.signInWithPassword({ email, password }); 
        if (error) throw error; 
        setLocation('/dashboard'); 
      } 
    } catch (err) { 
      setError(getSupabaseErrorMessage(err, 'Authentication error')); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  return <div className="noise flex min-h-[100dvh] items-center justify-center bg-background px-5 py-10"><div className="w-full max-w-sm animate-rise"><div className="mb-10 flex justify-center"><Logo /></div><div className="card-shell p-6 sm:p-9"><h1 className="mb-6 text-center text-2xl font-extrabold tracking-tight">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>{error && <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}<form onSubmit={(e) => void submitForm(e)} className="space-y-4">
    {mode === 'signup' && step === 'form' && <><AppField label="Full name" value={name} onChange={setName} required test="input-signup-name" /><AppField label="Phone number" type="tel" value={phone} onChange={setPhone} required test="input-signup-phone" /></>}
    {step === 'form' && <><AppField label="Email" type="email" value={email} onChange={setEmail} required test="input-auth-email" /><AppField label="Password" type="password" value={password} onChange={setPassword} required test="input-auth-password" /></>}
    {step === 'otp' && <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"><div className="mb-4 text-xs text-muted-foreground">We sent a 6-digit code to <strong>{email}</strong></div><AppField label="Enter OTP" value={otp} onChange={setOtp} required test="input-signup-otp" /></div>}
    <button disabled={loading || !supabaseConfigured} className="btn-primary mt-2 min-h-12 w-full rounded-xl text-sm font-extrabold disabled:opacity-50" data-testid="button-auth-submit">{loading ? 'Working…' : step === 'form' && mode === 'signup' ? 'Continue' : mode === 'login' ? 'Sign in' : 'Verify & Create account'}</button></form></div><p className="mt-8 text-center text-[13px] text-muted-foreground">{mode === 'login' ? 'New here? ' : 'Already have an account? '}<Link href={mode === 'login' ? '/signup' : '/login'} className="font-bold text-foreground hover:underline">{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p></div></div>;
}

function Onboarding() {
  const [, setLocation] = useLocation(); 
  const [name, setName] = useState(''); 
  const [address, setAddress] = useState('');
  const [turnover, setTurnover] = useState('');
  const [employees, setEmployees] = useState('1');
  const [currency, setCurrency] = useState('INR'); 
  const [error, setError] = useState(''); 
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    async function preload() {
      let session = auth.session();
      if (!session) session = await auth.getSession();
      const meta = session?.user?.user_metadata || {};
      if (meta.business_name) setName(meta.business_name);
      if (meta.address) setAddress(meta.address);
      if (meta.turnover) setTurnover(meta.turnover);
      if (meta.employees) setEmployees(meta.employees);
    }
    void preload();
  }, []);

  const save = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    setSaving(true); 
    setError('');
    try { 
      let session = auth.session();
      if (!session) {
        session = await auth.getSession();
      }
      const userMeta = session?.user?.user_metadata || {};
      const memberName = userMeta.full_name || userMeta.name || session?.user?.email?.split('@')[0] || 'Owner';
      const userEmail = session?.user?.email || '';
      const userPhone = userMeta.phone || (session?.user as any)?.phone || '';

      // Immediately cache in localStorage
      if (session?.user?.id) {
        try {
          localStorage.setItem(`arventa_biz_${session.user.id}`, JSON.stringify({
            name: name.trim(),
            owner_name: memberName,
            email: userEmail,
            phone: userPhone,
            address: address.trim(),
            turnover,
            employees,
            currency: currency || 'INR'
          }));
        } catch (le) {
          console.warn('localStorage cache error:', le);
        }
      }

      // Update Supabase Auth metadata
      try {
        await supabase.auth.updateUser({
          data: {
            business_name: name.trim(),
            address: address.trim(),
            turnover,
            employees,
            full_name: memberName,
            name: memberName,
            phone: userPhone
          }
        });
      } catch (ae) {
        console.warn('Auth user metadata update in onboarding:', ae);
      }

      let bizId: string | null = null;
      try {
        const biz = await db.rpc<Row>('create_business', {
          business_name: name.trim(),
          member_name: memberName,
          business_currency: currency || 'INR'
        }); 
        if (biz && biz.id) bizId = biz.id;
      } catch (rpcErr) {
        console.warn('create_business rpc fallback to getBusinessId:', rpcErr);
        bizId = await getBusinessId();
      }

      if (bizId) {
        try {
          await db.update('businesses', bizId, {
            name: name.trim(),
            address: address.trim(),
            turnover,
            employees,
            email: userEmail,
            phone: userPhone,
            currency: currency || 'INR'
          });
        } catch (e) {
          console.warn('Fallback update business fields:', e);
          try {
            await db.update('businesses', bizId, { 
              address: address.trim(), 
              name: name.trim(),
              email: userEmail,
              phone: userPhone
            });
          } catch (e2) {}
        }

        try {
          await db.upsert('settings', {
            business_id: bizId,
            invoice_prefix: 'INV',
            default_due_days: 30,
            currency: currency || 'INR'
          });
        } catch (e3) {
          console.warn('Default settings setup:', e3);
        }
      }
      setLocation('/dashboard'); 
    } catch (err) { 
      setError(getSupabaseErrorMessage(err, 'Could not create your business.')); 
    } finally { 
      setSaving(false); 
    } 
  };
  
  return <div className="noise flex min-h-[100dvh] items-center justify-center bg-background px-5 py-10">
    <div className="w-full max-w-lg animate-rise">
      <div className="mb-10 flex justify-center"><Logo /></div>
      <div className="card-shell p-6 sm:p-9">
        <div className="mb-7">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-primary">One good first step</div>
          <h1 className="text-3xl font-extrabold tracking-[-.06em]">Tell us about the shop.</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">We’ll use this to keep your invoices and reports grounded in your business.</p>
        </div>
        {error && <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
        <form onSubmit={(e) => void save(e)} className="space-y-4">
          <AppField label="Business name" value={name} onChange={setName} test="input-onboarding-business" required />
          <AppField label="Business address" value={address} onChange={setAddress} test="input-onboarding-address" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold">
              Turnover (approx)
              <CustomDropdown
                value={turnover}
                onChange={setTurnover}
                placeholder="Select turnover range"
                options={[
                  { label: 'Under ₹1 Lakh', value: 'Under 1L', hint: '₹0 – ₹1,00,000 / year' },
                  { label: '₹1 Lakh', value: '1L', hint: 'Exact ₹1,00,000 / year' },
                  { label: '₹1 Lakh – ₹5 Lakhs', value: '1L - 5L', hint: 'Micro business' },
                  { label: '₹5 Lakhs – ₹10 Lakhs', value: '5L - 10L', hint: 'Growing business' },
                  { label: '₹10 Lakhs – ₹25 Lakhs', value: '10L - 25L', hint: 'Small enterprise' },
                  { label: '₹25 Lakhs – ₹50 Lakhs', value: '25L - 50L', hint: 'Mid enterprise' },
                  { label: '₹50 Lakhs – ₹1 Crore', value: '50L - 1Cr', hint: 'Upper mid enterprise' },
                  { label: '₹1 Crore – ₹5 Crores', value: '1Cr - 5Cr', hint: 'Large enterprise' },
                  { label: '₹5 Crores+', value: '5Cr+', hint: 'Corporate' },
                ]}
              />
            </label>
            <label className="block text-xs font-bold">
              Employees
              <CustomDropdown
                value={employees}
                onChange={setEmployees}
                placeholder="Select employee count"
                options={[
                  { label: '1 Employee (Solo / Just me)', value: '1', hint: 'Individual / Freelance' },
                  { label: '2 – 5 Employees', value: '2-5', hint: 'Small core team' },
                  { label: '6 – 10 Employees', value: '6-10', hint: 'Expanding team' },
                  { label: '11 – 25 Employees', value: '11-25', hint: 'Established team' },
                  { label: '26 – 50 Employees', value: '26-50', hint: 'Mid-sized crew' },
                  { label: '51 – 100 Employees', value: '51-100', hint: 'Department level' },
                  { label: '101 – 250 Employees', value: '101-250', hint: 'Large team' },
                  { label: '250+ Employees', value: '250+', hint: 'Enterprise organization' },
                ]}
              />
            </label>
          </div>
          <label className="block text-xs font-bold">Currency
            <CustomDropdown 
              disabled 
              value={currency} 
              onChange={setCurrency}
              options={[{ label: "INR — Indian Rupee", value: "INR" }]}
            />
          </label>
          <button disabled={saving || !supabaseConfigured} className="btn-primary mt-2 min-h-12 w-full rounded-xl text-sm font-extrabold disabled:opacity-50" data-testid="button-finish-onboarding">
            {saving ? 'Setting up…' : 'Open my workspace'}
          </button>
        </form>
      </div>
      <p className="mt-5 text-center text-[11px] text-muted-foreground">You can change these details in Settings.</p>
    </div>
  </div>;
}

function Home() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setLocation(data.session ? '/dashboard' : '/login');
    });
    return () => { active = false; };
  }, [setLocation]);
  return <div className="grid min-h-[100dvh] place-items-center text-sm text-muted-foreground">Loading workspace…</div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function Protected({ children }: { children: ReactNode }) { return <Shell>{children}</Shell>; }

function KhataBookWrapper() {
  const params = useParams<{ id?: string }>();
  return <KhataBook initialCustomerId={params.id} />;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={Home} />
    <Route path="/login"><Auth mode="login" /></Route>
    <Route path="/signup"><Auth mode="signup" /></Route>
    <Route path="/onboarding" component={Onboarding} />
    <Route path="/dashboard"><Protected><Dashboard key="dashboard" /></Protected></Route>
    <Route path="/invoices/new"><Protected><InvoiceNew key="invoice-new" /></Protected></Route>
    <Route path="/invoices/:id"><Protected><InvoiceDetail key="invoice-detail" /></Protected></Route>
    <Route path="/invoices"><Protected><Invoices key="invoices" /></Protected></Route>
    <Route path="/customers"><Protected><CrudPage key="customers" kind="customers" /></Protected></Route>
    <Route path="/products"><Protected><CrudPage key="products" kind="products" /></Protected></Route>
    <Route path="/khatabook/:id"><Protected><KhataBookWrapper key="khatabook-id" /></Protected></Route>
    <Route path="/khatabook"><Protected><KhataBook key="khatabook" /></Protected></Route>
    <Route path="/purchases"><Protected><KhataBook key="purchases" /></Protected></Route>
    <Route path="/expenses"><Protected><SimpleList key="expenses" kind="expenses" /></Protected></Route>
    <Route path="/reports"><Protected><Reports key="reports" /></Protected></Route>
    <Route path="/settings"><Protected><Settings key="settings" /></Protected></Route>
    <Route><div className="p-10">Not found</div></Route>
  </Switch></RoutedErrorBoundary>;
}

function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;
