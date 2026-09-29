import { createClient } from '@supabase/supabase-js';

const OPENDOTA_BASE = 'https://api.opendota.com/api';

export default async function handler(req, res) {
  // Always set JSON and private no-cache headers for cron/sync tasks
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    let supabase = null;
    if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('sua-url-supabase')) {
      supabase = createClient(supabaseUrl, serviceRoleKey);
    }

    // Busca as partidas profissionais mais recentes da OpenDota
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    let proMatches = [];
    try {
      const response = await fetch(`${OPENDOTA_BASE}/proMatches`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'DotaHub-Sync/2.0' }
      });
      clearTimeout(timeout);
      if (response.ok) {
        proMatches = await response.json();
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.warn('Erro ao conectar na OpenDota:', fetchErr.message);
    }

    if (!Array.isArray(proMatches) || proMatches.length === 0) {
      return res.status(200).json({
        ok: false,
        source: 'opendota',
        synced: 0,
        message: 'Nenhuma partida retornada pela OpenDota ou limite temporário atingido'
      });
    }

    // Se o Supabase estiver configurado, realizamos o upsert das partidas e times
    let insertedCount = 0;
    if (supabase) {
      const teamsMap = new Map();
      const leaguesMap = new Map();
      const matchesPayload = [];

      for (const m of proMatches.slice(0, 30)) {
        if (!m.match_id) continue;

        // Armazena times únicos para upsert
        if (m.radiant_team_id && m.radiant_name) {
          teamsMap.set(m.radiant_team_id, {
            id: m.radiant_team_id,
            name: m.radiant_name,
            tag: m.radiant_name.substring(0, 8),
            logo_url: m.radiant_logo || null,
            last_match_time: new Date(m.start_time * 1000).toISOString()
          });
        }
        if (m.dire_team_id && m.dire_name) {
          teamsMap.set(m.dire_team_id, {
            id: m.dire_team_id,
            name: m.dire_name,
            tag: m.dire_name.substring(0, 8),
            logo_url: m.dire_logo || null,
            last_match_time: new Date(m.start_time * 1000).toISOString()
          });
        }

        // Armazena ligas únicas
        if (m.leagueid && m.league_name) {
          leaguesMap.set(m.leagueid, {
            id: m.leagueid,
            name: m.league_name,
            status: 'ongoing',
            updated_at: new Date().toISOString()
          });
        }

        matchesPayload.push({
          match_id: m.match_id,
          series_id: m.series_id || null,
          series_type: m.series_type || 3,
          league_id: m.leagueid || null,
          radiant_team_id: m.radiant_team_id || null,
          dire_team_id: m.dire_team_id || null,
          radiant_win: Boolean(m.radiant_win),
          duration: m.duration || 0,
          start_time: new Date(m.start_time * 1000).toISOString(),
          radiant_score: m.radiant_score || 0,
          dire_score: m.dire_score || 0
        });
      }

      // Upsert de times
      if (teamsMap.size > 0) {
        await supabase.from('teams').upsert(Array.from(teamsMap.values()), { onConflict: 'id' });
      }

      // Upsert de ligas
      if (leaguesMap.size > 0) {
        await supabase.from('leagues').upsert(Array.from(leaguesMap.values()), { onConflict: 'id' });
      }

      // Upsert de partidas
      if (matchesPayload.length > 0) {
        const { error } = await supabase.from('matches').upsert(matchesPayload, { onConflict: 'match_id' });
        if (!error) {
          insertedCount = matchesPayload.length;
        }
      }

      // Registrar log de sincronização
      await supabase.from('sync_logs').insert({
        source: 'opendota',
        status: 'success',
        items_synced: insertedCount,
        details: { matches_count: matchesPayload.length, teams_count: teamsMap.size }
      });
    }

    return res.status(200).json({
      ok: true,
      source: 'opendota',
      synced: insertedCount || proMatches.length,
      supabaseConnected: Boolean(supabase),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na sincronização OpenDota:', error);
    return res.status(200).json({
      ok: false,
      source: 'opendota',
      error: error.message || 'Erro desconhecido na sincronização'
    });
  }
}
