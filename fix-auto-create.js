const fs = require('fs');
const path = 'artifacts/commercial-billing/src/lib/supabase.ts';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
async function getBusinessId() {
  if (currentBusinessId) return currentBusinessId;
  const session = auth.session();
  if (!session) return null;
  const result = await supabase.from('profiles').select('business_id').eq('id', session.user.id).limit(1);
  if (result.data && result.data[0]?.business_id) {
    currentBusinessId = result.data[0].business_id;
    return currentBusinessId;
  }
  
  // Self-heal: if no business exists, create one automatically
  try {
    const res = await supabase.rpc('create_business', { 
      business_name: 'My Workspace', 
      member_name: session.user.email?.split('@')[0] || 'Owner', 
      business_currency: 'INR' 
    });
    if (res.data && res.data.id) {
      currentBusinessId = res.data.id;
      return currentBusinessId;
    }
  } catch (err) {
    console.error('Failed to auto-create business:', err);
  }
  return null;
}
`;

code = code.replace(/async function getBusinessId\(\) \{[\s\S]*?return null;\n\}/, replacement.trim());
fs.writeFileSync(path, code);
