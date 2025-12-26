const { execSync } = require('child_process');

const MAX_WAIT = 60;
const INTERVAL = 2;
let elapsed = 0;

console.log('Checking for DATABASE_URL...');

function waitForDatabaseUrl() {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (process.env.DATABASE_URL) {
        clearInterval(checkInterval);
        resolve(true);
      } else {
        elapsed += INTERVAL;
        console.log(`Waiting for DATABASE_URL... (${elapsed}s/${MAX_WAIT}s)`);
        
        if (elapsed >= MAX_WAIT) {
          clearInterval(checkInterval);
          reject(new Error('DATABASE_URL not available'));
        }
      }
    }, INTERVAL * 1000);
  });
}

async function main() {
  try {
    await waitForDatabaseUrl();
    console.log('✓ DATABASE_URL found');
    console.log('Running database migrations...');
    
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
    
    console.log('✓ Migrations completed');
  } catch (error) {
    if (error.message === 'DATABASE_URL not available') {
      console.error(`\nERROR: DATABASE_URL not available after ${MAX_WAIT} seconds`);
      console.error('');
      console.error('Railway Setup Checklist:');
      console.error('1. Ensure PostgreSQL service exists in your Railway project');
      console.error('2. Link PostgreSQL service to your app service');
      console.error('3. Railway will auto-generate DATABASE_URL when services are linked');
      process.exit(1);
    } else {
      console.error('Migration failed:', error.message);
      process.exit(1);
    }
  }
}

main();

