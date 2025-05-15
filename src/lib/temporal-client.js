/**
 * Temporal Client
 * 
 * This module provides a client for interacting with Temporal.
 * It's a CommonJS wrapper around the TypeScript implementation
 * to make it easier to use in scripts.
 */

// Import the TypeScript implementation
const temporalWorkflowService = require('./temporal-workflow-service');

/**
 * Get the Temporal client
 * @returns Temporal client
 */
async function getTemporalClient() {
  try {
    // Use the getTemporalClient function from the TypeScript implementation
    return await temporalWorkflowService.getTemporalClient();
  } catch (error) {
    console.error('Error getting Temporal client:', error);
    throw error;
  }
}

module.exports = {
  getTemporalClient,
};
