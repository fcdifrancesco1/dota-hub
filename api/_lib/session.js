// Sessões assinadas pelo servidor (HMAC-SHA256) guardadas em cookies HttpOnly:
// o JavaScript da página não consegue ler nem alterar o conteúdo, e qualquer
// mudança feita à mão invalida a assinatura.
import crypto from 'node:crypto';

export const PROFILE_COOKIE = 'dh_profile';
export const ADMIN_COOKIE = 'dh_admin';

function secret() {
  const value = process.env.SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

/** As sessões só funcionam com SESSION_SECRET (32+ caracteres) configurado. */
export function sessionsEnabled() {
  return Boolean(secret());
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const hmac = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');

/** Token "<dados>.<assinatura>" que expira em `maxAgeSec` segundos. */
export function signToken(payload, maxAgeSec) {
  if (!secret()) throw new Error('SESSION_SECRET não configurado');
  const body = b64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSec }));
  return `${body}.${hmac(body)}`;
}

/** Conteúdo do token se a assinatura bater e ele não tiver expirado; senão null. */
export function verifyToken(token) {
  if (!secret() || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = Buffer.from(hmac(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

export function readCookie(req, name) {
  const header = req.headers?.cookie || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/** Sessão válida guardada no cookie `name` (ou null). */
export function readSession(req, name) {
  return verifyToken(readCookie(req, name));
}

function appendSetCookie(res, value) {
  const current = res.getHeader?.('Set-Cookie');
  const list = current ? (Array.isArray(current) ? current : [current]) : [];
  res.setHeader('Set-Cookie', [...list, value]);
}

export function setSessionCookie(res, name, token, maxAgeSec) {
  appendSetCookie(res, `${name}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; Secure; SameSite=Lax`);
}

export function clearSessionCookie(res, name) {
  appendSetCookie(res, `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

/** Comparação de textos em tempo constante (senhas). */
export function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

/** Corpo JSON da requisição (a Vercel já entrega parseado; o servidor local não). */
export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (chunks.reduce((n, c) => n + c.length, 0) > 10_000) break;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}

/** Admin logado (cookie) ou chamada do agendador da Vercel com CRON_SECRET. */
export function isAdminRequest(req) {
  if (readSession(req, ADMIN_COOKIE)?.role === 'admin') return true;
  const cron = process.env.CRON_SECRET;
  return Boolean(cron) && req.headers?.authorization === `Bearer ${cron}`;
}
