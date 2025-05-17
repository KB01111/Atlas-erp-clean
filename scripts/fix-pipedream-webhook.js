const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(process.cwd(), 'src', 'app', 'api', 'webhooks', 'pipedream', 'route.ts');

// Function to fix the file
function fixPipedreamWebhookRoute() {
  console.log(`Fixing TypeScript errors in ${filePath}...`);

  try {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }

    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');

    // Update the SurrealDBRecord interface to fix TypeScript errors
    if (content.includes('interface SurrealDBRecord')) {
      // Replace the existing interface with the fixed version
      content = content.replace(
        /interface SurrealDBRecord \{[^}]*\}/s,
        `interface SurrealDBRecord {
  id: string;  // ID is required for returned records
  [key: string]: unknown;
}`
      );

      // Add the SurrealDBInputRecord interface if it doesn't exist
      if (!content.includes('interface SurrealDBInputRecord')) {
        content = content.replace(
          /interface SurrealDBRecord \{[^}]*\}/s,
          `interface SurrealDBRecord {
  id: string;  // ID is required for returned records
  [key: string]: unknown;
}

// Define the type for SurrealDB input record (without ID)
interface SurrealDBInputRecord {
  [key: string]: unknown;
}`
        );
      }
    } else {
      // If the interface doesn't exist, add both interfaces
      const importSection = 'import { NextRequest, NextResponse } from "next/server";\nimport { getSurrealDB } from "@/lib/surreal-client";\nimport { sendWebSocketMessage } from "@/lib/websocket-server";';
      const interfaceDefinition = `${importSection}\n\n// Define the type for SurrealDB record with ID\ninterface SurrealDBRecord {\n  id: string;  // ID is required for returned records\n  [key: string]: unknown;\n}\n\n// Define the type for SurrealDB input record (without ID)\ninterface SurrealDBInputRecord {\n  [key: string]: unknown;\n}`;

      content = content.replace(importSection, interfaceDefinition);
    }

    // Fix the create method to use the SurrealDBRecord and SurrealDBInputRecord types
    if (content.includes('create<SurrealDBRecord>')) {
      // Update to use SurrealDBInputRecord if it doesn't already
      if (!content.includes('as SurrealDBInputRecord')) {
        content = content.replace(
          /const result = await surrealDB\.create<SurrealDBRecord>\("pipedream_events", event\);/,
          'const result = await surrealDB.create<SurrealDBRecord>("pipedream_events", event as SurrealDBInputRecord);'
        );
      }
    } else {
      // If the create method doesn't use SurrealDBRecord at all, add both types
      content = content.replace(
        /const result = await surrealDB\.create\("pipedream_events", event\);/,
        'const result = await surrealDB.create<SurrealDBRecord>("pipedream_events", event as SurrealDBInputRecord);'
      );
    }

    // Fix the eventId extraction to handle both array and object responses
    if (!content.includes('Array.isArray(result)')) {
      content = content.replace(
        /return NextResponse\.json\({\s+success: true,\s+message: "Webhook received successfully",\s+eventId: result\.id,\s+}\);/s,
        `// Handle both single object and array return types from SurrealDB
    const eventId = Array.isArray(result) && result.length > 0
      ? result[0].id
      : (result as SurrealDBRecord).id;

    return NextResponse.json({
      success: true,
      message: "Webhook received successfully",
      eventId,
    });`
      );
    } else if (!content.includes('(result as SurrealDBRecord).id')) {
      // If it already has Array.isArray but doesn't have the type cast, add it
      content = content.replace(
        /const eventId = Array\.isArray\(result\) && result\.length > 0\s+\? result\[0\]\.id\s+\: result\.id;/s,
        `const eventId = Array.isArray(result) && result.length > 0
      ? result[0].id
      : (result as SurrealDBRecord).id;`
      );
    }

    // Fix the GET method to safely extract results
    if (!content.includes('let eventResults: unknown[]')) {
      content = content.replace(
        /return NextResponse\.json\({\s+events: events\[0\]\?\.result \|\| \[\],\s+}\);/s,
        `let eventResults: unknown[] = [];

    // Safely extract results from the query response
    if (events && Array.isArray(events) && events.length > 0) {
      const firstResult = events[0] as unknown;
      if (firstResult && typeof firstResult === 'object' && firstResult.result) {
        if (Array.isArray(firstResult.result)) {
          eventResults = firstResult.result;
        }
      }
    }

    return NextResponse.json({
      events: eventResults,
    });`
      );
    } else if (content.includes('let eventResults: any[]')) {
      // Replace any with unknown for better type safety
      content = content.replace(
        /let eventResults: any\[\] = \[\];/,
        'let eventResults: unknown[] = [];'
      );

      content = content.replace(
        /const firstResult = events\[0\] as any;/,
        'const firstResult = events[0] as unknown;'
      );
    }

    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`Successfully fixed TypeScript errors in ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error fixing TypeScript errors in ${filePath}:`, error);
    return false;
  }
}

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

// Helper function for colored console output
function colorLog(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Run the fix function
const success = fixPipedreamWebhookRoute();

if (success) {
  colorLog('\n✅ Fix completed successfully!', colors.bright + colors.green);
  colorLog('\nThe following TypeScript issues were fixed:', colors.bright);
  colorLog('1. Updated SurrealDBRecord interface to have a required id property', colors.cyan);
  colorLog('2. Added SurrealDBInputRecord interface for input records without an id', colors.cyan);
  colorLog('3. Updated the create method to use proper TypeScript types', colors.cyan);
  colorLog('4. Fixed the eventId extraction to handle both array and object responses', colors.cyan);
  colorLog('5. Improved type safety by using unknown instead of any', colors.cyan);
  colorLog('\nThese changes fix the TypeScript error where property \'id\' doesn\'t exist on the expected type.', colors.bright);
  process.exit(0);
} else {
  colorLog('\n❌ Fix failed!', colors.bright + colors.red);
  colorLog('Please check the error messages above for details.', colors.yellow);
  process.exit(1);
}
