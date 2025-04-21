import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/mobilematchcard.css';

interface MatchCardProps {
  matchStatus: string;
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
  tournamentName: string;
  score: string;
}

const MobileMatchCard: React.FC<MatchCardProps> = ({ matchStatus, team1, team2, tournamentName, score }) => {
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
    <div className="mobile-match-card" onClick={handleCardClick}>
      <div className="mobile-team-info">
        <div className="mobile-team">
          <img src={team1.logo} alt={`${team1.name} Logo`} className="mobile-team-logo" />
          <span className="mobile-team-name">{team1.name}</span>
        </div>
        <span className="mobile-vs">VS</span>
        <div className="mobile-team">
          <img src={team2.logo} alt={`${team2.name} Logo`} className="mobile-team-logo" />
          <span className="mobile-team-name">{team2.name}</span>
        </div>
      </div>
      <div className="mobile-tournament-name">{tournamentName}</div>
      <div className="mobile-match-score">Score: {score}</div>
    </div>
  );
};

export default MobileMatchCard;
