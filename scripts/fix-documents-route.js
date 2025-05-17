/**
 * Fix TypeScript errors in the documents route
 *
 * This script fixes the TypeScript error where 'doc' is of type 'unknown'
 * by adding proper type definitions and type casting.
 */

const fs = require('fs');
const path = require('path');

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

// Path to the documents route file
const documentsRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'documents', 'route.ts');

// Function to fix the documents route
function fixDocumentsRoute() {
  log(`Fixing TypeScript errors in ${documentsRoutePath}...`, colors.bright + colors.cyan);

  try {
    // Check if the file exists
    if (!fs.existsSync(documentsRoutePath)) {
      error(`File not found: ${documentsRoutePath}`);
      return false;
    }

    // Read the file content
    let content = fs.readFileSync(documentsRoutePath, 'utf8');

    // Make a backup of the original file
    const backupPath = `${documentsRoutePath}.bak`;
    fs.writeFileSync(backupPath, content, 'utf8');
    log(`Created backup: ${backupPath}`, colors.dim);

    // Fix the GET method
    log('Fixing GET method...', colors.dim);

    // Log the content for debugging
    console.log('File content length:', content.length);

    // Use a simpler pattern for more reliable matching
    const getMethodPattern = /const documents = await Promise\.all\(\s*result\.result\.map\(async \(doc\)/;

    if (getMethodPattern.test(content)) {
      log('GET method pattern found', colors.dim);

      // Replace the entire section
      content = content.replace(
        /const documents = await Promise\.all\([^;]*\);/s,
        `// Define the document type
    interface Document {
      objectName: string;
      [key: string]: unknown;
    }

    // Generate fresh URLs for each document
    const documents = await Promise.all(
      result.result.map(async (doc) => {
        // Cast doc to Document type with objectName
        const document = doc as Document;
        // Generate a fresh URL that's valid for 24 hours
        const freshUrl = await getFileUrl(document.objectName);
        return {
          ...document,
          url: freshUrl,
        };
      })
    );`
      );

      log('Fixed GET method to use proper Document type', colors.cyan);
    } else {
      warning('Could not find GET method pattern in the file');
    }



    // Fix the DELETE method
    log('Fixing DELETE method...', colors.dim);

    // Use a simpler pattern for more reliable matching
    const deleteMethodPattern = /\/\/ Delete from MinIO\s*const doc = document\[0\] as/;

    if (deleteMethodPattern.test(content)) {
      log('DELETE method pattern found', colors.dim);

      // Replace the entire section
      content = content.replace(
        /\/\/ Delete from MinIO\s*const doc = document\[0\] as[^;]*;\s*if \(doc && doc\.objectName\) \{[^}]*\}/s,
        `// Define the document type
    interface Document {
      objectName?: string;
      [key: string]: unknown;
    }

    // Delete from MinIO
    const doc = document[0] as Document;
    if (doc && doc.objectName) {
      const minioClient = (await import('@/lib/minio-client')).default;
      await minioClient.deleteFile(doc.objectName);
    }`
      );

      log('Fixed DELETE method to use proper Document type', colors.cyan);
    } else {
      warning('Could not find DELETE method pattern in the file');
    }



    // Write the fixed content back to the file
    fs.writeFileSync(documentsRoutePath, content, 'utf8');

    success(`Successfully fixed TypeScript errors in ${documentsRoutePath}`);
    return true;
  } catch (err) {
    error(`Error fixing TypeScript errors in ${documentsRoutePath}: ${err.message}`);
    return false;
  }
}

// Run the fix function
const result = fixDocumentsRoute();

if (result) {
  log('\n✅ Fix completed successfully!', colors.bright + colors.green);
  log('\nThe following TypeScript issues were fixed:', colors.bright);
  log('1. Added Document interface with objectName property', colors.cyan);
  log('2. Added proper type casting for document objects', colors.cyan);
  log('3. Fixed the TypeScript error where \'doc\' is of type \'unknown\'', colors.cyan);
  process.exit(0);
} else {
  log('\n❌ Fix failed!', colors.bright + colors.red);
  log('Please check the error messages above for details.', colors.yellow);
  process.exit(1);
}
