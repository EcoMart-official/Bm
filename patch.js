const fs = require('fs');
const path = 'artifacts/commercial-billing/src/lib/supabase.ts';
let code = fs.readFileSync(path, 'utf8');

const cacheCode = `
let currentBusinessId: string | null = null;
async function getBusinessId() {
  if (currentBusinessId) return currentBusinessId;
  const session = auth.session();
  if (!session) return null;
  const result = await supabase.from('profiles').select('business_id').eq('id', session.user.id).limit(1);
  if (result.data && result.data[0]?.business_id) {
    currentBusinessId = result.data[0].business_id;
    return currentBusinessId;
  }
  return null;
}
`;

code = code.replace(
  'type Query = Record<string, string | number | boolean | undefined>;',
  cacheCode + '\ntype Query = Record<string, string | number | boolean | undefined>;'
);

code = code.replace(
  'async insert<T>(table: string, values: Record<string, unknown>) {',
  `async insert<T>(table: string, values: Record<string, unknown>) {
    if (!values.business_id && !['businesses', 'profiles', 'settings'].includes(table)) {
      const bid = await getBusinessId();
      if (bid) values.business_id = bid;
    }`
);

code = code.replace(
  'async list<T>(table: string, query: Query = {}) {',
  `async list<T>(table: string, query: Query = {}) {
    if (!query.business_id && !['businesses', 'profiles', 'settings'].includes(table)) {
      const bid = await getBusinessId();
      if (bid) query.business_id = bid;
    }`
);

fs.writeFileSync(path, code);
