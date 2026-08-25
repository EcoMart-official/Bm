const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add stockModal state
code = code.replace(
    'const [deleteModal, setDeleteModal] = useState<Row | null>(null);',
    'const [deleteModal, setDeleteModal] = useState<Row | null>(null);\n  const [stockModal, setStockModal] = useState<Row | null>(null);\n  const [stockAdjust, setStockAdjust] = useState<string>(\'\');'
);

// 2. Add confirmStock function
const confirmStockFn = `
  const confirmStock = async () => {
    if (!stockModal) return;
    try {
      const current = Number(stockModal.stock_quantity || 0);
      const adjust = Number(stockAdjust || 0);
      await db.update('products', stockModal.id, { stock_quantity: current + adjust });
      await table.reload();
      setStockModal(null);
    } catch { /* ignore */ }
  };
`;

code = code.replace('const confirmRemove =', confirmStockFn + '\n  const confirmRemove =');

// 3. Add icon to row
const boxesIcon = `{isProducts && <button onClick={() => { setStockModal(row); setStockAdjust(''); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Adjust stock"><Boxes size={16} /></button>}`;

code = code.replace('<button onClick={() => open(row)}', boxesIcon + '<button onClick={() => open(row)}');

// 4. Add Modal JSX
const stockModalJSX = `
    {stockModal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/35 p-0 sm:items-center sm:p-5"><div className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7"><div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Adjust Stock</div><h3 className="mt-1 text-xl font-extrabold">{stockModal.name}</h3></div><button onClick={() => setStockModal(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div><div className="mb-4 text-sm text-muted-foreground">Current stock: <strong>{stockModal.stock_quantity ?? 0} {stockModal.unit || 'units'}</strong></div><Field label="Adjustment (e.g. 10 or -10)" type="number" value={stockAdjust} onChange={setStockAdjust} test="input-stock-adjust" /><div className="mt-6 flex gap-3"><button onClick={() => setStockModal(null)} className="min-h-11 flex-1 rounded-xl border border-border text-sm font-bold">Cancel</button><button onClick={confirmStock} disabled={!stockAdjust || Number(stockAdjust) === 0} className="btn-primary min-h-11 flex-1 rounded-xl text-sm font-bold disabled:opacity-50">Update Stock</button></div></div></div>}
`;

code = code.replace(
    '{deleteModal &&',
    stockModalJSX + '\n        {deleteModal &&'
);

fs.writeFileSync(path, code);
console.log('Stock adjustment patched');
