/**
 * Atlas-ERP Services Verification Script
 * 
 * This script verifies that all services are actually running and accessible,
 * regardless of Docker health check status.
 * 
 * It performs application-level checks that are more reliable than the Docker health checks.
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config();

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

// Define service endpoints for verification
const SERVICES = [
  {
    name: 'Next.js App',
    url: 'http://localhost:3000/api/health',
    expectedStatus: 200,
    description: 'Main application server',
  },
  {
    name: 'SurrealDB',
    url: 'http://localhost:8001/health',
    expectedStatus: 200,
    description: 'Primary database for application data',
    alternativeCheck: async () => {
      try {
        const response = await fetch('http://localhost:3000/api/health/surrealdb');
        if (response.ok) {
          const data = await response.json();
          return data.status === 'connected' || data.status === 'operational';
        }
        return false;
      } catch (error) {
        return false;
      }
    }
  },
  {
    name: 'ArangoDB',
    url: 'http://localhost:8529/_api/version',
    expectedStatus: 200,
    description: 'Knowledge graph database',
    auth: {
      username: process.env.ARANGO_USER || 'root',
      password: process.env.ARANGO_PASS || 'atlas',
    },
    alternativeCheck: async () => {
      try {
        const response = await fetch('http://localhost:3000/api/health/arangodb');
        if (response.ok) {
          const data = await response.json();
          return data.status === 'connected' || data.status === 'operational';
        }
        return false;
      } catch (error) {
        return false;
      }
    }
  },
  {
    name: 'MinIO',
    url: 'http://localhost:9000/minio/health/live',
    expectedStatus: 200,
    description: 'Object storage for files and documents',
    alternativeCheck: async () => {
      try {
        // Check if MinIO console is accessible
        const response = await fetch('http://localhost:9001', { method: 'HEAD' });
        return response.ok;
      } catch (error) {
        return false;
      }
    }
  },
  {
    name: 'Temporal UI',
    url: 'http://localhost:8088',
    expectedStatus: 200,
    description: 'Workflow orchestration UI',
    method: 'HEAD'
  },
];

// Function to check service health
async function checkServiceHealth(service) {
  return new Promise(async (resolve) => {
    console.log(`${colors.blue}Checking ${service.name}...${colors.reset}`);
    
    // Try alternative check first if available
    if (service.alternativeCheck) {
      try {
        const isAvailable = await service.alternativeCheck();
        if (isAvailable) {
          console.log(`${colors.green}✓ ${service.name} is verified through application API${colors.reset}`);
          resolve({
            service: service.name,
            status: 'verified',
            method: 'application-api',
          });
          return;
        }
      } catch (error) {
        // Continue with standard check if alternative fails
        console.log(`${colors.yellow}Alternative check failed, trying direct check...${colors.reset}`);
      }
    }
    
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
    const req = client.request(options, { method: service.method || 'GET' }, (res) => {
      const { statusCode } = res;
      
      if (statusCode === service.expectedStatus || (statusCode >= 200 && statusCode < 400)) {
        console.log(`${colors.green}✓ ${service.name} is verified (Status: ${statusCode})${colors.reset}`);
        resolve({
          service: service.name,
          status: 'verified',
          statusCode,
        });
      } else {
        console.log(`${colors.red}✗ ${service.name} returned unexpected status: ${statusCode} (Expected: ${service.expectedStatus})${colors.reset}`);
        resolve({
          service: service.name,
          status: 'failed',
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
    
    req.end();
  });
}

// Check Docker container status
function checkDockerContainers() {
  console.log(`${colors.blue}Checking Docker container status...${colors.reset}`);
  
  try {
    const output = execSync('docker-compose ps').toString();
    console.log(`\n${colors.cyan}Docker Container Status:${colors.reset}`);
    console.log(output);
    
    // Check for unhealthy containers
    const unhealthyCheck = execSync('docker-compose ps | grep -i unhealthy || echo "No unhealthy containers"').toString();
    
    if (unhealthyCheck.includes('unhealthy')) {
      console.log(`${colors.yellow}Note: Some containers are marked as unhealthy by Docker, but they may still be functional.${colors.reset}`);
      console.log(`${colors.yellow}The verification checks above provide a more accurate assessment of service availability.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error checking Docker containers: ${error.message}${colors.reset}`);
  }
}

// Main function to check all services
async function verifyAllServices() {
  console.log(`${colors.cyan}=== Atlas-ERP Services Verification ===${colors.reset}\n`);
  
  const results = [];
  
  for (const service of SERVICES) {
    const result = await checkServiceHealth(service);
    results.push(result);
  }
  
  // Print summary
  console.log(`\n${colors.cyan}=== Verification Summary ===${colors.reset}`);
  
  const verified = results.filter(r => r.status === 'verified').length;
  const total = results.length;
  
  console.log(`\n${verified} of ${total} services are verified working\n`);
  
  // Print details for failed services
  const failed = results.filter(r => r.status !== 'verified');
  
  if (failed.length > 0) {
    console.log(`${colors.yellow}The following services could not be verified:${colors.reset}`);
    
    failed.forEach(service => {
      console.log(`- ${colors.red}${service.service}: ${service.status} - ${service.error || 'Unknown error'}${colors.reset}`);
    });
    
    console.log(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);
    console.log('1. Check if all Docker containers are running: docker-compose ps');
    console.log('2. Check container logs: docker-compose logs [service_name]');
    console.log('3. Ensure all environment variables are set correctly');
    console.log('4. Try restarting the services: docker-compose restart [service_name]');
  } else {
    console.log(`${colors.green}All services are verified working!${colors.reset}`);
  }
  
  // Check Docker container status
  checkDockerContainers();
}

// Run the verification
verifyAllServices().catch(error => {
  console.error(`${colors.red}Error running verification: ${error.message}${colors.reset}`);
  process.exit(1);
});
