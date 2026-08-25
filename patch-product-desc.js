const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update the open() function
const oldOpen = `  const open = (row?: Row) => {
    setEditing(row || null);
    setForm(row ? { ...row } : {});
    setModal(true);
    if (isProducts && row) {
      setImagePreview(localStorage.getItem(\`product_image_\${row.id}\`) || null);
    } else {
      setImagePreview(null);
    }
  };`;

const newOpen = `  const open = (row?: Row) => {
    setEditing(row || null);
    if (isProducts && row) {
      setForm({ ...row, description: localStorage.getItem(\`product_desc_\${row.id}\`) || '' });
      setImagePreview(localStorage.getItem(\`product_image_\${row.id}\`) || null);
    } else {
      setForm(row ? { ...row } : {});
      setImagePreview(null);
    }
    setModal(true);
  };`;

code = code.replace(oldOpen, newOpen);

// 2. Update the save function to store description
const oldSavePart = `      if (isProducts && savedId) {
        if (imagePreview) {
          localStorage.setItem(\`product_image_\${savedId}\`, imagePreview);
        } else {
          localStorage.removeItem(\`product_image_\${savedId}\`);
        }
      }`;

const newSavePart = `      if (isProducts && savedId) {
        if (imagePreview) {
          localStorage.setItem(\`product_image_\${savedId}\`, imagePreview);
        } else {
          localStorage.removeItem(\`product_image_\${savedId}\`);
        }
        if (form.description) {
          localStorage.setItem(\`product_desc_\${savedId}\`, form.description);
        } else {
          localStorage.removeItem(\`product_desc_\${savedId}\`);
        }
      }`;

code = code.replace(oldSavePart, newSavePart);

// 3. Update the UI to add textarea
const oldUI = `{isProducts ? <><Field label="Price" type="number" value={form.price ?? ''} onChange={(v) => setForm({ ...form, price: v })} test="input-products-price" /><Field label="Cost" type="number" value={form.cost ?? ''} onChange={(v) => setForm({ ...form, cost: v })} test="input-products-cost" /><Field label="Stock quantity"`;

const newUI = `{isProducts ? <><div className="col-span-full mb-1"><label className="block text-xs font-bold mb-2">Description (optional)</label><textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-shell min-h-20 w-full resize-none p-3 text-sm" placeholder="Any specifications or details..."></textarea></div><Field label="Price" type="number" value={form.price ?? ''} onChange={(v) => setForm({ ...form, price: v })} test="input-products-price" /><Field label="Cost" type="number" value={form.cost ?? ''} onChange={(v) => setForm({ ...form, cost: v })} test="input-products-cost" /><Field label="Stock quantity"`;

code = code.replace(oldUI, newUI);

fs.writeFileSync(path, code);
console.log('Product description patched');
