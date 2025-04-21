import React, { useState } from 'react';
import MobileMatchCard from './MobileMatchCard';
import '../styles/mobilematchcardholder.css';

interface MatchCardProps {
  matchStatus: string;
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
  tournamentName: string;
  score: string;
}

interface MobileMatchCardHolderProps {
  title: string;
  matches: MatchCardProps[];
}

const MobileMatchCardHolder: React.FC<MobileMatchCardHolderProps> = ({ title, matches }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : matches.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < matches.length - 1 ? prevIndex + 1 : 0));
  };

  return (
    <section className="mobile-category-section">
      <h2>{title}</h2>
      <div className="mobile-match-card-container">
        <button className="mobile-scroll-button mobile-left" onClick={handlePrev}>&#8249;</button>
        <div className="mobile-match-card-wrapper">
          <MobileMatchCard {...matches[currentIndex]} />
        </div>
        <button className="mobile-scroll-button mobile-right" onClick={handleNext}>&#8250;</button>
      </div>
    </section>
  );
};

export default MobileMatchCardHolder;
