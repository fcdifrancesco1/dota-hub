import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TeamsSidebar from './components/TeamsSidebar';
import MatchesSidebar from './components/MatchesSidebar';
import CenterChampion from './components/CenterChampion';
import TournamentsView from './components/TournamentsView';
import MmrRankingView from './components/MmrRankingView';
import PlayerStatsModal from './components/PlayerStatsModal';
import { fetchTopTeams, fetchTeam100MatchesStats } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('torneios');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamStats, setTeamStats] = useState({ loading: false, data: [] });

  useEffect(() => {
    fetchTopTeams().then(setTeams);
  }, []);

  const handleSelectTeam = async (team) => {
    setSelectedTeam(team);
    setTeamStats({ loading: true, data: [] });
    const data = await fetchTeam100MatchesStats(team.team_id, team.name);
    setTeamStats({ loading: false, data });
  };

  return (
    <div className="min-h-screen flex flex-col bg-dota-bg">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      {currentView === 'torneios' ? (
        <div className="flex flex-1">
          {/* Coluna Esquerda: Ranking Top 16 Times */}
          <TeamsSidebar teams={teams} onSelectTeam={handleSelectTeam} selectedTeam={selectedTeam} />

          {/* Coluna Central: Campeão Recente e Informações do Torneio */}
          <CenterChampion />

          {/* Coluna Direita: Próximas Partidas com Expansão */}
          <MatchesSidebar />
        </div>
      ) : (
        <MmrRankingView />
      )}

      {/* Modal de Estatísticas ao clicar em um time da Sidebar */}
      {selectedTeam && (
        <PlayerStatsModal
          team={selectedTeam}
          stats={teamStats.data}
          loading={teamStats.loading}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}