const fs = require('fs');
let code = fs.readFileSync('artifacts/commercial-billing/src/App.tsx', 'utf8');

const fieldImpl = `function Field({ label, value, onChange, type = 'text', required, test }: { label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean; test?: string }) {
  return (
    <label className="block text-xs font-bold">{label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="input-shell mt-2 w-full px-3 text-sm font-normal" data-testid={test} />
    </label>
  );
}
`;

code = code.replace('function Logo() {', fieldImpl + '\nfunction Logo() {');
code = code.replace(/void saveCustomer\(\)/g, 'void saveNewCustomerForm()');
code = code.replace(/savingCustomer/g, 'saving');
code = code.replace(/setCustomerId\(result\.id\)/g, 'setCustomerId((result as any).id)');

fs.writeFileSync('artifacts/commercial-billing/src/App.tsx', code);
