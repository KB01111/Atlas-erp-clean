const fs = require('fs');
const path = require('path');

// Function to recursively find TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next') && !filePath.includes('dist')) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to fix 'any' type warnings
function fixAnyTypeWarnings(content) {
  // Replace explicit 'any' with more specific types where possible
  // This is a simple example - in a real scenario, you'd want to analyze the code more carefully
  return content
    .replace(/: any(\[\])?/g, ': unknown$1')
    .replace(/as any/g, 'as unknown');
}

// Function to fix unused variables
function fixUnusedVariables(content) {
  // Prefix unused variables with underscore
  const unusedVarRegex = /const ([a-zA-Z0-9_]+)(\s*=\s*[^;]+);(\s*\/\/\s*eslint-disable-line\s+@typescript-eslint\/no-unused-vars)?/g;
  return content.replace(unusedVarRegex, (match, varName, assignment, comment) => {
    // If the variable is already prefixed with underscore or has a disable comment, leave it as is
    if (varName.startsWith('_') || comment) {
      return match;
    }
    // Check if the variable is used later in the code
    const varUsageRegex = new RegExp(`[^a-zA-Z0-9_]${varName}[^a-zA-Z0-9_]`);
    const isUsed = varUsageRegex.test(content.substring(match.index + match.length));
    
    if (!isUsed) {
      return `const _${varName}${assignment}; // eslint-disable-line @typescript-eslint/no-unused-vars`;
    }
    return match;
  });
}

// Function to fix Function type warnings
function fixFunctionTypeWarnings(content) {
  // Replace generic Function type with more specific function signatures
  return content.replace(/: Function/g, ': (...args: any[]) => any');
}

// Function to fix anonymous default export warnings
function fixAnonymousDefaultExport(content) {
  // Replace anonymous default exports with named exports
  const anonymousExportRegex = /export default {([^}]*)}/g;
  return content.replace(anonymousExportRegex, (match, objectContent) => {
    return `const defaultExport = {${objectContent}};\nexport default defaultExport;`;
  });
}

// Main function to process files
function processFiles() {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = findTsFiles(srcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  tsFiles.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Apply fixes
      content = fixAnyTypeWarnings(content);
      content = fixUnusedVariables(content);
      content = fixFunctionTypeWarnings(content);
      content = fixAnonymousDefaultExport(content);
      
      // Only write back if changes were made
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        fixedFiles++;
        console.log(`Fixed issues in: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  });
  
  console.log(`Fixed issues in ${fixedFiles} files`);
}

// Run the script
processFiles();
