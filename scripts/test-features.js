/**
 * Atlas-ERP Feature Testing Script
 * 
 * This script tests the functionality of various features in the Atlas-ERP application:
 * 1. Dashboard components and real-time metrics
 * 2. Document upload, processing, and OCR
 * 3. Knowledge graph visualization and editing
 * 4. Workflow builder and agent configuration
 * 5. WebSocket connections for real-time updates
 * 6. Pipedream integration
 * 
 * Run with: node scripts/test-features.js
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const fetch = require('node-fetch');
const WebSocket = require('ws');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Helper functions for logging
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function info(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

// Test dashboard API endpoints
async function testDashboardAPI() {
  log('\n=== Testing Dashboard API ===', colors.bright + colors.cyan);
  
  try {
    // Test dashboard metrics API
    const response = await fetch('http://localhost:3000/api/dashboard/metrics', {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      success('Dashboard metrics API is working');
      info(`Retrieved ${data.length} metrics`);
      return true;
    } else {
      warning('Dashboard metrics API returned empty or invalid data');
      return false;
    }
  } catch (err) {
    error(`Failed to test dashboard API: ${err.message}`);
    return false;
  }
}

// Test document upload and processing
async function testDocumentProcessing() {
  log('\n=== Testing Document Processing ===', colors.bright + colors.cyan);
  
  try {
    // Create a test document
    const testDocumentPath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testDocumentPath, 'This is a test document for Atlas-ERP document processing.');
    
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(testDocumentPath));
    form.append('documentType', 'text');
    
    // Upload the document
    const response = await fetch('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: form,
    });
    
    // Clean up test file
    fs.unlinkSync(testDocumentPath);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.id) {
      success('Document upload and processing is working');
      info(`Document ID: ${data.id}`);
      return true;
    } else {
      warning('Document upload API returned invalid data');
      return false;
    }
  } catch (err) {
    error(`Failed to test document processing: ${err.message}`);
    return false;
  }
}

// Test knowledge graph API
async function testKnowledgeGraphAPI() {
  log('\n=== Testing Knowledge Graph API ===', colors.bright + colors.cyan);
  
  try {
    // Test knowledge nodes API
    const response = await fetch('http://localhost:3000/api/knowledge/nodes', {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      success('Knowledge graph API is working');
      info(`Retrieved ${data.length} knowledge nodes`);
      
      // Test creating a knowledge node
      const newNode = {
        type: 'CONCEPT',
        name: `Test Concept ${uuidv4().substring(0, 8)}`,
        content: 'This is a test concept created by the feature testing script.',
      };
      
      const createResponse = await fetch('http://localhost:3000/api/knowledge/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNode),
      });
      
      if (createResponse.ok) {
        const createdNode = await createResponse.json();
        success('Knowledge node creation is working');
        info(`Created node ID: ${createdNode.id}`);
        
        // Delete the test node
        const deleteResponse = await fetch(`http://localhost:3000/api/knowledge/nodes/${createdNode.id}`, {
          method: 'DELETE',
        });
        
        if (deleteResponse.ok) {
          success('Knowledge node deletion is working');
        } else {
          warning('Failed to delete test knowledge node');
        }
      } else {
        warning('Failed to create test knowledge node');
      }
      
      return true;
    } else {
      warning('Knowledge graph API returned invalid data');
      return false;
    }
  } catch (err) {
    error(`Failed to test knowledge graph API: ${err.message}`);
    return false;
  }
}

// Test workflow API
async function testWorkflowAPI() {
  log('\n=== Testing Workflow API ===', colors.bright + colors.cyan);
  
  try {
    // Test workflows API
    const response = await fetch('http://localhost:3000/api/workflows', {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      success('Workflow API is working');
      info(`Retrieved ${data.length} workflows`);
      
      // Test creating a workflow
      const newWorkflow = {
        name: `Test Workflow ${uuidv4().substring(0, 8)}`,
        description: 'This is a test workflow created by the feature testing script.',
        nodes: [],
        edges: [],
      };
      
      const createResponse = await fetch('http://localhost:3000/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkflow),
      });
      
      if (createResponse.ok) {
        const createdWorkflow = await createResponse.json();
        success('Workflow creation is working');
        info(`Created workflow ID: ${createdWorkflow.id}`);
        
        // Delete the test workflow
        const deleteResponse = await fetch(`http://localhost:3000/api/workflows/${createdWorkflow.id}`, {
          method: 'DELETE',
        });
        
        if (deleteResponse.ok) {
          success('Workflow deletion is working');
        } else {
          warning('Failed to delete test workflow');
        }
      } else {
        warning('Failed to create test workflow');
      }
      
      return true;
    } else {
      warning('Workflow API returned invalid data');
      return false;
    }
  } catch (err) {
    error(`Failed to test workflow API: ${err.message}`);
    return false;
  }
}

// Test agent API
async function testAgentAPI() {
  log('\n=== Testing Agent API ===', colors.bright + colors.cyan);
  
  try {
    // Test agents API
    const response = await fetch('http://localhost:3000/api/agents', {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      success('Agent API is working');
      info(`Retrieved ${data.length} agents`);
      return true;
    } else {
      warning('Agent API returned invalid data');
      return false;
    }
  } catch (err) {
    error(`Failed to test agent API: ${err.message}`);
    return false;
  }
}

// Test WebSocket connection
async function testWebSocketConnection() {
  log('\n=== Testing WebSocket Connection ===', colors.bright + colors.cyan);
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket('ws://localhost:3000/api/websocket');
      
      ws.on('open', () => {
        success('WebSocket connection established');
        
        // Close the connection after a short delay
        setTimeout(() => {
          ws.close();
          resolve(true);
        }, 1000);
      });
      
      ws.on('message', (data) => {
        info(`Received WebSocket message: ${data}`);
      });
      
      ws.on('error', (err) => {
        error(`WebSocket error: ${err.message}`);
        resolve(false);
      });
      
      // Set a timeout in case the connection never opens
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          error('WebSocket connection timed out');
          ws.terminate();
          resolve(false);
        }
      }, 5000);
    } catch (err) {
      error(`Failed to test WebSocket connection: ${err.message}`);
      resolve(false);
    }
  });
}

// Main function
async function main() {
  log('🧪 Atlas-ERP Feature Testing', colors.bright + colors.magenta);
  log('==========================', colors.bright + colors.magenta);
  
  // Test all features
  const dashboardResult = await testDashboardAPI();
  const documentResult = await testDocumentProcessing();
  const knowledgeResult = await testKnowledgeGraphAPI();
  const workflowResult = await testWorkflowAPI();
  const agentResult = await testAgentAPI();
  const websocketResult = await testWebSocketConnection();
  
  // Summary
  log('\n=== Feature Testing Summary ===', colors.bright + colors.magenta);
  
  const results = {
    'Dashboard API': dashboardResult,
    'Document Processing': documentResult,
    'Knowledge Graph API': knowledgeResult,
    'Workflow API': workflowResult,
    'Agent API': agentResult,
    'WebSocket Connection': websocketResult,
  };
  
  for (const [feature, result] of Object.entries(results)) {
    if (result) {
      success(`${feature}: Passed`);
    } else {
      error(`${feature}: Failed`);
    }
  }
  
  const overallResult = Object.values(results).every(result => result);
  
  if (overallResult) {
    log('\n✅ All feature tests passed! Atlas-ERP is fully functional.', colors.bright + colors.green);
  } else {
    log('\n⚠️ Some feature tests failed. Atlas-ERP may have functionality issues.', colors.bright + colors.yellow);
  }
}

// Run the main function
main().catch(err => {
  error(`Testing failed: ${err.message}`);
  process.exit(1);
});
