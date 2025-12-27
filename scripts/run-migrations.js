#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Debug information
console.log("=== Migration Script Debug Info ===");
console.log("Working directory:", process.cwd());
console.log("Script directory:", __dirname);
console.log("Node version:", process.version);
console.log("Platform:", process.platform);

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
    console.log("\n=== Starting Migration Process ===");
    console.log("Checking for DATABASE_URL...");
    
    await waitForDatabaseUrl();
    
    const dbUrl = process.env.DATABASE_URL;
    console.log("✓ DATABASE_URL found:", dbUrl.substring(0, 30) + "...");
    
    // Clear Prisma config cache if it exists
    const cacheDir = path.join(process.cwd(), "node_modules", ".cache", "jiti");
    console.log("Checking for Prisma cache at:", cacheDir);
    
    if (fs.existsSync(cacheDir)) {
      console.log("Clearing Prisma config cache...");
      try {
        const files = fs.readdirSync(cacheDir);
        const prismaConfigFiles = files.filter((f) => f.includes("prisma.config"));
        if (prismaConfigFiles.length > 0) {
          prismaConfigFiles.forEach((f) => {
            fs.unlinkSync(path.join(cacheDir, f));
            console.log("Deleted cached config:", f);
          });
        } else {
          console.log("No Prisma config cache files found");
        }
      } catch (e) {
        console.warn("Could not clear cache:", e.message);
      }
    } else {
      console.log("Prisma cache directory does not exist (this is OK)");
    }
    
    // Verify Prisma is available
    console.log("\n=== Verifying Prisma CLI ===");
    try {
      execSync("npx prisma --version", { stdio: "pipe" });
      console.log("✓ Prisma CLI is available");
    } catch (e) {
      console.error("✗ Prisma CLI not found, attempting to continue...");
    }
    
    // Check if prisma.config.ts exists
    const prismaConfigPath = path.join(process.cwd(), "prisma.config.ts");
    if (fs.existsSync(prismaConfigPath)) {
      console.log("✓ Found prisma.config.ts");
    } else {
      console.warn("⚠ prisma.config.ts not found at:", prismaConfigPath);
    }
    
    // Check if schema.prisma exists
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    if (fs.existsSync(schemaPath)) {
      console.log("✓ Found prisma/schema.prisma");
    } else {
      console.warn("⚠ prisma/schema.prisma not found at:", schemaPath);
    }
    
    console.log("\n=== Running Database Migrations ===");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: process.env,
      cwd: process.cwd(),
    });
    
    console.log("\n✓ Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n=== Migration Failed ===");
    if (error.message === "DATABASE_URL not available") {
      console.error(`ERROR: DATABASE_URL not available after ${MAX_WAIT} seconds`);
      console.error("\nRailway Setup Checklist:");
      console.error("1. Ensure PostgreSQL service exists in your Railway project");
      console.error("2. Link PostgreSQL service to your app service:");
      console.error("   - Go to app service → Settings → Variables");
      console.error("   - Click 'New Variable' or use Railway's service linking");
      console.error("   - Select your PostgreSQL service");
      console.error("3. Railway will auto-generate DATABASE_URL when services are linked");
    } else {
      console.error("Error message:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
    process.exit(1);
  }
}

main();

