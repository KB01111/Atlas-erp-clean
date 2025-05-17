import { Workflow, StepType } from '@/components/pipedream/PipedreamWorkflowBuilder';
import { WorkflowExecution, WorkflowExecutionStatus, WorkflowTemplate } from '@/components/pipedream/PipedreamIntegrationManager';

// Mock data for demonstration
export const mockWorkflows: Workflow[] = [
  {
    id: 'workflow-1',
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
      },
      {
        id: 'step-4',
        type: StepType.KNOWLEDGE_NODE,
        name: 'Store in Knowledge Graph',
        description: 'Stores processed data in knowledge graph',
        config: {
          nodeType: 'entity',
          name: 'Processed Data',
          content: 'Data processed from API'
        },
        position: { x: 1150, y: 100 }
      }
    ],
    connections: [
      { source: 'step-1', target: 'step-2' },
      { source: 'step-2', target: 'step-3' },
      { source: 'step-3', target: 'step-4' }
    ],
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2023-06-16T14:30:00Z'
  },
  {
    id: 'workflow-2',
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
          to: 'team@example.com',
          subject: 'Daily Report',
          body: 'Here is your daily report.'
        },
        position: { x: 450, y: 100 }
      }
    ],
    connections: [
      { source: 'step-1', target: 'step-2' }
    ],
    createdAt: '2023-06-20T09:00:00Z',
    updatedAt: '2023-06-20T09:00:00Z'
  }
];

export const mockExecutions: WorkflowExecution[] = [
  {
    id: 'exec-1',
    workflowId: 'workflow-1',
    status: WorkflowExecutionStatus.COMPLETED,
    startTime: '2023-06-16T15:00:00Z',
    endTime: '2023-06-16T15:01:30Z',
    duration: 90000,
    steps: [
      {
        id: 'exec-step-1',
        name: 'Webhook Trigger',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-16T15:00:00Z',
        endTime: '2023-06-16T15:00:05Z',
        input: { headers: { 'content-type': 'application/json' }, body: { data: 'example' } },
        output: { success: true, data: { data: 'example' } }
      },
      {
        id: 'exec-step-2',
        name: 'HTTP Request',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-16T15:00:05Z',
        endTime: '2023-06-16T15:00:35Z',
        input: { url: 'https://api.example.com/data' },
        output: { status: 200, data: { id: 123, name: 'Example Data' } }
      },
      {
        id: 'exec-step-3',
        name: 'Transform Data',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-16T15:00:35Z',
        endTime: '2023-06-16T15:00:40Z',
        input: { status: 200, data: { id: 123, name: 'Example Data' } },
        output: { id: 123, name: 'Example Data', processed: true }
      },
      {
        id: 'exec-step-4',
        name: 'Store in Knowledge Graph',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-16T15:00:40Z',
        endTime: '2023-06-16T15:01:30Z',
        input: { id: 123, name: 'Example Data', processed: true },
        output: { success: true, nodeId: 'node-123' }
      }
    ]
  },
  {
    id: 'exec-2',
    workflowId: 'workflow-1',
    status: WorkflowExecutionStatus.FAILED,
    startTime: '2023-06-17T10:00:00Z',
    endTime: '2023-06-17T10:00:45Z',
    duration: 45000,
    steps: [
      {
        id: 'exec-step-1',
        name: 'Webhook Trigger',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-17T10:00:00Z',
        endTime: '2023-06-17T10:00:05Z',
        input: { headers: { 'content-type': 'application/json' }, body: { data: 'example' } },
        output: { success: true, data: { data: 'example' } }
      },
      {
        id: 'exec-step-2',
        name: 'HTTP Request',
        status: WorkflowExecutionStatus.FAILED,
        startTime: '2023-06-17T10:00:05Z',
        endTime: '2023-06-17T10:00:45Z',
        input: { url: 'https://api.example.com/data' },
        error: 'API request failed with status 500: Internal Server Error'
      }
    ],
    error: 'Workflow execution failed at step "HTTP Request"'
  },
  {
    id: 'exec-3',
    workflowId: 'workflow-2',
    status: WorkflowExecutionStatus.COMPLETED,
    startTime: '2023-06-20T09:00:00Z',
    endTime: '2023-06-20T09:00:30Z',
    duration: 30000,
    steps: [
      {
        id: 'exec-step-1',
        name: 'Schedule Trigger',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-20T09:00:00Z',
        endTime: '2023-06-20T09:00:01Z',
        input: { timestamp: '2023-06-20T09:00:00Z' },
        output: { triggered: true }
      },
      {
        id: 'exec-step-2',
        name: 'Send Email',
        status: WorkflowExecutionStatus.COMPLETED,
        startTime: '2023-06-20T09:00:01Z',
        endTime: '2023-06-20T09:00:30Z',
        input: { to: 'team@example.com', subject: 'Daily Report', body: 'Here is your daily report.' },
        output: { sent: true, messageId: 'msg-123' }
      }
    ]
  }
];
