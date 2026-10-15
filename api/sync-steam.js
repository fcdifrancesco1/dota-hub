import { createClient } from '@supabase/supabase-js';

const STEAM_ID64_BASE = 76561197960265728n;

/**
 * GET /api/sync-steam?openid=verify&<parâmetros openid.* devolvidos pela Steam>
 * Confirma com a própria Steam (check_authentication) que o login foi real e
 * devolve o SteamID64 e o account_id (ID de 32 bits usado pela OpenDota).
 */
async function verifySteamLogin(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const query = req.query || {};
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('openid.')) params.set(key, String(value));
  }
  const claimed = params.get('openid.claimed_id') || '';
  const match = claimed.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  if (params.get('openid.mode') !== 'id_res' || !match) {
    return res.status(400).json({ ok: false, error: 'Resposta de login inválida' });
  }
  // A Steam só valida os campos listados em openid.signed: o ID da conta e o
  // endereço de retorno precisam estar entre eles, senão poderiam ser trocados
  // por quem montou a resposta
  const signed = new Set((params.get('openid.signed') || '').split(','));
  const mustBeSigned = ['claimed_id', 'identity', 'return_to', 'response_nonce', 'op_endpoint'];
  if (
    !mustBeSigned.every((field) => signed.has(field)) ||
    params.get('openid.identity') !== claimed ||
    params.get('openid.op_endpoint') !== 'https://steamcommunity.com/openid/login'
  ) {
    return res.status(400).json({ ok: false, error: 'Resposta de login inválida' });
  }
  // O retorno precisa apontar para este site (evita reaproveitar login de outro lugar)
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  try {
    if (new URL(params.get('openid.return_to') || '').host !== host) {
      return res.status(400).json({ ok: false, error: 'Endereço de retorno inválido' });
    }
  } catch {
    return res.status(400).json({ ok: false, error: 'Endereço de retorno inválido' });
  }

  params.set('openid.mode', 'check_authentication');
  try {
    const r = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(8000)
    });
    const text = await r.text();
    if (!/is_valid\s*:\s*true/.test(text)) {
      return res.status(401).json({ ok: false, error: 'A Steam não confirmou o login' });
    }
    const steamId64 = match[1];
    const accountId = Number(BigInt(steamId64) - STEAM_ID64_BASE);
    return res.status(200).json({ ok: true, steamId64, accountId });
  } catch (err) {
    console.error('[Steam OpenID] Falha na verificação:', err.message);
    return res.status(502).json({ ok: false, error: 'Não foi possível falar com a Steam agora' });
  }
}

export default async function handler(req, res) {
  if (req.query?.openid === 'verify') return verifySteamLogin(req, res);
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
