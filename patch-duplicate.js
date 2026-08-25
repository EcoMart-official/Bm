const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldSave = "const save = async () => { try { if (editing?.id) await db.update(kind, editing.id, isProducts ? { name: form.name, sku: form.sku, price: Number(form.price || 0), cost: Number(form.cost || 0), stock_quantity: Number(form.stock_quantity || 0), low_stock_threshold: Number(form.low_stock_threshold || 0), unit: form.unit || 'unit' } : { name: form.name, email: form.email, phone: form.phone, address: form.address, notes: form.notes }); else await db.insert(kind, isProducts ? { name: form.name, sku: form.sku || ('PRD-' + Date.now().toString(36).toUpperCase()), price: Number(form.price || 0), cost: Number(form.cost || 0), stock_quantity: Number(form.stock_quantity || 0), low_stock_threshold: Number(form.low_stock_threshold || 0), unit: form.unit || 'unit', is_active: true } : { name: form.name, email: form.email, phone: form.phone, address: form.address, notes: form.notes }); setModal(false); await table.reload(); } catch (e) { setForm((old) => ({ ...old, _error: getSupabaseErrorMessage(e, 'Could not save.') })); } };";

const newSave = `const save = async () => {
    try {
      if (isProducts) {
        const normalized = form.name?.trim().toLowerCase();
        const duplicate = table.data.find(r => r.name?.trim().toLowerCase() === normalized && r.id !== editing?.id);
        if (duplicate) {
          setForm(old => ({ ...old, _error: 'A product with this name already exists.' }));
          return;
        }
      }

      if (editing?.id) {
        await db.update(kind, editing.id, isProducts 
          ? { name: form.name, sku: form.sku, price: Number(form.price || 0), cost: Number(form.cost || 0), stock_quantity: Number(form.stock_quantity || 0), low_stock_threshold: Number(form.low_stock_threshold || 0), unit: form.unit || 'unit' } 
          : { name: form.name, email: form.email, phone: form.phone, address: form.address, notes: form.notes });
      } else {
        await db.insert(kind, isProducts 
          ? { name: form.name, sku: form.sku || ('PRD-' + Date.now().toString(36).toUpperCase()), price: Number(form.price || 0), cost: Number(form.cost || 0), stock_quantity: Number(form.stock_quantity || 0), low_stock_threshold: Number(form.low_stock_threshold || 0), unit: form.unit || 'unit', is_active: true } 
          : { name: form.name, email: form.email, phone: form.phone, address: form.address, notes: form.notes });
      }
      setModal(false);
      await table.reload();
    } catch (e) {
      setForm((old) => ({ ...old, _error: getSupabaseErrorMessage(e, 'Could not save.') }));
    }
  };`;

code = code.replace(oldSave, newSave);
fs.writeFileSync(path, code);
console.log('Duplicate check patched');
