-- ==============================================================================
-- DOTA 2 COMPETITIVE HUB - SUPABASE DATABASE SCHEMA
-- PostgreSQL schema with Row Level Security (RLS), Views, Functions & Triggers
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE tournament_tier AS ENUM ('tier_1', 'tier_2', 'tier_3', 'qualifier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prediction_status AS ENUM ('pending', 'won', 'lost', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Ligas / Campeonatos
CREATE TABLE IF NOT EXISTS leagues (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT DEFAULT 'tier_1',
    prize_pool TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    banner_url TEXT,
    logo_url TEXT,
    status TEXT DEFAULT 'ongoing', -- 'ongoing', 'upcoming', 'finished'
    location TEXT,
    liquipedia_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Times
CREATE TABLE IF NOT EXISTS teams (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    tag TEXT,
    logo_url TEXT,
    rating NUMERIC DEFAULT 1000,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    last_match_time TIMESTAMPTZ,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jogadores
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    personaname TEXT,
    avatar_url TEXT,
    country_code TEXT,
    team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    role INT DEFAULT 1, -- 1: Carry, 2: Mid, 3: Offlane, 4: Soft Support, 5: Hard Support
    is_pro BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relação Time x Jogador (Histórico e Elenco Atual)
CREATE TABLE IF NOT EXISTS team_players (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    role INT DEFAULT 1,
    is_current BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(team_id, player_id)
);

-- Heróis
CREATE TABLE IF NOT EXISTS heroes (
    id INT PRIMARY KEY,
    name TEXT NOT NULL, -- ex: 'npc_dota_hero_antimage'
    localized_name TEXT NOT NULL, -- ex: 'Anti-Mage'
    primary_attr TEXT NOT NULL, -- 'str', 'agi', 'int', 'all'
    attack_type TEXT, -- 'Melee', 'Ranged'
    roles TEXT[] DEFAULT '{}',
    icon_url TEXT,
    img_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Séries (MD1, MD3, MD5)
CREATE TABLE IF NOT EXISTS series (
    id BIGSERIAL PRIMARY KEY,
    series_id BIGINT UNIQUE, -- OpenDota series_id ou ID sintético
    league_id BIGINT REFERENCES leagues(id) ON DELETE CASCADE,
    team1_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    team2_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    score_team1 INT DEFAULT 0,
    score_team2 INT DEFAULT 0,
    series_type INT DEFAULT 3, -- 1: BO1, 2: BO2, 3: BO3, 5: BO5
    stage TEXT, -- 'Fase de Grupos', 'Playoffs', 'Grande Final', etc.
    status TEXT DEFAULT 'finished', -- 'scheduled', 'live', 'finished'
    start_time TIMESTAMPTZ NOT NULL,
    winner_team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partidas (Mapas individuais da série)
CREATE TABLE IF NOT EXISTS matches (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT UNIQUE NOT NULL, -- OpenDota / Valve Match ID
    series_id BIGINT REFERENCES series(series_id) ON DELETE SET NULL,
    league_id BIGINT REFERENCES leagues(id) ON DELETE CASCADE,
    radiant_team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    dire_team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    radiant_win BOOLEAN,
    duration INT, -- em segundos
    start_time TIMESTAMPTZ NOT NULL,
    radiant_score INT DEFAULT 0,
    dire_score INT DEFAULT 0,
    game_mode INT,
    first_blood_time INT,
    radiant_gold_adv INT[], -- vantagem de ouro minuto a minuto
    radiant_xp_adv INT[],   -- vantagem de xp minuto a minuto
    vod_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estatísticas de Jogadores por Partida
CREATE TABLE IF NOT EXISTS match_players (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    account_id BIGINT NOT NULL,
    hero_id INT REFERENCES heroes(id) ON DELETE SET NULL,
    player_slot INT NOT NULL,
    is_radiant BOOLEAN NOT NULL,
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    assists INT DEFAULT 0,
    last_hits INT DEFAULT 0,
    denies INT DEFAULT 0,
    gpm INT DEFAULT 0,
    xpm INT DEFAULT 0,
    hero_damage INT DEFAULT 0,
    tower_damage INT DEFAULT 0,
    hero_healing INT DEFAULT 0,
    net_worth INT DEFAULT 0,
    item_0 INT DEFAULT 0,
    item_1 INT DEFAULT 0,
    item_2 INT DEFAULT 0,
    item_3 INT DEFAULT 0,
    item_4 INT DEFAULT 0,
    item_5 INT DEFAULT 0,
    backpack_0 INT DEFAULT 0,
    backpack_1 INT DEFAULT 0,
    backpack_2 INT DEFAULT 0,
    neutral_item INT DEFAULT 0,
    gold_per_min INT,
    xp_per_min INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, player_slot)
);

-- Picks e Bans das Partidas
CREATE TABLE IF NOT EXISTS match_picks_bans (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    is_pick BOOLEAN NOT NULL,
    hero_id INT REFERENCES heroes(id) ON DELETE CASCADE,
    team INT NOT NULL, -- 0: Radiant, 1: Dire
    order_num INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, order_num)
);

-- Agenda Manual / Próximas Partidas Cadastradas
CREATE TABLE IF NOT EXISTS schedule (
    id BIGSERIAL PRIMARY KEY,
    league_id BIGINT REFERENCES leagues(id) ON DELETE SET NULL,
    league_name TEXT,
    team1_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    team2_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    team1_name TEXT NOT NULL,
    team2_name TEXT NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    series_type INT DEFAULT 3, -- 1: BO1, 3: BO3, 5: BO5
    stage TEXT DEFAULT 'Partida Regular',
    stream_url TEXT,
    stream_channel TEXT,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished', 'postponed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transmissões (Streams Oficiais e Comunitárias)
CREATE TABLE IF NOT EXISTS streams (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'twitch', 'youtube'
    channel_url TEXT NOT NULL,
    language TEXT DEFAULT 'pt-BR',
    is_live BOOLEAN DEFAULT FALSE,
    viewer_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VODs Cadastrados
CREATE TABLE IF NOT EXISTS vods (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT REFERENCES matches(match_id) ON DELETE SET NULL,
    series_id BIGINT REFERENCES series(series_id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    platform TEXT DEFAULT 'youtube',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chaveamentos / Brackets (Admin)
CREATE TABLE IF NOT EXISTS brackets (
    id BIGSERIAL PRIMARY KEY,
    league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL, -- ex: 'Upper Bracket', 'Lower Bracket', 'Grand Final'
    bracket_data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Palpites (Bolão)
CREATE TABLE IF NOT EXISTS predictions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    series_id BIGINT REFERENCES series(series_id) ON DELETE CASCADE,
    match_id BIGINT REFERENCES matches(match_id) ON DELETE CASCADE,
    schedule_id BIGINT REFERENCES schedule(id) ON DELETE CASCADE,
    predicted_winner_team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    predicted_team1_score INT,
    predicted_team2_score INT,
    status prediction_status DEFAULT 'pending',
    points_awarded INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Placar Geral e Ranking de Palpites por Usuário
CREATE TABLE IF NOT EXISTS prediction_scores (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INT DEFAULT 0,
    correct_winners INT DEFAULT 0,
    correct_scores INT DEFAULT 0,
    monthly_points INT DEFAULT 0,
    streak_count INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conquistas / Badges do Bolão
CREATE TABLE IF NOT EXISTS achievements (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL, -- ex: 'FIRST_GUESS', 'ORACLE_5', 'UPSET_KING'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    points INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conquistas dos Usuários
CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id BIGINT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Análises e Artigos do Blog (Markdown)
CREATE TABLE IF NOT EXISTS analyses (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL, -- Formato Markdown
    cover_image TEXT,
    author TEXT DEFAULT 'Redação DotaHub',
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações Gerais do Site
CREATE TABLE IF NOT EXISTS site_settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs de Sincronização
CREATE TABLE IF NOT EXISTS sync_logs (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL, -- 'opendota', 'steam', 'manual'
    status TEXT NOT NULL, -- 'success', 'warning', 'error'
    items_synced INT DEFAULT 0,
    error_message TEXT,
    details JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_series_id ON matches(series_id);
CREATE INDEX IF NOT EXISTS idx_matches_radiant_team ON matches(radiant_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_dire_team ON matches(dire_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_start_time ON matches(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_series_league_id ON series(league_id);
CREATE INDEX IF NOT EXISTS idx_series_start_time ON series(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_series_status ON series(status);

CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_hero ON match_players(hero_id);
CREATE INDEX IF NOT EXISTS idx_match_players_account ON match_players(account_id);

CREATE INDEX IF NOT EXISTS idx_match_picks_bans_match ON match_picks_bans(match_id);
CREATE INDEX IF NOT EXISTS idx_match_picks_bans_hero ON match_picks_bans(hero_id);

CREATE INDEX IF NOT EXISTS idx_schedule_time ON schedule(scheduled_time ASC);
CREATE INDEX IF NOT EXISTS idx_schedule_status ON schedule(status);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_series ON predictions(series_id);

CREATE INDEX IF NOT EXISTS idx_analyses_slug ON analyses(slug);
CREATE INDEX IF NOT EXISTS idx_analyses_published ON analyses(published_at DESC);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_picks_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE vods ENABLE ROW LEVEL SECURITY;
ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Regras de Leitura Pública
CREATE POLICY "Public Read Leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "Public Read Teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public Read Players" ON players FOR SELECT USING (true);
CREATE POLICY "Public Read TeamPlayers" ON team_players FOR SELECT USING (true);
CREATE POLICY "Public Read Heroes" ON heroes FOR SELECT USING (true);
CREATE POLICY "Public Read Series" ON series FOR SELECT USING (true);
CREATE POLICY "Public Read Matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public Read MatchPlayers" ON match_players FOR SELECT USING (true);
CREATE POLICY "Public Read MatchPicksBans" ON match_picks_bans FOR SELECT USING (true);
CREATE POLICY "Public Read Schedule" ON schedule FOR SELECT USING (true);
CREATE POLICY "Public Read Streams" ON streams FOR SELECT USING (true);
CREATE POLICY "Public Read Vods" ON vods FOR SELECT USING (true);
CREATE POLICY "Public Read Brackets" ON brackets FOR SELECT USING (true);
CREATE POLICY "Public Read Achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public Read UserAchievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Public Read PredictionScores" ON prediction_scores FOR SELECT USING (true);
CREATE POLICY "Public Read Analyses" ON analyses FOR SELECT USING (true);
CREATE POLICY "Public Read SiteSettings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public Read SyncLogs" ON sync_logs FOR SELECT USING (true);

-- Regras de Palpites (Predictions):
-- Leitura pública dos palpites após a partida ter começado ou apenas pelo próprio usuário
CREATE POLICY "Predictions Read Policy" ON predictions FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM schedule s WHERE s.id = predictions.schedule_id AND s.scheduled_time <= NOW()
) OR EXISTS (
    SELECT 1 FROM series sr WHERE sr.series_id = predictions.series_id AND sr.start_time <= NOW()
));

-- Criação e Edição de Palpites pelo próprio usuário logado ANTES do início do jogo
CREATE POLICY "Predictions Insert Policy" ON predictions FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND (
        (schedule_id IS NOT NULL AND EXISTS (SELECT 1 FROM schedule s WHERE s.id = schedule_id AND s.scheduled_time > NOW()))
        OR (series_id IS NOT NULL AND EXISTS (SELECT 1 FROM series sr WHERE sr.series_id = series_id AND sr.start_time > NOW()))
    )
);

CREATE POLICY "Predictions Update Policy" ON predictions FOR UPDATE
USING (
    auth.uid() = user_id
    AND (
        (schedule_id IS NOT NULL AND EXISTS (SELECT 1 FROM schedule s WHERE s.id = schedule_id AND s.scheduled_time > NOW()))
        OR (series_id IS NOT NULL AND EXISTS (SELECT 1 FROM series sr WHERE sr.series_id = series_id AND sr.start_time > NOW()))
    )
);

-- Regras de Admin (Escrita irrestrita via service_role ou usuário com claim role = 'admin')
CREATE POLICY "Admin Full Access Leagues" ON leagues FOR ALL TO authenticated USING (
    (auth.jwt()->>'role') = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
);
CREATE POLICY "Admin Full Access Teams" ON teams FOR ALL TO authenticated USING (
    (auth.jwt()->>'role') = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
);
CREATE POLICY "Admin Full Access Schedule" ON schedule FOR ALL TO authenticated USING (
    (auth.jwt()->>'role') = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
);
CREATE POLICY "Admin Full Access Streams" ON streams FOR ALL TO authenticated USING (
    (auth.jwt()->>'role') = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
);
CREATE POLICY "Admin Full Access Vods" ON vods FOR ALL TO authenticated USING (
    (auth.jwt()->>'role') = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
);
CREATE POLICY "Admin Full Access Brackets" ON brackets FOR ALL TO authenticated USING (
    (auth.jwt()->>'role') = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
);
CREATE POLICY "Admin Full Access Analyses" ON analyses FOR ALL TO authenticated USING (
    (auth.jwt()->>'role') = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
);
CREATE POLICY "Admin Full Access Settings" ON site_settings FOR ALL TO authenticated USING (
    (auth.jwt()->>'role') = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
);

-- 6. VIEWS AGREGADAS DE ALTA PERFORMANCE (Evita processamento pesado no client)

-- View: Meta dos Heróis (Picks, Bans, Vitórias e Winrate)
CREATE OR REPLACE VIEW v_hero_meta AS
SELECT 
    h.id AS hero_id,
    h.localized_name,
    h.primary_attr,
    h.attack_type,
    h.img_url,
    COUNT(DISTINCT mp.match_id) AS total_picks,
    COUNT(DISTINCT CASE 
        WHEN (mp.is_radiant = TRUE AND m.radiant_win = TRUE) OR (mp.is_radiant = FALSE AND m.radiant_win = FALSE) 
        THEN mp.match_id 
    END) AS total_wins,
    COALESCE(pb.bans_count, 0) AS total_bans,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT mp.match_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN (mp.is_radiant = TRUE AND m.radiant_win = TRUE) OR (mp.is_radiant = FALSE AND m.radiant_win = FALSE) THEN mp.match_id END)::numeric / COUNT(DISTINCT mp.match_id)::numeric) * 100 
            ELSE 0 
        END, 
        1
    ) AS winrate
FROM heroes h
LEFT JOIN match_players mp ON h.id = mp.hero_id
LEFT JOIN matches m ON mp.match_id = m.match_id
LEFT JOIN (
    SELECT hero_id, COUNT(*) AS bans_count
    FROM match_picks_bans
    WHERE is_pick = FALSE
    GROUP BY hero_id
) pb ON h.id = pb.hero_id
GROUP BY h.id, h.localized_name, h.primary_attr, h.attack_type, h.img_url, pb.bans_count;

-- View: Médias Estatísticas por Jogador
CREATE OR REPLACE VIEW v_player_averages AS
SELECT 
    p.account_id,
    p.name,
    p.personaname,
    p.avatar_url,
    p.country_code,
    p.role,
    t.name AS team_name,
    t.logo_url AS team_logo,
    COUNT(mp.match_id) AS matches_recorded,
    ROUND(AVG(mp.kills), 1) AS avg_kills,
    ROUND(AVG(mp.deaths), 1) AS avg_deaths,
    ROUND(AVG(mp.assists), 1) AS avg_assists,
    ROUND(AVG(mp.gpm), 0) AS avg_gpm,
    ROUND(AVG(mp.xpm), 0) AS avg_xpm,
    ROUND(AVG(mp.last_hits), 0) AS avg_last_hits,
    ROUND(AVG(mp.hero_damage), 0) AS avg_damage,
    ROUND(
        CASE 
            WHEN AVG(mp.deaths) = 0 THEN (AVG(mp.kills) + AVG(mp.assists))::numeric
            ELSE ((AVG(mp.kills) + AVG(mp.assists)) / NULLIF(AVG(mp.deaths), 0))::numeric
        END, 
        2
    ) AS avg_kda
FROM players p
LEFT JOIN teams t ON p.team_id = t.id
JOIN match_players mp ON p.account_id = mp.account_id
GROUP BY p.account_id, p.name, p.personaname, p.avatar_url, p.country_code, p.role, t.name, t.logo_url;

-- View: Ranking dos Times com Winrate Geral
CREATE OR REPLACE VIEW v_team_rankings AS
SELECT 
    t.id,
    t.name,
    t.tag,
    t.logo_url,
    t.rating,
    t.wins,
    t.losses,
    (t.wins + t.losses) AS total_games,
    ROUND(
        CASE 
            WHEN (t.wins + t.losses) > 0 THEN (t.wins::numeric / (t.wins + t.losses)::numeric) * 100 
            ELSE 0 
        END, 
        1
    ) AS winrate,
    t.region,
    t.last_match_time
FROM teams t
ORDER BY t.rating DESC;
