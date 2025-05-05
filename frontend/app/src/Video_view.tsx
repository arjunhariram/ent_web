// Video_view.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import './styles/navbar.css';
import Navbar from './components/Navbar';
import VideoPlayer from './components/VideoPlayer';
import MatchCard from './components/MatchCard';
import './styles/video-view.css';
import Footer from './components/Footer';
import { fetchMatches, Match } from './services/MatchService.tsx';

interface MatchDetails {
  matchStatus: string;
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
  tournamentName: string;
  score: string;
}

const VideoView: React.FC = () => {
  const location = useLocation();
  const matchDetails = location.state as MatchDetails | undefined;
  const [recommendedMatches, setRecommendedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  const hlsStreamUrl = "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8";

  useEffect(() => {
    const loadRecommendedMatches = async () => {
      try {
        setLoading(true);
        const allMatches = await fetchMatches();
        
        // Find matches from the same tournament
        let sameTournamentMatches: Match[] = [];
        
        if (matchDetails) {
          Object.values(allMatches).forEach(sportMatches => {
            const filteredMatches = sportMatches.filter(match => 
              match.tournamentName === matchDetails.tournamentName && 
              (match.team1.name !== matchDetails.team1.name || 
               match.team2.name !== matchDetails.team2.name)
            );
            sameTournamentMatches = [...sameTournamentMatches, ...filteredMatches];
          });
        }
        
        setRecommendedMatches(sameTournamentMatches.slice(0, 5));
      } catch (error) {
        console.error('Error loading recommended matches:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecommendedMatches();
  }, [matchDetails]);

  if (!matchDetails) {
    return <Navigate to="/" />;
  }

  const isLive = matchDetails.matchStatus.toLowerCase() === 'live';

  return (
    <div className="video-view-page">
      <Navbar />
      
      <div className="youtube-layout-container">
        {/* Left Column - Video Player and Match Info */}
        <div className="video-main-column">
          <div className="video-player-container">
            <div className="video-player-wrapper">
              <VideoPlayer 
                src={hlsStreamUrl} 
                autoPlay={true}
                fluid={true}
              />
              <div className="video-overlay"></div>
            </div>
          </div>
          
          <div className="match-info-card">
            {isLive && <div className="match-status-badge live">Live</div>}
            {!isLive && <div className="match-status-badge">{matchDetails.matchStatus}</div>}
            
            <div className="match-teams-container">
              <div className="team-column">
                <div className="team-logo-container">
                  <img 
                    src={matchDetails.team1.logo || "/placeholder-logo.png"} 
                    alt={matchDetails.team1.name} 
                    className="team-logo"
                  />
                </div>
                <div className="team-name">{matchDetails.team1.name}</div>
              </div>
              
              <div className="match-center-info">
                <div className="vs-text">VS</div>
                <div className="match-score">{matchDetails.score}</div>
              </div>
              
              <div className="team-column">
                <div className="team-logo-container">
                  <img 
                    src={matchDetails.team2.logo || "/placeholder-logo.png"} 
                    alt={matchDetails.team2.name} 
                    className="team-logo"
                  />
                </div>
                <div className="team-name">{matchDetails.team2.name}</div>
              </div>
            </div>
            
            <div className="match-details-section">
              <div className="tournament-name">
                {matchDetails.tournamentName}
              </div>
              <div className="match-description">
                Watch the exciting match between {matchDetails.team1.name} and {matchDetails.team2.name} in the {matchDetails.tournamentName}.
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Recommendations */}
        <div className="video-recommendations-column">
          <h3 className="recommendations-title">Upcoming Matches</h3>
          
          {loading ? (
            <div className="loading-recommendations">Loading...</div>
          ) : recommendedMatches.length > 0 ? (
            <div className="recommendations-list">
              {recommendedMatches.map((match, index) => (
                <div key={index} className="recommendation-card-wrapper">
                  <MatchCard 
                    matchStatus={match.matchStatus}
                    team1={match.team1}
                    team2={match.team2}
                    tournamentName={match.tournamentName}
                    score={match.score}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-recommendations">
              No upcoming matches found in this tournament.
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default VideoView;