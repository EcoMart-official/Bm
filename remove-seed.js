const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const \[seeding, setSeeding\] = useState\(false\);[\s\S]*?\/\/ Auto-seed only once if empty\s*seedCustomers\(\);\s*\}\s*\}, \[table\.data, isProducts, seeding\]\);/, '');

fs.writeFileSync(path, code);
