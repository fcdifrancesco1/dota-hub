// api/_lib/liquipediaClient.js
// Cliente centralizado para a API da Liquipedia em estrita conformidade com as diretrizes oficiais:
// 1. User-Agent identificado com nome da aplicação e contato.
// 2. Fila sequencial garantindo no máximo 1 requisição a cada 2 segundos (intervalo de 2.050 ms).
// 3. Cache em memória para evitar chamadas repetidas à mesma página.
// 4. Tratamento gracioso de erros 429 / 503.

const USER_AGENT = 'DotaHubApp/2.1 (https://github.com/fcdifrancesco1/dota-hub; contact: felipe@dota-hub.local)';
const MIN_REQUEST_INTERVAL_MS = 2050;

// Cache em memória compartilhado durante a execução do processo Node.js
const memoryCache = new Map();

// Controle da fila sequencial de requisições
let lastRequestPromise = Promise.resolve();
let lastRequestTime = 0;

/**
 * Consulta segura da API da Liquipedia respeitando rigorosamente o limite de taxa (rate limit).
 * @param {string} page - Nome da página na wiki da Liquipedia (ex: 'Liquipedia:Matches', 'Team_Spirit/Played_Matches')
 * @param {object} options
 * @param {number} options.ttlMs - Tempo de vida do cache em milissegundos (padrão: 10 minutos)
 * @returns {Promise<{ html: string, raw: any, fromCache: boolean } | null>}
 */
export async function fetchLiquipediaApi(page, { ttlMs = 10 * 60 * 1000 } = {}) {
  if (!page) return null;

  const cacheKey = page.trim();
  const now = Date.now();

  // 1. Verificar cache em memória
  if (memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey);
    if (entry && now < entry.expiresAt) {
      return { html: entry.html, raw: entry.raw, fromCache: true };
    }
  }

  // 2. Enfileirar requisição na fila sequencial para garantir >= 2.050 ms de espaçamento
  const executeRequest = async () => {
    // Re-checar o cache caso outra requisição idêntica na fila já tenha resolvido
    if (memoryCache.has(cacheKey)) {
      const entry = memoryCache.get(cacheKey);
      if (entry && Date.now() < entry.expiresAt) {
        return { html: entry.html, raw: entry.raw, fromCache: true };
      }
    }

    const currentTime = Date.now();
    const timeSinceLast = currentTime - lastRequestTime;
    if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
      const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLast;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    try {
      const targetUrl = `https://liquipedia.net/dota2/api.php?action=parse&page=${encodeURIComponent(page)}&format=json`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        console.warn(`[Liquipedia Client] HTTP ${response.status} para a página "${page}"`);
        // Se houver dados antigos em cache, retorna-os mesmo expirados para não quebrar a aplicação
        if (memoryCache.has(cacheKey)) {
          return { ...memoryCache.get(cacheKey), fromCache: true, stale: true };
        }
        return null;
      }

      const json = await response.json();
      if (json.error) {
        console.warn(`[Liquipedia Client] Erro retornado pela API para "${page}":`, json.error.info || json.error.code);
        return null;
      }

      const html = json?.parse?.text?.['*'] || '';
      const payload = {
        html,
        raw: json,
        expiresAt: Date.now() + ttlMs,
        fromCache: false
      };

      // Gravar no cache em memória
      memoryCache.set(cacheKey, payload);
      return payload;
    } catch (err) {
      console.warn(`[Liquipedia Client] Falha de rede para "${page}":`, err.message);
      if (memoryCache.has(cacheKey)) {
        return { ...memoryCache.get(cacheKey), fromCache: true, stale: true };
      }
      return null;
    } finally {
      lastRequestTime = Date.now();
    }
  };

  // Enfileira sequencialmente
  const currentPromise = lastRequestPromise.then(executeRequest, executeRequest);
  lastRequestPromise = currentPromise.catch(() => {});
  return currentPromise;
}

/**
 * Limpa o cache em memória (útil para testes ou refresh manual).
 */
export function clearLiquipediaCache() {
  memoryCache.clear();
}
