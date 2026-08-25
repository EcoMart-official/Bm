import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

if (!supabaseConfigured) {
  console.warn('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

let currentSession: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null;
if (supabaseConfigured) {
  void supabase.auth.getSession().then(({ data }) => { currentSession = data.session; }).catch(() => {});
}
supabase.auth.onAuthStateChange((_event, session) => { 
  currentSession = session; 
  if (!session) currentBusinessId = null;
});

export const auth = {
  session() {
    return currentSession;
  },
  async getSession() {
    if (currentSession) return currentSession;
    if (!supabaseConfigured) return null;
    try {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
      return currentSession;
    } catch (e) {
      return null;
    }
  },
  async signIn(email: string, password: string) {
    if (!supabaseConfigured) throw new Error("Supabase is not configured.");
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    currentSession = result.data.session;
    currentBusinessId = null;
    return result.data.session;
  },
  async signUp(email: string, password: string, name?: string, phone?: string) {
    if (!supabaseConfigured) throw new Error("Supabase is not configured.");
    const result = await supabase.auth.signUp({ 
      email, 
      password,
      options: { 
        data: { 
          full_name: name || '',
          name: name || '',
          phone: phone || ''
        } 
      }
    });
    if (result.error) throw result.error;
    currentSession = result.data.session;
    return result.data.session;
  },
  signOut() {
    currentSession = null;
    currentBusinessId = null;
    if (supabaseConfigured) {
      void supabase.auth.signOut().catch(() => {});
    }
  },
};

let currentBusinessId: string | null = null;
export async function getBusinessId() {
  if (!supabaseConfigured) return null;
  if (currentBusinessId) return currentBusinessId;
  let session = auth.session();
  if (!session) {
    session = await auth.getSession();
  }
  if (!session) return null;
  try {
    const result = await supabase.from('profiles').select('business_id').eq('id', session.user.id).limit(1);
    if (result.data && result.data[0]?.business_id) {
      currentBusinessId = result.data[0].business_id;
      return currentBusinessId;
    }
    
    // Self-heal: if no business exists, create one automatically
    const meta = session.user.user_metadata || {};
    const res = await supabase.rpc('create_business', { 
      business_name: meta.business_name || 'My Workspace', 
      member_name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Owner', 
      business_currency: 'INR' 
    });
    if (res.data && (res.data as any).id) {
      currentBusinessId = (res.data as any).id;
      return currentBusinessId;
    }
  } catch (err) {
    console.error('Failed to auto-create business:', err);
  }
  return null;
}

type Query = Record<string, string | number | boolean | undefined>;

function getLocalStore<T>(table: string): T[] {
  try {
    const raw = localStorage.getItem(`arventa_store_${table}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function setLocalStore<T>(table: string, items: T[]) {
  try {
    localStorage.setItem(`arventa_store_${table}`, JSON.stringify(items));
  } catch (e) {}
}

const NO_BUSINESS_ID_TABLES = ['businesses', 'profiles', 'settings', 'invoice_items', 'purchase_items'];

function filterLocals<T>(locals: T[], query: Query): T[] {
  let result = [...locals];
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || key === 'order' || key === 'limit') return;
    const valStr = String(value);
    const targetVal = valStr.startsWith('eq.') ? valStr.slice(3) : valStr;
    result = result.filter((item: any) => {
      if (item[key] === undefined) return false;
      return String(item[key]) === targetVal;
    });
  });

  if (query.order) {
    const [column, direction] = String(query.order).split('.');
    result.sort((a: any, b: any) => {
      if (direction === 'desc') {
        return (b[column] || '') > (a[column] || '') ? 1 : -1;
      }
      return (a[column] || '') > (b[column] || '') ? 1 : -1;
    });
  }

  if (query.limit) {
    result = result.slice(0, Number(query.limit));
  }

  return result;
}

async function run<T>(builder: any) {
  if (!supabaseConfigured) return [] as T[];
  const result = await builder;
  if (result.error) throw result.error;
  return (result.data || []) as T[];
}

export function getProductBarcode(product: any): string {
  if (!product) return '';
  let code = String(product.barcode || product.sku || '').trim();
  if (product.notes && typeof product.notes === 'string' && (product.notes.startsWith('{') || product.notes.startsWith('['))) {
    try {
      const parsed = JSON.parse(product.notes);
      if (parsed.barcode && !code) code = String(parsed.barcode).trim();
      if (parsed.sku && !code) code = String(parsed.sku).trim();
    } catch (e) {}
  }
  if (!code) return '';
  if (
    code.startsWith('AUTOSKU-') || 
    code.startsWith('NO_BARCODE-') || 
    code.startsWith('SYS-') || 
    code.startsWith('INTERNAL-')
  ) {
    return '';
  }
  return code;
}

export function generateInternalSku(id?: string): string {
  const cleanId = id ? id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) : Date.now().toString(36);
  return `AUTOSKU-${cleanId.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

const TABLE_ALLOWED_COLUMNS: Record<string, string[]> = {
  products: ['id', 'business_id', 'category_id', 'name', 'sku', 'price', 'cost', 'stock_quantity', 'low_stock_threshold', 'unit', 'is_active', 'created_at', 'updated_at'],
  customers: ['id', 'business_id', 'name', 'email', 'phone', 'address', 'notes', 'opening_balance', 'created_at', 'updated_at'],
  suppliers: ['id', 'business_id', 'name', 'email', 'phone', 'address', 'created_at'],
  categories: ['id', 'business_id', 'name', 'created_at'],
  expenses: ['id', 'business_id', 'category', 'amount', 'date', 'description', 'created_by', 'created_at'],
};

function sanitizeForSupabase(table: string, values: Record<string, any>): Record<string, any> {
  const allowed = TABLE_ALLOWED_COLUMNS[table];
  if (!allowed) return { ...values };

  const sanitized: Record<string, any> = {};
  for (const col of allowed) {
    if (values[col] !== undefined) {
      sanitized[col] = values[col];
    }
  }

  if (table === 'products') {
    if (sanitized.cost === undefined && values.buying_price !== undefined && values.buying_price !== null && values.buying_price !== '') {
      sanitized.cost = Number(values.buying_price) || 0;
    }
    if (sanitized.price !== undefined) {
      sanitized.price = Number(sanitized.price) || 0;
    }
    if (sanitized.stock_quantity !== undefined) {
      sanitized.stock_quantity = Number(sanitized.stock_quantity) || 0;
    }
    if (!sanitized.sku || !String(sanitized.sku).trim()) {
      sanitized.sku = generateInternalSku(values.id as string);
    }
  }

  return sanitized;
}

export const db = {
  async list<T extends Record<string, any>>(table: string, query: Query = {}): Promise<T[]> {
    const activeQuery = { ...query };
    if (!activeQuery.business_id && !NO_BUSINESS_ID_TABLES.includes(table)) {
      const bid = await getBusinessId();
      if (bid) activeQuery.business_id = bid;
    }

    try {
      let builder: any = supabase.from(table).select('*');
      Object.entries(activeQuery).forEach(([key, value]) => {
        if (value === undefined) return;
        if (key === 'order') {
          const [column, direction] = String(value).split('.');
          builder = builder.order(column, { ascending: direction !== 'desc' });
        } else if (key === 'limit') builder = builder.limit(Number(value));
        else if (String(value).startsWith('eq.')) builder = builder.eq(key, String(value).slice(3) === 'true' ? true : String(value).slice(3));
        else builder = builder.eq(key, value);
      });
      const remoteData = await run<T>(builder);
      const locals = getLocalStore<T>(table);
      if (remoteData && remoteData.length > 0) {
        // Merge or cache local store
        const remoteIds = new Set(remoteData.map((r: any) => r.id));
        const missingLocals = locals.filter((l: any) => l.id && !remoteIds.has(l.id));
        const combined = [...remoteData, ...missingLocals];
        setLocalStore(table, combined);
        return filterLocals(combined, activeQuery);
      } else {
        if (locals.length > 0) return filterLocals(locals, activeQuery);
        return remoteData;
      }
    } catch (err) {
      console.warn(`db.list fallback to local store for table "${table}":`, err);
      const locals = getLocalStore<T>(table);
      return filterLocals(locals, activeQuery);
    }
  },

  async insert<T extends Record<string, any>>(table: string, values: Record<string, unknown>): Promise<T> {
    if (!values.business_id && !NO_BUSINESS_ID_TABLES.includes(table)) {
      const bid = await getBusinessId();
      if (bid) values.business_id = bid;
    }
    const itemWithId = {
      id: (values.id as string) || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
      created_at: (values.created_at as string) || new Date().toISOString(),
      ...values,
    };

    const supabasePayload = sanitizeForSupabase(table, itemWithId);

    try {
      const rows = await run<T>(supabase.from(table).insert(supabasePayload).select());
      if (rows && rows[0]) {
        const locals = getLocalStore<T>(table);
        const merged = { ...itemWithId, ...rows[0] };
        setLocalStore(table, [merged, ...locals.filter((x: any) => x.id !== (rows[0] as any).id)]);
        return merged;
      }
    } catch (err) {
      console.warn(`db.insert fallback to local store for table "${table}":`, err);
    }

    // Save to local store
    const locals = getLocalStore<T>(table);
    setLocalStore(table, [itemWithId as T, ...locals.filter((x: any) => x.id !== itemWithId.id)]);
    return itemWithId as T;
  },

  async upsert<T extends Record<string, any>>(table: string, values: Record<string, unknown>): Promise<T> {
    const itemWithId = {
      id: (values.id as string) || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}`),
      ...values,
    };
    const supabasePayload = sanitizeForSupabase(table, itemWithId);
    try {
      const rows = await run<T>(supabase.from(table).upsert(supabasePayload).select());
      if (rows && rows[0]) {
        const locals = getLocalStore<T>(table);
        const merged = { ...itemWithId, ...rows[0] };
        setLocalStore(table, [merged, ...locals.filter((x: any) => x.id !== (rows[0] as any).id)]);
        return merged;
      }
    } catch (err) {
      console.warn(`db.upsert fallback to local store for table "${table}":`, err);
    }

    const locals = getLocalStore<T>(table);
    const existingIndex = locals.findIndex((x: any) => x.id === itemWithId.id);
    if (existingIndex >= 0) {
      locals[existingIndex] = { ...locals[existingIndex], ...itemWithId };
      setLocalStore(table, locals);
    } else {
      setLocalStore(table, [itemWithId as T, ...locals]);
    }
    return itemWithId as T;
  },

  async update<T extends Record<string, any>>(table: string, id: string, values: Record<string, unknown>): Promise<T> {
    const supabasePayload = sanitizeForSupabase(table, { id, ...values });
    try {
      const rows = await run<T>(supabase.from(table).update(supabasePayload).eq('id', id).select());
      if (rows && rows[0]) {
        const locals = getLocalStore<T>(table);
        const idx = locals.findIndex((x: any) => x.id === id);
        const merged = { ...(locals[idx] || {}), ...values, ...rows[0] };
        if (idx >= 0) {
          locals[idx] = merged;
          setLocalStore(table, locals);
        }
        return merged;
      }
    } catch (err) {
      console.warn(`db.update fallback to local store for table "${table}":`, err);
    }

    const locals = getLocalStore<T>(table);
    const idx = locals.findIndex((x: any) => x.id === id);
    if (idx >= 0) {
      locals[idx] = { ...locals[idx], ...values };
      setLocalStore(table, locals);
      return locals[idx];
    }
    return { id, ...values } as T;
  },

  async remove(table: string, id: string): Promise<void> {
    try {
      await run(supabase.from(table).delete().eq('id', id).select());
    } catch (err) {
      console.warn(`db.remove fallback to local store for table "${table}":`, err);
    }
    const locals = getLocalStore<any>(table);
    setLocalStore(table, locals.filter((x: any) => x.id !== id));
  },

  async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const result = await supabase.rpc(name, args);
    if (result.error) throw result.error;
    return result.data as T;
  },
};

export function getSupabaseErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}