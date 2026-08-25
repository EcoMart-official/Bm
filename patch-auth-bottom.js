const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetBottom = `<p className="mt-7 text-center text-xs text-muted-foreground">{mode === 'login' ? 'New to BillingMaster? ' : 'Already have an account? '}<Link href={mode === 'login' ? '/signup' : '/login'} className="font-bold text-primary no-underline" data-testid="link-auth-switch">{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p>`;

const newBottom = `{step === 'form' ? (
          <p className="mt-7 text-center text-xs text-muted-foreground">{mode === 'login' ? 'New to BillingMaster? ' : 'Already have an account? '}<Link href={mode === 'login' ? '/signup' : '/login'} className="font-bold text-primary no-underline" onClick={() => {setError(''); setStep('form');}} data-testid="link-auth-switch">{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p>
        ) : (
          <p className="mt-7 text-center text-xs text-muted-foreground"><button type="button" onClick={() => setStep('form')} className="font-bold text-primary hover:underline">Back to form</button></p>
        )}`;

code = code.replace(targetBottom, newBottom);

fs.writeFileSync(path, code);
console.log('Auth bottom patched');
