import { createClient } from '@supabase/supabase-js';

/**
 * Última resposta boa de uma rota, guardada na tabela site_settings do Supabase
 * (chave `snapshot:<nome>`). Serve de reserva quando a fonte externa (ex.:
 * OpenDota) cai e a CDN da Vercel não tem mais cópia — o que acontece a cada
 * deploy, já que o deploy limpa o cache da CDN.
 * Sem Supabase configurado, as funções simplesmente não fazem nada.
 */
let client;
function getClient() {
  if (client !== undefined) return client;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key && !url.includes('sua-url-supabase') ? createClient(url, key) : null;
  return client;
}

export async function loadSnapshot(name) {
  const supabase = getClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value, updated_at')
      .eq('key', `snapshot:${name}`)
      .maybeSingle();
    if (error || !data) return null;
    return { value: data.value, updatedAt: data.updated_at };
  } catch (err) {
    console.error(`[snapshot] falha ao ler ${name}:`, err.message);
    return null;
  }
}

export async function saveSnapshot(name, value) {
  const supabase = getClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: `snapshot:${name}`, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) console.error(`[snapshot] falha ao salvar ${name}:`, error.message);
  } catch (err) {
    console.error(`[snapshot] falha ao salvar ${name}:`, err.message);
  }
}

/**
 * Resposta de reserva para quando a fonte externa falhou: devolve a última
 * cópia salva (com cache curto na CDN, para tentar a fonte de novo logo) ou 503.
 */
export async function respondWithSnapshot(res, name, logLabel, err) {
  console.error(`[Results API] ${logLabel} indisponível:`, err.message);
  const snap = await loadSnapshot(name);
  if (snap) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('X-Data-Snapshot', snap.updatedAt || 'unknown');
    return res.status(200).json(snap.value);
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(503).json({ error: 'OpenDota indisponível' });
}
