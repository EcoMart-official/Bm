const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Replace createCustomerWithNumber with the new states and functions
const oldCreateFn = `const createCustomerWithNumber = async () => {
    try {
      setSaving(true);
      const newCustomer = await db.insert('customers', { name: 'Customer ' + customerQuery, phone: customerQuery });
      await customers.reload();
      setCustomerId(newCustomer.id);
      setCustomerDropdown(false);
    } catch (e) {
      setMessage(getSupabaseErrorMessage(e, 'Could not create customer.'));
    } finally {
      setSaving(false);
    }
  };`;

const newCreateFn = `const [customerModal, setCustomerModal] = useState(false);
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
      setSaving(true);
      const result = await db.insert('customers', { 
        name: newCustomerForm.name, 
        email: newCustomerForm.email, 
        phone: newCustomerForm.phone, 
        address: newCustomerForm.address, 
        notes: newCustomerForm.notes 
      });
      await customers.reload();
      setCustomerId(result.id);
      setCustomerModal(false);
    } catch (e) {
      setNewCustomerForm(old => ({ ...old, _error: getSupabaseErrorMessage(e, 'Could not create customer.') }));
    } finally {
      setSaving(false);
    }
  };`;

// Because indentation might slightly differ in the file, we can replace it differently if exact match fails
if (code.includes(oldCreateFn)) {
  code = code.replace(oldCreateFn, newCreateFn);
} else {
  // Let's use a regex to match it
  const regex = /const createCustomerWithNumber = async \(\) => \{[\s\S]*?finally \{\s*setSaving\(false\);\s*\}\s*\};/;
  code = code.replace(regex, newCreateFn);
}

// 2. Update the button onClick
code = code.replace(
  'onClick={(e) => { e.preventDefault(); createCustomerWithNumber(); }}',
  'onClick={(e) => { e.preventDefault(); openCustomerModal(); }}'
);

// 3. Inject the modal UI at the end of InvoiceNew
const modalJSX = `
    {customerModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/35 p-0 sm:items-center sm:p-5">
        <div className="w-full max-w-lg rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">New record</div>
              <h3 className="mt-1 text-xl font-extrabold">Add customer</h3>
            </div>
            <button onClick={() => setCustomerModal(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
          </div>
          {newCustomerForm._error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{newCustomerForm._error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={newCustomerForm.name || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, name: v })} test="input-new-customer-name" required />
            <Field label="Email" type="email" value={newCustomerForm.email || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, email: v })} test="input-new-customer-email" />
            <Field label="Phone" value={newCustomerForm.phone || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, phone: v })} test="input-new-customer-phone" />
            <Field label="Address" value={newCustomerForm.address || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, address: v })} test="input-new-customer-address" />
            <Field label="Notes" value={newCustomerForm.notes || ''} onChange={(v) => setNewCustomerForm({ ...newCustomerForm, notes: v })} test="input-new-customer-notes" />
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setCustomerModal(false)} className="min-h-11 flex-1 rounded-xl border border-border text-sm font-bold">Cancel</button>
            <button disabled={!newCustomerForm.name || !supabaseConfigured} onClick={() => void saveNewCustomerForm()} className="btn-primary min-h-11 flex-1 rounded-xl text-sm font-bold disabled:opacity-50">Add record</button>
          </div>
        </div>
      </div>
    )}
  </div>;
}

function CrudPage`;

code = code.replace(/  <\/div>;\n}\n\nfunction CrudPage/, modalJSX);

fs.writeFileSync(path, code);
console.log('Customer modal patched inside InvoiceNew');
