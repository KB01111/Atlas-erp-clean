/**
 * Mock Service Provider
 *
 * This module provides mock implementations for services when they are not available.
 * It allows the application to function in development mode without requiring all services to be running.
 */

/**
 * Check if a service is available
 * @param url The URL to check
 * @returns True if the service is available, false otherwise
 */
export async function isServiceAvailable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Mock SurrealDB client
 */
export const mockSurrealDB = {
  query: async () => {
    return [{ count: 0 }];
  },
  select: async () => {
    return [];
  },
  create: async (table: string, data: any) => {
    return { id: `${table}:mock-${Date.now()}`, ...data };
  },
  update: async (id: string, data: any) => {
    return { id, ...data };
  },
  delete: async () => {
    return null;
  }
};

/**
 * Mock ArangoDB client
 */
export const mockArangoDB = {
  version: async () => {
    return { version: 'mock-3.11.0' };
  },
  query: async () => {
    return { all: async () => [] };
  },
  collection: () => ({
    exists: async () => true,
    create: async () => ({}),
    save: async (doc: any) => ({ _id: `mock-${Date.now()}`, ...doc }),
    update: async (id: string, doc: any) => ({ _id: id, ...doc }),
    remove: async () => ({})
  }),
  edgeCollection: () => ({
    exists: async () => true,
    create: async () => ({}),
    save: async (doc: any) => ({ _id: `mock-${Date.now()}`, ...doc }),
    update: async (id: string, doc: any) => ({ _id: id, ...doc }),
    remove: async () => ({})
  }),
  graph: () => ({
    exists: async () => true,
    create: async () => ({}),
    vertexCollection: () => ({
      save: async (doc: any) => ({ _id: `mock-${Date.now()}`, ...doc })
    }),
    edgeCollection: () => ({
      save: async (doc: any) => ({ _id: `mock-${Date.now()}`, ...doc })
    })
  })
};

/**
 * Mock MinIO client
 */
export const mockMinIO = {
  bucketExists: async () => true,
  makeBucket: async () => {},
  putObject: async () => {},
  getObject: async () => new ReadableStream(),
  listObjects: async function* () {
    yield { name: 'mock-object', size: 1024, lastModified: new Date() };
  },
  removeObject: async () => {}
};

/**
 * Mock Temporal client
 */
export const mockTemporal = {
  connection: {
    connect: async () => ({})
  },
  client: {
    workflow: {
      start: async () => ({ workflowId: `mock-${Date.now()}` }),
      getHandle: () => ({
        result: async () => ({}),
        terminate: async () => ({})
      })
    },
    workflowService: {
      listNamespaces: async () => ({ namespaces: [{ namespace: { name: 'default' } }] })
    }
  }
};

/**
 * Mock LiteLLM client
 */
export const mockLiteLLM = {
  completion: async () => ({
    choices: [{
      message: {
        content: 'This is a mock response from the LLM API.'
      }
    }]
  }),
  embedding: async () => ({
    data: [{
      embedding: Array(1536).fill(0).map(() => Math.random())
    }]
  })
};

/**
 * Mock Nango client
 */
export const mockNango = {
  // Mock connections
  connections: [
    {
      id: 1,
      connection_id: 'google-calendar-1',
      provider: 'google-calendar',
      provider_config_key: 'google-calendar-integration',
      created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        user_email: 'user@example.com',
        last_sync: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      errors: []
    },
    {
      id: 2,
      connection_id: 'slack-workspace',
      provider: 'slack',
      provider_config_key: 'slack-integration',
      created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        workspace_name: 'Atlas Workspace',
        channels: ['general', 'random', 'development']
      },
      errors: []
    },
    {
      id: 3,
      connection_id: 'github-repos',
      provider: 'github',
      provider_config_key: 'github-integration',
      created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        username: 'atlas-dev',
        repos: ['atlas-erp', 'atlas-docs', 'atlas-api']
      },
      errors: []
    }
  ],

  // Mock API methods
  listConnections: async () => ({
    connections: mockNango.connections
  }),

  getConnection: async (providerConfigKey: string, connectionId: string) => {
    const connection = mockNango.connections.find(
      c => c.provider_config_key === providerConfigKey && c.connection_id === connectionId
    );

    if (!connection) return null;

    return {
      id: connection.id,
      created_at: connection.created,
      updated_at: connection.created,
      provider_config_key: connection.provider_config_key,
      connection_id: connection.connection_id,
      credentials: {
        type: 'OAUTH2',
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        raw: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'bearer',
          scope: 'read write'
        }
      },
      metadata: connection.metadata
    };
  },

  createConnection: async (data: any) => {
    const newConnection = {
      id: mockNango.connections.length + 1,
      connection_id: data.connection_id,
      provider: data.provider_config_key.split('-')[0],
      provider_config_key: data.provider_config_key,
      created: new Date().toISOString(),
      metadata: data.metadata || {},
      errors: []
    };

    mockNango.connections.push(newConnection);

    return {
      id: newConnection.id,
      created_at: newConnection.created,
      updated_at: newConnection.created,
      provider_config_key: newConnection.provider_config_key,
      connection_id: newConnection.connection_id,
      credentials: {
        type: 'OAUTH2',
        access_token: data.access_token || 'mock-access-token',
        refresh_token: data.refresh_token || 'mock-refresh-token',
        expires_at: data.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        raw: {
          access_token: data.access_token || 'mock-access-token',
          refresh_token: data.refresh_token || 'mock-refresh-token',
          token_type: 'bearer',
          scope: 'read write'
        }
      },
      metadata: newConnection.metadata
    };
  },

  deleteConnection: async (providerConfigKey: string, connectionId: string) => {
    const index = mockNango.connections.findIndex(
      c => c.provider_config_key === providerConfigKey && c.connection_id === connectionId
    );

    if (index !== -1) {
      mockNango.connections.splice(index, 1);
      return true;
    }

    return false;
  }
};

