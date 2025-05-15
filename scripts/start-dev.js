/**
 * Start Development Environment
 * 
 * This script starts the development environment with WebSocket support
 * and simulates real-time metrics updates.
 */

const { spawn } = require('child_process');
const path = require('path');

// Function to run a command
function runCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });
  
  child.on('error', (error) => {
    console.error(`Error running command: ${command} ${args.join(' ')}`, error);
  });
  
  return child;
}

// Start the Next.js server with WebSocket support
console.log('Starting Next.js server with WebSocket support...');
const serverProcess = runCommand('node', ['server.js']);

// Wait for the server to start
setTimeout(() => {
  // Start the metrics simulation
  console.log('Starting metrics simulation...');
  const metricsProcess = runCommand('node', ['scripts/simulate-metrics.js']);
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    serverProcess.kill();
    metricsProcess.kill();
    process.exit();
  });
}, 5000); // Wait 5 seconds for the server to start
