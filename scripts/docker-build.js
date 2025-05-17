const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const IMAGE_NAME = 'atlas-erp';
const DOCKERFILE_PATH = './Dockerfile';

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

// Check if Docker is installed and running
function checkDocker() {
  console.log('Checking Docker installation...');
  const result = executeCommand('docker --version', { stdio: 'pipe' });
  
  if (!result.success) {
    console.error('Docker is not installed or not in PATH. Please install Docker and try again.');
    process.exit(1);
  }
  
  console.log('Checking if Docker daemon is running...');
  const daemonResult = executeCommand('docker info', { stdio: 'pipe' });
  
  if (!daemonResult.success) {
    console.error('Docker daemon is not running. Please start Docker and try again.');
    process.exit(1);
  }
  
  console.log('Docker is installed and running.');
}

// Fix TypeScript errors before building
function fixTypeScriptErrors() {
  console.log('Fixing TypeScript errors...');
  
  // Check if the fix script exists
  const fixScriptPath = path.join(process.cwd(), 'scripts', 'fix-typescript-errors.js');
  if (!fs.existsSync(fixScriptPath)) {
    console.error('TypeScript fix script not found. Skipping this step.');
    return;
  }
  
  // Run the fix script
  const result = executeCommand('node scripts/fix-typescript-errors.js');
  
  if (!result.success) {
    console.warn('Failed to fix TypeScript errors automatically. Continuing with build anyway...');
  } else {
    console.log('TypeScript errors fixed successfully.');
  }
}

// Build the Docker image
function buildDockerImage() {
  console.log(`Building Docker image: ${IMAGE_NAME}...`);
  
  // Check if Dockerfile exists
  if (!fs.existsSync(DOCKERFILE_PATH)) {
    console.error(`Dockerfile not found at ${DOCKERFILE_PATH}. Please create a Dockerfile and try again.`);
    process.exit(1);
  }
  
  // Build the image
  const buildResult = executeCommand(`docker build -t ${IMAGE_NAME} .`);
  
  if (!buildResult.success) {
    console.error('Docker build failed. See error details above.');
    process.exit(1);
  }
  
  console.log(`Docker image ${IMAGE_NAME} built successfully.`);
}

// Verify the built image
function verifyImage() {
  console.log('Verifying Docker image...');
  
  // Check if the image exists
  const imageResult = executeCommand(`docker image inspect ${IMAGE_NAME}`, { stdio: 'pipe' });
  
  if (!imageResult.success) {
    console.error(`Failed to verify Docker image ${IMAGE_NAME}.`);
    process.exit(1);
  }
  
  console.log(`Docker image ${IMAGE_NAME} verified successfully.`);
}

// Main function
function main() {
  console.log('Starting Docker build process for Atlas-ERP...');
  
  // Run the build steps
  checkDocker();
  fixTypeScriptErrors();
  buildDockerImage();
  verifyImage();
  
  console.log('Docker build process completed successfully!');
  console.log(`You can now run the container with: docker run -p 3000:3000 ${IMAGE_NAME}`);
}

// Run the main function
main();
