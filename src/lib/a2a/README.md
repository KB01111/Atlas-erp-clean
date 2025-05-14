# Agent-to-Agent Communication Protocol

This directory contains a simplified implementation of an Agent-to-Agent (A2A) communication protocol for the Atlas-ERP project. The protocol is inspired by the Agent Communication Protocol (ACP) but simplified for our specific needs.

## Overview

The A2A protocol provides a standardized way for agents to communicate with each other, including:

- Structured message format with support for multiple content types
- Synchronous and asynchronous agent execution
- Status tracking for agent runs
- Error handling and reporting

## Components

### 1. Protocol (`protocol.ts`)

Defines the core protocol types and utilities:

- `Message` and `MessagePart` types for structured communication
- `RunStatus` and `RunMode` enums for execution control
- `RunRequest` and `RunResponse` interfaces for agent execution
- Utility functions for creating messages, artifacts, and run requests/responses

### 2. Client (`client.ts`)

Provides a client for interacting with agents:

- `AgentClient.runSync()` - Run an agent synchronously
- `AgentClient.runAsync()` - Run an agent asynchronously
- `AgentClient.getRunStatus()` - Get the status of an asynchronous run

## Usage Examples

### Basic Agent Execution

```typescript
import { AgentClient } from '../lib/a2a/client';

// Run an agent synchronously
const response = await AgentClient.runSync(
  'agent-id',
  'What is the financial forecast for Q3?'
);

// Check the response
if (response.status === 'completed' && response.output) {
  console.log(response.output[0].parts[0].content);
} else if (response.error) {
  console.error('Error:', response.error);
}
```

### Structured Messages

```typescript
import { 
  createMessageWithParts, 
  createArtifact 
} from '../lib/a2a/protocol';
import { AgentClient } from '../lib/a2a/client';

// Create a message with multiple parts
const message = createMessageWithParts([
  {
    contentType: 'text/plain',
    content: 'Analyze this financial data:',
  },
  createArtifact(
    'financial-data.json',
    JSON.stringify({ revenue: 1250000, expenses: 780000 }),
    'application/json'
  ),
]);

// Run the agent with the structured message
const response = await AgentClient.runSync('agent-id', message);
```

### Agent Chaining

```typescript
import { AgentClient } from '../lib/a2a/client';
import { messageToString } from '../lib/a2a/protocol';

// Step 1: Run the first agent
const response1 = await AgentClient.runSync(
  'agent1-id',
  'Generate financial insights'
);

// Step 2: Pass the output to the second agent
const insights = messageToString(response1.output[0]);
const response2 = await AgentClient.runSync(
  'agent2-id',
  `Create social media posts based on these insights: ${insights}`
);
```

### Asynchronous Execution

```typescript
import { AgentClient } from '../lib/a2a/client';

// Start the agent execution asynchronously
const response = await AgentClient.runAsync(
  'agent-id',
  'Perform a long-running analysis'
);

console.log(`Run ID: ${response.runId}`);
console.log(`Initial status: ${response.status}`);

// Check the status later
const status = await AgentClient.getRunStatus(response.runId);
```

## Integration with Zod Validation

The A2A protocol is integrated with Zod validation schemas defined in `src/lib/validation/schemas.ts`. This ensures that all messages and responses conform to the expected structure and types.

## Future Enhancements

1. **Persistent Run Storage**: Store run status and results in SurrealDB for reliable status tracking
2. **Streaming Responses**: Add support for streaming responses from agents
3. **WebSocket Integration**: Implement WebSocket support for real-time updates
4. **Full ACP Compatibility**: Extend the implementation to be fully compatible with the Agent Communication Protocol (ACP)

## See Also

For a complete example of how to use the A2A protocol, see `src/examples/agent-communication-example.ts`.
