const fs = require('fs');
const js = fs.readFileSync('artifacts/commercial-billing/dist/public/assets/index-B4NWV1z_.js', 'utf8');
const idx = js.indexOf('function InvoiceNew');
console.log(js.substring(idx - 100, Math.min(idx + 1000, js.length)));
