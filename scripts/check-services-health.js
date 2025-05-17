/**
 * Atlas-ERP Services Health Check Script
 * 
 * This script checks the health of all services used by Atlas-ERP.
 * It verifies that all services are running and accessible.
 */

const http = require('http');
const https = require('https');

// Load environment variables
require('dotenv').config();

// Define service endpoints
const SERVICES = [
  {
    name: 'Next.js App',
    url: 'http://localhost:3000/api/health',
    expectedStatus: 200,
  },
  {
    name: 'SurrealDB',
    url: process.env.SURREAL_URL || 'http://localhost:8001/health',
    expectedStatus: 200,
  },
  {
    name: 'ArangoDB',
    url: (process.env.ARANGO_URL || 'http://localhost:8529') + '/_api/version',
    expectedStatus: 200,
    auth: {
      username: process.env.ARANGO_USER || 'root',
      password: process.env.ARANGO_PASS || 'atlas',
    },
  },
  {
    name: 'MinIO',
    url: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}/minio/health/live`,
    expectedStatus: 200,
  },
  {
    name: 'Temporal',
    url: `http://${process.env.TEMPORAL_ADDRESS || 'localhost:7233'}/health`,
    expectedStatus: 200,
  },
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Function to check service health
async function checkServiceHealth(service) {
  return new Promise((resolve) => {
    console.log(`${colors.blue}Checking ${service.name}...${colors.reset}`);
    
    // Determine if we need to use http or https
    const client = service.url.startsWith('https') ? https : http;
    
    // Prepare request options
    const options = new URL(service.url);
    
    // Add authentication if provided
    if (service.auth) {
      const auth = Buffer.from(`${service.auth.username}:${service.auth.password}`).toString('base64');
      options.headers = {
        'Authorization': `Basic ${auth}`,
      };
    }
    
    // Make the request
    const req = client.get(options, (res) => {
      const { statusCode } = res;
      
      if (statusCode === service.expectedStatus) {
        console.log(`${colors.green}✓ ${service.name} is healthy (Status: ${statusCode})${colors.reset}`);
        resolve({
          service: service.name,
          status: 'healthy',
          statusCode,
        });
      } else {
        console.log(`${colors.red}✗ ${service.name} returned unexpected status: ${statusCode} (Expected: ${service.expectedStatus})${colors.reset}`);
        resolve({
          service: service.name,
          status: 'unhealthy',
          statusCode,
          error: `Unexpected status code: ${statusCode}`,
        });
      }
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}✗ ${service.name} is not accessible: ${error.message}${colors.reset}`);
      resolve({
        service: service.name,
        status: 'unavailable',
        error: error.message,
      });
    });
    
    // Set timeout
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`${colors.red}✗ ${service.name} request timed out${colors.reset}`);
      resolve({
        service: service.name,
        status: 'timeout',
        error: 'Request timed out',
      });
    });
  });
}

// Main function to check all services
async function checkAllServices() {
  console.log(`${colors.cyan}=== Atlas-ERP Services Health Check ===${colors.reset}\n`);
  
  const results = [];
  
  for (const service of SERVICES) {
    const result = await checkServiceHealth(service);
    results.push(result);
  }
  
  // Print summary
  console.log(`\n${colors.cyan}=== Health Check Summary ===${colors.reset}`);
  
  const healthy = results.filter(r => r.status === 'healthy').length;
  const total = results.length;
  
  console.log(`\n${healthy} of ${total} services are healthy\n`);
  
  // Print details for unhealthy services
  const unhealthy = results.filter(r => r.status !== 'healthy');
  
  if (unhealthy.length > 0) {
    console.log(`${colors.yellow}The following services have issues:${colors.reset}`);
    
    unhealthy.forEach(service => {
      console.log(`- ${colors.red}${service.service}: ${service.status} - ${service.error}${colors.reset}`);
    });
    
    console.log(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);
    console.log('1. Check if all Docker containers are running: docker-compose ps');
    console.log('2. Check container logs: docker-compose logs [service_name]');
    console.log('3. Ensure all environment variables are set correctly');
    console.log('4. Try restarting the services: docker-compose restart [service_name]');
    
    process.exit(1);
  } else {
    console.log(`${colors.green}All services are healthy!${colors.reset}`);
    process.exit(0);
  }
}

// Run the health check
checkAllServices().catch(error => {
  console.error(`${colors.red}Error running health check: ${error.message}${colors.reset}`);
  process.exit(1);
});
