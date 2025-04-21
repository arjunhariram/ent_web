import pool from '../db.js';
import redisClient from '../utils/redisClient.js';

const getMatchStatus = (matchDate, status) => {
  if (status === 'completed') return 'Completed';
  
  const now = new Date();
  const matchDateTime = new Date(matchDate);
  const diffMs = matchDateTime - now;
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 0) return 'Live';
  if (diffMins < 60) return `Starts in ${diffMins} mins`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Starts in ${diffHours} hours`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Starts in ${diffDays} days`;
};

const getTeamLogo = async (teamName, client) => {
  const cacheKey = `team:logo:${teamName}`;
  const cachedLogo = await redisClient.get(cacheKey);
  
  if (cachedLogo) {
    return cachedLogo;
  }
  
  try {
    const logoQuery = `SELECT logo_location FROM logos WHERE team_name = $1`;
    const result = await client.query(logoQuery, [teamName]);
    
    if (result.rows.length > 0) {
      const logoLocation = result.rows[0].logo_location;
      await redisClient.set(cacheKey, logoLocation, 86400);
      
      return logoLocation;
    } else {
      return 'https://example.com/default-logo.svg';
    }
  } catch (error) {
    return 'https://example.com/default-logo.svg';
  }
};

export const getUpcomingMatches = async () => {
  const client = await pool.connect();
  try {
    const cacheKey = 'upcoming:matches';
    const cachedMatches = await redisClient.getJson(cacheKey);
    
    if (cachedMatches) {
      return cachedMatches;
    }
    
    const tournamentsQuery = `
      SELECT id, name, sport_type 
      FROM tournament_list 
      WHERE start_date <= NOW() + INTERVAL '48 hours' 
      AND end_date >= NOW()
    `;
    
    const tournamentsResult = await client.query(tournamentsQuery);
    const tournaments = tournamentsResult.rows;
    const sportMatches = {};
    
    for (const tournament of tournaments) {
      const tableName = tournament.name
        .toLowerCase()
        .replace(/ /g, '_');  // Ensure table name is properly formatted
      
      // Normalize sport type to lowercase for consistent grouping
      const sportType = tournament.sport_type.toLowerCase();
      
      const matchesQuery = `
        SELECT id, title, team_a, team_b, match_date, status 
        FROM ${tableName} 
        WHERE match_date <= NOW() + INTERVAL '48 hours'
        AND status != 'completed'
        ORDER BY match_date ASC
      `;
      
      try {
        const matchesResult = await client.query(matchesQuery);
        const matches = matchesResult.rows;
        
        if (!sportMatches[sportType]) {
          sportMatches[sportType] = [];
        }
        
        for (const match of matches) {
          if (match.status === 'completed') continue;
          
          const formattedTournamentName = tournament.name
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          const team1Logo = await getTeamLogo(match.team_a, client);
          const team2Logo = await getTeamLogo(match.team_b, client);
            
          sportMatches[sportType].push({
            matchStatus: getMatchStatus(match.match_date, match.status),
            team1: {
              name: match.team_a,
              logo: team1Logo
            },
            team2: {
              name: match.team_b,
              logo: team2Logo
            },
            tournamentName: formattedTournamentName,
            score: match.status === 'upcoming' ? 'TBD' : match.score || 'TBD',
          });
        }
      } catch (error) {
        console.error(`Error fetching matches for ${tableName}:`, error.message);
      }
    }
    
    await redisClient.setJson(cacheKey, sportMatches, 300);
    
    return sportMatches;
  } finally {
    client.release();
  }
};

export default { getUpcomingMatches };
