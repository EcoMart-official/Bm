const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Hide custom products from the main product list
code = code.replace(
  "const visibleProducts = products.data.filter((p) => `${p.name} ${p.sku || ''}`.toLowerCase().includes(query.toLowerCase()));",
  "const visibleProducts = products.data.filter((p) => p.unit !== 'custom-item' && `${p.name} ${p.sku || ''}`.toLowerCase().includes(query.toLowerCase()));"
);

code = code.replace(
  "const rows = table.data.filter((r) => `${r.name} ${r.email || ''}`.toLowerCase().includes(search.toLowerCase()));",
  "const rows = table.data.filter((r) => `${r.name} ${r.email || ''}`.toLowerCase().includes(search.toLowerCase()) && (isProducts ? r.unit !== 'custom-item' : true));"
);

// 2. Add custom product state and UI to InvoiceNew
const searchBox = '<div className="relative mb-3"><Search className="absolute left-3 top-3 text-muted-foreground" size={16} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to add a product…" className="input-shell w-full pl-10 pr-3 text-sm" data-testid="input-product-search" /></div>';

const newSearchBox = `
<div className="relative mb-3"><Search className="absolute left-3 top-3 text-muted-foreground" size={16} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to add a product…" className="input-shell w-full pl-10 pr-3 text-sm" data-testid="input-product-search" /></div>
{query && !products.loading && visibleProducts.length === 0 && (
  <button
    type="button"
    onClick={() => {
      setCustomItemModal(true);
      setCustomItemForm({ name: query, price: '', quantity: 1 });
      setQuery('');
    }}
    className="mb-4 flex w-full items-center justify-between rounded-xl border border-border bg-primary/5 p-3 text-left text-sm font-bold text-primary hover:bg-primary/10"
  >
    <span>Add "{query}" as custom item</span>
    <Plus size={16} />
  </button>
)}
`;

code = code.replace(searchBox, newSearchBox);

// 3. Add CustomItem state to InvoiceNew
const stateInsertionPoint = "const [items, setItems] = useState<Row[]>([]);";
const newStates = `const [items, setItems] = useState<Row[]>([]);
  const [customItemModal, setCustomItemModal] = useState(false);
  const [customItemForm, setCustomItemForm] = useState<any>({ name: '', price: '', quantity: 1 });
`;
code = code.replace(stateInsertionPoint, newStates);

// 4. Update the InvoiceNew save function to handle custom items
const oldSaveFuncRegex = /const save = async \(\) => \{[\s\S]*?try \{[\s\S]*?if \(!customerId\) throw new Error\('Choose a customer before creating the invoice.'\);[\s\S]*?const result = await db\.rpc\('create_invoice_transaction', \{[\s\S]*?\}\);[\s\S]*?setLocation\('\/invoices'\);[\s\S]*?\} catch \(e\) \{ setMessage\(getSupabaseErrorMessage\(e, 'Could not save the invoice.'\)\); \} finally \{ setSaving\(false\); \}\s*\};/g;

// Find the match to make sure it exists
const match = code.match(oldSaveFuncRegex);
if (match) {
  const newSaveFunc = `const save = async () => {
    try {
      setSaving(true);
      if (!items.length) throw new Error('Add at least one item.');
      if (!customerId) throw new Error('Choose a customer before creating the invoice.');
      
      const finalItems = [];
      for (const item of items) {
        if (item.is_custom) {
          const newProduct = await db.insert('products', {
            name: item.name,
            sku: 'CUSTOM-' + Date.now().toString(36).toUpperCase(),
            price: Number(item.price),
            cost: 0,
            stock_quantity: 999999, // large stock so it doesn't run out
            unit: 'custom-item',
            is_active: true
          });
          finalItems.push({ product_id: newProduct.id, quantity: item.quantity, unit_price: item.price });
        } else {
          finalItems.push({ product_id: item.product_id, quantity: item.quantity, unit_price: item.price });
        }
      }

      const result = await db.rpc('create_invoice_transaction', {
        invoice_data: { customer_id: customerId, notes },
        line_items: finalItems,
      });
      setLocation('/invoices');
    } catch (e) { setMessage(getSupabaseErrorMessage(e, 'Could not save the invoice.')); } finally { setSaving(false); }
  };`;
  code = code.replace(oldSaveFuncRegex, newSaveFunc);
} else {
  console.log('Regex match failed for save function!');
}

// 5. Inject the CustomItem modal at the end of InvoiceNew
const customModalJSX = `
    {customItemModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/35 p-0 sm:items-center sm:p-5">
        <div className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-extrabold">Custom item</h3>
            <button onClick={() => setCustomItemModal(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
          </div>
          <div className="space-y-4">
            <Field label="Item description" value={customItemForm.name} onChange={(v) => setCustomItemForm({ ...customItemForm, name: v })} test="input-custom-item-name" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price" type="number" value={customItemForm.price} onChange={(v) => setCustomItemForm({ ...customItemForm, price: v })} test="input-custom-item-price" />
              <Field label="Quantity" type="number" value={customItemForm.quantity} onChange={(v) => setCustomItemForm({ ...customItemForm, quantity: v })} test="input-custom-item-quantity" />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setCustomItemModal(false)} className="min-h-11 flex-1 rounded-xl border border-border text-sm font-bold">Cancel</button>
            <button 
              disabled={!customItemForm.name || !customItemForm.price} 
              onClick={() => {
                setItems([...items, { is_custom: true, product_id: 'custom-' + Date.now(), name: customItemForm.name, price: Number(customItemForm.price), quantity: Number(customItemForm.quantity), unit: 'custom-item' }]);
                setCustomItemModal(false);
              }} 
              className="btn-primary min-h-11 flex-1 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              Add to invoice
            </button>
          </div>
        </div>
      </div>
    )}
`;

code = code.replace(/  <\/div>;\n}\n\nfunction CrudPage/, customModalJSX + '\n  </div>;\n}\n\nfunction CrudPage');

fs.writeFileSync(path, code);
console.log('Custom item feature added');
