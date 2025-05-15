/**
 * Tests for the Nango client
 */

import axios from 'axios';
import nangoClient from '@/lib/nango-client';
import { isServiceAvailable } from '@/lib/mock-service-provider';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  })),
  isAxiosError: jest.fn(),
}));

// Mock isServiceAvailable
jest.mock('@/lib/mock-service-provider', () => ({
  isServiceAvailable: jest.fn(),
}));

describe('Nango Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should return true when Nango API is available', async () => {
      // Mock isServiceAvailable to return true
      (isServiceAvailable as jest.Mock).mockResolvedValue(true);
      
      // Call the method
      const result = await nangoClient.checkAvailability();
      
      // Verify the result
      expect(result).toBe(true);
      expect(isServiceAvailable).toHaveBeenCalled();
    });
    
    it('should return false when Nango API is not available', async () => {
      // Mock isServiceAvailable to return false
      (isServiceAvailable as jest.Mock).mockResolvedValue(false);
      
      // Call the method
      const result = await nangoClient.checkAvailability();
      
      // Verify the result
      expect(result).toBe(false);
      expect(isServiceAvailable).toHaveBeenCalled();
    });
    
    it('should cache the availability result', async () => {
      // Mock isServiceAvailable to return true
      (isServiceAvailable as jest.Mock).mockResolvedValue(true);
      
      // Call the method twice
      await nangoClient.checkAvailability();
      await nangoClient.checkAvailability();
      
      // Verify isServiceAvailable was called only once
      expect(isServiceAvailable).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('listConnections', () => {
    it('should return connections when API call succeeds', async () => {
      // Mock axios get to return connections
      const mockConnections = {
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
      };
      
      const axiosInstance = axios.create();
      (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockConnections });
      
      // Call the method
      const result = await nangoClient.listConnections();
      
      // Verify the result
      expect(result).toEqual(mockConnections);
      expect(axiosInstance.get).toHaveBeenCalledWith('/connection');
    });
    
    it('should return empty connections array when API call fails', async () => {
      // Mock axios get to throw an error
      const axiosInstance = axios.create();
      (axiosInstance.get as jest.Mock).mockRejectedValue(new Error('API error'));
      
      // Call the method
      const result = await nangoClient.listConnections();
      
      // Verify the result
      expect(result).toEqual({ connections: [] });
      expect(axiosInstance.get).toHaveBeenCalledWith('/connection');
    });
  });
  
  describe('getConnection', () => {
    it('should return a connection when API call succeeds', async () => {
      // Mock axios get to return a connection
      const mockConnection = {
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
      };
      
      const axiosInstance = axios.create();
      (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockConnection });
      
      // Call the method
      const result = await nangoClient.getConnection('test-provider', 'test-connection');
      
      // Verify the result
      expect(result).toEqual(mockConnection);
      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/connection/test-connection?provider_config_key=test-provider'
      );
    });
    
    it('should return null when API call fails', async () => {
      // Mock axios get to throw an error
      const axiosInstance = axios.create();
      (axiosInstance.get as jest.Mock).mockRejectedValue(new Error('API error'));
      
      // Call the method
      const result = await nangoClient.getConnection('test-provider', 'test-connection');
      
      // Verify the result
      expect(result).toBeNull();
      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/connection/test-connection?provider_config_key=test-provider'
      );
    });
  });
  
  describe('createConnection', () => {
    it('should create a connection when API call succeeds', async () => {
      // Mock axios post to return a connection
      const mockConnection = {
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
      };
      
      const axiosInstance = axios.create();
      (axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockConnection });
      
      // Call the method
      const connectionData = {
        connection_id: 'test-connection',
        provider_config_key: 'test-provider',
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
      };
      
      const result = await nangoClient.createConnection(connectionData);
      
      // Verify the result
      expect(result).toEqual(mockConnection);
      expect(axiosInstance.post).toHaveBeenCalledWith('/connection', connectionData);
    });
  });
});
