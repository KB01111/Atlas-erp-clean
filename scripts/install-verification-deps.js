/**
 * Install Verification Dependencies
 * 
 * This script installs the necessary dependencies for the verification scripts.
 * 
 * Run with: node scripts/install-verification-deps.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Helper functions for logging
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function info(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

// Main function
function main() {
  log('📦 Installing Verification Dependencies', colors.bright + colors.magenta);
  log('=====================================', colors.bright + colors.magenta);
  
  // Check if package.json exists
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    error('package.json not found. Make sure you are in the project root directory.');
    process.exit(1);
  }
  
  // Read package.json
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (err) {
    error(`Failed to parse package.json: ${err.message}`);
    process.exit(1);
  }
  
  // Check if dependencies already exist
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  const requiredDeps = {
    'node-fetch': '^2.6.7',
    'form-data': '^4.0.0',
    'ws': '^8.8.1',
    'uuid': '^9.0.0',
  };
  
  const missingDeps = [];
  
  for (const [dep, version] of Object.entries(requiredDeps)) {
    if (!dependencies[dep] && !devDependencies[dep]) {
      missingDeps.push(`${dep}@${version}`);
    }
  }
  
  if (missingDeps.length === 0) {
    success('All required dependencies are already installed.');
    log('You can now run the verification scripts:', colors.bright);
    log('  node scripts/verify-atlas-erp.js', colors.cyan);
    log('  node scripts/start-docker-environment.js', colors.cyan);
    log('  node scripts/test-features.js', colors.cyan);
    return;
  }
  
  // Install missing dependencies
  log(`Installing missing dependencies: ${missingDeps.join(', ')}`, colors.bright);
  
  try {
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    success('Dependencies installed successfully.');
    
    log('You can now run the verification scripts:', colors.bright);
    log('  node scripts/verify-atlas-erp.js', colors.cyan);
    log('  node scripts/start-docker-environment.js', colors.cyan);
    log('  node scripts/test-features.js', colors.cyan);
  } catch (err) {
    error(`Failed to install dependencies: ${err.message}`);
    warning('Try installing the dependencies manually:');
    log(`  npm install --save-dev ${missingDeps.join(' ')}`, colors.cyan);
  }
}

// Run the main function
main();
