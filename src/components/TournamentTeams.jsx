import React from 'react';
import { Users } from 'lucide-react';
import TeamLogo from '../utils/teamLogos';
import { liquipediaImage } from '../utils/liquipediaImage';
import { useOpenTeam } from '../utils/teamRoute';

// Posições do Dota 2 (número da Liquipedia)
const POSITIONS = {
  1: 'Carry',
  2: 'Mid',
  3: 'Offlane',
  4: 'Suporte 4',
  5: 'Suporte 5'
};

// "Invited" / "Qualified ..." da Liquipedia
function labelPt(label) {
  if (!label) return null;
  if (/^invited/i.test(label)) return 'Convidado';
  if (/^qualified/i.test(label)) return 'Classificado';
  return label;
}

function MemberRow({ member, isCoach }) {
  return (
    <li className="flex items-center gap-2.5 py-1.5">
      <span
        className={`w-7 shrink-0 text-center text-[10px] font-black font-mono rounded py-0.5 ${
          isCoach ? 'bg-white/10 text-gray-300' : 'bg-amber-500/15 text-amber-400'
        }`}
        title={isCoach ? 'Técnico' : POSITIONS[member.position] || member.role || ''}
      >
        {isCoach ? 'TÉC' : member.position || '—'}
      </span>
      {member.flag && (
        <img
          src={liquipediaImage(member.flag)}
          alt={member.country || ''}
          title={member.country || ''}
          referrerPolicy="no-referrer"
          className="w-4 h-3 object-cover rounded-sm shrink-0"
        />
      )}
      <span className="text-xs font-bold text-white truncate">{member.name}</span>
      <span className="ml-auto text-[10px] text-gray-500 whitespace-nowrap">
        {isCoach ? 'Técnico' : POSITIONS[member.position] || member.role || ''}
      </span>
    </li>
  );
}

/** Equipes do campeonato com elenco, posições e técnico (cards de participantes da Liquipedia). */
export default function TournamentTeams({ teams }) {
  const openTeam = useOpenTeam();

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" />
        <strong className="text-white">{teams.length}</strong> equipes · elencos inscritos no campeonato, segundo a Liquipedia.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {teams.map((team) => (
          <div key={team.name} className="bg-surface border border-line rounded-2xl p-4 shadow-lg flex flex-col">
            <button
              type="button"
              onClick={() => openTeam(null, team.name)}
              title={`Ver ${team.name}`}
              className="flex items-center gap-3 text-left group mb-3 pb-3 border-b border-line"
            >
              <TeamLogo teamName={team.name} logoUrl={team.logo?.dark} className="w-10 h-10 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-black text-white group-hover:text-amber-400 transition-colors leading-tight break-words">
                  {team.name}
                </div>
                {labelPt(team.label) && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">{labelPt(team.label)}</div>
                )}
              </div>
            </button>

            {team.players.length === 0 && team.coaches.length === 0 ? (
              <p className="text-xs text-gray-500">Elenco ainda não divulgado.</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {team.players.map((p) => <MemberRow key={`p-${p.name}`} member={p} />)}
                {team.coaches.map((c) => <MemberRow key={`c-${c.name}`} member={c} isCoach />)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
