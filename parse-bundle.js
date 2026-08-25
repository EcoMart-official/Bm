const fs = require('fs');
const js = fs.readFileSync('artifacts/commercial-billing/dist/public/assets/index-B4NWV1z_.js', 'utf8');

const regexes = [
  /function Invoices\(\)\{/,
  /function CrudPage\(/,
  /function SimpleList\(/,
  /function Reports\(\)\{/,
  /function Settings\(\)\{/,
  /function Auth\(/
];

regexes.forEach(r => {
  const match = js.match(r);
  if (match) {
    const idx = match.index;
    console.log(`\n\n--- MATCH ${r} ---`);
    console.log(js.substring(idx, idx + 2000));
  } else {
    console.log(`\n\n--- NOT FOUND ${r} ---`);
  }
});
