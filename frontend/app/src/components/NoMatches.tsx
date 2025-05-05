import React from 'react';

interface NoMatchesProps {
  sportName?: string;
}

const NoMatches: React.FC<NoMatchesProps> = ({ sportName }) => {
  const message = sportName 
    ? `No upcoming ${sportName.toLowerCase()} matches available`
    : 'No upcoming matches available';
    
  return (
    <div className="no-matches">
      <div className="no-matches-content">
        <i className="no-matches-icon">📅</i>
        <h3>{message}</h3>
        <p>Check back later for updates</p>
      </div>
    </div>
  );
};

export default NoMatches;
