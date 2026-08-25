const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wahxmwzuumkjzraodgcq.supabase.co', 'sb_publishable_b-QvwyAfv_nRsudoThwMMA_bdyHWgRa');
supabase.from('customers').select('*').limit(1).then(console.log).catch(console.error);
