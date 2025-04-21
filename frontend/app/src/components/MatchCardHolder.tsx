import React, { useRef, useEffect, useState } from 'react';
import MatchCard from './MatchCard';
import '../styles/matchcard_holder.css';

interface MatchCardProps {
  matchStatus: string;
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
  tournamentName: string;
  score: string;
}

interface MatchCardHolderProps {
  title: string;
  matches: MatchCardProps[];
  containerId: string;
}

const MatchCardHolder: React.FC<MatchCardHolderProps> = ({ title, matches, containerId }) => {
  if (!title || typeof title !== 'string') {
    console.error('Invalid title provided to MatchCardHolder');
    return null;
  }

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showNavButtons, setShowNavButtons] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const handleResize = () => {
        const isOverflowing = container.scrollWidth > container.clientWidth;
        setShowNavButtons(isOverflowing);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      const observer = new MutationObserver(handleResize);
      observer.observe(container, { childList: true, subtree: true });

      return () => {
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
      };
    }
  }, [matches]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className="category-section">
      <h2>{title}</h2>
      <div className="scroll-wrapper">
        {showNavButtons && (
          <>
            <button className="scroll-button left" onClick={scrollLeft}>&#8249;</button>
            <button className="scroll-button right" onClick={scrollRight}>&#8250;</button>
          </>
        )}
        <div className="scroll-container" id={containerId} ref={scrollContainerRef}>
          {matches.map((match, index) => (
            <MatchCard key={index} {...match} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MatchCardHolder;
