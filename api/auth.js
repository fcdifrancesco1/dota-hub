// Autenticação do site: perfil vinculado pela Steam e acesso ao Admin.
// As sessões ficam em cookies HttpOnly assinados (ver _lib/session.js).
import {
  PROFILE_COOKIE, ADMIN_COOKIE, sessionsEnabled, signToken, readSession,
  setSessionCookie, clearSessionCookie, safeEqual, readJsonBody
} from './_lib/session.js';

const STEAM_ID64_BASE = 76561197960265728n;
const PROFILE_MAX_AGE = 30 * 24 * 3600; // 30 dias
const ADMIN_MAX_AGE = 12 * 3600; // 12 horas

// Único e-mail com acesso ao Admin (pode ser trocado por ADMIN_EMAIL na Vercel)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'fcdifrancesco1@gmail.com').trim().toLowerCase();

// Tentativas de login no Admin por IP (memória da instância; freia força bruta)
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
}

/**
 * GET /api/auth?action=steam&<parâmetros openid.* devolvidos pela Steam>
 * Confirma o login com a própria Steam e grava a sessão do perfil.
 */
async function steamLogin(req, res) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key.startsWith('openid.')) params.set(key, String(value));
  }
  const claimed = params.get('openid.claimed_id') || '';
  const match = claimed.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  // A Steam só valida os campos listados em openid.signed: o ID da conta e o
  // endereço de retorno precisam estar entre eles
  const signed = new Set((params.get('openid.signed') || '').split(','));
  const mustBeSigned = ['claimed_id', 'identity', 'return_to', 'response_nonce', 'op_endpoint'];
  if (
    params.get('openid.mode') !== 'id_res' || !match ||
    !mustBeSigned.every((field) => signed.has(field)) ||
    params.get('openid.identity') !== claimed ||
    params.get('openid.op_endpoint') !== 'https://steamcommunity.com/openid/login'
  ) {
    return res.status(400).json({ ok: false, error: 'Resposta de login inválida' });
  }
  // O retorno precisa apontar para este site
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  try {
    if (new URL(params.get('openid.return_to') || '').host !== host) {
      return res.status(400).json({ ok: false, error: 'Endereço de retorno inválido' });
    }
  } catch {
    return res.status(400).json({ ok: false, error: 'Endereço de retorno inválido' });
  }

  params.set('openid.mode', 'check_authentication');
  let text = '';
  try {
    const r = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(8000)
    });
    text = await r.text();
  } catch (err) {
    console.error('[Auth] Falha ao falar com a Steam:', err.message);
    return res.status(502).json({ ok: false, error: 'Não foi possível falar com a Steam agora' });
  }
  if (!/is_valid\s*:\s*true/.test(text)) {
    return res.status(401).json({ ok: false, error: 'A Steam não confirmou o login' });
  }

  const steamId64 = match[1];
  const accountId = Number(BigInt(steamId64) - STEAM_ID64_BASE);
  setSessionCookie(res, PROFILE_COOKIE, signToken({ sub: accountId, steamId64 }, PROFILE_MAX_AGE), PROFILE_MAX_AGE);
  return res.status(200).json({ ok: true, accountId });
}

/** POST /api/auth?action=admin-login  { email, password } */
async function adminLogin(req, res) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return res.status(503).json({ ok: false, error: 'Login do Admin ainda não configurado no servidor' });
  }
  const ip = clientIp(req);
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now - entry.first < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ ok: false, error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  const body = await readJsonBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const ok = safeEqual(email, ADMIN_EMAIL) && safeEqual(String(body.password || ''), password);
  if (!ok) {
    const fresh = !entry || now - entry.first >= WINDOW_MS;
    attempts.set(ip, { first: fresh ? now : entry.first, count: fresh ? 1 : entry.count + 1 });
    await new Promise((r) => setTimeout(r, 800)); // desacelera tentativas automáticas
    return res.status(401).json({ ok: false, error: 'E-mail ou senha incorretos' });
  }
  attempts.delete(ip);
  setSessionCookie(res, ADMIN_COOKIE, signToken({ role: 'admin', email: ADMIN_EMAIL }, ADMIN_MAX_AGE), ADMIN_MAX_AGE);
  return res.status(200).json({ ok: true, email: ADMIN_EMAIL });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!sessionsEnabled()) {
    return res.status(503).json({ ok: false, error: 'Sessões não configuradas no servidor (SESSION_SECRET)' });
  }
  const action = req.query?.action;

  if (action === 'steam' && req.method === 'GET') return steamLogin(req, res);
  if (action === 'admin-login' && req.method === 'POST') return adminLogin(req, res);

  if (action === 'me' && req.method === 'GET') {
    const profile = readSession(req, PROFILE_COOKIE);
    const admin = readSession(req, ADMIN_COOKIE);
    return res.status(200).json({
      profile: profile ? { accountId: profile.sub } : null,
      admin: admin?.role === 'admin' ? { email: admin.email } : null
    });
  }

  if (action === 'logout' && req.method === 'POST') {
    const which = req.query?.scope === 'admin' ? ADMIN_COOKIE : PROFILE_COOKIE;
    clearSessionCookie(res, which);
    return res.status(200).json({ ok: true });
  }

  return res.status(404).json({ ok: false, error: 'Ação desconhecida' });
}
