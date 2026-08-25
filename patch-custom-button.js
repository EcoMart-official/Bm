const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove the old dynamic button
const oldDynamicButton = `{query && !products.loading && visibleProducts.length === 0 && (
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
)}`;
code = code.replace(oldDynamicButton, '');

// 2. Add the custom add button to the Line items header
const oldHeader = `<span className="mono text-xs text-muted-foreground">{items.length} item{items.length === 1 ? '' : 's'}</span></div>`;
const newHeader = `<div className="flex items-center gap-3"><button type="button" onClick={() => { setCustomItemForm({ title: '', description: '', price: '', quantity: 1 }); setCustomItemModal(true); }} className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20"><Plus size={14}/> Custom add</button><span className="mono text-xs text-muted-foreground">{items.length} item{items.length === 1 ? '' : 's'}</span></div></div>`;
code = code.replace(oldHeader, newHeader);

// 3. Update CustomItemModal structure
const oldModalInner = `<div className="space-y-4">
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
          </div>`;

const newModalInner = `<div className="space-y-4">
            <Field label="Product Title" value={customItemForm.title || ''} onChange={(v) => setCustomItemForm({ ...customItemForm, title: v })} test="input-custom-item-title" />
            <div className="grid gap-2">
               <label className="text-xs font-bold">Product Description (optional)</label>
               <textarea value={customItemForm.description || ''} onChange={(e) => setCustomItemForm({ ...customItemForm, description: e.target.value })} className="input-shell min-h-16 w-full resize-none p-3 text-sm" placeholder="Any specifications or details..."></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price" type="number" value={customItemForm.price} onChange={(v) => setCustomItemForm({ ...customItemForm, price: v })} test="input-custom-item-price" />
              <Field label="Quantity" type="number" value={customItemForm.quantity} onChange={(v) => setCustomItemForm({ ...customItemForm, quantity: v })} test="input-custom-item-quantity" />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setCustomItemModal(false)} className="min-h-11 flex-1 rounded-xl border border-border text-sm font-bold">Cancel</button>
            <button 
              disabled={!customItemForm.title || !customItemForm.price} 
              onClick={() => {
                const combinedName = customItemForm.title + (customItemForm.description ? ' - ' + customItemForm.description : '');
                setItems([...items, { is_custom: true, product_id: 'custom-' + Date.now(), name: combinedName, price: Number(customItemForm.price), quantity: Number(customItemForm.quantity), unit: 'custom-item' }]);
                setCustomItemModal(false);
              }} 
              className="btn-primary min-h-11 flex-1 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              Add to invoice
            </button>
          </div>`;

code = code.replace(oldModalInner, newModalInner);

fs.writeFileSync(path, code);
