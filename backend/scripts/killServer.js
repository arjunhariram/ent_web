import findProcess from 'find-process';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get port from command line args or use default 4000
const port = process.argv[2] || 4000;

async function killProcessOnPort() {
  console.log(`Attempting to kill process using port ${port}...`);
  
  try {
    // Find all processes using the specified port
    const processList = await findProcess('port', port);
    
    if (processList.length === 0) {
      console.log(`No process found using port ${port}`);
      return false;
    }
    
    console.log(`Found ${processList.length} process(es) using port ${port}:`);
    
    // Loop through each process and attempt to kill it
    for (const process of processList) {
      console.log(`PID: ${process.pid}, Name: ${process.name}`);
      
      try {
        // Different kill command based on platform
        if (process.platform === 'win32') {
          await execAsync(`taskkill /F /PID ${process.pid}`);
        } else {
          await execAsync(`kill -9 ${process.pid}`);
        }
        console.log(`Successfully killed process ${process.pid}`);
      } catch (killError) {
        console.error(`Failed to kill process ${process.pid}:`, killError.message);
        return false;
      }
    }
    
    // Verify the port is now free
    try {
      const checkAgain = await findProcess('port', port);
      if (checkAgain.length > 0) {
        console.log(`Port ${port} is still in use. Manual intervention may be required.`);
        return false;
      } else {
        console.log(`Port ${port} is now free and ready to use.`);
        return true;
      }
    } catch (error) {
      console.error('Error verifying port status:', error);
      return false;
    }
  } catch (error) {
    console.error('Error finding processes:', error);
    return false;
  }
}

// Run the function
killProcessOnPort()
  .then(success => {
    console.log(success 
      ? 'Port cleanup successful! You can now restart your server.' 
      : 'Port cleanup was not completely successful.');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  });
