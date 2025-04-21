import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileNavbar from './components/MobileNavbar';
import MatchCardHolder from './components/MatchCardHolder';
import MobileMatchCardHolder from './components/MobileMatchCardHolder';
import Footer from './components/Footer';
import MobileFooter from './components/MobileFooter';
import VideoView from './Video_view';
import { fetchMatches, SportMatches } from './services/MatchService';
import './styles/global.css';
import './App.css';
import './styles/profile_dropdown.css';
import AuthStateDebugger from './components/AuthStateDebugger';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [matchData, setMatchData] = useState<SportMatches>({
    cricket: [],
    football: [],
    tennis: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const getMatches = async () => {
      try {
        setLoading(true);
        const data = await fetchMatches();
        
        // Normalize keys to ensure consistent casing
        const normalizedData: SportMatches = {};
        Object.entries(data).forEach(([sport, matches]) => {
          const normalizedSport = sport.toLowerCase();
          if (!normalizedData[normalizedSport]) {
            normalizedData[normalizedSport] = [];
          }
          normalizedData[normalizedSport] = [...(normalizedData[normalizedSport] || []), ...matches];
        });
        
        setMatchData(normalizedData);
        setError(null);
      } catch (err) {
        setError('Failed to load match data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getMatches();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const formatSportTitle = (sport: string): string => {
    return sport.charAt(0).toUpperCase() + sport.slice(1) + ' Matches';
  };

  return (
    <>
      <AuthStateDebugger />
      {isMobile ? <MobileNavbar /> : <Navbar />}
      {isMobile ? (
        <>
          {Object.entries(matchData).map(([sport, matches]) => (
            matches.length > 0 && (
              <MobileMatchCardHolder
                key={sport}
                title={formatSportTitle(sport)}
                matches={matches}
              />
            )
          ))}
        </>
      ) : (
        <>
          {Object.entries(matchData).map(([sport, matches]) => (
            matches.length > 0 && (
              <MatchCardHolder
                key={sport}
                title={formatSportTitle(sport)}
                matches={matches}
                containerId={`${sport}-matches`}
              />
            )
          ))}
        </>
      )}
      {isMobile ? <MobileFooter /> : <Footer />}
    </>
  );
};

const MainApp: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/video-view" element={<VideoView />} />
      </Routes>
    </BrowserRouter>
  );
};

export default MainApp;
