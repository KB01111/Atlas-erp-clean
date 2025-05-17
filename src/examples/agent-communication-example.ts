/**
 * Agent Communication Example
 *
 * This example demonstrates how to use the agent communication protocol
 * to enable agent-to-agent communication in the Atlas-ERP project.
 */

import { AgentClient } from '../lib/a2a/client';
import {
  createMessage,
  createMessageWithParts,
  createArtifact,
  messageToString,
  RunStatus
} from '../lib/a2a/protocol';

/**
 * Example of running a single agent
 */
async function runSingleAgent() {
  console.log('Running single agent example...');

  // Run the CFO-Bot agent with a simple text input
  const response = await AgentClient.runSync(
    '1', // CFO-Bot ID
    'Generate a financial forecast for Q3 2025'
  );

  console.log('Agent response:');
  console.log(`Status: ${response.status}`);

  if (response.status === RunStatus.COMPLETED && response.output) {
    console.log('Output:');
    console.log(messageToString(response.output[0]));
  } else if (response.error) {
    console.error('Error:', response.error);
  }

  console.log('---');
}

/**
 * Example of chaining multiple agents
 */
async function chainAgents() {
  console.log('Running agent chaining example...');

  // Step 1: Run the CFO-Bot to generate financial insights
  const cfoResponse = await AgentClient.runSync(
    '1', // CFO-Bot ID
    'Generate key financial insights for our company'
  );

  if (cfoResponse.status !== RunStatus.COMPLETED || !cfoResponse.output) {
    console.error('CFO-Bot failed:', cfoResponse.error);
    return;
  }

  const financialInsights = messageToString(cfoResponse.output[0]);
  console.log('CFO-Bot generated insights:');
  console.log(financialInsights);

  // Step 2: Pass the financial insights to Soshie-Bot to create social media content
  const soshiePrompt = `Based on these financial insights, create social media posts for LinkedIn and Twitter:

${financialInsights}`;

  const soshieResponse = await AgentClient.runSync(
    '3', // Soshie-Bot ID
    soshiePrompt
  );

  if (soshieResponse.status !== RunStatus.COMPLETED || !soshieResponse.output) {
    console.error('Soshie-Bot failed:', soshieResponse.error);
    return;
  }

  const socialMediaContent = messageToString(soshieResponse.output[0]);
  console.log('Soshie-Bot generated social media content:');
  console.log(socialMediaContent);

  console.log('---');
}

/**
 * Example of using structured messages with artifacts
 */
async function createStructuredMessages() {
  console.log('Running structured messages example...');

  // Create a message with multiple parts
  const message = createMessageWithParts([
    {
      contentType: 'text/plain',
      content: 'Analyze this financial data and provide insights:',
    },
    createArtifact(
      'financial-data.json',
      JSON.stringify({
        revenue: 1250000,
        expenses: 780000,
        growth: 0.15,
        departments: {
          sales: { revenue: 750000, expenses: 320000 },
          marketing: { revenue: 0, expenses: 150000 },
          operations: { revenue: 500000, expenses: 310000 },
        },
      }),
      'application/json'
    ),
  ]);

  // Run the CFO-Bot with the structured message
  const response = await AgentClient.runSync(
    '1', // CFO-Bot ID
    message
  );

  if (response.status === RunStatus.COMPLETED && response.output) {
    console.log('CFO-Bot analysis:');
    console.log(messageToString(response.output[0]));
  } else if (response.error) {
    console.error('Error:', response.error);
  }

  console.log('---');
}

/**
 * Example of running an agent asynchronously
 */
async function runAsyncAgent() {
  console.log('Running async agent example...');

  // Start the agent execution asynchronously
  const response = await AgentClient.runAsync(
    '2', // Ops-Bot ID
    'Identify process bottlenecks in our supply chain'
  );

  console.log(`Run ID: ${response.runId}`);
  console.log(`Initial status: ${response.status}`);

  // In a real implementation, you would poll for the status
  // or use a callback mechanism to get the final result
  console.log('Waiting for agent to complete...');

  // Simulate waiting for completion
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Agent execution completed asynchronously.');
  console.log('---');
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await runSingleAgent();
    await chainAgents();
    await createStructuredMessages();
    await runAsyncAgent();

    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples when this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  runSingleAgent,
  chainAgents,
  createStructuredMessages,
  runAsyncAgent,
  runExamples,
};
