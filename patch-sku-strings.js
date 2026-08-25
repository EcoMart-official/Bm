const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// Line 163: <div className="mono mt-1 text-[10px] text-muted-foreground">{p.sku || 'No SKU'}</div>
code = code.replace('<div className="mono mt-1 text-[10px] text-muted-foreground">{p.sku || \'No SKU\'}</div>', '');

// Line 211: <p className="mt-1 text-xs text-muted-foreground">Search by product name or SKU.</p>
code = code.replace('Search by product name or SKU.', 'Search by product name.');

// Line 211: <span className="mono text-[10px] text-muted-foreground">{product.sku || 'No SKU'}</span>
code = code.replace('<span className="mono text-[10px] text-muted-foreground">{product.sku || \'No SKU\'}</span>', '');

// Line 232: description={isProducts ? 'Keep prices, SKUs, and stock in one steady place.' :
code = code.replace('Keep prices, SKUs, and stock in one steady place.', 'Keep prices and stock in one steady place.');

// Line 233: placeholder={isProducts ? 'Search product or SKU' :
code = code.replace('Search product or SKU', 'Search product');

// Remove from useTable search filter (line 218):
// filter((r) => \`\${r.name} \${r.email || ''} \${r.sku || ''}\`.toLowerCase()
code = code.replace('`${r.name} ${r.email || \'\'} ${r.sku || \'\'}`', '`${r.name} ${r.email || \'\'}`');

fs.writeFileSync(path, code);
console.log('SKU strings patched');
