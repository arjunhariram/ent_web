import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/matchcard.css';

interface MatchCardProps {
  matchStatus: string;
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
  tournamentName: string;
  score: string;
}

const MatchCard: React.FC<MatchCardProps> = ({ matchStatus, team1, team2, tournamentName, score }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate('/video-view', {
      state: { 
        matchStatus, 
        team1, 
        team2, 
        tournamentName, 
        score 
      },
    });
  };

  return (
    <div className="match-card" onClick={handleCardClick}>
      <div className="match-status">
        <span className="match-status-label">{matchStatus}</span>
      </div>
      <div className="team-info">
        <div className="team">
          <img src={team1.logo} alt={`${team1.name} Logo`} className="team-logo" />
          <span className="team-name">{team1.name}</span>
        </div>
        <span className="vs">VS</span>
        <div className="team">
          <img src={team2.logo} alt={`${team2.name} Logo`} className="team-logo" />
          <span className="team-name">{team2.name}</span>
        </div>
      </div>
      <div className="tournament-name">{tournamentName}</div>
      <div className="match-score">Score: {score}</div>
    </div>
  );
};

export default MatchCard;
