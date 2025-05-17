// Script to replace MagicUI components with clean UI components
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Component mapping
const componentMapping = {
  "MagicCard": "EnhancedCard",
  "ShimmerButton": "EnhancedActionButton",
  "AnimatedGridPattern": "GridPattern",
  "DotPattern": "DotBackground",
  "WordRotate": "TextRotate",
  "NumberTicker": "NumberDisplay",
  "ShineBorder": "BorderContainer",
  "Ripple": null,
  "BorderBeam": null
};

// Import path mapping
const importMapping = {
  "@/components/magicui/magic-card": "@/components/ui/enhanced-card",
  "@/components/magicui/shimmer-button": "@/components/ui/enhanced-action-button",
  "@/components/ui/animated-grid-pattern": "@/components/ui/grid-pattern",
  "@/components/magicui/dot-pattern": "@/components/ui/dot-background",
  "@/components/magicui/word-rotate": "@/components/ui/text-rotate",
  "@/components/ui/number-ticker": "@/components/ui/number-display",
  "@/components/ui/shine-border": "@/components/ui/shine-border"
};

// Default props to add when replacing components
const defaultProps = {
  "EnhancedCard": ' interactive hoverEffect="shadow"',
  "EnhancedActionButton": ' variant="default" size="sm" hover="lift"',
  "BorderContainer": ' variant="primary" rounded="xl"'
};

// Find all files that might contain MagicUI components
const findFiles = () => {
  return glob.sync('src/**/*.{tsx,jsx,ts,js}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
};

// Process a file to replace MagicUI components
const processFile = (filePath) => {
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace imports
  for (const [oldImport, newImport] of Object.entries(importMapping)) {
    const importRegex = new RegExp(`import\\s+{([^}]*)\\}\\s+from\\s+["']${oldImport}["']`, 'g');
    const matches = [...content.matchAll(importRegex)];
    
    if (matches.length > 0) {
      modified = true;
      for (const match of matches) {
        const importedComponents = match[1].split(',').map(c => c.trim());
        const newImportedComponents = importedComponents.map(comp => {
          const componentName = comp.split(' as ')[0].trim();
          if (componentMapping[componentName]) {
            return componentMapping[componentName];
          }
          return comp;
        });
        
        // Replace the import statement
        const oldImportStatement = match[0];
        const newImportStatement = `import { ${newImportedComponents.join(', ')} } from "${newImport}"`;
        content = content.replace(oldImportStatement, newImportStatement);
      }
    }
  }

  // Replace component usage
  for (const [oldComponent, newComponent] of Object.entries(componentMapping)) {
    if (!newComponent) continue; // Skip components that don't have a direct replacement
    
    // Replace opening tags
    const openTagRegex = new RegExp(`<${oldComponent}([^>]*)>`, 'g');
    const openMatches = [...content.matchAll(openTagRegex)];
    
    if (openMatches.length > 0) {
      modified = true;
      for (const match of openMatches) {
        const props = match[1];
        const defaultProp = defaultProps[newComponent] || '';
        const newOpenTag = `<${newComponent}${props}${defaultProp}>`;
        content = content.replace(match[0], newOpenTag);
      }
    }
    
    // Replace closing tags
    const closeTagRegex = new RegExp(`</${oldComponent}>`, 'g');
    content = content.replace(closeTagRegex, `</${newComponent}>`);
  }

  // Special case for ShineBorder -> BorderContainer
  const shineBorderRegex = /<ShineBorder\s+borderRadius="([^"]+)"([^>]*)>/g;
  const shineBorderMatches = [...content.matchAll(shineBorderRegex)];
  
  if (shineBorderMatches.length > 0) {
    modified = true;
    for (const match of shineBorderMatches) {
      const borderRadius = match[1];
      const otherProps = match[2];
      let rounded = 'xl';
      
      // Map borderRadius to rounded prop
      if (borderRadius === '0.25rem') rounded = 'sm';
      else if (borderRadius === '0.375rem') rounded = 'md';
      else if (borderRadius === '0.5rem') rounded = 'lg';
      else if (borderRadius === '0.75rem') rounded = 'xl';
      else if (borderRadius === '1rem') rounded = '2xl';
      
      const newTag = `<BorderContainer variant="primary" rounded="${rounded}"${otherProps}>`;
      content = content.replace(match[0], newTag);
    }
  }

  // Save the file if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
    return true;
  }
  
  return false;
};

// Main function
const main = () => {
  const files = findFiles();
  console.log(`Found ${files.length} files to process`);
  
  let updatedCount = 0;
  for (const file of files) {
    if (processFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} files`);
};

main();
