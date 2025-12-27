#!/usr/bin/env node
const { execSync } = require("child_process");

const MAX_WAIT = 60;
const INTERVAL = 2;
let elapsed = 0;

function waitForDatabaseUrl() {
  return new Promise((resolve, reject) => {
    const check = setInterval(() => {
      if (process.env.DATABASE_URL) {
        clearInterval(check);
        resolve(true);
      } else {
        elapsed += INTERVAL;
        console.log(`Waiting for DATABASE_URL... (${elapsed}s/${MAX_WAIT}s)`);
        if (elapsed >= MAX_WAIT) {
          clearInterval(check);
          reject(new Error("DATABASE_URL not available"));
        }
      }
    }, INTERVAL * 1000);
  });
}

async function main() {
  try {
    console.log("Checking for DATABASE_URL...");
    await waitForDatabaseUrl();
    
    const dbUrl = process.env.DATABASE_URL;
    console.log("✓ DATABASE_URL found:", dbUrl.substring(0, 30) + "...");
    
    // Clear Prisma config cache if it exists
    const fs = require("fs");
    const path = require("path");
    const cacheDir = path.join(process.cwd(), "node_modules", ".cache", "jiti");
    
    if (fs.existsSync(cacheDir)) {
      console.log("Clearing Prisma config cache...");
      try {
        const files = fs.readdirSync(cacheDir);
        files.forEach((f) => {
          if (f.includes("prisma.config")) {
            fs.unlinkSync(path.join(cacheDir, f));
            console.log("Deleted cached config:", f);
          }
        });
      } catch (e) {
        console.warn("Could not clear cache:", e.message);
      }
    }
    
    console.log("Running database migrations...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: process.env,
    });
    
    console.log("✓ Migrations completed");
    process.exit(0);
  } catch (error) {
    if (error.message === "DATABASE_URL not available") {
      console.error(`\nERROR: DATABASE_URL not available after ${MAX_WAIT} seconds`);
      console.error("\nRailway Setup Checklist:");
      console.error("1. Ensure PostgreSQL service exists in your Railway project");
      console.error("2. Link PostgreSQL service to your app service:");
      console.error("   - Go to app service → Settings → Variables");
      console.error("   - Click 'New Variable' or use Railway's service linking");
      console.error("   - Select your PostgreSQL service");
      console.error("3. Railway will auto-generate DATABASE_URL when services are linked");
    } else {
      console.error("Migration failed:", error.message);
    }
    process.exit(1);
  }
}

main();

