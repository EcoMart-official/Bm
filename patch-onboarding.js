const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetRegex = /function Onboarding\(\) \{[\s\S]*?\}\s*function Home/m;

const match = code.match(targetRegex);

if (match) {
  const newOnboarding = `function Onboarding() {
  const [, setLocation] = useLocation(); 
  const [name, setName] = useState(''); 
  const [address, setAddress] = useState('');
  const [turnover, setTurnover] = useState('');
  const [employees, setEmployees] = useState('1-10');
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
              <select value={turnover} onChange={(e) => setTurnover(e.target.value)} className="input-shell mt-2 w-full px-3 text-sm font-normal">
                <option value="">Select turnover</option>
                <option value="Under 10L">Under 10 Lakhs</option>
                <option value="10L - 50L">10 Lakhs - 50 Lakhs</option>
                <option value="50L - 1Cr">50 Lakhs - 1 Crore</option>
                <option value="1Cr+">1 Crore+</option>
              </select>
            </label>
            <label className="block text-xs font-bold">Employees
              <select value={employees} onChange={(e) => setEmployees(e.target.value)} className="input-shell mt-2 w-full px-3 text-sm font-normal">
                <option value="1-10">1 - 10</option>
                <option value="11-50">11 - 50</option>
                <option value="51-200">51 - 200</option>
                <option value="200+">200+</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-bold">Currency
            <select disabled value={currency} className="input-shell mt-2 w-full px-3 text-sm font-normal disabled:opacity-50" required data-testid="select-onboarding-currency">
              <option value="INR">INR — Indian Rupee</option>
            </select>
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

function Home`;
  code = code.replace(match[0], newOnboarding);
  fs.writeFileSync(path, code);
  console.log('Onboarding patched');
} else {
  console.log('Regex match failed!');
}
