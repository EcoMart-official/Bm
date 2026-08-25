const fs = require('fs');
let code = fs.readFileSync('artifacts/commercial-billing/src/App.tsx', 'utf8');
code = code.replace(
  "setDiscountType(v)",
  "setDiscountType(v as 'amount' | 'percentage')"
);
fs.writeFileSync('artifacts/commercial-billing/src/App.tsx', code);
