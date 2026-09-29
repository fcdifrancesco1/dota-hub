-- ==============================================================================
-- DOTA 2 COMPETITIVE HUB - SEED DATA
-- 2 Campeonatos, 8 Times, Jogadores Pro, Heróis, 20 Partidas Reais, Palpites e Análises
-- ==============================================================================

-- 1. CONFIGURAÇÕES DO SITE
INSERT INTO site_settings (key, value) VALUES
('general', '{
    "site_name": "DotaHub Brasil",
    "tagline": "O portal definitivo do Dota 2 competitivo em português",
    "primary_color": "#E03E2D",
    "secondary_color": "#C59B27",
    "logo_url": "/logo.svg",
    "discord_url": "https://discord.gg/dota2brasil",
    "whatsapp_url": "https://chat.whatsapp.com/dota2brasil",
    "favorite_teams": [8255888, 2163]
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. CAMPEONATOS
INSERT INTO leagues (id, name, tier, prize_pool, start_date, end_date, banner_url, logo_url, status, location) VALUES
(16890, 'ESL One Bangkok 2026', 'tier_1', '$1,000,000', NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/leagues/esl_banner.jpg', 'https://eslgaming.com/wp-content/uploads/2021/04/esl-logo-small.png', 'ongoing', 'Bangkok, Tailândia'),
(17200, 'The International 2026', 'tier_1', '$3,500,000', NOW() + INTERVAL '20 days', NOW() + INTERVAL '32 days', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/blog/ti_banner.jpg', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/aegis.png', 'upcoming', 'Copenhague, Dinamarca')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

-- 3. TIMES
INSERT INTO teams (id, name, tag, logo_url, rating, wins, losses, region, last_match_time) VALUES
(8255888, 'Team Falcons', 'Falcons', 'https://steamusercontent-a.akamaihd.net/ugc/2349354060855799757/7A831E0D1C8C85786CF4DFB3BECA07D6D8E2D642/', 1680.5, 342, 110, 'MENA / WEU', NOW() - INTERVAL '2 hours'),
(2163, 'Team Liquid', 'Liquid', 'https://steamusercontent-a.akamaihd.net/ugc/2027229562725807908/33C788A58529CF34A1B2961CE9E546C9E42C2DE4/', 1640.2, 850, 420, 'WEU', NOW() - INTERVAL '5 hours'),
(8599101, 'Gaimin Gladiators', 'GG', 'https://steamusercontent-a.akamaihd.net/ugc/2028348873491959739/BEB53243FDB737EE8D0A144EC1DA98DBF25F6564/', 1615.0, 420, 195, 'WEU', NOW() - INTERVAL '8 hours'),
(7119388, 'Team Spirit', 'Spirit', 'https://steamusercontent-a.akamaihd.net/ugc/1858293739775368595/A4EE82FEA58F54BA79667794DF2803BFDE23B2F7/', 1605.8, 620, 280, 'EEU', NOW() - INTERVAL '1 day'),
(8254400, 'BetBoom Team', 'BB', 'https://steamusercontent-a.akamaihd.net/ugc/1838042459424874984/2E5DDCF95D21FE7EBDE6ED3FDC4C697B9C7A1489/', 1585.0, 310, 155, 'EEU', NOW() - INTERVAL '1 day'),
(8291895, 'Tundra Esports', 'Tundra', 'https://steamusercontent-a.akamaihd.net/ugc/1858293739783935293/5CA4DC23A8C5BD67A32F52909C2B7E1B73F3DE7C/', 1572.4, 380, 210, 'WEU', NOW() - INTERVAL '2 days'),
(9262100, 'PARIVISION', 'PARI', 'https://steamusercontent-a.akamaihd.net/ugc/2458479878234891102/52BD1A0176D7AC3C99FE4C9B718BCFEBC83A3B43/', 1560.1, 140, 75, 'EEU', NOW() - INTERVAL '2 days'),
(8574561, 'Xtreme Gaming', 'XG', 'https://steamusercontent-a.akamaihd.net/ugc/1824523363384260275/02FB8971B0B796CD2D4A93699BCF2B663A7EFD9B/', 1550.0, 290, 160, 'China', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating, wins = EXCLUDED.wins, losses = EXCLUDED.losses;

-- 4. JOGADORES
INSERT INTO players (account_id, name, personaname, team_id, role, country_code, avatar_url) VALUES
-- Team Falcons
(152962063, 'skiter', 'Oliver Lepko', 8255888, 1, 'sk', 'https://avatars.steamstatic.com/d6a36f6d52f6c99c864437a3f5a2f5f9dd7b43a9_full.jpg'),
(183719386, 'Malr1ne', 'Stanislav Potorak', 8255888, 2, 'ru', 'https://avatars.steamstatic.com/ec6cb52ec5428a47ff7dbb846e1335cb99cf166e_full.jpg'),
(97590558, 'ATF', 'Ammar Al-Assaf', 8255888, 3, 'jo', 'https://avatars.steamstatic.com/4f05256e2e50529d47910ff6fc74308ee4f55bb8_full.jpg'),
(25907144, 'Cr1t-', 'Andreas Nielsen', 8255888, 4, 'dk', 'https://avatars.steamstatic.com/83bb2227d8db1df87c0c16b607062ea9cf5538e6_full.jpg'),
(86726887, 'Sneyking', 'Jingjun Wu', 8255888, 5, 'us', 'https://avatars.steamstatic.com/a42b1090013b5552a4658efeb9b8fb9dffb186b1_full.jpg'),

-- Team Liquid
(106863163, 'miCKe', 'Michael Vu', 2163, 1, 'se', 'https://avatars.steamstatic.com/c1da4dfce56dcfeecae209a8031d2ba5cf5bf237_full.jpg'),
(119576842, 'Nisha', 'Michał Jankowski', 2163, 2, 'pl', 'https://avatars.steamstatic.com/7b134d4a8e63fb28db15984efc7df2559b97779d_full.jpg'),
(94738847, 'SabeRLighT-', 'Jonáš Volek', 2163, 3, 'cz', 'https://avatars.steamstatic.com/5cb9668fe5e27a6e11894b8fa64ef3f248e3cfbb_full.jpg'),
(10366616, 'Boxi', 'Samuel Svahn', 2163, 4, 'se', 'https://avatars.steamstatic.com/264b383ae8957ba4bcf1fe3e54b6fcfe973ca427_full.jpg'),
(82262495, 'Insania', 'Aydin Sarkohi', 2163, 5, 'se', 'https://avatars.steamstatic.com/492efb1a9cbe498877bc3dbbe95379e563065a78_full.jpg')
ON CONFLICT (account_id) DO UPDATE SET team_id = EXCLUDED.team_id, role = EXCLUDED.role;

-- 5. HERÓIS PRINCIPAIS (REFERÊNCIA DE DADOS)
INSERT INTO heroes (id, name, localized_name, primary_attr, attack_type, roles, img_url, icon_url) VALUES
(1, 'npc_dota_hero_antimage', 'Anti-Mage', 'agi', 'Melee', ARRAY['Carry', 'Escape'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/antimage.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/antimage.png'),
(14, 'npc_dota_hero_pudge', 'Pudge', 'str', 'Melee', ARRAY['Disabler', 'Initiator', 'Durable'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/pudge.png'),
(18, 'npc_dota_hero_sven', 'Sven', 'str', 'Melee', ARRAY['Carry', 'Disabler', 'Initiator'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/sven.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/sven.png'),
(22, 'npc_dota_hero_zuus', 'Zeus', 'int', 'Ranged', ARRAY['Nuker'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/zuus.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/zuus.png'),
(25, 'npc_dota_hero_lina', 'Lina', 'int', 'Ranged', ARRAY['Carry', 'Nuker', 'Disabler'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lina.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/lina.png'),
(31, 'npc_dota_hero_lich', 'Lich', 'int', 'Ranged', ARRAY['Support', 'Nuker'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lich.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/lich.png'),
(35, 'npc_dota_hero_sniper', 'Sniper', 'agi', 'Ranged', ARRAY['Carry', 'Nuker'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/sniper.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/sniper.png'),
(48, 'npc_dota_hero_luna', 'Luna', 'agi', 'Ranged', ARRAY['Carry', 'Nuker'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/luna.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/luna.png'),
(54, 'npc_dota_hero_life_stealer', 'Lifestealer', 'str', 'Melee', ARRAY['Carry', 'Durable', 'Escape'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/life_stealer.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/life_stealer.png'),
(74, 'npc_dota_hero_invoker', 'Invoker', 'all', 'Ranged', ARRAY['Carry', 'Nuker', 'Disabler', 'Escape'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/invoker.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/invoker.png'),
(86, 'npc_dota_hero_rubick', 'Rubick', 'int', 'Ranged', ARRAY['Support', 'Disabler', 'Nuker'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/rubick.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/rubick.png'),
(91, 'npc_dota_hero_wisp', 'Io', 'all', 'Ranged', ARRAY['Support', 'Escape', 'Nuker'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/wisp.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/wisp.png'),
(98, 'npc_dota_hero_shredder', 'Timbersaw', 'all', 'Melee', ARRAY['Nuker', 'Durable', 'Escape'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/shredder.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/shredder.png'),
(99, 'npc_dota_hero_bristleback', 'Bristleback', 'str', 'Melee', ARRAY['Carry', 'Durable', 'Initiator'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/bristleback.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/bristleback.png'),
(102, 'npc_dota_hero_abaddon', 'Abaddon', 'all', 'Melee', ARRAY['Support', 'Carry', 'Durable'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/abaddon.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/abaddon.png'),
(104, 'npc_dota_hero_legion_commander', 'Legion Commander', 'str', 'Melee', ARRAY['Carry', 'Disabler', 'Initiator', 'Durable'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/legion_commander.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/legion_commander.png'),
(114, 'npc_dota_hero_monkey_king', 'Monkey King', 'agi', 'Melee', ARRAY['Carry', 'Escape', 'Disabler', 'Initiator'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/monkey_king.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/monkey_king.png'),
(123, 'npc_dota_hero_hoodwink', 'Hoodwink', 'agi', 'Ranged', ARRAY['Support', 'Nuker', 'Escape', 'Disabler'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/hoodwink.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/hoodwink.png'),
(138, 'npc_dota_hero_ringmaster', 'Ringmaster', 'int', 'Ranged', ARRAY['Support', 'Disabler', 'Nuker', 'Escape'], 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/ringmaster.png', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/ringmaster.png')
ON CONFLICT (id) DO UPDATE SET localized_name = EXCLUDED.localized_name;

-- 6. SÉRIES E PARTIDAS
-- Série 1: Falcons vs Liquid (Grande Final BO5)
INSERT INTO series (series_id, league_id, team1_id, team2_id, score_team1, score_team2, series_type, stage, status, start_time, winner_team_id) VALUES
(9001001, 16890, 8255888, 2163, 3, 2, 5, 'Grande Final', 'finished', NOW() - INTERVAL '1 day', 8255888),
-- Série 2: GG vs Spirit (Semifinal BO3)
(9001002, 16890, 8599101, 7119388, 2, 0, 3, 'Semifinal Upper Bracket', 'finished', NOW() - INTERVAL '2 days', 8599101),
-- Série 3: BetBoom vs Tundra (Quartas de Final BO3)
(9001003, 16890, 8254400, 8291895, 2, 1, 3, 'Quartas de Final', 'finished', NOW() - INTERVAL '3 days', 8254400),
-- Série 4: PARIVISION vs Xtreme Gaming (Playoffs BO3)
(9001004, 16890, 9262100, 8574561, 2, 1, 3, 'Fase de Grupos', 'finished', NOW() - INTERVAL '4 days', 9262100)
ON CONFLICT (series_id) DO UPDATE SET score_team1 = EXCLUDED.score_team1, score_team2 = EXCLUDED.score_team2;

-- 20 Partidas Reais associadas às Séries
INSERT INTO matches (match_id, series_id, league_id, radiant_team_id, dire_team_id, radiant_win, duration, start_time, radiant_score, dire_score, radiant_gold_adv, radiant_xp_adv) VALUES
-- Série 1 (5 mapas)
(7920001, 9001001, 16890, 8255888, 2163, true, 2450, NOW() - INTERVAL '28 hours', 36, 18, ARRAY[0, 200, 500, 1200, 3400, 5800, 12000, 24000], ARRAY[0, 100, 400, 900, 2100, 4300, 9800, 18000]),
(7920002, 9001001, 16890, 2163, 8255888, true, 2810, NOW() - INTERVAL '26 hours', 42, 29, ARRAY[0, -100, -300, 800, 2500, 4100, 8900, 19500], ARRAY[0, 0, -200, 600, 1800, 3200, 7100, 15000]),
(7920003, 9001001, 16890, 8255888, 2163, true, 1980, NOW() - INTERVAL '24 hours', 28, 11, ARRAY[0, 400, 1100, 2800, 6200, 11500, 18400], ARRAY[0, 300, 800, 2100, 4900, 9200, 14800]),
(7920004, 9001001, 16890, 2163, 8255888, true, 3120, NOW() - INTERVAL '22 hours', 38, 35, ARRAY[0, -200, 400, -500, 1200, -2100, 4500, 14000], ARRAY[0, -100, 300, -200, 900, -1400, 3800, 11200]),
(7920005, 9001001, 16890, 8255888, 2163, true, 2670, NOW() - INTERVAL '20 hours', 41, 23, ARRAY[0, 300, 800, 1900, 4500, 8900, 16200, 28500], ARRAY[0, 200, 600, 1400, 3800, 7100, 12900, 21000]),

-- Série 2 (2 mapas)
(7920006, 9001002, 16890, 8599101, 7119388, true, 2150, NOW() - INTERVAL '50 hours', 31, 14, ARRAY[0, 100, 600, 1800, 4100, 9500, 17000], ARRAY[0, 150, 400, 1200, 3100, 7200, 13400]),
(7920007, 9001002, 16890, 7119388, 8599101, false, 2540, NOW() - INTERVAL '48 hours', 20, 35, ARRAY[0, 200, 100, -800, -2400, -6800, -15300], ARRAY[0, 100, 50, -500, -1900, -5100, -11800]),

-- Série 3 (3 mapas)
(7920008, 9001003, 16890, 8254400, 8291895, true, 2900, NOW() - INTERVAL '74 hours', 39, 25, ARRAY[0, 100, 300, 1100, 2900, 5400, 12000], ARRAY[0, 50, 200, 900, 2100, 4200, 9800]),
(7920009, 9001003, 16890, 8291895, 8254400, true, 2210, NOW() - INTERVAL '72 hours', 28, 12, ARRAY[0, 300, 800, 2400, 5800, 11200, 19400], ARRAY[0, 200, 600, 1800, 4500, 8900, 15100]),
(7920010, 9001003, 16890, 8254400, 8291895, true, 3450, NOW() - INTERVAL '70 hours', 45, 41, ARRAY[0, -400, -800, 200, -1100, 2500, 9400, 22000], ARRAY[0, -300, -500, 100, -800, 1900, 7500, 17000]),

-- Série 4 (3 mapas)
(7920011, 9001004, 16890, 9262100, 8574561, false, 2380, NOW() - INTERVAL '98 hours', 15, 30, ARRAY[0, -200, -600, -1500, -3800, -8900, -18200], ARRAY[0, -100, -400, -1100, -2900, -6800, -13500]),
(7920012, 9001004, 16890, 8574561, 9262100, false, 2710, NOW() - INTERVAL '96 hours', 22, 34, ARRAY[0, 100, 400, -200, -1800, -5100, -14000], ARRAY[0, 50, 250, -100, -1200, -3800, -10500]),
(7920013, 9001004, 16890, 9262100, 8574561, true, 2990, NOW() - INTERVAL '94 hours', 33, 21, ARRAY[0, 200, 500, 1400, 3900, 8400, 16800], ARRAY[0, 100, 350, 1000, 2800, 6500, 13100]),

-- Mais 7 partidas de fase de grupos
(7920014, NULL, 16890, 8255888, 7119388, true, 2100, NOW() - INTERVAL '5 days', 29, 13, ARRAY[0, 300, 900, 2500, 6100, 12500], ARRAY[0, 200, 700, 1900, 4800, 9800]),
(7920015, NULL, 16890, 2163, 8599101, true, 2480, NOW() - INTERVAL '5 days', 32, 20, ARRAY[0, 150, 450, 1200, 3400, 7900, 15200], ARRAY[0, 100, 300, 900, 2600, 6100, 11900]),
(7920016, NULL, 16890, 8254400, 9262100, false, 2850, NOW() - INTERVAL '6 days', 21, 38, ARRAY[0, -100, -400, -1200, -3100, -7800, -16500], ARRAY[0, -50, -250, -800, -2200, -5900, -12800]),
(7920017, NULL, 16890, 8291895, 8574561, true, 2640, NOW() - INTERVAL '6 days', 30, 17, ARRAY[0, 250, 600, 1700, 4200, 9100, 17400], ARRAY[0, 180, 450, 1300, 3200, 7000, 13600]),
(7920018, NULL, 16890, 7119388, 2163, false, 3210, NOW() - INTERVAL '7 days', 26, 39, ARRAY[0, 100, -200, -900, -2400, -5900, -13500], ARRAY[0, 50, -100, -650, -1800, -4400, -10200]),
(7920019, NULL, 16890, 8255888, 8599101, true, 1950, NOW() - INTERVAL '7 days', 27, 9, ARRAY[0, 500, 1400, 3600, 8200, 15900], ARRAY[0, 350, 1100, 2700, 6300, 12200]),
(7920020, NULL, 16890, 8574561, 8254400, true, 2750, NOW() - INTERVAL '8 days', 35, 24, ARRAY[0, 200, 700, 1800, 4300, 9700, 18600], ARRAY[0, 120, 500, 1350, 3300, 7500, 14400])
ON CONFLICT (match_id) DO UPDATE SET duration = EXCLUDED.duration, radiant_score = EXCLUDED.radiant_score;

-- Jogadores na partida histórica 7920001 (Falcons vs Liquid - Game 1)
INSERT INTO match_players (match_id, account_id, hero_id, player_slot, is_radiant, kills, deaths, assists, last_hits, denies, gpm, xpm, hero_damage, tower_damage, net_worth) VALUES
-- Falcons (Radiant)
(7920001, 152962063, 48, 0, true, 11, 2, 14, 380, 22, 820, 890, 34500, 12400, 28500), -- skiter (Luna)
(7920001, 183719386, 98, 1, true, 9, 3, 16, 290, 15, 680, 740, 28900, 4100, 21400),  -- Malr1ne (Timbersaw)
(7920001, 97590558, 99, 2, true, 8, 4, 18, 310, 18, 710, 760, 31200, 5800, 23100),   -- ATF (Bristleback)
(7920001, 25907144, 123, 3, true, 5, 4, 22, 110, 6, 420, 510, 14200, 850, 13800),    -- Cr1t- (Hoodwink)
(7920001, 86726887, 102, 4, true, 3, 5, 24, 75, 4, 360, 440, 9800, 600, 11200),      -- Sneyking (Abaddon)

-- Liquid (Dire)
(7920001, 106863163, 18, 128, false, 6, 7, 7, 340, 14, 690, 710, 22400, 2100, 20100), -- miCKe (Sven)
(7920001, 119576842, 74, 129, false, 5, 6, 9, 270, 12, 610, 680, 24100, 1500, 18200), -- Nisha (Invoker)
(7920001, 94738847, 104, 130, false, 4, 7, 8, 220, 9, 520, 590, 17800, 1200, 15400),  -- SabeRLighT- (Legion Commander)
(7920001, 10366616, 86, 131, false, 2, 8, 12, 85, 3, 340, 410, 11200, 300, 10100),    -- Boxi (Rubick)
(7920001, 82262495, 31, 132, false, 1, 8, 11, 45, 2, 290, 360, 8400, 150, 8900)       -- Insania (Lich)
ON CONFLICT (match_id, player_slot) DO UPDATE SET kills = EXCLUDED.kills, deaths = EXCLUDED.deaths;

-- Picks e Bans da partida 7920001
INSERT INTO match_picks_bans (match_id, is_pick, hero_id, team, order_num) VALUES
(7920001, false, 91, 0, 0), -- Ban Io (Falcons)
(7920001, false, 25, 1, 1), -- Ban Lina (Liquid)
(7920001, false, 14, 0, 2), -- Ban Pudge (Falcons)
(7920001, false, 54, 1, 3), -- Ban Lifestealer (Liquid)
(7920001, true, 102, 0, 4), -- Pick Abaddon (Falcons)
(7920001, true, 31, 1, 5),  -- Pick Lich (Liquid)
(7920001, true, 123, 0, 6), -- Pick Hoodwink (Falcons)
(7920001, true, 86, 1, 7),  -- Pick Rubick (Liquid)
(7920001, false, 1, 0, 8),  -- Ban Anti-Mage (Falcons)
(7920001, false, 35, 1, 9), -- Ban Sniper (Liquid)
(7920001, true, 99, 0, 10), -- Pick Bristleback (Falcons)
(7920001, true, 104, 1, 11),-- Pick Legion Commander (Liquid)
(7920001, true, 98, 0, 12), -- Pick Timbersaw (Falcons)
(7920001, true, 74, 1, 13), -- Pick Invoker (Liquid)
(7920001, false, 22, 1, 14),-- Ban Zeus (Liquid)
(7920001, false, 138, 0, 15),-- Ban Ringmaster (Falcons)
(7920001, true, 18, 1, 16), -- Pick Sven (Liquid)
(7920001, true, 48, 0, 17)  -- Pick Luna (Falcons)
ON CONFLICT (match_id, order_num) DO UPDATE SET hero_id = EXCLUDED.hero_id;

-- 7. AGENDA MANUAL / PRÓXIMAS PARTIDAS (PRÓXIMAS 24H)
INSERT INTO schedule (league_id, league_name, team1_id, team2_id, team1_name, team2_name, scheduled_time, series_type, stage, stream_url, stream_channel, status) VALUES
(16890, 'ESL One Bangkok 2026', 8255888, 8599101, 'Team Falcons', 'Gaimin Gladiators', NOW() + INTERVAL '2 hours', 3, 'Playoffs - Semifinal', 'https://twitch.tv/esl_dota2', 'ESL Dota 2 Oficial', 'scheduled'),
(16890, 'ESL One Bangkok 2026', 2163, 7119388, 'Team Liquid', 'Team Spirit', NOW() + INTERVAL '5 hours 30 minutes', 3, 'Playoffs - Lower Bracket', 'https://twitch.tv/esl_dota2br', 'ESL Dota 2 Brasil', 'scheduled'),
(16890, 'ESL One Bangkok 2026', 8254400, 9262100, 'BetBoom Team', 'PARIVISION', NOW() + INTERVAL '9 hours', 3, 'Playoffs - Lower Bracket', 'https://twitch.tv/esl_dota2', 'ESL Dota 2 Oficial', 'scheduled'),
(16890, 'ESL One Bangkok 2026', 8291895, 8574561, 'Tundra Esports', 'Xtreme Gaming', NOW() + INTERVAL '14 hours', 3, 'Fase de Eliminação', 'https://twitch.tv/esl_dota2br', 'ESL Dota 2 Brasil', 'scheduled')
ON CONFLICT DO NOTHING;

-- 8. STREAMS CADASTRADAS
INSERT INTO streams (name, platform, channel_url, language, is_live, viewer_count) VALUES
('ESL Dota 2 Brasil', 'twitch', 'https://twitch.tv/esl_dota2br', 'pt-BR', true, 1420),
('ESL Dota 2 Official', 'twitch', 'https://twitch.tv/esl_dota2', 'en', true, 48500),
('Dota 2 Esports Canal Oficial', 'youtube', 'https://youtube.com/@dota2esports', 'en', false, 0)
ON CONFLICT DO NOTHING;

-- 9. CONQUISTAS / BADGES DO BOLÃO
INSERT INTO achievements (code, title, description, icon, points) VALUES
('FIRST_GUESS', 'Iniciado em Roshan', 'Fez o primeiro palpite em uma partida oficial', 'Shield', 10),
('STREAK_3', 'Em Chamas', 'Acertou o vencedor de 3 partidas seguidas', 'Flame', 30),
('EXACT_SCORE', 'Visão do Oráculo', 'Acertou o placar exato de uma série MD3 ou MD5', 'Eye', 50),
('UPSET_HUNTER', 'Caçador de Zebras', 'Acertou a vitória de um time com menos de 30% de votos', 'Zap', 80),
('TI_MASTER', 'Campeão do Aegis', 'Participou de palpites em todas as etapas dos playoffs', 'Trophy', 150)
ON CONFLICT (code) DO NOTHING;

-- 10. ARTIGOS DE ANÁLISE (BLOG / MARKDOWN)
INSERT INTO analyses (title, slug, summary, content, cover_image, author, tags, is_featured, published_at) VALUES
(
    'Raio-X do Patch 7.37: O domínio da Luna e dos heróis Universais no competitivo',
    'raio-x-patch-7-37-luna-meta',
    'Entenda por que a Luna se tornou a carry mais prioritária dos torneios tier 1 e como as mudanças de mapa impactaram as rotações de suporte.',
    '# O Retorno Triunfante da Luna no Cenário Profissional

O patch 7.37 trouxe alterações sutis porém decisivas nas rotas e nos itens de agilidade, transformando heróis de farming rápido como a **Luna** e o **Sven** nas escolhas principais das potências mundiais.

---

## 1. Por que a Luna está tão forte?
- **Lucent Beam e Eclipse com scaling mágico:** O dano inicial garante presença em lutas rápidas antes dos 20 minutos.
- **Moon Glaives:** Limpeza instantânea de campos de neutros e pressão contínua nas rotas laterais.
- **Build otimizada:** *Manta Style* + *Dragon Lance* + *Black King Bar* fornecem sobrevivência e alcance para lutar com segurança.

```markdown
Estatísticas da Luna no ESL One:
- Taxa de Pick: 42.5%
- Taxa de Ban: 38.0%
- Winrate: 68.4% em 38 jogos
```

---

## 2. A força dos Heróis Universais na rota do meio
Heróis como **Invoker**, **Timbersaw** e **Abaddon** continuam ditando o ritmo devido ao ganho linear de dano proporcionado por qualquer atributo secundário.

> "A versatilidade dos heróis universais permite flexibilizar a rotação de draft sem entregar as intenções do time no primeiro estágio." — *Análise Técnica DotaHub*

---

## 3. O que esperar dos próximos confrontos?
Espere ver mais contramedidas focadas em controle de área (*Hoodwink*, *Disruptor*) e drafts com iniciação de longa distância para neutralizar as carries vulneráveis a burst.',
    'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/blog/patch737_banner.jpg',
    'Felipe Di Francesco',
    ARRAY['Patch 7.37', 'Meta', 'Análise Tática', 'Luna', 'ESL One'],
    true,
    NOW() - INTERVAL '6 hours'
),
(
    'Team Falcons vs Team Liquid: A rivalidade que define a temporada 2026',
    'falcons-vs-liquid-rivalidade-2026',
    'Uma análise detalhada da grande final do ESL One Bangkok, onde o controle de mapa de Sneyking enfrentou o ritmo implacável de Nisha.',
    '# Falcons x Liquid: O Clássico Moderno do Dota 2

Nos últimos meses, **Team Falcons** e **Team Liquid** protagonizaram as finais mais eletrizantes do circuito profissional. A final em MD5 do ESL One Bangkok não foi exceção.

## O Choque de Estilos
1. **O Estilo Opressor da Falcons:**
   - Prioridade de farm para Ammar (**ATF**) no offlane.
   - Malr1ne com picks agressivos no mid criando espaço.
   - Sneyking coordenando stacks e wards profundas.

2. **A Resposta Estratégica da Liquid:**
   - Nisha como motor principal das team fights.
   - Boxi e Insania garantindo saves cruciais com *Rubick* e *Lich*.

O placar de 3x2 coroou a Falcons, mas deixou claro que o The International 2026 terá uma das disputas mais equilibradas de todos os tempos.',
    'https://steamusercontent-a.akamaihd.net/ugc/2349354060855799757/7A831E0D1C8C85786CF4DFB3BECA07D6D8E2D642/',
    'Redação DotaHub',
    ARRAY['Falcons', 'Liquid', 'ESL One', 'Playoffs', 'Recap'],
    false,
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;
