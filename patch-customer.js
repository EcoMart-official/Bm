const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const search = '<label className="mb-2 block text-xs font-bold">Customer <span className="font-normal text-muted-foreground">(optional)</span></label><select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input-shell mb-6 w-full px-3 text-sm" data-testid="select-invoice-customer"><option value="">Walk-in customer</option>{customers.data.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select>';

const replacement = '<label className="mb-2 block text-xs font-bold">Customer <span className="text-accent">*</span></label><div className="relative mb-6">{customerId ? (<div className="input-shell flex min-h-10 w-full items-center justify-between px-3 text-sm"><span className="font-bold">{customers.data.find(c => c.id === customerId)?.name || \'Unknown customer\'}</span><button onClick={() => { setCustomerId(\'\'); setCustomerQuery(\'\'); }} className="p-1 text-muted-foreground hover:text-destructive"><X size={15} /></button></div>) : (<><Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} /><input value={customerQuery} onChange={(e) => { setCustomerQuery(e.target.value); setCustomerDropdown(true); }} onFocus={() => setCustomerDropdown(true)} onBlur={() => setTimeout(() => setCustomerDropdown(false), 200)} placeholder="Search to select a customer…" className="input-shell min-h-10 w-full pl-10 pr-3 text-sm" data-testid="input-customer-search" />{customerDropdown && (<div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-auto rounded-xl border border-border bg-card shadow-float">{customers.loading ? (<div className="p-3 text-xs text-muted-foreground">Loading…</div>) : visibleCustomers.length ? (visibleCustomers.map((c) => (<button key={c.id} onClick={() => { setCustomerId(c.id); setCustomerDropdown(false); }} className="flex w-full items-center px-3 py-2.5 text-left text-sm hover:bg-muted" data-testid={`button-select-customer-${c.id}`}>{c.name}</button>))) : (<div className="p-3 text-xs text-muted-foreground">No customers found.</div>)}</div>)}</>)}</div>';

code = code.replace(search, replacement);

code = code.replace(
    "const [customerId, setCustomerId] = useState('');",
    "const [customerId, setCustomerId] = useState('');\n  const [customerQuery, setCustomerQuery] = useState('');\n  const [customerDropdown, setCustomerDropdown] = useState(false);\n  const visibleCustomers = useMemo(() => customers.data.filter(c => c.name?.toLowerCase().includes(customerQuery.toLowerCase())), [customers.data, customerQuery]);"
);

fs.writeFileSync(path, code);
console.log('Customer UI patched');
