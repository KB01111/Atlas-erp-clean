const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DOCKER_COMPOSE_FILE = './docker-compose.yml';

// Helper function to execute shell commands
function executeCommand(command, options = {}) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, {
      stdio: 'inherit',
      ...options,
    });
    return { success: true, output };
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return { success: false, error };
  }
}

// Check if Docker Compose is installed and running
function checkDockerCompose() {
  console.log('Checking Docker Compose installation...');
  const result = executeCommand('docker compose version', { stdio: 'pipe' });
  
  if (!result.success) {
    console.error('Docker Compose is not installed or not in PATH. Please install Docker Compose and try again.');
    process.exit(1);
  }
  
  console.log('Docker Compose is installed.');
}

// Check if Docker Compose file exists
function checkDockerComposeFile() {
  console.log(`Checking if Docker Compose file exists at ${DOCKER_COMPOSE_FILE}...`);
  
  if (!fs.existsSync(DOCKER_COMPOSE_FILE)) {
    console.error(`Docker Compose file not found at ${DOCKER_COMPOSE_FILE}. Please create a Docker Compose file and try again.`);
    process.exit(1);
  }
  
  console.log('Docker Compose file exists.');
}

// Create .env file if it doesn't exist
function createEnvFile() {
  console.log('Checking if .env file exists...');
  
  const envFilePath = './.env';
  
  if (!fs.existsSync(envFilePath)) {
    console.log('.env file not found. Creating a default .env file...');
    
    const defaultEnvContent = `# SurrealDB Configuration
SURREAL_NS=atlas
SURREAL_DB=erp
SURREAL_USER=root
SURREAL_PASS=root

# MinIO Configuration
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=atlas-erp

# ArangoDB Configuration
ARANGO_DB=atlas_knowledge
ARANGO_USER=root
ARANGO_PASS=atlas
ARANGO_ROOT_PASSWORD=atlas

# Temporal Configuration
TEMPORAL_NAMESPACE=default

# LLM Configuration
LLM_PROVIDER=openai
LLM_API_KEY=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
LLM_MODEL=gpt-4o

# CopilotKit Configuration
COPILOTKIT_API_KEY=ck_pub_4e87be87ce5fcbc54805a9597fd74013

# Pipedream Configuration
PIPEDREAM_API_KEY=
PIPEDREAM_API_URL=https://api.pipedream.com/v1
PIPEDREAM_ORG_ID=
PIPEDREAM_WORKSPACE_ID=

# Nango Configuration
NANGO_API_URL=https://api.nango.dev
NANGO_SECRET_KEY=
NANGO_PUBLIC_KEY=
`;
    
    fs.writeFileSync(envFilePath, defaultEnvContent);
    console.log('Default .env file created.');
  } else {
    console.log('.env file exists.');
  }
}

// Build the Docker Compose services
function buildDockerCompose() {
  console.log('Building Docker Compose services...');
  
  // Build the services
  const buildResult = executeCommand('docker compose build --no-cache');
  
  if (!buildResult.success) {
    console.error('Docker Compose build failed. See error details above.');
    process.exit(1);
  }
  
  console.log('Docker Compose build completed successfully.');
}

// Start the Docker Compose services
function startDockerCompose() {
  console.log('Starting Docker Compose services...');
  
  // Start the services
  const startResult = executeCommand('docker compose up -d');
  
  if (!startResult.success) {
    console.error('Docker Compose start failed. See error details above.');
    process.exit(1);
  }
  
  console.log('Docker Compose services started successfully.');
}

// Check the status of Docker Compose services
function checkDockerComposeStatus() {
  console.log('Checking Docker Compose services status...');
  
  // Check the status
  const statusResult = executeCommand('docker compose ps');
  
  if (!statusResult.success) {
    console.error('Failed to check Docker Compose services status. See error details above.');
    process.exit(1);
  }
  
  console.log('Docker Compose services status checked successfully.');
}

// Main function
function main() {
  console.log('Starting Docker Compose build process for Atlas-ERP...');
  
  // Run the build steps
  checkDockerCompose();
  checkDockerComposeFile();
  createEnvFile();
  buildDockerCompose();
  startDockerCompose();
  checkDockerComposeStatus();
  
  console.log('Docker Compose build process completed successfully!');
  console.log('You can now access the application at http://localhost:3000');
}

// Run the main function
main();
