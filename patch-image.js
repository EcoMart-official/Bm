const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add ImagePlus, Camera to imports
if (!code.includes('ImagePlus,')) {
    code = code.replace('Menu, MoreHorizontal, Package,', 'ImagePlus, Camera, Menu, MoreHorizontal, Package,');
}

// 2. Add image states to CrudPage
code = code.replace(
    'const [form, setForm] = useState<Row>({});',
    'const [form, setForm] = useState<Row>({});\n  const [imagePreview, setImagePreview] = useState<string | null>(null);'
);

// 3. Update open function
const oldOpen = "const open = (row?: Row) => { setEditing(row || null); setForm(row ? { ...row } : {}); setModal(true); };";
const newOpen = `const open = (row?: Row) => {
    setEditing(row || null);
    setForm(row ? { ...row } : {});
    setModal(true);
    if (isProducts && row) {
      setImagePreview(localStorage.getItem(\`product_image_\${row.id}\`) || null);
    } else {
      setImagePreview(null);
    }
  };`;
code = code.replace(oldOpen, newOpen);

// 4. Update save function
const oldSave = `const save = async () => {
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

      let savedId = editing?.id;

      if (editing?.id) {
        await db.update(kind, editing.id, isProducts 
          ? { name: form.name, price: Number(form.price || 0), cost: Number(form.cost || 0), stock_quantity: Number(form.stock_quantity || 0), low_stock_threshold: Number(form.low_stock_threshold || 0), unit: form.unit || 'unit' } 
          : { name: form.name, email: form.email, phone: form.phone, address: form.address, notes: form.notes });
      } else {
        const result = await db.insert(kind, isProducts 
          ? { name: form.name, sku: ('PRD-' + Date.now().toString(36).toUpperCase()), price: Number(form.price || 0), cost: Number(form.cost || 0), stock_quantity: Number(form.stock_quantity || 0), low_stock_threshold: Number(form.low_stock_threshold || 0), unit: form.unit || 'unit', is_active: true } 
          : { name: form.name, email: form.email, phone: form.phone, address: form.address, notes: form.notes });
        savedId = result.id;
      }
      
      if (isProducts && savedId) {
        if (imagePreview) {
          localStorage.setItem(\`product_image_\${savedId}\`, imagePreview);
        } else {
          localStorage.removeItem(\`product_image_\${savedId}\`);
        }
      }

      setModal(false);
      await table.reload();
    } catch (e) {
      setForm((old) => ({ ...old, _error: getSupabaseErrorMessage(e, 'Could not save.') }));
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`;
code = code.replace(oldSave, newSave);

// 5. Update UI in row rendering
const oldIconBox = '<div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isProducts ? \'bg-secondary/30 text-foreground\' : \'bg-accent/12 text-accent\'}`}>{isProducts ? <Package size={17} /> : <UserRound size={17} />}</div>';
const newIconBox = '<div className={`grid h-10 w-10 shrink-0 overflow-hidden place-items-center rounded-xl ${isProducts ? \'bg-secondary/30 text-foreground\' : \'bg-accent/12 text-accent\'}`}>{isProducts ? (localStorage.getItem(`product_image_${row.id}`) ? <img src={localStorage.getItem(`product_image_${row.id}`) || \'\'} alt="" className="h-full w-full object-cover" /> : <Package size={17} />) : <UserRound size={17} />}</div>';
code = code.replace(oldIconBox, newIconBox);

// 6. Add image upload UI to the form
const imageUploadUI = `
{isProducts && (
  <div className="col-span-full mb-2">
    <label className="block text-xs font-bold mb-2">Product Image (optional)</label>
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-dashed border-border bg-muted/50">
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Camera size={18} />
          </div>
        )}
      </div>
      <div className="flex-1">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-primary hover:file:bg-primary/20"
        />
        {imagePreview && (
          <button type="button" onClick={() => setImagePreview(null)} className="mt-2 text-[11px] font-bold text-destructive hover:underline">Remove image</button>
        )}
      </div>
    </div>
  </div>
)}
`;

code = code.replace('<Field label="Name"', imageUploadUI + '<Field label="Name"');

fs.writeFileSync(path, code);
console.log('Image upload patched');
