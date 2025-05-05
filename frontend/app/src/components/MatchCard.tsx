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

  const getStatusClass = () => {
    if (matchStatus.toLowerCase() === 'live') {
      return 'live';
    }
    return '';
  };

  const handleClick = () => {
    let sportType = 'cricket';
    if (tournamentName.toLowerCase().includes('football') || 
        tournamentName.toLowerCase().includes('soccer')) {
      sportType = 'football';
    } else if (tournamentName.toLowerCase().includes('tennis')) {
      sportType = 'tennis';
    }

    const urlSport = encodeURIComponent(sportType);
    const urlTournament = encodeURIComponent(tournamentName);
    const urlTeam1 = encodeURIComponent(team1.name);
    const urlTeam2 = encodeURIComponent(team2.name);

    navigate(`/watch/${urlSport}/${urlTournament}/${urlTeam1}/${urlTeam2}`, {
      state: {
        matchStatus,
        team1,
        team2,
        tournamentName,
        score
      }
    });
  };

  return (
    <div className="match-card" onClick={handleClick}>
      <div className={`match-status ${getStatusClass()}`}>
        {matchStatus}
      </div>
      
      <div className="match-teams">
        <div className="team team-1">
          <div className="team-logo">
            <img src={team1.logo || "/placeholder-logo.png"} alt={team1.name} />
          </div>
          <div className="team-name">{team1.name}</div>
        </div>
        
        <div className="match-center">
          <div className="vs">VS</div>
          <div className="score">{score}</div>
        </div>
        
        <div className="team team-2">
          <div className="team-logo">
            <img src={team2.logo || "/placeholder-logo.png"} alt={team2.name} />
          </div>
          <div className="team-name">{team2.name}</div>
        </div>
      </div>
      
      <div className="match-tournament">
        {tournamentName}
      </div>
    </div>
  );
};

export default MatchCard;
