const fs = require('fs');
let code = fs.readFileSync('artifacts/commercial-billing/src/App.tsx', 'utf8');

// Remove import { Field }
code = code.replace(/import \{ Field \} from "@\/components\/ui\/field";\n/, '');

// Rename function Field
code = code.replace(/function Field\(/, 'function AppField(');
// Use AppField
code = code.replace(/<Field /g, '<AppField ');

fs.writeFileSync('artifacts/commercial-billing/src/App.tsx', code);
