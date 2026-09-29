import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Radio } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LiveMatchDetail from '../components/LiveMatchDetail';
import { liveMatchKey } from '../utils/liveMatchRoute';
import { useOpenTeam } from '../utils/teamRoute';

export default function LiveMatchPage() {
  const { matchKey } = useParams();
  const location = useLocation();
  const { liveGames, loading, constants, setSelectedHero } = useApp();
  const openTeam = useOpenTeam();

  // Prefere o jogo da lista atualizada (a cada 30s); na primeira abertura usa o
  // que veio no clique; com o link direto, um match_id numérico basta para a
  // página buscar a telemetria sozinha.
  const fromList = (liveGames || []).find((g) => liveMatchKey(g) === matchKey);
  const fromNavigation = location.state?.game && liveMatchKey(location.state.game) === matchKey
    ? location.state.game
    : null;
  const resolved = fromList || fromNavigation || (/^\d+$/.test(matchKey) ? { match_id: matchKey } : null);

  // A lista ao vivo é recriada a cada 30s; repassar um objeto novo reiniciaria a
  // sincronização (e o spinner) da página. Mantemos um objeto por partida e só o
  // trocamos quando chega a versão completa de um jogo aberto por link direto.
  const stableRef = useRef({ key: null, game: null });
  const current = stableRef.current;
  const isBare = (g) => g && !g.timeA && !g.radiant_name;
  if (
    current.key !== matchKey ||
    (!current.game && resolved) ||
    (isBare(current.game) && resolved && !isBare(resolved))
  ) {
    stableRef.current = { key: matchKey, game: resolved };
  }
  const game = stableRef.current.game;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [matchKey]);

  const teamA = game?.timeA || game?.radiant_name;
  const teamB = game?.timeB || game?.dire_name;
  useEffect(() => {
    const previous = document.title;
    if (teamA && teamB) document.title = `${teamA} vs ${teamB} · Ao Vivo · DotaHub Brasil`;
    return () => { document.title = previous; };
  }, [teamA, teamB]);

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
      <Link
        to="/ao-vivo"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Central Ao Vivo</span>
      </Link>

      {game ? (
        <LiveMatchDetail
          // Remonta só quando muda a partida, não a cada atualização da lista
          key={matchKey}
          game={game}
          constants={constants}
          onOpenTeamProfile={(name) => openTeam(null, name)}
          onSelectHero={setSelectedHero}
        />
      ) : loading ? (
        <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-semibold">Carregando partida...</span>
        </div>
      ) : (
        <div className="rounded-2xl bg-surface border border-line p-10 text-center max-w-xl mx-auto">
          <Radio className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h1 className="text-lg font-black text-white uppercase mb-2">Partida não está mais ao vivo</h1>
          <p className="text-xs text-gray-400 mb-5">
            Esta partida pode ter terminado. Confira as partidas em andamento na Central Ao Vivo ou o resultado em Partidas.
          </p>
          <Link to="/ao-vivo" className="inline-flex px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-black uppercase">
            Ir para Central Ao Vivo
          </Link>
        </div>
      )}
    </div>
  );
}
