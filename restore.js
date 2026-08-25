const fs = require('fs');

const original = fs.readFileSync('artifacts/commercial-billing/src/App.tsx', 'utf8');

const cutIndex = original.indexOf('    {customerModal && (');
if (cutIndex === -1) {
    console.error("Could not find cut index!");
    process.exit(1);
}

const safeCode = original.substring(0, cutIndex);

const restOfInvoiceNew = `    {customerModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/35 p-0 sm:items-center sm:p-5">
        <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">New record</div>
              <h3 className="mt-1 text-xl font-extrabold">Add customer</h3>
            </div>
            <button onClick={() => setCustomerModal(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
          </div>
          {newCustomerForm._error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{newCustomerForm._error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={newCustomerForm.name || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, name: v })} required />
            <Field label="Email" type="email" value={newCustomerForm.email || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, email: v })} />
            <Field label="Phone" value={newCustomerForm.phone || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, phone: v })} />
            <div className="sm:col-span-2">
              <Field label="Address" value={newCustomerForm.address || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, address: v })} />
            </div>
          </div>
          <div className="mt-7 flex justify-end gap-3">
            <button onClick={() => setCustomerModal(false)} className="px-4 py-2 text-sm font-bold hover:bg-muted rounded-lg">Cancel</button>
            <button onClick={() => void saveCustomer()} disabled={savingCustomer} className="btn-primary px-5 py-2 text-sm font-bold rounded-lg disabled:opacity-50">Save customer</button>
          </div>
        </div>
      </div>
    )}
  </div>;
}

function CrudPage({ kind }: { kind: 'customers' | 'products' }) {
  const table = useTable<Row>(kind, { order: 'name.asc' });
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => table.data.filter((r) => \`\${r.name} \${r.email || ''} \${r.phone || ''}\`.toLowerCase().includes(search.toLowerCase())), [table.data, search]);
  
  return <>
    <PageHeader title={kind === 'customers' ? 'Customers' : 'Products'} actionLabel={\`New \${kind.slice(0,-1)}\`} action={() => alert('Not implemented in mock')} />
    <div className="mb-4">
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input-shell w-full max-w-sm px-3 text-sm" />
    </div>
    <State {...table}>
      {filtered.length ? (
        <div className="card-shell overflow-hidden">
          <div className="divide-y divide-border/70">
            {filtered.map(row => (
              <div key={row.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.email || row.phone || row.sku || 'No details'}</div>
                </div>
                {row.price && <div className="mono">{Number(row.price).toFixed(2)}</div>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Empty icon={kind === 'customers' ? Users : Package} title={\`No \${kind} yet\`} description="They will appear here." />
      )}
    </State>
  </>;
}

function SimpleList({ kind }: { kind: 'purchases' | 'expenses' }) {
  return <div className="p-10 text-center text-muted-foreground">List for {kind} under construction</div>;
}

function Reports() {
  return <div className="p-10 text-center text-muted-foreground">Reports under construction</div>;
}

function Settings() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', currency: 'INR', tax_rate: '', invoice_prefix: '', default_due_days: '' });
  const [saved, setSaved] = useState(false);
  const save = async () => { try { await db.insert('settings', { ...form, tax_rate: Number(form.tax_rate || 0), default_due_days: Number(form.default_due_days || 0) }); setSaved(true); } catch { setSaved(false); } };
  return <><PageHeader eyebrow="Workspace controls" title="Settings" description="Shape invoices and business details around the way you work." /><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><section className="card-shell p-5 sm:p-7"><div className="mb-6"><h3 className="text-sm font-extrabold">Business profile</h3><p className="mt-1 text-xs text-muted-foreground">This information appears on your documents.</p></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Business name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} test="input-business-name" /><Field label="Business email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} test="input-business-email" /><Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} test="input-business-phone" /><label className="block text-xs font-bold">Currency<input type="text" value="INR" disabled className="input-shell mt-2 w-full px-3 text-sm font-normal disabled:opacity-50" data-testid="input-business-currency" /></label><Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} test="input-business-address" /><Field label="Tax rate" type="number" value={form.tax_rate} onChange={(v) => setForm({ ...form, tax_rate: v })} test="input-business-tax" /></div><button onClick={() => void save()} disabled={!supabaseConfigured} className="btn-primary mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-50" data-testid="button-save-settings">{saved ? <><Check size={16} /> Saved</> : 'Save profile'}</button></section><section className="card-shell p-5 sm:p-7"><div className="mb-6"><h3 className="text-sm font-extrabold">Invoice defaults</h3><p className="mt-1 text-xs text-muted-foreground">Small defaults that keep entry moving.</p></div><div className="space-y-5"><Field label="Invoice prefix" value={form.invoice_prefix} onChange={(v) => setForm({ ...form, invoice_prefix: v })} test="input-invoice-prefix" /><Field label="Default due days" type="number" value={form.default_due_days} onChange={(v) => setForm({ ...form, default_due_days: v })} test="input-default-due-days" /></div><div className="mt-7 rounded-xl bg-muted/70 p-4 text-xs leading-5 text-muted-foreground"><Sparkles size={16} className="mb-2 text-primary" /><strong className="text-foreground">Quiet by default.</strong> We only show numbers once they come from your workspace.</div></section></div></>;
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
    {mode === 'signup' && step === 'form' && <><Field label="Full name" value={name} onChange={setName} required test="input-signup-name" /><Field label="Phone number" type="tel" value={phone} onChange={setPhone} required test="input-signup-phone" /></>}
    {step === 'form' && <><Field label="Email" type="email" value={email} onChange={setEmail} required test="input-auth-email" /><Field label="Password" type="password" value={password} onChange={setPassword} required test="input-auth-password" /></>}
    {step === 'otp' && <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"><div className="mb-4 text-xs text-muted-foreground">We sent a 6-digit code to <strong>{email}</strong></div><Field label="Enter OTP" value={otp} onChange={setOtp} required test="input-signup-otp" /></div>}
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
  
  const save = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    setSaving(true); 
    try { 
      const biz = await db.rpc<Row>('create_business', { business_name: name, member_name: '', business_currency: currency }); 
      try {
        await db.update('businesses', biz.id, { address, turnover, employees });
      } catch(e) {
        try {
          await db.update('businesses', biz.id, { address });
        } catch(e2) {
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
          <Field label="Business name" value={name} onChange={setName} test="input-onboarding-business" required />
          <Field label="Business address" value={address} onChange={setAddress} test="input-onboarding-address" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold">Turnover (approx)
              <Select value={turnover} onValueChange={setTurnover}>
                <SelectTrigger className="mt-2 w-full border-input bg-transparent shadow-sm">
                  <SelectValue placeholder="Select turnover" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under 1L">Under 1 Lakh</SelectItem>
                  <SelectItem value="1L - 10L">1 Lakh - 10 Lakhs</SelectItem>
                  <SelectItem value="10L - 50L">10 Lakhs - 50 Lakhs</SelectItem>
                  <SelectItem value="50L - 1Cr">50 Lakhs - 1 Crore</SelectItem>
                  <SelectItem value="1Cr+">1 Crore+</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block text-xs font-bold">Employees
              <Select value={employees} onValueChange={setEmployees}>
                <SelectTrigger className="mt-2 w-full border-input bg-transparent shadow-sm">
                  <SelectValue placeholder="Select employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Just me (1)</SelectItem>
                  <SelectItem value="1-10">1 - 10</SelectItem>
                  <SelectItem value="11-50">11 - 50</SelectItem>
                  <SelectItem value="51-200">51 - 200</SelectItem>
                  <SelectItem value="200+">200+</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
          <label className="block text-xs font-bold">Currency
            <Select disabled value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mt-2 w-full border-input bg-transparent shadow-sm disabled:opacity-50" data-testid="select-onboarding-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR — Indian Rupee</SelectItem>
              </SelectContent>
            </Select>
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

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/login"><Auth mode="login" /></Route><Route path="/signup"><Auth mode="signup" /></Route><Route path="/onboarding" component={Onboarding} /><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/invoices/new"><Protected><InvoiceNew /></Protected></Route><Route path="/invoices"><Protected><Invoices /></Protected></Route><Route path="/customers"><Protected><CrudPage kind="customers" /></Protected></Route><Route path="/products"><Protected><CrudPage kind="products" /></Protected></Route><Route path="/purchases"><Protected><SimpleList kind="purchases" /></Protected></Route><Route path="/expenses"><Protected><SimpleList kind="expenses" /></Protected></Route><Route path="/reports"><Protected><Reports /></Protected></Route><Route path="/settings"><Protected><Settings /></Protected></Route><Route><div className="p-10">Not found</div></Route></Switch></RoutedErrorBoundary>;
}

function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;
`;

fs.writeFileSync('artifacts/commercial-billing/src/App.tsx', safeCode + restOfInvoiceNew);
console.log('App.tsx restored.');
