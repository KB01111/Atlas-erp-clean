/**
 * WebSocket Server Implementation
 *
 * This module provides a WebSocket server implementation for real-time updates
 * in the Atlas-ERP application. It uses the Socket.IO library to handle WebSocket
 * connections and provides a simple API for sending updates to connected clients.
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiResponse } from 'next';

// Define event types for type safety
export enum EventType {
  STATUS_UPDATE = 'status-update',
  METRICS_UPDATE = 'metrics-update',
  AGENT_PROGRESS = 'agent-progress',
  WORKFLOW_PROGRESS = 'workflow-progress',
  DOCUMENT_PROCESSING = 'document-processing',
  KNOWLEDGE_GRAPH_UPDATE = 'knowledge-graph-update',
}

// Define the structure of a status update
export interface StatusUpdate {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  message?: string;
  timestamp: string;
  responseTime?: number;
}

// Define the structure of a metrics update
export interface MetricsUpdate {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: string;
}

// Define the structure of an agent progress update
export interface AgentProgressUpdate {
  agentId: string;
  runId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  timestamp: string;
}

// Define the structure of a workflow progress update
export interface WorkflowProgressUpdate {
  workflowId: string;
  executionId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  currentNode?: string;
  message: string;
  timestamp: string;
}

// Define the structure of a document processing update
export interface DocumentProcessingUpdate {
  documentId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  timestamp: string;
}

// Define the structure of a knowledge graph update
export interface KnowledgeGraphUpdate {
  type: 'node-added' | 'node-updated' | 'node-removed' | 'edge-added' | 'edge-updated' | 'edge-removed';
  nodeId?: string;
  edgeId?: string;
  timestamp: string;
}

// Singleton instance of the WebSocket server
let io: SocketIOServer | null = null;

/**
 * Initialize the WebSocket server
 * @param server HTTP server instance
 * @returns Socket.IO server instance
 */
export function initWebSocketServer(server: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  try {
    // Try to get the existing Socket.IO server from the global scope
    // This is set in server.js
    const globalAny = global as unknown;
    if (globalAny.__ATLAS_ERP_IO) {
      io = globalAny.__ATLAS_ERP_IO;
      console.log('Using existing WebSocket server from server.js');
      return io;
    }

    // Create a new Socket.IO server if not found
    io = new SocketIOServer(server, {
      path: '/api/websocket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Store the Socket.IO server in the global scope
    globalAny.__ATLAS_ERP_IO = io;

    // Handle new connections
    io.on('connection', (socket) => {
      console.log(`New client connected: ${socket.id}`);

      // Handle disconnections
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });

      // Handle room subscriptions
      socket.on('subscribe', (room) => {
        socket.join(room);
        console.log(`Client ${socket.id} joined room: ${room}`);
      });

      // Handle room unsubscriptions
      socket.on('unsubscribe', (room) => {
        socket.leave(room);
        console.log(`Client ${socket.id} left room: ${room}`);
      });
    });

    console.log('WebSocket server initialized');
    return io;
  } catch (error) {
    console.error('Error initializing WebSocket server:', error);
    throw error;
  }
}

/**
 * Get the WebSocket server instance
 * @returns Socket.IO server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Send a status update to all connected clients
 * @param update Status update
 */
export function sendStatusUpdate(update: StatusUpdate): void {
  // Try to get the WebSocket server from the global scope
  const globalAny = global as unknown;
  const socketIo = io || globalAny.__ATLAS_ERP_IO;

  if (!socketIo) {
    console.warn('WebSocket server not initialized');
    return;
  }

  socketIo.emit(EventType.STATUS_UPDATE, update);
}

/**
 * Send a metrics update to all connected clients
 * @param update Metrics update
 */
export function sendMetricsUpdate(update: MetricsUpdate): void {
  // Try to get the WebSocket server from the global scope
  const globalAny = global as unknown;
  const socketIo = io || globalAny.__ATLAS_ERP_IO;

  if (!socketIo) {
    console.warn('WebSocket server not initialized');
    return;
  }

  socketIo.emit(EventType.METRICS_UPDATE, update);
}

/**
 * Send an agent progress update to all connected clients
 * @param update Agent progress update
 */
export function sendAgentProgressUpdate(update: AgentProgressUpdate): void {
  // Try to get the WebSocket server from the global scope
  const globalAny = global as unknown;
  const socketIo = io || globalAny.__ATLAS_ERP_IO;

  if (!socketIo) {
    console.warn('WebSocket server not initialized');
    return;
  }

  // Emit to all clients
  socketIo.emit(EventType.AGENT_PROGRESS, update);

  // Also emit to the specific agent room
  socketIo.to(`agent-${update.agentId}`).emit(EventType.AGENT_PROGRESS, update);
}

/**
 * Send a workflow progress update to all connected clients
 * @param update Workflow progress update
 */
export function sendWorkflowProgressUpdate(update: WorkflowProgressUpdate): void {
  // Try to get the WebSocket server from the global scope
  const globalAny = global as unknown;
  const socketIo = io || globalAny.__ATLAS_ERP_IO;

  if (!socketIo) {
    console.warn('WebSocket server not initialized');
    return;
  }

  // Emit to all clients
  socketIo.emit(EventType.WORKFLOW_PROGRESS, update);

  // Also emit to the specific workflow room
  socketIo.to(`workflow-${update.workflowId}`).emit(EventType.WORKFLOW_PROGRESS, update);
}

/**
 * Send a document processing update to all connected clients
 * @param update Document processing update
 */
export function sendDocumentProcessingUpdate(update: DocumentProcessingUpdate): void {
  // Try to get the WebSocket server from the global scope
  const globalAny = global as unknown;
  const socketIo = io || globalAny.__ATLAS_ERP_IO;

  if (!socketIo) {
    console.warn('WebSocket server not initialized');
    return;
  }

  // Emit to all clients
  socketIo.emit(EventType.DOCUMENT_PROCESSING, update);

  // Also emit to the specific document room
  socketIo.to(`document-${update.documentId}`).emit(EventType.DOCUMENT_PROCESSING, update);
}

/**
 * Send a knowledge graph update to all connected clients
 * @param update Knowledge graph update
 */
export function sendKnowledgeGraphUpdate(update: KnowledgeGraphUpdate): void {
  // Try to get the WebSocket server from the global scope
  const globalAny = global as unknown;
  const socketIo = io || globalAny.__ATLAS_ERP_IO;

  if (!socketIo) {
    console.warn('WebSocket server not initialized');
    return;
  }

  socketIo.emit(EventType.KNOWLEDGE_GRAPH_UPDATE, update);
}

/**
 * Generic function to send a WebSocket message
 * @param message Message to send
 * @param room Optional room to send the message to
 */
export function sendWebSocketMessage(message: unknown, room?: string): void {
  // Try to get the WebSocket server from the global scope
  const globalAny = global as unknown;
  const socketIo = io || globalAny.__ATLAS_ERP_IO;

  if (!socketIo) {
    console.warn('WebSocket server not initialized');
    return;
  }

  // Emit to all clients
  socketIo.emit(message.type || 'message', message);

  // Also emit to the specific room if provided
  if (room) {
    socketIo.to(room).emit(message.type || 'message', message);
  }
}
