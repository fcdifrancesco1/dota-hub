import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const apiKey = process.env.STEAM_API_KEY || process.env.VITE_STEAM_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      ok: false,
      source: 'steam',
      error: 'STEAM_API_KEY não configurada nas variáveis de ambiente'
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const url = `https://api.steampowered.com/IDOTA2Match_570/GetLiveLeagueGames/v1/?key=${apiKey}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        source: 'steam',
        status: response.status,
        error: `Steam API retornou status HTTP ${response.status}`
      });
    }

    const data = await response.json();
    const games = data?.result?.games || [];

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    let supabase = null;
    if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('sua-url-supabase')) {
      supabase = createClient(supabaseUrl, serviceRoleKey);
    }

    if (supabase) {
      await supabase.from('sync_logs').insert({
        source: 'steam',
        status: 'success',
        items_synced: games.length,
        details: { total_live_games: games.length }
      });
    }

    return res.status(200).json({
      ok: true,
      source: 'steam',
      count: games.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(200).json({
      ok: false,
      source: 'steam',
      error: error.message || 'Erro ao sincronizar com a Steam Web API'
    });
  }
}
