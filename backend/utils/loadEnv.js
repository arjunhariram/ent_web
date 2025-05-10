import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Ensures environment variables are properly loaded
 * This can be imported at the top of files that need env variables
 */
const loadEnv = () => {
  try {
    // Get the directory path of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Try multiple possible locations for the .env file
    const possiblePaths = [
      path.resolve(__dirname, '../../.env'),
      path.resolve(process.cwd(), '.env')
    ];
    
    let envPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        envPath = p;
        break;
      }
    }
    
    if (!envPath) {
      console.error('Could not find .env file in any of the expected locations');
      return false;
    }
    
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.error('Error loading .env file:', result.error);
      return false;
    }
    
    // Verify critical environment variables
    const requiredVars = ['JWT_SECRET', 'DB_USER', 'DB_HOST'];
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length) {
      console.error(`Missing required environment variables: ${missing.join(', ')}`);
      console.log('Loaded environment from:', envPath);
      console.log('Available variables:', Object.keys(process.env).filter(k => k.startsWith('JWT') || k.startsWith('DB')));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Fatal error loading environment variables:', error);
    return false;
  }
};

export default loadEnv;
