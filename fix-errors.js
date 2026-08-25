const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/e instanceof Error \? e.message : 'Could not load this data.'/g, "getSupabaseErrorMessage(e, 'Could not load this data.')");
code = code.replace(/e instanceof Error \? e.message : 'Could not save the invoice.'/g, "getSupabaseErrorMessage(e, 'Could not save the invoice.')");
code = code.replace(/e instanceof Error \? e.message : 'Could not save.'/g, "getSupabaseErrorMessage(e, 'Could not save.')");
code = code.replace(/err instanceof Error \? err.message : 'Authentication failed.'/g, "getSupabaseErrorMessage(err, 'Authentication failed.')");

if (!code.includes('getSupabaseErrorMessage')) {
  console.log("Failed to replace");
} else {
  // Wait, did I import it?
  // Let's check imports
  if (!code.includes('getSupabaseErrorMessage')) {
      code = code.replace("import { db, auth, supabaseConfigured", "import { db, auth, supabaseConfigured, getSupabaseErrorMessage");
  }
}

fs.writeFileSync(path, code);
