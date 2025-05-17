/**
 * Atlas-ERP Docker Setup Test Script
 * 
 * This script tests the Docker setup by checking the connectivity to all services
 * and verifying that they are properly configured and accessible.
 */

const axios = require('axios');
const { Client: MinioClient } = require('minio');
const { Database } = require('arangojs');
const { Surreal } = require('surrealdb');
const { Client: TemporalClient } = require('@temporalio/client');

// Load environment variables
require('dotenv').config();

// Define service endpoints
const SERVICES = {
  NEXT_APP: 'http://localhost:3000',
  SURREALDB: process.env.SURREAL_URL || 'http://localhost:8001',
  ARANGODB: process.env.ARANGO_URL || 'http://localhost:8529',
  MINIO: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'atlas-erp',
  },
  TEMPORAL: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
};

// Test results
const results = {
  nextApp: { status: 'pending', message: '' },
  surrealDB: { status: 'pending', message: '' },
  arangoDB: { status: 'pending', message: '' },
  minIO: { status: 'pending', message: '' },
  temporal: { status: 'pending', message: '' },
  websocket: { status: 'pending', message: '' },
};

// Test Next.js app
async function testNextApp() {
  try {
    console.log('Testing Next.js app...');
    const response = await axios.get(`${SERVICES.NEXT_APP}/api/health`);
    
    if (response.status === 200) {
      results.nextApp = { status: 'success', message: 'Next.js app is running' };
      console.log('✅ Next.js app is running');
    } else {
      results.nextApp = { status: 'error', message: `Unexpected status: ${response.status}` };
      console.error('❌ Next.js app returned unexpected status:', response.status);
    }
  } catch (error) {
    results.nextApp = { status: 'error', message: error.message };
    console.error('❌ Error testing Next.js app:', error.message);
  }
}

// Test SurrealDB
async function testSurrealDB() {
  try {
    console.log('Testing SurrealDB...');
    const db = new Surreal();
    
    // Connect to the database
    await db.connect(`${SERVICES.SURREALDB}/rpc`, {
      namespace: process.env.SURREAL_NS || 'atlas',
      database: process.env.SURREAL_DB || 'erp',
      auth: {
        username: process.env.SURREAL_USER || 'root',
        password: process.env.SURREAL_PASS || 'root',
      },
    });
    
    // Test query
    const result = await db.query('SELECT * FROM schema');
    
    results.surrealDB = { status: 'success', message: 'SurrealDB is running and accessible' };
    console.log('✅ SurrealDB is running and accessible');
  } catch (error) {
    results.surrealDB = { status: 'error', message: error.message };
    console.error('❌ Error testing SurrealDB:', error.message);
  }
}

// Test ArangoDB
async function testArangoDB() {
  try {
    console.log('Testing ArangoDB...');
    const db = new Database({
      url: SERVICES.ARANGODB,
      auth: {
        username: process.env.ARANGO_USER || 'root',
        password: process.env.ARANGO_PASS || process.env.ARANGO_ROOT_PASSWORD || 'atlas',
      },
      databaseName: process.env.ARANGO_DB || 'atlas_knowledge',
    });
    
    // Test connection
    const info = await db.version();
    
    results.arangoDB = { 
      status: 'success', 
      message: `ArangoDB is running (version: ${info.version})` 
    };
    console.log(`✅ ArangoDB is running (version: ${info.version})`);
  } catch (error) {
    results.arangoDB = { status: 'error', message: error.message };
    console.error('❌ Error testing ArangoDB:', error.message);
  }
}

// Test MinIO
async function testMinIO() {
  try {
    console.log('Testing MinIO...');
    const minioClient = new MinioClient({
      endPoint: SERVICES.MINIO.endpoint,
      port: SERVICES.MINIO.port,
      useSSL: SERVICES.MINIO.useSSL,
      accessKey: SERVICES.MINIO.accessKey,
      secretKey: SERVICES.MINIO.secretKey,
    });
    
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(SERVICES.MINIO.bucket);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      await minioClient.makeBucket(SERVICES.MINIO.bucket, 'us-east-1');
      console.log(`Created bucket: ${SERVICES.MINIO.bucket}`);
    }
    
    results.minIO = { 
      status: 'success', 
      message: `MinIO is running and bucket '${SERVICES.MINIO.bucket}' is accessible` 
    };
    console.log(`✅ MinIO is running and bucket '${SERVICES.MINIO.bucket}' is accessible`);
  } catch (error) {
    results.minIO = { status: 'error', message: error.message };
    console.error('❌ Error testing MinIO:', error.message);
  }
}

// Test Temporal
async function testTemporal() {
  try {
    console.log('Testing Temporal...');
    const client = new TemporalClient({
      address: SERVICES.TEMPORAL,
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    });
    
    // Test connection by getting workflow service description
    const description = await client.workflowService.getSystemInfo();
    
    results.temporal = { 
      status: 'success', 
      message: 'Temporal is running and accessible' 
    };
    console.log('✅ Temporal is running and accessible');
  } catch (error) {
    results.temporal = { status: 'error', message: error.message };
    console.error('❌ Error testing Temporal:', error.message);
  }
}

// Test WebSocket
async function testWebSocket() {
  try {
    console.log('Testing WebSocket...');
    const response = await axios.get(`${SERVICES.NEXT_APP}/api/websocket/health`);
    
    if (response.status === 200) {
      results.websocket = { status: 'success', message: 'WebSocket server is running' };
      console.log('✅ WebSocket server is running');
    } else {
      results.websocket = { status: 'error', message: `Unexpected status: ${response.status}` };
      console.error('❌ WebSocket server returned unexpected status:', response.status);
    }
  } catch (error) {
    results.websocket = { status: 'error', message: error.message };
    console.error('❌ Error testing WebSocket server:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting Atlas-ERP Docker setup tests...');
  
  await testNextApp();
  await testSurrealDB();
  await testArangoDB();
  await testMinIO();
  await testTemporal();
  await testWebSocket();
  
  // Print summary
  console.log('\n=== Test Results Summary ===');
  Object.entries(results).forEach(([service, result]) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${service}: ${result.status.toUpperCase()} - ${result.message}`);
  });
  
  // Check if all tests passed
  const allPassed = Object.values(results).every(result => result.status === 'success');
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Your Atlas-ERP Docker setup is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above and fix the issues.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});
