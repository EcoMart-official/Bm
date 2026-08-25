const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add Pencil to imports
if (!code.includes('Pencil,')) {
    code = code.replace('Package, Plus, Printer,', 'Package, Pencil, Plus, Printer,');
}

// 2. Change Settings2 to Pencil in the edit button
code = code.replace('<Settings2 size={16} />', '<Pencil size={16} />');

// 3. Add deleteModal state
code = code.replace(
    'const [modal, setModal] = useState(false);',
    'const [modal, setModal] = useState(false);\n  const [deleteModal, setDeleteModal] = useState<Row | null>(null);'
);

// 4. Update remove function
const oldRemove = "const remove = async (row: Row) => { if (window.confirm(`Remove ${row.name}?`)) { try { await db.remove(kind, row.id); await table.reload(); } catch { /* error state remains available on next reload */ } } };";
const newRemove = `const remove = (row: Row) => { setDeleteModal(row); };
  const confirmRemove = async () => { if (!deleteModal) return; try { await db.remove(kind, deleteModal.id); await table.reload(); setDeleteModal(null); } catch { /* ignore */ } };`;

code = code.replace(oldRemove, newRemove);

// 5. Add Delete Modal JSX
const deleteModalJSX = `
    {deleteModal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/35 p-0 sm:items-center sm:p-5"><div className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><Trash2 size={24} /></div><h3 className="mb-2 text-lg font-bold">Delete {isProducts ? 'product' : 'customer'}?</h3><p className="mb-6 text-sm text-muted-foreground">Are you sure you want to delete <strong>{deleteModal.name}</strong>? This action cannot be undone.</p><div className="flex gap-3"><button onClick={() => setDeleteModal(null)} className="min-h-11 flex-1 rounded-xl border border-border text-sm font-bold">Cancel</button><button onClick={confirmRemove} className="min-h-11 flex-1 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:bg-destructive/90">Delete</button></div></div></div>}
`;

code = code.replace(
    '{modal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/35 p-0 sm:items-center sm:p-5">',
    deleteModalJSX + '\n    {modal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/35 p-0 sm:items-center sm:p-5">'
);

fs.writeFileSync(path, code);
console.log('Patched');
