/**
 * Service Configuration
 * 
 * This module provides a unified way to access service configuration
 * from environment variables or other sources.
 */

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  [key: string]: unknown;
}

/**
 * Get configuration for a specific service
 * @param serviceName The service name
 * @returns The service configuration
 */
export async function getServiceConfig(serviceName: string): Promise<ServiceConfig> {
  switch (serviceName.toLowerCase()) {
    case 'surrealdb':
      return {
        url: process.env.SURREAL_URL || 'http://localhost:8000',
        namespace: process.env.SURREAL_NS || 'atlas',
        database: process.env.SURREAL_DB || 'erp',
        username: process.env.SURREAL_USER || 'root',
        password: process.env.SURREAL_PASS || 'root',
      };
      
    case 'arangodb':
      return {
        url: process.env.ARANGO_URL || 'http://localhost:8529',
        database: process.env.ARANGO_DB || 'atlas_knowledge',
        username: process.env.ARANGO_USER || 'root',
        password: process.env.ARANGO_PASS || process.env.ARANGO_ROOT_PASSWORD || 'atlas',
      };
      
    case 'minio':
      return {
        endpoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000', 10),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        bucket: process.env.MINIO_BUCKET || 'atlas-erp',
      };
      
    case 'temporal':
      return {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      };
      
    case 'llm':
      return {
        provider: process.env.LLM_PROVIDER || 'openai',
        model: process.env.LLM_MODEL || 'gpt-4o',
        apiKey: process.env.LLM_API_KEY,
        apiBase: process.env.LLM_API_BASE,
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
        maxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS, 10) : undefined,
        maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3', 10),
        fallbackProvider: process.env.LLM_FALLBACK_PROVIDER,
        fallbackModel: process.env.LLM_FALLBACK_MODEL,
        fallbackApiKey: process.env.LLM_FALLBACK_API_KEY,
      };
      
    case 'pipedream':
      return {
        apiKey: process.env.PIPEDREAM_API_KEY,
        baseUrl: process.env.PIPEDREAM_API_URL || 'https://api.pipedream.com/v1',
        orgId: process.env.PIPEDREAM_ORG_ID,
        workspaceId: process.env.PIPEDREAM_WORKSPACE_ID,
      };
      
    default:
      throw new Error(`Unknown service: ${serviceName}`);
  }
}

/**
 * Update the mock service provider with a new mock implementation
 * @param mockServiceProvider The mock service provider module
 * @param serviceName The service name
 * @param mockImplementation The mock implementation
 */
export function addMockService(
  mockServiceProvider: unknown,
  serviceName: string,
  mockImplementation: unknown
) {
  mockServiceProvider[`mock${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}`] = mockImplementation;
  
  // Update the mock service status
  const currentStatus = mockServiceProvider.getMockServiceStatus();
  currentStatus[serviceName.toLowerCase()] = {
    status: 'operational',
    message: `Using mock ${serviceName} service`,
    responseTime: Math.floor(Math.random() * 20) + 10,
  };
}

const defaultExport = {
  getServiceConfig,
  addMockService,
};
export default defaultExport;;
