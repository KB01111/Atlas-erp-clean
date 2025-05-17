/**
 * Browser-compatible Socket.IO Client Wrapper
 *
 * This module provides a browser-compatible wrapper for the Socket.IO client
 * that doesn't rely on Node.js modules like 'fs', 'net', etc.
 */

import { io as socketIOClient, Socket } from 'socket.io-client';
import { EventType } from './websocket-server';

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

  // Create a new Socket.IO client with browser-compatible options
  try {
    socket = socketIOClient({
      path: '/api/websocket',
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'], // Explicitly specify transports
      autoConnect: true, // Ensure auto-connection is enabled
    });
    console.log("Socket.IO client initialized");
  } catch (error) {
    console.error("Failed to initialize Socket.IO client:", error);
    // Create a mock socket to prevent errors
    socket = {
      connected: false,
      on: () => {},
      emit: () => {},
      disconnect: () => {},
      off: () => {},
    } as unknown as Socket;
  }

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
export function addEventListener(eventType: EventType, listener: (...args: unknown[]) => any): void {
  if (!eventListeners[eventType]) {
    eventListeners[eventType] = [];
  }

  eventListeners[eventType].push(listener);

  // If socket exists, add the listener to the socket
  if (socket) {
    socket.on(eventType, (data: unknown) => {
      listener(data);
    });
  }
}

/**
 * Remove an event listener for a specific event type
 * @param eventType Event type
 * @param listener Event listener function
 */
export function removeEventListener(eventType: EventType, listener: (...args: unknown[]) => any): void {
  if (!eventListeners[eventType]) {
    return;
  }

  const index = eventListeners[eventType].indexOf(listener);
  if (index !== -1) {
    eventListeners[eventType].splice(index, 1);
  }

  // If socket exists, remove the listener
  if (socket) {
    socket.off(eventType);

    // Re-add remaining listeners
    for (const remainingListener of eventListeners[eventType]) {
      socket.on(eventType, (data: unknown) => {
        remainingListener(data);
      });
    }
  }
}

/**
 * Trigger event listeners for a specific event type
 * @param eventType Event type
 * @param data Event data
 */
function triggerEventListeners(eventType: EventType, data: unknown): void {
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

// Re-export EventType and other types from websocket-server
export { EventType };
export type {
  StatusUpdate,
  MetricsUpdate,
  AgentProgressUpdate,
  WorkflowProgressUpdate,
  DocumentProcessingUpdate,
  KnowledgeGraphUpdate
} from './websocket-server';
