import React from 'react';
import { useNavigate } from 'react-router-dom';
import TeamLogo from '../utils/teamLogos';
import { useTheme } from '../context/ThemeContext';

// Medidas do desenho (px): largura do card, espaço das linhas e altura das linhas do card
const CARD_W = 184;
const GAP = 28;
const ROW_H = 26;
const LINE = 'bg-line-strong';

// ---- Tradução dos textos que vêm em inglês da Liquipedia ----
const ROUND_NAMES = [
  [/^Upper Bracket Quarterfinals?$/i, 'Quartas · Superior'],
  [/^Upper Bracket Semifinals?$/i, 'Semifinal · Superior'],
  [/^Upper Bracket Final$/i, 'Final · Superior'],
  [/^Lower Bracket Round (\d+)$/i, 'Rodada $1 · Inferior'],
  [/^Lower Bracket Quarterfinals?$/i, 'Quartas · Inferior'],
  [/^Lower Bracket Semifinals?$/i, 'Semifinal · Inferior'],
  [/^Lower Bracket Final$/i, 'Final · Inferior'],
  [/^Grand Finals?$/i, 'Grande Final'],
  [/^Quarterfinals?$/i, 'Quartas de Final'],
  [/^Semifinals?$/i, 'Semifinal'],
  [/^Finals?$/i, 'Final'],
  [/^Third Place Match$/i, 'Disputa de 3º lugar'],
  [/^Round (\d+)$/i, 'Rodada $1'],
  [/^Seeding Matches$/i, 'Partidas de Seeding'],
  [/^Last Chance Matches$/i, 'Última Chance'],
  [/^Tiebreakers?$/i, 'Desempate'],
  [/^To (.+)$/i, 'Classifica p/ $1']
];
const SECTION_NAMES = [
  [/^Group Stage$/i, 'Fase de Grupos'],
  [/^Playoffs$/i, 'Playoffs'],
  [/^Seeding Match(es)?$/i, 'Seeding'],
  [/^Last Chance$/i, 'Última Chance'],
  [/^Main Event$/i, 'Evento Principal']
];
const translateWith = (list) => (s) => {
  const text = String(s || '').trim();
  for (const [re, pt] of list) if (re.test(text)) return text.replace(re, pt);
  return text;
};
// Siglas usadas nos destinos ("To UBSF/UBQF")
const ABBR = { UBQF: 'Quartas Sup.', UBSF: 'Semi Sup.', UBF: 'Final Sup.', LBQF: 'Quartas Inf.', LBSF: 'Semi Inf.', LBF: 'Final Inf.', GF: 'Grande Final', LB: 'Chave Inf.', UB: 'Chave Sup.' };
const roundName = (s) => translateWith(ROUND_NAMES)(s).replace(/\b(UBQF|UBSF|UBF|LBQF|LBSF|LBF|GF|LB|UB)\b/g, (m) => ABBR[m]);
const sectionName = translateWith(SECTION_NAMES);

// "Group D 1st" → "1º do Grupo D"
function placeholderText(p) {
  const m = String(p || '').match(/^Group (\w+) (\d+)(?:st|nd|rd|th)$/i);
  if (m) return `${m[2]}º do Grupo ${m[1]}`;
  return p || 'A definir';
}

const fmtWhen = (ts) => new Date(ts * 1000).toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
});

// ---- Card de uma partida ----
function OpponentRow({ opp, decided }) {
  const { theme } = useTheme();
  const name = opp?.name;
  const logo = opp?.logo ? ((theme === 'light' ? opp.logo.light : opp.logo.dark) || opp.logo.dark) : undefined;
  const loser = decided && !opp?.winner;
  return (
    <div
      className={`flex items-center gap-2 px-2 ${opp?.winner ? 'bg-emerald-500/10' : ''}`}
      style={{ height: ROW_H }}
      title={name || placeholderText(opp?.placeholder)}
    >
      {name ? (
        <TeamLogo teamName={name} logoUrl={logo} className="w-4 h-4 shrink-0" />
      ) : (
        <span className="w-4 h-4 shrink-0" />
      )}
      <span className={`flex-1 min-w-0 truncate text-[11px] ${
        name
          ? `${opp.winner ? 'font-black text-white' : 'font-semibold'} ${loser ? 'text-gray-500' : 'text-gray-200'}`
          : 'italic text-gray-500'
      }`}>
        {name || placeholderText(opp?.placeholder)}
      </span>
      <span className={`w-5 text-center font-mono text-[11px] font-black ${
        opp?.winner ? 'text-emerald-400' : loser ? 'text-gray-500' : 'text-gray-300'
      }`}>
        {opp?.score ?? ''}
      </span>
    </div>
  );
}

