import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import DefaultView from './routes/DefaultView.js';
import './cron/matchStatusUpdater.js';
import Styles from './routes/Styles.js';
import TeamLogos from './routes/TeamLogos.js';
import validateMobileNumber from './middleware/InputValueChecker.js';
import validatePassword from './middleware/PasswordValidator.js';
import inputValueCheckerRoutes from './routes/InputValueChecker.js';
import { getUpcomingMatches } from './api/Matchinfo.js';
import otpRoutes from './routes/otpRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import pool from './db.js';
import redisClient from './utils/redisClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/validate', inputValueCheckerRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);

app.post('/api/validate/validate-mobile', validateMobileNumber);

app.post('/api/validate/validate-password', validatePassword, (req, res) => {
  res.json({ isValid: true });
});

app.post('/api/validate/change-password', validatePassword, (req, res) => {
  res.json({ isValid: true });
});

app.get('/api/matches', async (req, res) => {
  try {
    const matches = await getUpcomingMatches();
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Error fetching matches' });
  }
});


app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT 1 as connection_test');

    const redisResult = await redisClient.ping();

    res.json({
      status: 'OK',
      database: dbResult.rows.length > 0 ? 'Connected' : 'Error',
      redis: redisResult ? 'Connected' : 'Error'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'Error',
      message: error.message
    });
  }
});

app.use('/styles', Styles);
app.use('/assets/teamlogos', TeamLogos);
app.use('/', DefaultView);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 4000;
let server;


const startServer = async () => {
  return new Promise((resolve, reject) => {
    try {

      server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        resolve(server);
      });


      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`⚠️ Port ${PORT} is already in use`);


          const alternativePort = PORT + 1;
          console.log(`Attempting to use alternative port: ${alternativePort}...`);


          if (process.env.KUBERNETES_SERVICE_HOST) {
            console.log('Running in Kubernetes - exiting with code 1 to trigger restart policy');
            process.exit(1);
          } else {

            console.error('Possible solutions:');
            console.error('1. Stop the other process using this port');
            console.error('2. Use a different port by setting the PORT environment variable');
            console.error(`3. Run: node scripts/killServer.js ${PORT} to attempt auto-recovery`);


            server = app.listen(alternativePort, () => {
              console.log(`Server now running on alternative port ${alternativePort}`);
              console.log(`Access the application at http://localhost:${alternativePort}`);
              resolve(server);
            });


            server.on('error', (altError) => {
              console.error(`Failed to start server on alternative port ${alternativePort}:`, altError.message);
              reject(altError);
            });
          }
        } else {
          console.error('Failed to start server:', error);
          reject(error);
        }
      });


      setupGracefulShutdown(server);

    } catch (error) {
      console.error('Server startup error:', error);
      reject(error);
    }
  });
};


function setupGracefulShutdown(server) {

  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
      console.log(`Received ${signal}. Shutting down gracefully...`);


      server.close(() => {
        console.log('HTTP server closed');


        Promise.all([
          (async () => {
            try {
              console.log('Closing database pool...');
              await pool.end();
              console.log('Database pool closed');
            } catch (err) {
              console.error('Error closing database pool:', err);
            }
          })(),
          (async () => {
            try {
              console.log('Closing Redis client...');
              await redisClient.quit();
              console.log('Redis client closed');
            } catch (err) {
              console.error('Error closing Redis client:', err);
            }
          })()
        ])
        .then(() => {
          console.log('All connections closed, exiting process');
          process.exit(0);
        })
        .catch(err => {
          console.error('Error during graceful shutdown:', err);
          process.exit(1);
        });
      });


      setTimeout(() => {
        console.error('Shutdown timed out, forcing exit');
        process.exit(1);
      }, 10000);
    });
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});