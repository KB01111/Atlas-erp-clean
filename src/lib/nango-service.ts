/**
 * Nango integration service
 * 
 * This service provides functions for working with the Nango API
 * to connect to external services like Google Calendar, Google Drive,
 * Microsoft 365, and Slack.
 */

/**
 * Connection interface
 */
export interface NangoConnection {
  id: string;
  provider_name: string;
  connection_id: string;
  connection_config_id: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  last_used_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Provider interface
 */
export interface NangoProvider {
  name: string;
  provider: string;
  description: string;
  icon: string;
}

/**
 * Get all connections
 */
export async function getConnections(): Promise<NangoConnection[]> {
  try {
    // In a real implementation, we would call the Nango API
    // For now, we'll fetch from our local API
    const response = await fetch('/api/integrations/connections', {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch connections: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.connections || [];
  } catch (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
}

/**
 * Create a connection
 */
export async function createConnection(
  provider_name: string,
  connection_id: string,
  connection_config_id?: string
): Promise<NangoConnection | null> {
  try {
    // In a real implementation, we would call the Nango API
    // For now, we'll call our local API
    const response = await fetch('/api/integrations/connections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider_name,
        connection_id,
        connection_config_id: connection_config_id || provider_name,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create connection: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.connection || null;
  } catch (error) {
    console.error('Error creating connection:', error);
    return null;
  }
}

/**
 * Delete a connection
 */
export async function deleteConnection(connection_id: string): Promise<boolean> {
  try {
    // In a real implementation, we would call the Nango API
    // For now, we'll call our local API
    const response = await fetch(`/api/integrations/connections/${connection_id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete connection: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting connection:', error);
    return false;
  }
}

/**
 * Get supported providers
 */
export function getSupportedProviders(): NangoProvider[] {
  return [
    { 
      name: "Google Calendar", 
      provider: "google-calendar", 
      description: "Sync your calendar events with Atlas-ERP",
      icon: "/icons/google-calendar.svg" 
    },
    { 
      name: "Google Drive", 
      provider: "google-drive", 
      description: "Access your Google Drive files",
      icon: "/icons/google-drive.svg" 
    },
    { 
      name: "Microsoft 365", 
      provider: "microsoft-365", 
      description: "Connect to Microsoft 365 services",
      icon: "/icons/microsoft-365.svg" 
    },
    { 
      name: "Slack", 
      provider: "slack", 
      description: "Post updates to your Slack channels",
      icon: "/icons/slack.svg" 
    },
    { 
      name: "GitHub", 
      provider: "github", 
      description: "Access your GitHub repositories",
      icon: "/icons/github.svg" 
    },
    { 
      name: "Jira", 
      provider: "jira", 
      description: "Sync your Jira issues",
      icon: "/icons/jira.svg" 
    },
    { 
      name: "Salesforce", 
      provider: "salesforce", 
      description: "Connect to your Salesforce account",
      icon: "/icons/salesforce.svg" 
    },
    { 
      name: "HubSpot", 
      provider: "hubspot", 
      description: "Sync your HubSpot contacts and deals",
      icon: "/icons/hubspot.svg" 
    },
  ];
}

/**
 * Get provider by name
 */
export function getProviderByName(name: string): NangoProvider | null {
  const providers = getSupportedProviders();
  return providers.find(p => p.provider === name) || null;
}