function MatchCard({ match }) {
  const navigate = useNavigate();
  const [a, b] = match?.opponents || [];
  const decided = Boolean(a?.winner || b?.winner);
  const matchId = match?.matchIds?.[0];
  const pending = !decided && match?.timestamp;
  const Wrapper = matchId ? 'button' : 'div';

  return (
    <Wrapper
      type={matchId ? 'button' : undefined}
      onClick={matchId ? () => navigate(`/partidas/${matchId}`) : undefined}
      className={`block text-left bg-surface border border-line rounded-lg overflow-hidden shadow-sm shrink-0 ${
        matchId ? 'hover:border-amber-500/60 transition-colors cursor-pointer' : ''
      }`}
      style={{ width: CARD_W }}
      title={matchId ? 'Ver detalhes da série' : undefined}
    >
      <div className="h-4 px-2 flex items-center justify-end text-[9px] font-mono font-bold text-gray-500 bg-surface-2 border-b border-line">
        {pending ? `${fmtWhen(match.timestamp)} BRT` : ''}
      </div>
      <OpponentRow opp={a} decided={decided} />
      <div className="h-px bg-line" />
      <OpponentRow opp={b} decided={decided} />
    </Wrapper>
  );
}

// ---- Árvore ----
// Cada nó: partidas de origem (filhos) à esquerda, linhas de ligação e a partida à direita.
function BracketNode({ node }) {
  const items = node.children || [];
  const bodyIdx = items.map((c, i) => (c.header ? -1 : i)).filter((i) => i >= 0);
  const first = bodyIdx[0];
  const last = bodyIdx[bodyIdx.length - 1];

  return (
    <div className="flex items-center">
      {bodyIdx.length > 0 && (
        <>
          <div className="flex flex-col items-end">
            {items.map((child, i) => {
              // Linha vertical: da metade do primeiro filho até a metade do último
              const vertical = bodyIdx.length > 1 && i >= first && i <= last;
              return (
                <div key={i} className="relative flex items-center" style={{ paddingRight: GAP / 2 }}>
                  {child.header ? (
                    <RoundHeader titles={child.header} className="pt-5 pb-2" />
                  ) : (
                    <>
                      <BracketNode node={child} />
                      <span className={`absolute right-0 top-1/2 h-px ${LINE}`} style={{ width: GAP / 2 }} />
                    </>
                  )}
                  {vertical && (
                    <span
                      className={`absolute right-0 w-px ${LINE}`}
                      style={{ top: i === first ? '50%' : 0, bottom: i === last ? '50%' : 0 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <span className={`h-px ${LINE} shrink-0`} style={{ width: GAP / 2 }} />
        </>
      )}

      <div className="py-1.5">
        <MatchCard match={node.match} />
      </div>

      {node.qualified?.length > 0 && (
        <>
          <span className={`h-px ${LINE} shrink-0`} style={{ width: GAP }} />
          <div className="flex flex-col gap-2">
            {node.qualified.map((q, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 bg-surface-2 border border-dashed border-line rounded-lg"
                style={{ width: CARD_W, height: ROW_H }}
              >
                <span className={`truncate text-[11px] ${q.name ? 'font-bold text-white' : 'italic text-gray-500'}`}>
                  {q.name || 'A definir'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Nomes das rodadas, alinhados à direita (cada um sobre a sua coluna)
function RoundHeader({ titles, className = '' }) {
  return (
    <div className={`flex justify-end ${className}`} style={{ gap: GAP }}>
      {titles.map((t, i) => (
        <div
          key={i}
          className="shrink-0 flex items-center justify-center min-h-[34px] text-center text-[10px] leading-tight font-black uppercase tracking-wider text-gray-300 bg-surface-2 border border-line rounded-md px-2 py-1"
          style={{ width: CARD_W }}
          title={t}
        >
          {roundName(t)}
        </div>
      ))}
    </div>
  );
}

/** Chaveamentos do campeonato, agrupados por fase. */
export default function TournamentBracket({ brackets }) {
  return (
    <div className="space-y-8">
      {brackets.map((b, idx) => {
        const title = [sectionName(b.stage), b.title && sectionName(b.title)].filter(Boolean).join(' · ') || `Chaveamento ${idx + 1}`;
        return (
          <section key={idx}>
            <h2 className="text-xs font-black uppercase tracking-wider text-white mb-3">{title}</h2>
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-xl overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="w-max">
                  {b.headers?.length > 0 && <RoundHeader titles={b.headers} className="pb-2" />}
                  <div className="flex flex-col items-end gap-2">
                    {b.roots.map((root, i) => <BracketNode key={i} node={root} />)}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}
      <p className="text-[11px] text-gray-500">
        Clique em uma partida já jogada para ver as estatísticas da série. Horários em Brasília (BRT).
      </p>
    </div>
  );
}
