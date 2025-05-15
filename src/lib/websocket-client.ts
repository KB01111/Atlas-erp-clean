/**
 * WebSocket Client Implementation
 * 
 * This module provides a WebSocket client implementation for real-time updates
 * in the Atlas-ERP application. It uses the Socket.IO client library to handle
 * WebSocket connections and provides a simple API for receiving updates from the server.
 */

import { io, Socket } from 'socket.io-client';
import { 
  EventType, 
  StatusUpdate, 
  MetricsUpdate, 
  AgentProgressUpdate, 
  WorkflowProgressUpdate,
  DocumentProcessingUpdate,
  KnowledgeGraphUpdate
} from './websocket-server';

// Singleton instance of the WebSocket client
let socket: Socket | null = null;

// Event listeners
const eventListeners: Record<string, Function[]> = {};

/**
 * Initialize the WebSocket client
 * @returns Socket.IO client instance
 */
export function initWebSocketClient(): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  // Create a new Socket.IO client
  socket = io({
    path: '/api/websocket',
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Handle connection events
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  socket.on('disconnect', (reason) => {
    console.log(`Disconnected from WebSocket server: ${reason}`);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  // Set up event listeners for different event types
  socket.on(EventType.STATUS_UPDATE, (update: StatusUpdate) => {
    triggerEventListeners(EventType.STATUS_UPDATE, update);
  });

  socket.on(EventType.METRICS_UPDATE, (update: MetricsUpdate) => {
    triggerEventListeners(EventType.METRICS_UPDATE, update);
  });

  socket.on(EventType.AGENT_PROGRESS, (update: AgentProgressUpdate) => {
    triggerEventListeners(EventType.AGENT_PROGRESS, update);
  });

  socket.on(EventType.WORKFLOW_PROGRESS, (update: WorkflowProgressUpdate) => {
    triggerEventListeners(EventType.WORKFLOW_PROGRESS, update);
  });

  socket.on(EventType.DOCUMENT_PROCESSING, (update: DocumentProcessingUpdate) => {
    triggerEventListeners(EventType.DOCUMENT_PROCESSING, update);
  });

  socket.on(EventType.KNOWLEDGE_GRAPH_UPDATE, (update: KnowledgeGraphUpdate) => {
    triggerEventListeners(EventType.KNOWLEDGE_GRAPH_UPDATE, update);
  });

  return socket;
}

/**
 * Get the WebSocket client instance
 * @returns Socket.IO client instance
 */
export function getWebSocketClient(): Socket | null {
  return socket;
}

/**
 * Subscribe to a room to receive specific updates
 * @param room Room name
 */
export function subscribeToRoom(room: string): void {
  if (!socket) {
    console.warn('WebSocket client not initialized');
    return;
  }

  socket.emit('subscribe', room);
}

/**
 * Unsubscribe from a room
 * @param room Room name
 */
export function unsubscribeFromRoom(room: string): void {
  if (!socket) {
    console.warn('WebSocket client not initialized');
    return;
  }

  socket.emit('unsubscribe', room);
}

/**
 * Add an event listener for a specific event type
 * @param eventType Event type
 * @param listener Event listener function
 */
export function addEventListener(eventType: EventType, listener: Function): void {
  if (!eventListeners[eventType]) {
    eventListeners[eventType] = [];
  }

  eventListeners[eventType].push(listener);
}

/**
 * Remove an event listener for a specific event type
 * @param eventType Event type
 * @param listener Event listener function
 */
export function removeEventListener(eventType: EventType, listener: Function): void {
  if (!eventListeners[eventType]) {
    return;
  }

  const index = eventListeners[eventType].indexOf(listener);
  if (index !== -1) {
    eventListeners[eventType].splice(index, 1);
  }
}

/**
 * Trigger event listeners for a specific event type
 * @param eventType Event type
 * @param data Event data
 */
function triggerEventListeners(eventType: EventType, data: any): void {
  if (!eventListeners[eventType]) {
    return;
  }

  for (const listener of eventListeners[eventType]) {
    try {
      listener(data);
    } catch (error) {
      console.error(`Error in ${eventType} event listener:`, error);
    }
  }
}

/**
 * React hook for using WebSocket events
 * @param eventType Event type
 * @param callback Callback function
 */
export function useWebSocketEvent<T>(eventType: EventType, callback: (data: T) => void): void {
  // Initialize the WebSocket client if it's not already initialized
  if (!socket) {
    initWebSocketClient();
  }

  // Add the event listener when the component mounts
  addEventListener(eventType, callback);

  // Return a cleanup function to remove the event listener when the component unmounts
  return () => {
    removeEventListener(eventType, callback);
  };
}

/**
 * React hook for subscribing to a specific agent's updates
 * @param agentId Agent ID
 * @param callback Callback function
 */
export function useAgentUpdates(agentId: string, callback: (update: AgentProgressUpdate) => void): void {
  // Initialize the WebSocket client if it's not already initialized
  if (!socket) {
    initWebSocketClient();
  }

  // Subscribe to the agent's room
  subscribeToRoom(`agent-${agentId}`);

  // Add the event listener
  const listener = (update: AgentProgressUpdate) => {
    if (update.agentId === agentId) {
      callback(update);
    }
  };

  addEventListener(EventType.AGENT_PROGRESS, listener);

  // Return a cleanup function
  return () => {
    unsubscribeFromRoom(`agent-${agentId}`);
    removeEventListener(EventType.AGENT_PROGRESS, listener);
  };
}

/**
 * React hook for subscribing to a specific workflow's updates
 * @param workflowId Workflow ID
 * @param callback Callback function
 */
export function useWorkflowUpdates(workflowId: string, callback: (update: WorkflowProgressUpdate) => void): void {
  // Initialize the WebSocket client if it's not already initialized
  if (!socket) {
    initWebSocketClient();
  }

  // Subscribe to the workflow's room
  subscribeToRoom(`workflow-${workflowId}`);

  // Add the event listener
  const listener = (update: WorkflowProgressUpdate) => {
    if (update.workflowId === workflowId) {
      callback(update);
    }
  };

  addEventListener(EventType.WORKFLOW_PROGRESS, listener);

  // Return a cleanup function
  return () => {
    unsubscribeFromRoom(`workflow-${workflowId}`);
    removeEventListener(EventType.WORKFLOW_PROGRESS, listener);
  };
}
