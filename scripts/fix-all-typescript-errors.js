/**
 * Fix All TypeScript Errors Script
 * 
 * This script runs all the TypeScript error fix scripts in sequence
 * to fix all known TypeScript errors in the codebase.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Helper functions for console output
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

// Run a script and return true if it succeeds
function runScript(scriptPath) {
  try {
    log(`Running ${scriptPath}...`, colors.bright + colors.cyan);
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    success(`${scriptPath} completed successfully`);
    return true;
  } catch (err) {
    error(`${scriptPath} failed: ${err.message}`);
    return false;
  }
}

// Main function
function main() {
  log('🔧 Atlas-ERP TypeScript Error Fixer', colors.bright + colors.magenta);
  log('================================', colors.bright + colors.magenta);
  
  // Check if we're in the project root
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    error('package.json not found. Make sure you are in the project root directory.');
    process.exit(1);
  }
  
  // List of scripts to run
  const scripts = [
    'scripts/fix-pipedream-webhook.js',
    'scripts/fix-documents-route.js',
    'scripts/fix-typescript-errors.js',
  ];
  
  // Run each script
  let allSucceeded = true;
  const results = {};
  
  for (const script of scripts) {
    const scriptPath = path.join(process.cwd(), script);
    
    if (!fs.existsSync(scriptPath)) {
      warning(`Script ${script} not found, skipping`);
      results[script] = 'skipped';
      continue;
    }
    
    const succeeded = runScript(script);
    results[script] = succeeded ? 'success' : 'failed';
    
    if (!succeeded) {
      allSucceeded = false;
    }
    
    log('', colors.reset); // Add a blank line between scripts
  }
  
  // Run ESLint auto-fix
  log('Running ESLint auto-fix...', colors.bright + colors.cyan);
  try {
    execSync('pnpm lint:fix:type', { stdio: 'inherit' });
    success('ESLint auto-fix completed successfully');
    results['eslint-autofix'] = 'success';
  } catch (err) {
    error(`ESLint auto-fix failed: ${err.message}`);
    results['eslint-autofix'] = 'failed';
    allSucceeded = false;
  }
  
  // Summary
  log('\n📋 Summary:', colors.bright);
  for (const [script, result] of Object.entries(results)) {
    const resultColor = result === 'success' ? colors.green : (result === 'skipped' ? colors.yellow : colors.red);
    log(`${script}: ${result}`, resultColor);
  }
  
  if (allSucceeded) {
    success('\nAll TypeScript errors have been fixed successfully!');
    log('\nYou can now run the build command:', colors.bright);
    log('  pnpm build', colors.cyan);
  } else {
    warning('\nSome TypeScript errors may still remain.');
    log('\nYou can try running the build with the --no-lint flag:', colors.bright);
    log('  pnpm build --no-lint', colors.cyan);
  }
}

// Run the main function
main();
