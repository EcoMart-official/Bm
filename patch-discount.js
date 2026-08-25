const fs = require('fs');
let code = fs.readFileSync('artifacts/commercial-billing/src/App.tsx', 'utf8');

code = code.replace(
  /<select[\s\S]*?<\/select>/,
  "<CustomDropdown value={discountType} onChange={(v) => { setDiscountType(v); setDiscountValue(''); }} options={[{label: 'Amount', value: 'amount'}, {label: 'Percent (%)', value: 'percentage'}]} />"
);
fs.writeFileSync('artifacts/commercial-billing/src/App.tsx', code);
