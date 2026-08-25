const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update visibleCustomers logic to include phone and email
const oldVisibleCustomers = 'const visibleCustomers = useMemo(() => customers.data.filter(c => c.name?.toLowerCase().includes(customerQuery.toLowerCase())), [customers.data, customerQuery]);';
const newVisibleCustomers = 'const visibleCustomers = useMemo(() => { const q = customerQuery.toLowerCase(); return customers.data.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)); }, [customers.data, customerQuery]);';
code = code.replace(oldVisibleCustomers, newVisibleCustomers);

// 2. Add createCustomerWithNumber function
const createCustomerFn = `
  const createCustomerWithNumber = async () => {
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
  };
`;

code = code.replace('const save = async () => {', createCustomerFn + '\n  const save = async () => {');

// 3. Update the input placeholder and add the "Create with this number" button
const oldInputJSX = 'placeholder="Search to select a customer…"';
const newInputJSX = 'placeholder="Type customer phone or name to search / auto-create"';
code = code.replace(oldInputJSX, newInputJSX);

const oldNoCustomersFound = '<div className="p-3 text-xs text-muted-foreground">No customers found.</div>';
const newNoCustomersFound = `
  <>
    <div className="p-3 text-xs text-muted-foreground">No customers found.</div>
    {customerQuery.length >= 10 && (
      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); createCustomerWithNumber(); }}
        className="flex w-full items-center justify-between border-t border-border/60 bg-primary/5 px-3 py-3 text-left text-sm font-bold text-primary hover:bg-primary/10"
      >
        <span>Create with this number</span>
        <Plus size={16} />
      </button>
    )}
  </>
`;
code = code.replace(oldNoCustomersFound, newNoCustomersFound);

fs.writeFileSync(path, code);
console.log('Customer search patched');
