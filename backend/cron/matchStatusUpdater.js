import cron from 'node-cron';
import pool from '../db.js';

async function updateMatchStatuses() {
  const client = await pool.connect();
  let updated = 0;
  
  try {
    const tournamentsQuery = `
      SELECT name 
      FROM tournament_list 
      WHERE end_date >= NOW()
    `;
    const tournaments = await client.query(tournamentsQuery);

    for (const tournament of tournaments.rows) {
      const tableName = tournament.name;
      const updateQuery = `
        UPDATE ${tableName}
        SET status = 'completed'
        WHERE status NOT IN ('completed', 'cancelled')
        AND match_date < NOW() - INTERVAL '5 hours'
        RETURNING id
      `;
      
      try {
        const result = await client.query(updateQuery);
        if (result.rowCount > 0) {
          updated += result.rowCount;
          console.log(`Updated ${result.rowCount} matches in ${tableName}`);
        }
      } catch (error) {
        console.error(`Error updating ${tableName}:`, error.message);
      }
    }
    
    console.log(`Total matches updated: ${updated}`);
  } catch (error) {
    console.error('Cron job error:', error.message);
  } finally {
    client.release();
  }
}

const cronJob = cron.schedule('0 * * * *', () => {
  console.log(`[${new Date().toISOString()}] Running match status update`);
  updateMatchStatuses().catch(error => {
    console.error('Failed to run match status update:', error);
  });
}, {
  scheduled: true,
  timezone: "UTC"
});

console.log(`[${new Date().toISOString()}] Initial match status update`);
updateMatchStatuses().catch(error => {
  console.error('Failed to run initial match status update:', error);
});

const now = new Date();
const nextRun = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
console.log(`Next scheduled run: ${nextRun.toISOString()}`);

process.on('SIGTERM', () => {
  cronJob.stop();
});

export default cronJob;
