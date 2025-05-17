/**
 * ESLint Auto-Fix Script
 * 
 * This script runs ESLint with the --fix option to automatically fix as many issues as possible.
 * It can target specific directories or the entire project.
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

// Parse command line arguments
const args = process.argv.slice(2);
const targetDirs = [];
let fixTypeOnly = false;
let dryRun = false;

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--type-only') {
    fixTypeOnly = true;
  } else if (arg === '--dry-run') {
    dryRun = true;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  } else {
    targetDirs.push(arg);
  }
}

// Show help information
function showHelp() {
  log('ESLint Auto-Fix Script', colors.bright + colors.cyan);
  log('=====================', colors.bright + colors.cyan);
  log('\nUsage: node scripts/eslint-autofix.js [options] [directories...]');
  log('\nOptions:');
  log('  --type-only     Only fix TypeScript-related issues', colors.yellow);
  log('  --dry-run       Run ESLint in dry-run mode (no changes will be made)', colors.yellow);
  log('  --help, -h      Show this help message', colors.yellow);
  log('\nExamples:');
  log('  node scripts/eslint-autofix.js                     # Fix all issues in the project', colors.dim);
  log('  node scripts/eslint-autofix.js src/components      # Fix issues in src/components', colors.dim);
  log('  node scripts/eslint-autofix.js --type-only         # Fix only TypeScript issues', colors.dim);
  log('  node scripts/eslint-autofix.js --dry-run           # Show what would be fixed without making changes', colors.dim);
}

// Run ESLint with auto-fix
function runEslintAutofix() {
  log('🔍 Running ESLint auto-fix...', colors.bright + colors.cyan);
  
  // Default to the entire project if no directories are specified
  const targets = targetDirs.length > 0 ? targetDirs : ['.'];
  
  // Build the ESLint command
  let eslintCommand = 'npx eslint';
  
  // Add fix option
  eslintCommand += dryRun ? ' --fix-dry-run' : ' --fix';
  
  // Add type-only flag if specified
  if (fixTypeOnly) {
    eslintCommand += ' --fix-type problem,suggestion';
  }
  
  // Add targets
  eslintCommand += ' ' + targets.join(' ');
  
  // Add format option for better output
  eslintCommand += ' --format stylish';
  
  // Log the command
  log(`\nExecuting: ${eslintCommand}`, colors.dim);
  
  try {
    // Run ESLint
    const output = execSync(eslintCommand, { stdio: 'inherit' });
    success('\nESLint auto-fix completed successfully!');
    
    if (dryRun) {
      log('\nThis was a dry run. No files were modified.', colors.yellow);
    }
    
    return true;
  } catch (err) {
    // ESLint returns a non-zero exit code if there are unfixable errors
    warning('\nESLint auto-fix completed with some unfixable issues.');
    
    if (dryRun) {
      log('\nThis was a dry run. No files were modified.', colors.yellow);
    }
    
    log('\nYou may need to fix some issues manually.', colors.yellow);
    return false;
  }
}

// Main function
function main() {
  log('🛠️ Atlas-ERP ESLint Auto-Fix', colors.bright + colors.magenta);
  log('========================', colors.bright + colors.magenta);
  
  // Check if package.json exists
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    error('package.json not found. Make sure you are in the project root directory.');
    process.exit(1);
  }
  
  // Run ESLint auto-fix
  const success = runEslintAutofix();
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run the main function
main();
