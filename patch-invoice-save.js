const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldSave = `  const save = async () => {
    if (!items.length) { setMessage('Add at least one product before saving.'); return; }
    setSaving(true); setMessage('');
    try {
      if (!customerId) throw new Error('Choose a customer before creating the invoice.');
      await db.rpc<Row>('create_invoice_transaction', {
        invoice_data: { customer_id: customerId, issue_date: new Date().toISOString().slice(0, 10), notes },
        line_items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.price }))
      });
      setLocation('/invoices');
    } catch (e) { setMessage(getSupabaseErrorMessage(e, 'Could not save the invoice.')); } finally { setSaving(false); }
  };`;

const newSave = `  const save = async () => {
    if (!items.length) { setMessage('Add at least one product before saving.'); return; }
    setSaving(true); setMessage('');
    try {
      if (!customerId) throw new Error('Choose a customer before creating the invoice.');
      
      const finalItems = [];
      for (const item of items) {
        if (item.is_custom) {
          const newProduct = await db.insert('products', {
            name: item.name,
            sku: 'CUSTOM-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase(),
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

      await db.rpc('create_invoice_transaction', {
        invoice_data: { customer_id: customerId, issue_date: new Date().toISOString().slice(0, 10), notes },
        line_items: finalItems
      });
      setLocation('/invoices');
    } catch (e) { setMessage(getSupabaseErrorMessage(e, 'Could not save the invoice.')); } finally { setSaving(false); }
  };`;

code = code.replace(oldSave, newSave);

fs.writeFileSync(path, code);
console.log('Save patched');
