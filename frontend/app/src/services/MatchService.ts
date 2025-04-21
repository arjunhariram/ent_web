interface Team {
  name: string;
  logo: string;
}

export interface Match {
  matchStatus: string;
  team1: Team;
  team2: Team;
  tournamentName: string;
  score: string;
}

export interface SportMatches {
  [sportType: string]: Match[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const fetchMatches = async (): Promise<SportMatches> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches`);
    
    if (!response.ok) {
      throw new Error(`Error fetching matches: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error);
    return {
      cricket: [],
      football: [],
      tennis: []
    };
  }
};
