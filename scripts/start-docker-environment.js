/**
 * Atlas-ERP Docker Environment Starter
 * 
 * This script starts the Atlas-ERP Docker environment and verifies that all services are running correctly.
 * 
 * Run with: node scripts/start-docker-environment.js
 */

const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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

// Check if Docker is running
async function checkDockerRunning() {
  try {
    await execPromise('docker info');
    return true;
  } catch (err) {
    return false;
  }
}

// Check if Docker Compose is installed
async function checkDockerComposeInstalled() {
  try {
    await execPromise('docker-compose --version');
    return true;
  } catch (err) {
    return false;
  }
}

// Start Docker Compose environment
async function startDockerCompose() {
  log('\n=== Starting Docker Compose Environment ===', colors.bright + colors.cyan);
  
  try {
    // Check if containers are already running
    const { stdout: psOutput } = await execPromise('docker ps --format "{{.Names}}" | grep atlas-erp');
    
    if (psOutput.trim()) {
      warning('Some Atlas-ERP containers are already running. Stopping them first...');
      await execPromise('docker-compose down');
    }
  } catch (err) {
    // No containers running, which is fine
  }
  
  // Start Docker Compose in detached mode
  log('Starting Docker Compose environment...', colors.bright);
  
  return new Promise((resolve, reject) => {
    const dockerCompose = spawn('docker-compose', ['up', '-d'], { stdio: 'inherit' });
    
    dockerCompose.on('close', (code) => {
      if (code === 0) {
        success('Docker Compose environment started successfully');
        resolve(true);
      } else {
        error(`Docker Compose failed with exit code ${code}`);
        reject(new Error(`Docker Compose failed with exit code ${code}`));
      }
    });
    
    dockerCompose.on('error', (err) => {
      error(`Failed to start Docker Compose: ${err.message}`);
      reject(err);
    });
  });
}

// Wait for containers to be healthy
async function waitForHealthyContainers(timeout = 120) {
  log('\n=== Waiting for Containers to be Healthy ===', colors.bright + colors.cyan);
  
  const startTime = Date.now();
  const containers = [
    'atlas-erp-surrealdb',
    'atlas-erp-arangodb',
    'atlas-erp-minio',
    'atlas-erp-postgres',
    'atlas-erp-temporal',
    'atlas-erp-app',
  ];
  
  while (Date.now() - startTime < timeout * 1000) {
    try {
      const { stdout } = await execPromise('docker ps --format "{{.Names}}:{{.Status}}" | grep atlas-erp');
      const containerStatuses = stdout.split('\n').filter(Boolean);
      
      log('\nCurrent container statuses:', colors.bright);
      containerStatuses.forEach(status => {
        if (status.includes('healthy')) {
          success(status);
        } else if (status.includes('starting') || status.includes('unhealthy')) {
          warning(status);
        } else {
          info(status);
        }
      });
      
      // Check if all required containers are running and healthy
      const allHealthy = containers.every(container => 
        containerStatuses.some(status => 
          status.includes(container) && 
          (status.includes('healthy') || !status.includes('health'))
        )
      );
      
      if (allHealthy) {
        success('\nAll containers are running and healthy!');
        return true;
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
      log('Waiting for containers to be healthy...', colors.dim);
    } catch (err) {
      warning(`Error checking container status: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  error(`Timeout waiting for containers to be healthy after ${timeout} seconds`);
  return false;
}

// Check service URLs
async function checkServiceURLs() {
  log('\n=== Checking Service URLs ===', colors.bright + colors.cyan);
  
  const services = [
    { name: 'Atlas-ERP App', url: 'http://localhost:3000' },
    { name: 'SurrealDB', url: 'http://localhost:8001/health' },
    { name: 'ArangoDB', url: 'http://localhost:8529/_api/version' },
    { name: 'MinIO API', url: 'http://localhost:9000/minio/health/live' },
    { name: 'MinIO Console', url: 'http://localhost:9001' },
    { name: 'Temporal UI', url: 'http://localhost:8088' },
  ];
  
  const fetch = (await import('node-fetch')).default;
  
  for (const service of services) {
    try {
      const response = await fetch(service.url, { timeout: 5000 }).catch(() => null);
      
      if (response && response.ok) {
        success(`${service.name} is accessible at ${service.url}`);
      } else {
        warning(`${service.name} returned non-OK response at ${service.url}`);
      }
    } catch (err) {
      error(`Failed to access ${service.name} at ${service.url}: ${err.message}`);
    }
  }
}

// Main function
async function main() {
  log('🚀 Atlas-ERP Docker Environment Starter', colors.bright + colors.magenta);
  log('======================================', colors.bright + colors.magenta);
  
  // Check if Docker is running
  if (!await checkDockerRunning()) {
    error('Docker is not running. Please start Docker and try again.');
    process.exit(1);
  }
  
  // Check if Docker Compose is installed
  if (!await checkDockerComposeInstalled()) {
    error('Docker Compose is not installed. Please install Docker Compose and try again.');
    process.exit(1);
  }
  
  // Start Docker Compose environment
  try {
    await startDockerCompose();
  } catch (err) {
    error(`Failed to start Docker Compose environment: ${err.message}`);
    process.exit(1);
  }
  
  // Wait for containers to be healthy
  const containersHealthy = await waitForHealthyContainers();
  
  if (!containersHealthy) {
    warning('Some containers may not be healthy. Proceeding with caution...');
  }
  
  // Check service URLs
  await checkServiceURLs();
  
  log('\n🎉 Docker environment setup complete!', colors.bright + colors.green);
  log('Run the verification script to test all features:', colors.bright);
  log('  node scripts/verify-atlas-erp.js', colors.bright + colors.cyan);
}

// Run the main function
main().catch(err => {
  error(`Setup failed: ${err.message}`);
  process.exit(1);
});
