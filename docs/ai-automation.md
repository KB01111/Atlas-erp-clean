# AI Automation Features

This document provides an overview of the AI automation features in Atlas-ERP, including the knowledge graph and workflow capabilities.

## Knowledge Graph

The knowledge graph is a flexible, graph-based storage system for AI knowledge. It allows the AI agents to store and retrieve information in a structured way, making them more intelligent and context-aware.

### Node Types

- **Concept**: Represents a general concept or idea
- **Entity**: Represents a specific entity or object
- **Document**: Represents a document or file
- **Fact**: Represents a specific fact or piece of information
- **Question**: Represents a question
- **Answer**: Represents an answer to a question

### Edge Types

- **RELATES_TO**: Indicates that two nodes are related
- **CONTAINS**: Indicates that one node contains another
- **ANSWERS**: Indicates that one node answers another
- **REFERENCES**: Indicates that one node references another
- **IS_A**: Indicates that one node is a type of another
- **HAS_PROPERTY**: Indicates that one node has a property represented by another

### API Endpoints

#### Create a Knowledge Node

```http
POST /api/knowledge
Content-Type: application/json

{
  "type": "concept",
  "name": "Customer Satisfaction",
  "content": "Customer satisfaction is a measure of how products and services supplied by a company meet or surpass customer expectations.",
  "metadata": {
    "tags": ["customer", "satisfaction", "metrics"]
  }
}
```

#### Get Knowledge Nodes by Type

```http
GET /api/knowledge?type=concept
```

#### Search Knowledge Nodes

```http
GET /api/knowledge?query=customer+satisfaction
```

#### Get a Specific Knowledge Node

```http
GET /api/knowledge/node-id
```

#### Create a Knowledge Edge

```http
POST /api/knowledge/edges
Content-Type: application/json

{
  "type": "relates_to",
  "sourceId": "node-id-1",
  "targetId": "node-id-2",
  "weight": 0.8,
  "metadata": {
    "tags": ["relationship", "customer"]
  }
}
```

#### Get Connected Nodes

```http
POST /api/knowledge/node-id
Content-Type: application/json

{
  "edgeType": "relates_to",
  "direction": "outgoing"
}
```

## Workflows

Workflows allow users to chain together AI agents to create custom automation processes. They are defined as a directed graph of nodes and edges, where each node represents an action or decision point, and each edge represents a transition between nodes.

### Node Types

- **Agent**: Executes an AI agent
- **Condition**: Evaluates a condition and routes the flow accordingly
- **Input**: Represents the workflow input
- **Output**: Represents the workflow output
- **Transform**: Transforms the data

### API Endpoints

#### Create a Workflow

```http
POST /api/workflows
Content-Type: application/json

{
  "name": "Customer Analysis",
  "description": "Analyze customer data and generate insights",
  "nodes": [
    {
      "id": "node1",
      "type": "agent",
      "name": "Data Analysis",
      "agentId": "ops-bot-id"
    },
    {
      "id": "node2",
      "type": "agent",
      "name": "Financial Impact",
      "agentId": "cfo-bot-id"
    }
  ],
  "edges": [
    {
      "id": "edge1",
      "source": "node1",
      "target": "node2"
    }
  ]
}
```

#### Get All Workflows

```http
GET /api/workflows
```

#### Get a Specific Workflow

```http
GET /api/workflows/workflow-id
```

#### Update a Workflow

```http
PUT /api/workflows/workflow-id
Content-Type: application/json

{
  "name": "Updated Customer Analysis",
  "description": "Updated description",
  "status": "active"
}
```

#### Delete a Workflow

```http
DELETE /api/workflows/workflow-id
```

#### Execute a Workflow

```http
POST /api/workflows/workflow-id/execute
Content-Type: application/json

{
  "input": {
    "customerData": "..."
  }
}
```

## Implementation Details

### Technologies Used

- **LangGraph**: For workflow orchestration
- **SurrealDB**: For storing knowledge graph and workflow definitions
- **LiteLLM**: For agent execution and embedding generation

### Database Schema

The database schema includes the following tables:

- **knowledge_nodes**: Stores knowledge nodes
- **knowledge_edges**: Stores knowledge edges
- **workflows**: Stores workflow definitions
- **workflow_executions**: Stores workflow execution states
- **agents**: Stores agent definitions

### Integration with AI Agents

The workflow system integrates with the existing AI agents (CFO-Bot, Ops-Bot, Soshie-Bot) to provide a comprehensive automation solution. Each agent can be used as a node in a workflow, allowing for complex automation scenarios.

## Getting Started

### Initialize the Database Schema

Run the schema initialization script to create the necessary tables and indexes:

```bash
node scripts/init-db-schema.js
```

### Create Knowledge Nodes

Use the knowledge graph API to create nodes and edges:

```javascript
// Create a concept node
const conceptNode = await fetch('/api/knowledge', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'concept',
    name: 'Customer Satisfaction',
    content: 'Customer satisfaction is a measure of how products and services supplied by a company meet or surpass customer expectations.',
  }),
}).then(res => res.json());
```

### Create and Execute a Workflow

Use the workflow API to create and execute workflows:

```javascript
// Create a workflow
const workflow = await fetch('/api/workflows', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Customer Analysis',
    description: 'Analyze customer data and generate insights',
    nodes: [
      {
        id: 'node1',
        type: 'agent',
        name: 'Data Analysis',
        agentId: 'ops-bot-id',
      },
      {
        id: 'node2',
        type: 'agent',
        name: 'Financial Impact',
        agentId: 'cfo-bot-id',
      },
    ],
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
      },
    ],
  }),
}).then(res => res.json());

// Execute the workflow
const execution = await fetch(`/api/workflows/${workflow.id}/execute`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: {
      customerData: '...',
    },
  }),
}).then(res => res.json());
```
