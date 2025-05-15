/**
 * Nango API client for Atlas-ERP
 * 
 * This module provides a client for interacting with the Nango API.
 * It handles authentication, error handling, and provides methods for
 * managing connections.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { isServiceAvailable } from './mock-service-provider';

// Define types for Nango API responses
export interface NangoConnection {
  id: number;
  connection_id: string;
  provider: string;
  provider_config_key: string;
  created: string;
  metadata: Record<string, any> | null;
  errors: Array<{ type: string; log_id: string }>;
  end_user?: {
    id: string;
    email?: string;
    organization?: {
      id: string;
    };
  };
}

export interface NangoConnectionsResponse {
  connections: NangoConnection[];
}

export interface NangoConnectionResponse {
  id: number;
  created_at: string;
  updated_at: string;
  provider_config_key: string;
  connection_id: string;
  credentials: {
    type: string;
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
    raw: Record<string, any>;
  };
  connection_config?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface NangoCreateConnectionRequest {
  connection_id: string;
  provider_config_key: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  expires_in?: number;
  no_expiration?: boolean;
  oauth_client_id_override?: string;
  oauth_client_secret_override?: string;
  oauth_token?: string;
  oauth_token_secret?: string;
  metadata?: Record<string, any>;
  connection_config?: Record<string, any>;
  username?: string;
  password?: string;
  api_key?: string;
}

/**
 * Nango API client
 */
class NangoClient {
  private client: AxiosInstance;
  private isAvailable: boolean | null = null;
  private baseUrl: string;
  private secretKey: string;

  constructor() {
    this.baseUrl = process.env.NANGO_API_URL || 'https://api.nango.dev';
    this.secretKey = process.env.NANGO_SECRET_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if the Nango API is available
   */
  async checkAvailability(): Promise<boolean> {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }

    try {
      this.isAvailable = await isServiceAvailable(this.baseUrl);
      return this.isAvailable;
    } catch (error) {
      console.error('Error checking Nango API availability:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * List all connections
   */
  async listConnections(): Promise<NangoConnectionsResponse> {
    try {
      const response = await this.client.get<NangoConnectionsResponse>('/connection');
      return response.data;
    } catch (error) {
      this.handleError(error as Error, 'Failed to list connections');
      return { connections: [] };
    }
  }

  /**
   * Get a connection by ID
   */
  async getConnection(providerConfigKey: string, connectionId: string): Promise<NangoConnectionResponse | null> {
    try {
      const response = await this.client.get<NangoConnectionResponse>(
        `/connection/${connectionId}?provider_config_key=${providerConfigKey}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error as Error, `Failed to get connection ${connectionId}`);
      return null;
    }
  }

  /**
   * Create a new connection
   */
  async createConnection(data: NangoCreateConnectionRequest): Promise<NangoConnectionResponse | null> {
    try {
      const response = await this.client.post<NangoConnectionResponse>('/connection', data);
      return response.data;
    } catch (error) {
      this.handleError(error as Error, 'Failed to create connection');
      return null;
    }
  }

  /**
   * Delete a connection
   */
  async deleteConnection(providerConfigKey: string, connectionId: string): Promise<boolean> {
    try {
      await this.client.delete(`/connection/${connectionId}?provider_config_key=${providerConfigKey}`);
      return true;
    } catch (error) {
      this.handleError(error as Error, `Failed to delete connection ${connectionId}`);
      return false;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: Error, message: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`${message}: ${axiosError.message}`, {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
    } else {
      console.error(`${message}: ${error.message}`);
    }
  }
}

// Create a singleton instance
const nangoClient = new NangoClient();

export default nangoClient;