/**
 * Mock Pipedream client
 */
export const mockPipedream = {
  // Mock workflows
  workflows: [
    {
      id: 'mock-workflow-1',
      name: 'Data Collection Workflow',
      description: 'Collects data from external sources for dashboard metrics',
      active: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { category: 'dashboard', type: 'data-collection' }
    },
    {
      id: 'mock-workflow-2',
      name: 'AI Agent Data Processor',
      description: 'Processes data for AI agents',
      active: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { category: 'ai-agent', type: 'data-processing' }
    }
  ],

  // Mock sources
  sources: [
    {
      id: 'mock-source-1',
      name: 'Google Analytics Source',
      description: 'Collects data from Google Analytics',
      active: true,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'google_analytics',
      metadata: { category: 'analytics' }
    },
    {
      id: 'mock-source-2',
      name: 'Webhook Source',
      description: 'Receives webhook events',
      active: true,
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'webhook',
      metadata: { category: 'integration' }
    }
  ],

  // Mock API methods
  getWorkflows: async () => mockPipedream.workflows,
  getWorkflow: async (id: string) => mockPipedream.workflows.find(w => w.id === id) || null,
  createWorkflow: async (workflow: any) => ({
    id: `mock-workflow-${Date.now()}`,
    ...workflow,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }),
  updateWorkflow: async (id: string, updates: any) => {
    const workflow = mockPipedream.workflows.find(w => w.id === id);
    if (!workflow) return null;
    return { ...workflow, ...updates, updated_at: new Date().toISOString() };
  },
  deleteWorkflow: async () => ({ success: true }),

  getSources: async () => mockPipedream.sources,
  getSource: async (id: string) => mockPipedream.sources.find(s => s.id === id) || null,
  createSource: async (source: any) => ({
    id: `mock-source-${Date.now()}`,
    ...source,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }),
  updateSource: async (id: string, updates: any) => {
    const source = mockPipedream.sources.find(s => s.id === id);
    if (!source) return null;
    return { ...source, ...updates, updated_at: new Date().toISOString() };
  },
  deleteSource: async () => ({ success: true }),

  triggerWorkflow: async (id: string, data: any) => ({
    execution_id: `mock-execution-${Date.now()}`,
    workflow_id: id,
    status: 'success',
    data: data
  })
};

/**
 * Get mock service status
 * @returns Mock service status
 */
export function getMockServiceStatus() {
  return {
    surrealdb: {
      status: 'operational',
      message: 'Using mock SurrealDB service',
      responseTime: 10
    },
    minio: {
      status: 'operational',
      message: 'Using mock MinIO service',
      responseTime: 15
    },
    arangodb: {
      status: 'operational',
      message: 'Using mock ArangoDB service',
      responseTime: 12
    },
    temporal: {
      status: 'operational',
      message: 'Using mock Temporal service',
      responseTime: 18
    },
    llm: {
      status: 'operational',
      message: 'Using mock LLM API service',
      responseTime: 20
    },
    copilotkit: {
      status: 'operational',
      message: 'Using mock CopilotKit service',
      responseTime: 25
    },
    pipedream: {
      status: 'operational',
      message: 'Using mock Pipedream service',
      responseTime: 15
    },
    nango: {
      status: 'operational',
      message: 'Using mock Nango service',
      responseTime: 14
    }
  };
}
