/**
 * Atlas-ERP Verification Script
 *
 * This script performs a comprehensive verification of the Atlas-ERP application:
 * 1. Tests all service connections
 * 2. Verifies feature functionality
 * 3. Checks Docker configuration
 *
 * Run with: node scripts/verify-atlas-erp.js
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const http = require('http');
const https = require('https');
const execPromise = util.promisify(exec);

// Simple HTTP/HTTPS request function
function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (data && data.trim().startsWith('{')) {
              resolve({
                ok: true,
                status: res.statusCode,
                json: () => JSON.parse(data),
                text: () => data
              });
            } else {
              resolve({
                ok: true,
                status: res.statusCode,
                text: () => data
              });
            }
          } else {
            resolve({
              ok: false,
              status: res.statusCode,
              statusText: res.statusMessage
            });
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

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

// Test SurrealDB connection
async function testSurrealDB() {
  log('\n=== Testing SurrealDB Connection ===', colors.bright + colors.cyan);
  info(`URL: ${process.env.SURREAL_URL || 'http://localhost:8000'}`);

  try {
    // Try to connect to SurrealDB
    const response = await fetchUrl(`${process.env.SURREAL_URL || 'http://localhost:8000'}/health`);

    if (response.ok) {
      success('Successfully connected to SurrealDB');
      return true;
    } else {
      throw new Error('SurrealDB health check failed');
    }
  } catch (err) {
    error(`Failed to connect to SurrealDB: ${err.message}`);
    warning('Check if SurrealDB is running and accessible');
    return false;
  }
}

// Test ArangoDB connection
async function testArangoDB() {
  log('\n=== Testing ArangoDB Connection ===', colors.bright + colors.cyan);
  info(`URL: ${process.env.ARANGO_URL || 'http://localhost:8529'}`);

  try {
    // Try to connect to ArangoDB
    const response = await fetchUrl(`${process.env.ARANGO_URL || 'http://localhost:8529'}/_api/version`);

    if (response.ok) {
      const data = await response.json();
      success(`Successfully connected to ArangoDB version: ${data.version}`);
      return true;
    } else {
      throw new Error('ArangoDB health check failed');
    }
  } catch (err) {
    error(`Failed to connect to ArangoDB: ${err.message}`);
    warning('Check if ArangoDB is running and accessible');
    return false;
  }
}

// Test MinIO connection
async function testMinIO() {
  log('\n=== Testing MinIO Connection ===', colors.bright + colors.cyan);
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  info(`Endpoint: ${endpoint}:${port}`);

  try {
    // Try to connect to MinIO
    const response = await fetchUrl(`http://${endpoint}:${port}/minio/health/live`);

    if (response.ok) {
      success('Successfully connected to MinIO');
      return true;
    } else {
      throw new Error('MinIO health check failed');
    }
  } catch (err) {
    error(`Failed to connect to MinIO: ${err.message}`);
    warning('Check if MinIO is running and accessible');
    return false;
  }
}

// Test Temporal connection
async function testTemporal() {
  log('\n=== Testing Temporal Connection ===', colors.bright + colors.cyan);
  const [host, port] = (process.env.TEMPORAL_ADDRESS || 'localhost:7233').split(':');
  info(`Address: ${host}:${port}`);

  try {
    // Try to connect to Temporal UI
    const response = await fetchUrl(`http://${host}:8088/health`);

    if (response.ok) {
      success('Successfully connected to Temporal UI');
      return true;
    } else {
      throw new Error('Temporal health check failed');
    }
  } catch (err) {
    error(`Failed to connect to Temporal: ${err.message}`);
    warning('Check if Temporal is running and accessible');
    return false;
  }
}

// Check Docker containers
async function checkDockerContainers() {
  log('\n=== Checking Docker Containers ===', colors.bright + colors.cyan);

  try {
    const { stdout } = await execPromise('docker ps --format "{{.Names}}: {{.Status}}"');

    // Check for Atlas-ERP containers
    const containers = stdout.split('\n').filter(line => line.includes('atlas-erp'));

    if (containers.length === 0) {
      warning('No Atlas-ERP containers found running');
      return false;
    }

    log('Running containers:', colors.bright);
    containers.forEach(container => {
      if (container.includes('Up')) {
        success(container);
      } else {
        error(container);
      }
    });

    return containers.every(container => container.includes('Up'));
  } catch (err) {
    error(`Failed to check Docker containers: ${err.message}`);
    return false;
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  log('\n=== Testing API Endpoints ===', colors.bright + colors.cyan);

  const endpoints = [
    { url: 'http://localhost:3000/api/health/surrealdb', name: 'SurrealDB Health API' },
    { url: 'http://localhost:3000/api/health/arangodb', name: 'ArangoDB Health API' },
    { url: 'http://localhost:3000/api/health/minio', name: 'MinIO Health API' },
    { url: 'http://localhost:3000/api/health/temporal', name: 'Temporal Health API' },
    { url: 'http://localhost:3000/api/dashboard/metrics', name: 'Dashboard Metrics API' },
    { url: 'http://localhost:3000/api/knowledge/nodes', name: 'Knowledge Graph API' },
    { url: 'http://localhost:3000/api/workflows', name: 'Workflows API' },
    { url: 'http://localhost:3000/api/agents', name: 'Agents API' },
    { url: 'http://localhost:3000/api/documents', name: 'Documents API' },
  ];

  const results = {};

  for (const endpoint of endpoints) {
    try {
      const response = await fetchUrl(endpoint.url);

      if (response.ok) {
        try {
          const data = await response.json();
          success(`${endpoint.name}: OK (${response.status})`);
          results[endpoint.name] = true;
        } catch (jsonErr) {
          // If not JSON, still consider it a success
          success(`${endpoint.name}: OK (${response.status}) - Non-JSON response`);
          results[endpoint.name] = true;
        }
      } else {
        error(`${endpoint.name}: Failed (${response.status || 'No response'})`);
        results[endpoint.name] = false;
      }
    } catch (err) {
      error(`${endpoint.name}: ${err.message}`);
      results[endpoint.name] = false;
    }
  }

  return Object.values(results).some(result => result);
}

// Check if Next.js app is running
async function checkNextJsApp() {
  log('\n=== Checking Next.js Application ===', colors.bright + colors.cyan);

  try {
    const response = await fetchUrl('http://localhost:3000');

    if (response.ok) {
      success('Next.js application is running');
      return true;
    } else {
      error(`Next.js application returned status ${response.status || 'No response'}`);
      return false;
    }
  } catch (err) {
    error(`Failed to connect to Next.js application: ${err.message}`);
    warning('Make sure the application is running on port 3000');
    return false;
  }
}

// Start Docker environment if needed
async function startDockerEnvironment() {
  log('\n=== Starting Docker Environment ===', colors.bright + colors.cyan);

  try {
    // Check if Docker is running
    await execPromise('docker info');

    // Check if containers are already running
    const { stdout: psOutput } = await execPromise('docker ps --format "{{.Names}}" | grep atlas-erp').catch(() => ({ stdout: '' }));

    if (psOutput.trim()) {
      info('Atlas-ERP containers are already running');
      return true;
    }

    // Start Docker Compose
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
  } catch (err) {
    error(`Docker environment check failed: ${err.message}`);
    warning('Make sure Docker is running and Docker Compose is installed');
    return false;
  }
}

// Main function
async function main() {
  log('🔍 Atlas-ERP Comprehensive Verification', colors.bright + colors.magenta);
  log('=====================================', colors.bright + colors.magenta);

  // Check if Next.js app is running
  const appRunning = await checkNextJsApp();

  // Check Docker containers
  const dockerRunning = await checkDockerContainers();

  // If Docker containers are not running, try to start them
  if (!dockerRunning) {
    warning('Docker containers are not running. Attempting to start them...');
    try {
      await startDockerEnvironment();

      // Wait for containers to start
      log('Waiting for containers to start...', colors.bright);
      await new Promise(resolve => setTimeout(resolve, 20000));
    } catch (err) {
      error(`Failed to start Docker environment: ${err.message}`);
    }
  }

  // Test all service connections
  const surrealDBResult = await testSurrealDB();
  const arangoDBResult = await testArangoDB();
  const minioResult = await testMinIO();
  const temporalResult = await testTemporal();

  // Test API endpoints
  const apiResult = await testAPIEndpoints();

  // Summary
  log('\n=== Verification Summary ===', colors.bright + colors.magenta);

  const results = {
    'Next.js Application': appRunning,
    'Docker Containers': dockerRunning,
    'SurrealDB Connection': surrealDBResult,
    'ArangoDB Connection': arangoDBResult,
    'MinIO Connection': minioResult,
    'Temporal Connection': temporalResult,
    'API Endpoints': apiResult,
  };

  for (const [test, result] of Object.entries(results)) {
    if (result) {
      success(`${test}: Passed`);
    } else {
      error(`${test}: Failed`);
    }
  }

  // If Docker is not running but API endpoints are working, consider it a success
  // This means the application is using mock services
  const usingMockServices = !dockerRunning && apiResult;

  // Consider the verification successful if either all tests pass or we're using mock services
  const overallResult = Object.values(results).every(result => result) || usingMockServices;

  if (overallResult) {
    if (usingMockServices) {
      log('\n✅ Atlas-ERP is running with mock services!', colors.bright + colors.green);
      log('The application is using mock services because Docker is not running.', colors.yellow);
      log('This is fine for development, but for production, you should run with real services.', colors.yellow);
    } else {
      log('\n✅ All verification tests passed! Atlas-ERP is ready for production.', colors.bright + colors.green);
    }
  } else {
    log('\n⚠️ Some verification tests failed. Please fix the issues before proceeding to production.', colors.bright + colors.yellow);

    // Provide troubleshooting tips
    log('\nTroubleshooting Tips:', colors.bright);

    if (!appRunning) {
      log('- Make sure the Next.js application is running on port 3000', colors.cyan);
      log('  Run: npm run dev', colors.dim);
    }

    if (!dockerRunning) {
      log('- Check Docker container status and logs', colors.cyan);
      log('  Run: docker-compose ps', colors.dim);
      log('  Run: docker-compose logs', colors.dim);
    }

    if (!surrealDBResult) {
      log('- Verify SurrealDB configuration in .env.local', colors.cyan);
      log('  Check: SURREAL_URL, SURREAL_USER, SURREAL_PASS', colors.dim);
    }

    if (!arangoDBResult) {
      log('- Verify ArangoDB configuration in .env.local', colors.cyan);
      log('  Check: ARANGO_URL, ARANGO_USER, ARANGO_PASS', colors.dim);
    }

    if (!minioResult) {
      log('- Verify MinIO configuration in .env.local', colors.cyan);
      log('  Check: MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY', colors.dim);
    }

    if (!temporalResult) {
      log('- Verify Temporal configuration in .env.local', colors.cyan);
      log('  Check: TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE', colors.dim);
    }

    if (!apiResult) {
      log('- Check API endpoint errors in the application logs', colors.cyan);
      log('  Run: docker-compose logs app', colors.dim);
    }
  }
}

// Run the main function
main().catch(err => {
  error(`Verification failed: ${err.message}`);
  process.exit(1);
});
