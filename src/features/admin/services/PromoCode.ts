import { supabase } from '@/lib/supabase';

interface PromoCodeType {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  valid_from?: string | null;
  valid_until?: string | null;
  max_uses?: number | null;
  usage_count: number;
  is_active: boolean;
  created_at?: string;
  [key: string]: any;
}

const normalizeDate = (v: string | null | undefined): string | null => {
  if (v === '' || v === undefined) return null;
  return v; // expect 'YYYY-MM-DD' from <input type="date">
};

const normalizeInt = (v: string | number | null | undefined): number | null => {
  if (v === '' || v === undefined || v === null) return null;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
};

const normalizeNumber = (v: string | number | null | undefined): number | null => {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const PromoCode = {
  async list(
    filters: Record<string, any> = {},
    orderBy: string = 'created_at',
    limit: number = 10000
  ): Promise<PromoCodeType[]> {
    let query = supabase.from('promo_codes').select('*');
    Object.keys(filters).forEach((key) => {
      query = query.eq(key, filters[key]);
    });
    query = query
      .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
      .limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data as PromoCodeType[]) || [];
  },

  async create(data: Partial<PromoCodeType>): Promise<PromoCodeType> {
    // Normalize payload to match DB types
    const payload = { ...data };
    if ('valid_from' in payload) payload.valid_from = normalizeDate(payload.valid_from);
    if ('valid_until' in payload) payload.valid_until = normalizeDate(payload.valid_until);
    if ('max_uses' in payload) payload.max_uses = normalizeInt(payload.max_uses);
    if ('discount_value' in payload)
      payload.discount_value = normalizeNumber(payload.discount_value) ?? 0;

    // Attempt insert, retry stripping unknown columns if needed
    let working = { ...payload };

    // eslint-disable-next-line
    while (true) {
      const { data: created, error } = await supabase
        .from('promo_codes')
        .insert(working)
        .select()
        .single();
      if (!error) return created as PromoCodeType;

      if (error.code === 'PGRST204') {
        const match = error.message?.match(/'([^']+)' column/);
        if (match?.[1]) {
          const { [match[1]]: _omit, ...rest } = working;
          working = rest;
          continue;
        }
      }
      throw error;
    }
  },

  async update(id: string, data: Partial<PromoCodeType>): Promise<PromoCodeType> {
    const payload = { ...data };
    if ('valid_from' in payload) payload.valid_from = normalizeDate(payload.valid_from);
    if ('valid_until' in payload) payload.valid_until = normalizeDate(payload.valid_until);
    if ('max_uses' in payload) payload.max_uses = normalizeInt(payload.max_uses);
    if ('discount_value' in payload)
      payload.discount_value = normalizeNumber(payload.discount_value) ?? 0;

    let working = { ...payload };
    // eslint-disable-next-line
    while (true) {
      const { data: updated, error } = await supabase
        .from('promo_codes')
        .update(working)
        .eq('id', id)
        .select()
        .single();
      if (!error) return updated as PromoCodeType;

      if (error.code === 'PGRST204') {
        const match = error.message?.match(/'([^']+)' column/);
        if (match?.[1]) {
          const { [match[1]]: _omit, ...rest } = working;
          working = rest;
          continue;
        }
      }
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('promo_codes')
      .delete({ returning: 'minimal' } as any) // workaround for supabase-js types if needed
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getById(id: string): Promise<PromoCodeType> {
    const { data, error } = await supabase.from('promo_codes').select('*').eq('id', id).single();
    if (error) throw error;
    return data as PromoCodeType;
  },
};
