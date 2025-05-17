import { StepType } from '@/components/pipedream/PipedreamWorkflowBuilder';
import { WorkflowTemplate } from '@/components/pipedream/PipedreamIntegrationManager';

export const mockTemplates: WorkflowTemplate[] = [
  {
    id: 'template-1',
    name: 'Data Collection Template',
    description: 'A template for collecting and processing data from external APIs',
    category: 'Data Collection',
    workflow: {
      id: 'template-workflow-1',
      name: 'Data Collection Workflow',
      description: 'Collects data from various sources and processes it',
      steps: [
        {
          id: 'step-1',
          type: StepType.TRIGGER,
          name: 'Webhook Trigger',
          description: 'Triggers on HTTP request',
          config: {
            method: 'POST',
            path: '/webhook/data-collection',
            requireAuth: true
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'step-2',
          type: StepType.ACTION,
          name: 'HTTP Request',
          description: 'Fetches data from API',
          config: {
            method: 'GET',
            url: 'https://api.example.com/data',
            headers: { 'Authorization': 'Bearer ${env.API_KEY}' }
          },
          position: { x: 450, y: 100 }
        },
        {
          id: 'step-3',
          type: StepType.TRANSFORMATION,
          name: 'Transform Data',
          description: 'Transforms the API response',
          config: {
            language: 'javascript',
            code: '// Transform data\nreturn { ...data, processed: true };'
          },
          position: { x: 800, y: 100 }
        }
      ],
      connections: [
        { source: 'step-1', target: 'step-2' },
        { source: 'step-2', target: 'step-3' }
      ]
    }
  },
  {
    id: 'template-2',
    name: 'Notification Template',
    description: 'A template for sending notifications based on events',
    category: 'Notifications',
    workflow: {
      id: 'template-workflow-2',
      name: 'Notification Workflow',
      description: 'Sends notifications based on events',
      steps: [
        {
          id: 'step-1',
          type: StepType.TRIGGER,
          name: 'Schedule Trigger',
          description: 'Triggers on schedule',
          config: {
            schedule: '0 9 * * *',
            timezone: 'UTC'
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'step-2',
          type: StepType.ACTION,
          name: 'Send Email',
          description: 'Sends email notification',
          config: {
            to: '',
            subject: 'Notification',
            body: 'This is a notification.'
          },
          position: { x: 450, y: 100 }
        }
      ],
      connections: [
        { source: 'step-1', target: 'step-2' }
      ]
    }
  },
  {
    id: 'template-3',
    name: 'Knowledge Graph Integration',
    description: 'A template for integrating with the knowledge graph',
    category: 'Knowledge Integration',
    workflow: {
      id: 'template-workflow-3',
      name: 'Knowledge Graph Integration',
      description: 'Integrates with the knowledge graph',
      steps: [
        {
          id: 'step-1',
          type: StepType.TRIGGER,
          name: 'Webhook Trigger',
          description: 'Triggers on HTTP request',
          config: {
            method: 'POST',
            path: '/webhook/knowledge',
            requireAuth: true
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'step-2',
          type: StepType.KNOWLEDGE_NODE,
          name: 'Query Knowledge Graph',
          description: 'Queries the knowledge graph',
          config: {
            query: '',
            nodeType: 'all',
            limit: 10
          },
          position: { x: 450, y: 100 }
        },
        {
          id: 'step-3',
          type: StepType.TRANSFORMATION,
          name: 'Process Results',
          description: 'Processes the query results',
          config: {
            language: 'javascript',
            code: '// Process results\nreturn { processed: true, results: data };'
          },
          position: { x: 800, y: 100 }
        }
      ],
      connections: [
        { source: 'step-1', target: 'step-2' },
        { source: 'step-2', target: 'step-3' }
      ]
    }
  }
];
