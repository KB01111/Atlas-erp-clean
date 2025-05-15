/**
 * Tests for the Nango connections API
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/integrations/connections/route';
import { DELETE } from '@/app/api/integrations/connections/[connectionId]/route';
import nangoClient from '@/lib/nango-client';
import { mockNango } from '@/lib/mock-service-provider';

// Mock the Nango client
jest.mock('@/lib/nango-client', () => ({
  __esModule: true,
  default: {
    checkAvailability: jest.fn(),
    listConnections: jest.fn(),
    getConnection: jest.fn(),
    createConnection: jest.fn(),
    deleteConnection: jest.fn(),
  },
}));

// Mock the mock-service-provider
jest.mock('@/lib/mock-service-provider', () => ({
  mockNango: {
    listConnections: jest.fn(),
    getConnection: jest.fn(),
    createConnection: jest.fn(),
    deleteConnection: jest.fn(),
  },
}));

describe('Nango Connections API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/integrations/connections', () => {
    it('should return connections from Nango API when available', async () => {
      // Mock Nango API availability
      (nangoClient.checkAvailability as jest.Mock).mockResolvedValue(true);
      
      // Mock Nango API response
      (nangoClient.listConnections as jest.Mock).mockResolvedValue({
        connections: [
          {
            id: 1,
            connection_id: 'test-connection',
            provider: 'test-provider',
            provider_config_key: 'test-provider-config',
            created: new Date().toISOString(),
            metadata: null,
            errors: [],
          },
        ],
      });
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/integrations/connections');
      
      // Call the API
      const response = await GET(request);
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(data.connections).toHaveLength(1);
      expect(data.connections[0].connection_id).toBe('test-connection');
      expect(data.useMockService).toBe(false);
      
      // Verify the Nango client was called
      expect(nangoClient.checkAvailability).toHaveBeenCalled();
      expect(nangoClient.listConnections).toHaveBeenCalled();
    });
    
    it('should return connections from mock service when Nango API is not available', async () => {
      // Mock Nango API unavailability
      (nangoClient.checkAvailability as jest.Mock).mockResolvedValue(false);
      
      // Mock mock service response
      (mockNango.listConnections as jest.Mock).mockResolvedValue({
        connections: [
          {
            id: 1,
            connection_id: 'mock-connection',
            provider: 'mock-provider',
            provider_config_key: 'mock-provider-config',
            created: new Date().toISOString(),
            metadata: null,
            errors: [],
          },
        ],
      });
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/integrations/connections');
      
      // Call the API
      const response = await GET(request);
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(data.connections).toHaveLength(1);
      expect(data.connections[0].connection_id).toBe('mock-connection');
      expect(data.useMockService).toBe(true);
      
      // Verify the Nango client was called
      expect(nangoClient.checkAvailability).toHaveBeenCalled();
      expect(nangoClient.listConnections).not.toHaveBeenCalled();
      expect(mockNango.listConnections).toHaveBeenCalled();
    });
  });
  
  describe('POST /api/integrations/connections', () => {
    it('should create a connection using Nango API when available', async () => {
      // Mock Nango API availability
      (nangoClient.checkAvailability as jest.Mock).mockResolvedValue(true);
      
      // Mock Nango API response
      (nangoClient.createConnection as jest.Mock).mockResolvedValue({
        id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        provider_config_key: 'test-provider',
        connection_id: 'test-connection',
        credentials: {
          type: 'OAUTH2',
          access_token: 'test-token',
          refresh_token: 'test-refresh-token',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          raw: {},
        },
      });
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/integrations/connections', {
        method: 'POST',
        body: JSON.stringify({
          provider_name: 'test-provider',
          connection_id: 'test-connection',
          access_token: 'test-token',
          refresh_token: 'test-refresh-token',
        }),
      });
      
      // Call the API
      const response = await POST(request);
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(data.connection.connection_id).toBe('test-connection');
      expect(data.useMockService).toBe(false);
      
      // Verify the Nango client was called
      expect(nangoClient.checkAvailability).toHaveBeenCalled();
      expect(nangoClient.createConnection).toHaveBeenCalledWith(expect.objectContaining({
        connection_id: 'test-connection',
        provider_config_key: 'test-provider',
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
      }));
    });
  });
  
  describe('DELETE /api/integrations/connections/[connectionId]', () => {
    it('should delete a connection using Nango API when available', async () => {
      // Mock Nango API availability
      (nangoClient.checkAvailability as jest.Mock).mockResolvedValue(true);
      
      // Mock Nango API response
      (nangoClient.deleteConnection as jest.Mock).mockResolvedValue(true);
      
      // Create a mock request with URL params
      const request = new NextRequest(
        'http://localhost:3000/api/integrations/connections/test-connection?provider_config_key=test-provider'
      );
      
      // Call the API
      const response = await DELETE(request, { params: { connectionId: 'test-connection' } });
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.useMockService).toBe(false);
      
      // Verify the Nango client was called
      expect(nangoClient.checkAvailability).toHaveBeenCalled();
      expect(nangoClient.deleteConnection).toHaveBeenCalledWith('test-provider', 'test-connection');
    });
  });
});
