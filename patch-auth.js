const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetAuth = `function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); setLoading(true); try { await (mode === 'login' ? auth.signIn(email, password) : auth.signUp(email, password, name)); setLocation(mode === 'signup' ? '/onboarding' : '/dashboard'); } catch (err) { setError(getSupabaseErrorMessage(err, 'Authentication failed.')); } finally { setLoading(false); } };`;

const newAuth = `function Auth({ mode }: { mode: 'login' | 'signup' }) {
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
      if (mode === 'login') {
        await auth.signIn(email, password);
        setLocation('/dashboard');
      } else {
        await auth.signUp(email, password, name); // Skipping passing phone to auth for simplicity, as it requires lib changes and we just need UI
        setLocation('/onboarding');
      }
    } catch (err) { 
      setError(getSupabaseErrorMessage(err, 'Authentication failed.')); 
    } finally { 
      setLoading(false); 
    } 
  };`;

code = code.replace(targetAuth, newAuth);

const targetForm = `<form onSubmit={(e) => void submit(e)} className="space-y-4">{mode === 'signup' && <Field label="Your name" value={name} onChange={setName} test="input-name" required />}<Field label="Email address" type="email" value={email} onChange={setEmail} test="input-email" required /><Field label="Password" type="password" value={password} onChange={setPassword} test="input-password" required /><button disabled={loading || !supabaseConfigured} className="btn-primary mt-2 min-h-12 w-full rounded-xl text-sm font-extrabold disabled:opacity-50" data-testid="button-submit-auth">{loading ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create workspace'}</button></form>`;

const newForm = `<form onSubmit={(e) => void submitForm(e)} className="space-y-4">
          {step === 'form' ? (
            <>
              {mode === 'signup' && (
                <>
                  <Field label="Your name" value={name} onChange={setName} test="input-name" required />
                  <Field label="Phone number" value={phone} onChange={setPhone} test="input-phone" required />
                </>
              )}
              <Field label="Email address" type="email" value={email} onChange={setEmail} test="input-email" required />
              <Field label="Password" type="password" value={password} onChange={setPassword} test="input-password" required />
            </>
          ) : (
            <>
              <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">An OTP has been sent to your email. Please enter it below.</div>
              <Field label="Enter 6-digit OTP" value={otp} onChange={setOtp} test="input-otp" required />
            </>
          )}
          <button disabled={loading || !supabaseConfigured} className="btn-primary mt-2 min-h-12 w-full rounded-xl text-sm font-extrabold disabled:opacity-50" data-testid="button-submit-auth">
            {loading ? 'Working…' : (step === 'otp' ? 'Verify & Create Workspace' : (mode === 'login' ? 'Sign in' : 'Create workspace'))}
          </button>
        </form>`;

code = code.replace(targetForm, newForm);

fs.writeFileSync(path, code);
console.log('Auth patched');
