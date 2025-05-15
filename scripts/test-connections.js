/**
 * Test Connections Script
 *
 * This script tests connections to all services used by Atlas-ERP:
 * - SurrealDB
 * - ArangoDB
 * - MinIO
 * - Temporal
 *
 * Run with: node scripts/test-connections.js
 */

// Load environment variables
require('dotenv').config();

// Import required modules
// Use dynamic imports for ESM modules
const nodeFetch = require('node-fetch');
const fetch = (...args) => nodeFetch.default(...args);

// Mock implementations for testing
const mockServices = {
  surrealDB: {
    getSurrealDB: async () => ({}),
    query: async () => ([]),
  },
  arangoDB: {
    getArangoDB: async () => ({
      version: async () => ({ version: 'mock' })
    }),
  },
  minioClient: {
    ensureBucketExists: async () => ({}),
  },
  temporalClient: {
    getTemporalClient: async () => ({}),
  }
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log messages with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to log success messages
function success(message) {
  log(`✅ ${message}`, colors.green);
}

// Helper function to log error messages
function error(message) {
  log(`❌ ${message}`, colors.red);
}

// Helper function to log info messages
function info(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

// Helper function to log warning messages
function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

// Test SurrealDB connection
async function testSurrealDB() {
  log('\n=== Testing SurrealDB Connection ===', colors.bright + colors.cyan);
  info(`URL: ${process.env.SURREAL_URL}`);

  try {
    // Try to connect to SurrealDB
    const response = await fetch(`${process.env.SURREAL_URL || 'http://localhost:8000'}/health`, {
      method: 'GET',
      timeout: 3000,
    }).catch(() => null);

    if (response && response.ok) {
      success('Successfully connected to SurrealDB');
      return true;
    } else {
      throw new Error('SurrealDB health check failed');
    }
  } catch (err) {
    error(`Failed to connect to SurrealDB: ${err.message}`);
    warning('Using mock SurrealDB service');
    return false;
  }
}

// Test ArangoDB connection
async function testArangoDB() {
  log('\n=== Testing ArangoDB Connection ===', colors.bright + colors.cyan);
  info(`URL: ${process.env.ARANGO_URL}`);

  try {
    // Try to connect to ArangoDB
    const response = await fetch(`${process.env.ARANGO_URL || 'http://localhost:8529'}/_api/version`, {
      method: 'GET',
      timeout: 3000,
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json();
      success(`Successfully connected to ArangoDB (version: ${data.version})`);
      return true;
    } else {
      throw new Error('ArangoDB health check failed');
    }
  } catch (err) {
    error(`Failed to connect to ArangoDB: ${err.message}`);
    warning('Using mock ArangoDB service');
    return false;
  }
}

// Test MinIO connection
async function testMinIO() {
  log('\n=== Testing MinIO Connection ===', colors.bright + colors.cyan);
  info(`Endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);

  try {
    // Try to connect to MinIO
    const url = `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}/minio/health/live`;
    const response = await fetch(url, {
      method: 'GET',
      timeout: 3000,
    }).catch(() => null);

    if (response && response.ok) {
      success(`Successfully connected to MinIO`);
      return true;
    } else {
      throw new Error('MinIO health check failed');
    }
  } catch (err) {
    error(`Failed to connect to MinIO: ${err.message}`);
    warning('Using mock MinIO service');
    return false;
  }
}

// Test Temporal connection
async function testTemporal() {
  log('\n=== Testing Temporal Connection ===', colors.bright + colors.cyan);
  info(`Address: ${process.env.TEMPORAL_ADDRESS}`);

  try {
    // Try to connect to Temporal
    // Temporal doesn't have a simple HTTP health endpoint, so we'll just check if the server is reachable
    const [host, port] = (process.env.TEMPORAL_ADDRESS || 'localhost:7233').split(':');
    const response = await fetch(`http://${host}:8088/health`, {
      method: 'GET',
      timeout: 3000,
    }).catch(() => null);

    if (response && response.ok) {
      success('Successfully connected to Temporal UI');
      return true;
    } else {
      throw new Error('Temporal health check failed');
    }
  } catch (err) {
    error(`Failed to connect to Temporal: ${err.message}`);
    warning('Using mock Temporal service');
    return false;
  }
}

// Test all connections
async function testAllConnections() {
  log('🔍 Testing all service connections...', colors.bright);

  const results = {
    surrealdb: await testSurrealDB(),
    arangodb: await testArangoDB(),
    minio: await testMinIO(),
    temporal: await testTemporal(),
  };

  log('\n=== Connection Test Summary ===', colors.bright + colors.magenta);

  for (const [service, result] of Object.entries(results)) {
    if (result) {
      success(`${service}: Connected`);
    } else {
      error(`${service}: Failed`);
    }
  }

  const allConnected = Object.values(results).every(Boolean);

  if (allConnected) {
    success('\nAll services are connected and working properly! 🎉');
  } else {
    warning('\nSome services failed to connect. Check the logs above for details.');
    info('The application will use mock services for any failed connections.');
  }

  return allConnected;
}

// Run the tests
testAllConnections()
  .then(() => {
    log('\nConnection tests completed.', colors.bright);
  })
  .catch((err) => {
    error(`An unexpected error occurred: ${err.message}`);
    process.exit(1);
  });
