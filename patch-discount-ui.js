const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetUI = `<div className="flex gap-2">
            <select 
              value={discountType} 
              onChange={(e) => { setDiscountType(e.target.value as 'amount'|'percentage'); setDiscountValue(''); }} 
              className="input-shell min-h-9 w-24 px-2 text-xs"
            >
              <option value="amount">Amount</option>
              <option value="percentage">Percent (%)</option>
            </select>
            <input 
              type="number" 
              min="0" 
              placeholder="0" 
              value={discountValue} 
              onChange={(e) => setDiscountValue(e.target.value)} 
              className="input-shell min-h-9 w-full px-3 text-sm"
            />
          </div>
          {Number(discountValue) > 0 && discountAmount > subtotal && (
            <p className="mt-1 text-[10px] text-destructive">Discount cannot exceed subtotal.</p>
          )}`;

const newUI = `<div className="flex gap-2">
            <select 
              value={discountType} 
              onChange={(e) => { setDiscountType(e.target.value as 'amount'|'percentage'); setDiscountValue(''); }} 
              className="input-shell min-h-9 w-28 px-1 sm:px-2 text-xs"
            >
              <option value="amount">Amount</option>
              <option value="percentage">Percent (%)</option>
            </select>
            <input 
              type="number" 
              min="0" 
              placeholder="0" 
              value={discountValue} 
              onChange={(e) => setDiscountValue(e.target.value)} 
              className="input-shell min-h-9 w-full px-3 text-sm"
            />
          </div>
          {Number(discountValue) > 0 && discountAmount > subtotal ? (
            <p className="mt-1.5 text-[11px] font-medium text-destructive">Discount cannot exceed subtotal.</p>
          ) : Number(discountValue) > 0 && subtotal > 0 ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground font-medium">
              {discountType === 'percentage' 
                ? \`Equals \${discountAmount.toFixed(2)} amount discount\` 
                : \`Equals \${((discountAmount / subtotal) * 100).toFixed(2)}% discount\`}
            </p>
          ) : null}`;

if (code.includes(targetUI)) {
  code = code.replace(targetUI, newUI);
  fs.writeFileSync(path, code);
  console.log('UI patched successfully.');
} else {
  console.log('Target UI string not found! Checking alternative match...');
  // try replacing just the select class
  code = code.replace(/className="input-shell min-h-9 w-24 px-2 text-xs"/g, 'className="input-shell min-h-9 w-28 px-1 sm:px-2 text-xs"');
  fs.writeFileSync(path, code);
}
