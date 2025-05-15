import { v4 as uuidv4 } from 'uuid';
import {
  Message,
  MessagePart,
  MessageSchema,
  MessagePartSchema
} from '../validation/schemas';

/**
 * A2A Message Type enum
 */
export enum A2AMessageType {
  SYSTEM = 'system',
  USER_MESSAGE = 'user_message',
  ASSISTANT_MESSAGE = 'assistant_message',
  ERROR = 'error',
  FUNCTION_CALL = 'function_call',
  FUNCTION_RESPONSE = 'function_response',
}

/**
 * A2A Message Role enum
 */
export enum A2AMessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function',
}

/**
 * A2A Message interface
 */
export interface A2AMessage {
  id?: string;
  type: A2AMessageType;
  role: A2AMessageRole;
  content: string;
  name?: string;
  timestamp?: string;
}

/**
 * Run status enum
 */
export enum RunStatus {
  CREATED = 'created',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  AWAITING = 'awaiting',
}

/**
 * Run mode enum
 */
export enum RunMode {
  SYNC = 'sync',
  ASYNC = 'async',
  STREAM = 'stream',
}

/**
 * Run request interface
 */
export interface RunRequest {
  agentName: string;
  input: Message[];
  mode: RunMode;
  sessionId?: string;
}

/**
 * Run response interface
 */
export interface RunResponse {
  runId: string;
  agentName: string;
  status: RunStatus;
  output?: Message[];
  error?: string;
  sessionId?: string;
}

/**
 * Run event interface
 */
export interface RunEvent {
  type: string;
  timestamp: string;
  run: RunResponse;
  data?: any;
}

/**
 * Create a new message
 * @param content The content of the message
 * @param contentType The content type (default: text/plain)
 * @returns A new message
 */
export function createTextMessage(content: string, contentType: string = 'text/plain'): Message {
  const messagePart: MessagePart = {
    contentType,
    content,
  };

  // Validate the message part
  const validatedPart = MessagePartSchema.parse(messagePart);

  return {
    parts: [validatedPart],
  };
}

/**
 * Create a new A2A message
 * @param params The message parameters
 * @returns A new A2A message
 */
export function createMessage(params: {
  type: A2AMessageType;
  role: A2AMessageRole;
  content: string;
  name?: string;
}): A2AMessage {
  return {
    id: uuidv4(),
    type: params.type,
    role: params.role,
    content: params.content,
    name: params.name,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a new message with multiple parts
 * @param parts The message parts
 * @returns A new message
 */
export function createMessageWithParts(parts: MessagePart[]): Message {
  // Validate the message
  return MessageSchema.parse({ parts });
}

/**
 * Create a new artifact message part
 * @param name The artifact name
 * @param content The artifact content
 * @param contentType The content type
 * @returns A new artifact message part
 */
export function createArtifact(
  name: string,
  content: string,
  contentType: string = 'application/json'
): MessagePart {
  const artifact: MessagePart = {
    name,
    contentType,
    content,
  };

  // Validate the artifact
  return MessagePartSchema.parse(artifact);
}

/**
 * Create a new run request
 * @param agentName The agent name
 * @param input The input messages
 * @param mode The run mode (default: sync)
 * @param sessionId Optional session ID
 * @returns A new run request
 */
export function createRunRequest(
  agentName: string,
  input: Message[],
  mode: RunMode = RunMode.SYNC,
  sessionId?: string
): RunRequest {
  return {
    agentName,
    input,
    mode,
    sessionId,
  };
}

/**
 * Create a new run response
 * @param agentName The agent name
 * @param status The run status
 * @param output Optional output messages
 * @param error Optional error message
 * @param sessionId Optional session ID
 * @returns A new run response
 */
export function createRunResponse(
  agentName: string,
  status: RunStatus,
  output?: Message[],
  error?: string,
  sessionId?: string
): RunResponse {
  return {
    runId: uuidv4(),
    agentName,
    status,
    output,
    error,
    sessionId,
  };
}

/**
 * Create a new run event
 * @param type The event type
 * @param run The run response
 * @param data Optional event data
 * @returns A new run event
 */
export function createRunEvent(
  type: string,
  run: RunResponse,
  data?: any
): RunEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    run,
    data,
  };
}

/**
 * Convert a message to string
 * @param message The message to convert
 * @returns The string representation of the message
 */
export function messageToString(message: Message | A2AMessage): string {
  if ('parts' in message) {
    // Handle standard Message type
    return message.parts
      .filter(part => part.contentType === 'text/plain' && part.content)
      .map(part => part.content)
      .join('\n');
  } else {
    // Handle A2AMessage type
    return message.content;
  }
}

/**
 * Convert a string to a message
 * @param text The text to convert
 * @returns A new message
 */
export function stringToMessage(text: string): Message {
  return createTextMessage(text);
}
