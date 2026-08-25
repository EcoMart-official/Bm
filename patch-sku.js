const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove SKU field from form
code = code.replace('<Field label="SKU" value={form.sku || \'\'} onChange={(v) => setForm({ ...form, sku: v })} test="input-products-sku" />', '');

// 2. Auto-generate SKU on insert
const oldInsert = "else await db.insert(kind, isProducts ? { name: form.name, sku: form.sku, price: Number(form.price || 0)";
const newInsert = "else await db.insert(kind, isProducts ? { name: form.name, sku: form.sku || ('PRD-' + Date.now().toString(36).toUpperCase()), price: Number(form.price || 0)";
code = code.replace(oldInsert, newInsert);

// 3. (Optional) Remove SKU from the list item display
code = code.replace(
    "${row.sku || 'No SKU'} · ${row.stock_quantity ?? '—'} ${row.unit || 'units'}",
    "${row.stock_quantity ?? '—'} ${row.unit || 'units'} in stock"
);

fs.writeFileSync(path, code);
console.log('SKU patched');
