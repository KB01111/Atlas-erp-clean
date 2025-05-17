/**
 * Pipedream API client for Atlas-ERP
 *
 * This client provides methods for interacting with the Pipedream API
 * to create and manage workflows, sources, and destinations.
 *
 * Pipedream is a platform for connecting APIs and building workflows.
 * It can be used to collect data from external sources and process it
 * for use in Atlas-ERP dashboards and AI agents.
 */

import { getServiceConfig } from './service-config';
import { isServiceAvailable, mockPipedream } from './mock-service-provider';

/**
 * Pipedream workflow interface
 */
export interface PipedreamWorkflow {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  orgId?: string;
  workspaceId?: string;
  steps?: unknown[];
  settings?: unknown;
  metadata?: Record<string, any>;
}

/**
 * Pipedream source interface
 */
export interface PipedreamSource {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  type: string;
  key?: string;
  settings?: unknown;
  metadata?: Record<string, any>;
}

/**
 * Pipedream webhook event interface
 */
export interface PipedreamWebhookEvent {
  id: string;
  timestamp: string;
  workflowId: string;
  sourceId?: string;
  data: unknown;
  metadata?: Record<string, any>;
}

/**
 * Pipedream client configuration
 */
export interface PipedreamClientConfig {
  apiKey: string;
  baseUrl?: string;
  orgId?: string;
  workspaceId?: string;
}

/**
 * Pipedream client class
 */
export class PipedreamClient {
  private apiKey: string;
  private baseUrl: string;
  private orgId?: string;
  private workspaceId?: string;

  /**
   * Create a new Pipedream client
   * @param config Client configuration
   */
  constructor(config: PipedreamClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.pipedream.com/v1';
    this.orgId = config.orgId;
    this.workspaceId = config.workspaceId;
  }

  /**
   * Make a request to the Pipedream API
   * @param path API path
   * @param method HTTP method
   * @param data Request data
   * @returns Response data
   */
  private async request<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pipedream API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return result as T;
    } catch (error) {
      console.error('Pipedream API request failed:', error);
      throw error;
    }
  }

  /**
   * Get all workflows
   * @returns List of workflows
   */
  async getWorkflows(): Promise<PipedreamWorkflow[]> {
    const path = '/workflows';
    return this.request<PipedreamWorkflow[]>(path);
  }

  /**
   * Get a workflow by ID
   * @param id Workflow ID
   * @returns Workflow details
   */
  async getWorkflow(id: string): Promise<PipedreamWorkflow> {
    const path = `/workflows/${id}`;
    return this.request<PipedreamWorkflow>(path);
  }

  /**
   * Create a new workflow
   * @param workflow Workflow data
   * @returns Created workflow
   */
  async createWorkflow(workflow: Partial<PipedreamWorkflow>): Promise<PipedreamWorkflow> {
    const path = '/workflows';
    return this.request<PipedreamWorkflow>(path, 'POST', workflow);
  }

  /**
   * Update a workflow
   * @param id Workflow ID
   * @param updates Workflow updates
   * @returns Updated workflow
   */
  async updateWorkflow(id: string, updates: Partial<PipedreamWorkflow>): Promise<PipedreamWorkflow> {
    const path = `/workflows/${id}`;
    return this.request<PipedreamWorkflow>(path, 'PUT', updates);
  }

  /**
   * Delete a workflow
   * @param id Workflow ID
   * @returns Success status
   */
  async deleteWorkflow(id: string): Promise<{ success: boolean }> {
    const path = `/workflows/${id}`;
    return this.request<{ success: boolean }>(path, 'DELETE');
  }

  /**
   * Get all sources
   * @returns List of sources
   */
  async getSources(): Promise<PipedreamSource[]> {
    const path = '/sources';
    return this.request<PipedreamSource[]>(path);
  }

  /**
   * Get a source by ID
   * @param id Source ID
   * @returns Source details
   */
  async getSource(id: string): Promise<PipedreamSource> {
    const path = `/sources/${id}`;
    return this.request<PipedreamSource>(path);
  }

  /**
   * Create a new source
   * @param source Source data
   * @returns Created source
   */
  async createSource(source: Partial<PipedreamSource>): Promise<PipedreamSource> {
    const path = '/sources';
    return this.request<PipedreamSource>(path, 'POST', source);
  }

  /**
   * Update a source
   * @param id Source ID
   * @param updates Source updates
   * @returns Updated source
   */
  async updateSource(id: string, updates: Partial<PipedreamSource>): Promise<PipedreamSource> {
    const path = `/sources/${id}`;
    return this.request<PipedreamSource>(path, 'PUT', updates);
  }

  /**
   * Delete a source
   * @param id Source ID
   * @returns Success status
   */
  async deleteSource(id: string): Promise<{ success: boolean }> {
    const path = `/sources/${id}`;
    return this.request<{ success: boolean }>(path, 'DELETE');
  }

  /**
   * Trigger a workflow
   * @param id Workflow ID
   * @param data Trigger data
   * @returns Execution details
   */
  async triggerWorkflow(id: string, data: unknown): Promise<any> {
    const path = `/workflows/${id}/trigger`;
    return this.request<any>(path, 'POST', data);
  }
}

/**
 * Create a Pipedream client instance from environment configuration
 * @returns Pipedream client
 */
export async function createPipedreamClient(): Promise<PipedreamClient> {
  try {
    const config = await getServiceConfig('pipedream');

    if (!config.apiKey) {
      throw new Error('Pipedream API key not found in configuration');
    }

    return new PipedreamClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      orgId: config.orgId,
      workspaceId: config.workspaceId,
    });
  } catch (error) {
    console.error('Failed to create Pipedream client:', error);
    throw error;
  }
}

const defaultExport = {
  createPipedreamClient,
  PipedreamClient,
};
export default defaultExport;;
