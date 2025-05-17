/**
 * Atlas-ERP Docker Issues Fixer
 * 
 * This script diagnoses and fixes common issues with the Atlas-ERP Docker setup.
 * It checks for common problems and provides solutions.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to execute shell commands
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

// Function to check if Docker is running
function isDockerRunning() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if Docker Compose is installed
function isDockerComposeInstalled() {
  try {
    execSync('docker-compose --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check container status
function getContainerStatus() {
  const output = execCommand('docker-compose ps');
  return output;
}

// Function to check container logs
function getContainerLogs(container, lines = 20) {
  const output = execCommand(`docker-compose logs --tail=${lines} ${container}`);
  return output;
}

// Function to check if ports are in use
function checkPortsInUse() {
  const ports = [3000, 8000, 8001, 8529, 9000, 9001, 7233, 8088];
  const inUse = [];
  
  for (const port of ports) {
    try {
      // Different commands for Windows vs Unix-like systems
      const command = process.platform === 'win32'
        ? `netstat -ano | findstr :${port}`
        : `lsof -i :${port} | grep LISTEN`;
      
      const output = execCommand(command);
      
      if (output && !output.includes('Error')) {
        inUse.push(port);
      }
    } catch (error) {
      // Ignore errors, as they likely mean the port is not in use
    }
  }
  
  return inUse;
}

// Function to check disk space
function checkDiskSpace() {
  try {
    const command = process.platform === 'win32'
      ? 'wmic logicaldisk get size,freespace,caption'
      : 'df -h';
    
    return execCommand(command);
  } catch (error) {
    return 'Unable to check disk space';
  }
}

// Function to check Docker resources
function checkDockerResources() {
  try {
    return execCommand('docker info');
  } catch (error) {
    return 'Unable to check Docker resources';
  }
}

// Function to fix common issues
async function fixIssue(issue) {
  return new Promise((resolve) => {
    switch (issue) {
      case 'docker-not-running':
        console.log(`${colors.yellow}Attempting to start Docker service...${colors.reset}`);
        
        if (process.platform === 'win32') {
          console.log(`${colors.blue}Please start Docker Desktop manually.${colors.reset}`);
        } else {
          execCommand('sudo systemctl start docker');
          console.log(`${colors.green}Docker service started.${colors.reset}`);
        }
        resolve();
        break;
        
      case 'ports-in-use':
        rl.question(`${colors.yellow}Do you want to stop processes using these ports? (y/n) ${colors.reset}`, (answer) => {
          if (answer.toLowerCase() === 'y') {
            const portsInUse = checkPortsInUse();
            
            for (const port of portsInUse) {
              try {
                if (process.platform === 'win32') {
                  const pidOutput = execCommand(`netstat -ano | findstr :${port}`);
                  const pid = pidOutput.trim().split(/\s+/).pop();
                  
                  if (pid) {
                    execCommand(`taskkill /F /PID ${pid}`);
                    console.log(`${colors.green}Killed process using port ${port} (PID: ${pid})${colors.reset}`);
                  }
                } else {
                  const pidOutput = execCommand(`lsof -i :${port} | grep LISTEN`);
                  const pid = pidOutput.trim().split(/\s+/)[1];
                  
                  if (pid) {
                    execCommand(`kill -9 ${pid}`);
                    console.log(`${colors.green}Killed process using port ${port} (PID: ${pid})${colors.reset}`);
                  }
                }
              } catch (error) {
                console.log(`${colors.red}Failed to kill process using port ${port}: ${error.message}${colors.reset}`);
              }
            }
          }
          resolve();
        });
        break;
        
      case 'restart-containers':
        rl.question(`${colors.yellow}Do you want to restart all containers? (y/n) ${colors.reset}`, (answer) => {
          if (answer.toLowerCase() === 'y') {
            console.log(`${colors.blue}Restarting containers...${colors.reset}`);
            execCommand('docker-compose restart');
            console.log(`${colors.green}Containers restarted.${colors.reset}`);
          }
          resolve();
        });
        break;
        
      case 'rebuild-containers':
        rl.question(`${colors.yellow}Do you want to rebuild all containers? This will take some time. (y/n) ${colors.reset}`, (answer) => {
          if (answer.toLowerCase() === 'y') {
            console.log(`${colors.blue}Rebuilding containers...${colors.reset}`);
            execCommand('docker-compose down');
            execCommand('docker-compose build --no-cache');
            execCommand('docker-compose up -d');
            console.log(`${colors.green}Containers rebuilt and started.${colors.reset}`);
          }
          resolve();
        });
        break;
        
      case 'clean-volumes':
        rl.question(`${colors.yellow}Do you want to remove all volumes? This will DELETE ALL DATA! (y/n) ${colors.reset}`, (answer) => {
          if (answer.toLowerCase() === 'y') {
            console.log(`${colors.blue}Removing volumes...${colors.reset}`);
            execCommand('docker-compose down -v');
            console.log(`${colors.green}Volumes removed.${colors.reset}`);
            
            rl.question(`${colors.yellow}Do you want to restart the containers? (y/n) ${colors.reset}`, (restartAnswer) => {
              if (restartAnswer.toLowerCase() === 'y') {
                execCommand('docker-compose up -d');
                console.log(`${colors.green}Containers started.${colors.reset}`);
              }
              resolve();
            });
          } else {
            resolve();
          }
        });
        break;
        
      default:
        resolve();
        break;
    }
  });
}

// Main function
async function main() {
  console.log(`${colors.cyan}=== Atlas-ERP Docker Issues Fixer ===${colors.reset}\n`);
  
  // Check if Docker is running
  if (!isDockerRunning()) {
    console.log(`${colors.red}Docker is not running.${colors.reset}`);
    await fixIssue('docker-not-running');
    
    if (!isDockerRunning()) {
      console.log(`${colors.red}Failed to start Docker. Please start it manually.${colors.reset}`);
      rl.close();
      return;
    }
  } else {
    console.log(`${colors.green}Docker is running.${colors.reset}`);
  }
  
  // Check if Docker Compose is installed
  if (!isDockerComposeInstalled()) {
    console.log(`${colors.red}Docker Compose is not installed.${colors.reset}`);
    console.log(`${colors.yellow}Please install Docker Compose: https://docs.docker.com/compose/install/${colors.reset}`);
    rl.close();
    return;
  } else {
    console.log(`${colors.green}Docker Compose is installed.${colors.reset}`);
  }
  
  // Check container status
  console.log(`\n${colors.blue}Checking container status...${colors.reset}`);
  const containerStatus = getContainerStatus();
  console.log(containerStatus);
  
  // Check if ports are in use
  console.log(`\n${colors.blue}Checking if ports are in use...${colors.reset}`);
  const portsInUse = checkPortsInUse();
  
  if (portsInUse.length > 0) {
    console.log(`${colors.red}The following ports are already in use: ${portsInUse.join(', ')}${colors.reset}`);
    await fixIssue('ports-in-use');
  } else {
    console.log(`${colors.green}All required ports are available.${colors.reset}`);
  }
  
  // Check disk space
  console.log(`\n${colors.blue}Checking disk space...${colors.reset}`);
  const diskSpace = checkDiskSpace();
  console.log(diskSpace);
  
  // Check Docker resources
  console.log(`\n${colors.blue}Checking Docker resources...${colors.reset}`);
  const dockerResources = checkDockerResources();
  console.log(dockerResources);
  
  // Ask user what they want to fix
  console.log(`\n${colors.cyan}=== Available Fixes ===${colors.reset}`);
  console.log(`${colors.yellow}1. Restart containers${colors.reset}`);
  console.log(`${colors.yellow}2. Rebuild containers${colors.reset}`);
  console.log(`${colors.yellow}3. Clean volumes (WARNING: This will delete all data!)${colors.reset}`);
  console.log(`${colors.yellow}4. Exit${colors.reset}`);
  
  rl.question(`\n${colors.cyan}What would you like to do? (1-4) ${colors.reset}`, async (answer) => {
    switch (answer) {
      case '1':
        await fixIssue('restart-containers');
        break;
      case '2':
        await fixIssue('rebuild-containers');
        break;
      case '3':
        await fixIssue('clean-volumes');
        break;
      case '4':
      default:
        console.log(`${colors.green}Exiting...${colors.reset}`);
        break;
    }
    
    rl.close();
  });
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  rl.close();
});
