import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import DefaultView from './routes/DefaultView.js';
import './cron/matchStatusUpdater.js';
import Styles from './routes/Styles.js';
import TeamLogos from './routes/TeamLogos.js';
import { getUpcomingMatches } from './api/Matchinfo.js';
import pool from './db.js';
import redisClient from './utils/redisClient.js';
import CreateAccount from './routes/CreateAccount.js';
import otpRoutes from './routes/OTPRoutes.js';
import SignupPasswordRoute from './routes/SignupPasswordRoute.js';
import LoginRoute from './routes/LoginRoute.js';
import ForgotPasswordInputRoute from './routes/ForgotPasswordInputRoute.js';
import ForgotPasswordChangeRoute from './routes/ForgotPasswordChangeRoute.js';
import ChangePasswordRoute from './routes/changepasswordroute.js';
import signOutRoutes from './routes/signoutflow.js'; // Import the sign-out routes

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

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`); // Log incoming requests
  next();
});

app.get('/api/matches', async (req, res) => {
  try {
    console.log('Fetching upcoming matches'); // Log endpoint activity
    const matches = await getUpcomingMatches();
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Error fetching matches' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    console.log('Performing health check'); // Log health check
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
app.use('/api/user', CreateAccount); 
app.use('/api/user', otpRoutes);
app.use('/api/user', SignupPasswordRoute);
app.use('/api/auth', LoginRoute);
app.use('/api/auth', ForgotPasswordInputRoute); // Add the new forgot password route
app.use('/api/user', ForgotPasswordChangeRoute); // Register the password reset route
app.use('/api/auth', ChangePasswordRoute); // Register the change password route
app.use('/api/auth', signOutRoutes); // Register the sign-out route

// Replace the 404 error handler with one that serves the HTML error page
app.use((req, res) => {
  console.log(`404 Error: ${req.method} ${req.url} not found`); // Log 404 errors
  res.status(404).sendFile(path.join(__dirname, '../frontend/app/src/pages/ErrorPage404.html'));
});

// Update general error handler to also serve the error page for server errors
app.use((err, req, res, next) => {
  console.error('Server error:', err); // Log server errors
  res.status(500).sendFile(path.join(__dirname, '../frontend/app/src/pages/ErrorPage404.html'));
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