import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('sua-url-supabase')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Campeonatos cadastrados no Supabase (o site usa a Liquipedia; isto é só um complemento).
export async function fetchLeagues(status = 'all') {
  if (!isSupabaseConfigured) return [];
  try {
    let query = supabase.from('leagues').select('*').order('start_date', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (!error && data) return data;
  } catch (e) {
    console.warn('Erro ao consultar Supabase (leagues):', e);
  }
  return [];
}

export async function fetchLeagueById(id) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('leagues').select('*').eq('id', id).single();
    if (!error && data) return data;
  } catch (e) {
    console.warn('Erro ao consultar Supabase (league id):', e);
  }
  return null;
}
