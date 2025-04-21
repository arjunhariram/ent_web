import { getUpcomingMatches } from '../api/Matchinfo.js';

async function testMatchInfo() {
  try {
    console.log('Fetching upcoming matches...');
    const matches = await getUpcomingMatches();
    console.log('=== Upcoming Matches By Sport ===');
    
    const sportCount = Object.keys(matches).length;
    console.log(`Found matches for ${sportCount} sport(s)`);
    
    for (const [sport, sportMatches] of Object.entries(matches)) {
      console.log(`\n--- ${sport} (${sportMatches.length} matches) ---`);
      
      sportMatches.forEach((match, index) => {
        console.log(`\n[Match ${index + 1}]`);
        console.log(JSON.stringify(match, null, 2));
      });
    }

    console.log('\n=== Example of Expected Format ===');
    console.log(JSON.stringify({
      matchStatus: 'Live',
      team1: { name: 'RCB', logo: 'https://upload.wikimedia.org/wikipedia/en/4/49/Royal_Challengers_Bangalore_Logo.svg' },
      team2: { name: 'GT', logo: 'https://upload.wikimedia.org/wikipedia/en/d/d1/Gujarat_Titans_Logo.svg' },
      tournamentName: 'IPL 2025',
      score: '150/5 (18.3)',
    }, null, 2));
  } catch (error) {
    console.error('Error testing match info:', error);
  } finally {
    process.exit(0);
  }
}

console.log('Starting Match Info Test...');
testMatchInfo();
