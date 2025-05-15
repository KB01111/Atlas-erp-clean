# Pipedream Integration for Atlas-ERP

This document provides information on how to set up and use the Pipedream integration in Atlas-ERP.

## Overview

Pipedream is a platform for connecting APIs and building workflows. It allows you to collect data from external sources and process it for use in Atlas-ERP dashboards and AI agents.

The Pipedream integration in Atlas-ERP provides the following features:

- Create and manage Pipedream workflows
- Create and manage Pipedream sources
- Trigger Pipedream workflows from Atlas-ERP
- Receive webhook events from Pipedream workflows
- Use Pipedream data in dashboards and AI agents

## Setup

To use the Pipedream integration, you need to set up a Pipedream account and configure Atlas-ERP to connect to it.

### 1. Create a Pipedream Account

1. Go to [pipedream.com](https://pipedream.com) and sign up for an account
2. Create a new workspace or use the default workspace
3. Generate an API key from the Pipedream dashboard

### 2. Configure Atlas-ERP

Add the following environment variables to your `.env.local` file:

```
PIPEDREAM_API_KEY=your_pipedream_api_key
PIPEDREAM_API_URL=https://api.pipedream.com/v1
PIPEDREAM_ORG_ID=your_pipedream_org_id (optional)
PIPEDREAM_WORKSPACE_ID=your_pipedream_workspace_id (optional)
```

### 3. Restart Atlas-ERP

Restart the Atlas-ERP application to apply the changes.

## Usage

### Managing Workflows

You can create, view, update, and delete Pipedream workflows from the Atlas-ERP dashboard.

1. Go to **Dashboard > Integrations > Pipedream**
2. Click on the **New Workflow** button to create a new workflow
3. Fill in the workflow details and click **Create**
4. To edit a workflow, click on the **Edit** button next to the workflow
5. To delete a workflow, click on the **Delete** button next to the workflow

### Triggering Workflows

You can trigger Pipedream workflows from Atlas-ERP.

1. Go to **Dashboard > Integrations > Pipedream**
2. Find the workflow you want to trigger
3. Click on the **Trigger** button next to the workflow
4. Enter the trigger data in JSON format
5. Click **Trigger Workflow**

### Receiving Webhook Events

Pipedream workflows can send data to Atlas-ERP via webhooks.

1. In your Pipedream workflow, add a step to send data to a webhook
2. Use the following webhook URL: `https://your-atlas-erp-url/api/webhooks/pipedream`
3. The webhook will receive the data and store it in the database
4. You can view the webhook events in the Atlas-ERP dashboard

### Using Pipedream Data in Dashboards

You can use data from Pipedream workflows in Atlas-ERP dashboards.

1. Create a Pipedream workflow that collects data from external sources
2. Configure the workflow to send data to Atlas-ERP via the webhook
3. Use the data in your dashboard components

### Using Pipedream Data in AI Agents

You can use data from Pipedream workflows in Atlas-ERP AI agents.

1. Create a Pipedream workflow that collects data for AI agents
2. Configure the workflow to send data to Atlas-ERP via the webhook
3. Use the data in your AI agent configurations

## API Reference

### Endpoints

- `GET /api/integrations/pipedream` - Get all workflows and sources
- `POST /api/integrations/pipedream` - Create a new workflow or source
- `GET /api/integrations/pipedream/:id` - Get a specific workflow or source
- `PUT /api/integrations/pipedream/:id` - Update a specific workflow or source
- `DELETE /api/integrations/pipedream/:id` - Delete a specific workflow or source
- `POST /api/integrations/pipedream/trigger` - Trigger a workflow
- `POST /api/webhooks/pipedream` - Receive webhook events from Pipedream
- `GET /api/webhooks/pipedream` - Get recent webhook events

### Example: Creating a Workflow

```javascript
const response = await fetch('/api/integrations/pipedream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'workflow',
    data: {
      name: 'My Workflow',
      description: 'Collects data from external sources',
      active: true,
    },
  }),
});

const result = await response.json();
console.log(result);
```

### Example: Triggering a Workflow

```javascript
const response = await fetch('/api/integrations/pipedream/trigger', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    workflowId: 'workflow-id',
    data: {
      key: 'value',
    },
  }),
});

const result = await response.json();
console.log(result);
```

## Troubleshooting

### Mock Service

If the Pipedream API is not available, Atlas-ERP will use a mock service. This is useful for development and testing.

You can tell if you're using the mock service by looking for the "Using mock Pipedream service" message on the Pipedream integration page.

### Common Issues

- **API Key Invalid**: Make sure you've set the correct API key in the environment variables.
- **Workflow Not Found**: Check if the workflow ID is correct.
- **Webhook Not Receiving Events**: Make sure the webhook URL is correct and accessible from the internet.

## Resources

- [Pipedream Documentation](https://pipedream.com/docs)
- [Pipedream API Reference](https://pipedream.com/docs/api/overview)
- [Atlas-ERP Documentation](https://atlas-erp.com/docs)
