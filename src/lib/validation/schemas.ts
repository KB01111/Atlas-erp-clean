import { z } from 'zod';

/**
 * Agent schema for validation
 */
export const AgentSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(['idle', 'running', 'error']),
  lastRun: z.string().optional(),
  capabilities: z.array(z.string()),
  systemPrompt: z.string().min(1, "System prompt is required"),
  model: z.string().optional(),
});

/**
 * Agent execution result schema
 */
export const AgentExecutionResultSchema = z.object({
  success: z.boolean(),
  output: z.string(),
  error: z.string().optional(),
});

/**
 * Message part schema for agent communication
 */
export const MessagePartSchema = z.object({
  contentType: z.string().default('text/plain'),
  content: z.string().optional(),
  contentUrl: z.string().url().optional(),
  name: z.string().optional(),
  metadata: z.record(z.any()).optional(),
}).refine(data => data.content !== undefined || data.contentUrl !== undefined, {
  message: "Either content or contentUrl must be provided"
});

/**
 * Artifact schema for structured data
 */
export const ArtifactSchema = MessagePartSchema.extend({
  name: z.string().min(1, "Artifact name is required"),
});

/**
 * Message schema for agent communication
 */
export const MessageSchema = z.object({
  parts: z.array(MessagePartSchema).min(1, "Message must have at least one part"),
});

/**
 * Workflow node schema
 */
export const WorkflowNodeSchema = z.object({
  id: z.string().min(1, "Node ID is required"),
  type: z.enum(['agent', 'condition', 'input', 'output', 'transform']),
  name: z.string().min(1, "Node name is required"),
  agentId: z.string().optional(),
  config: z.record(z.any()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

/**
 * Workflow edge schema
 */
export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1, "Edge ID is required"),
  source: z.string().min(1, "Source node ID is required"),
  target: z.string().min(1, "Target node ID is required"),
  condition: z.string().optional(),
  label: z.string().optional(),
});

/**
 * Workflow schema
 */
export const WorkflowSchema = z.object({
  id: z.string().min(1, "Workflow ID is required"),
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().min(1, "Workflow description is required"),
  status: z.enum(['active', 'inactive', 'draft']),
  createdAt: z.string(),
  updatedAt: z.string(),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  config: z.record(z.any()).optional(),
});

/**
 * Workflow log schema
 */
export const WorkflowLogSchema = z.object({
  timestamp: z.string(),
  nodeId: z.string(),
  nodeName: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
});

/**
 * Workflow execution state schema
 */
export const WorkflowStateSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
  executionId: z.string().min(1, "Execution ID is required"),
  status: z.enum(['running', 'completed', 'failed']),
  currentNodeId: z.string().optional(),
  input: z.record(z.any()),
  output: z.record(z.any()).optional(),
  logs: z.array(WorkflowLogSchema),
  startedAt: z.string(),
  completedAt: z.string().optional(),
});

// Export types derived from schemas
export type Agent = z.infer<typeof AgentSchema>;
export type AgentExecutionResult = z.infer<typeof AgentExecutionResultSchema>;
export type MessagePart = z.infer<typeof MessagePartSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowLog = z.infer<typeof WorkflowLogSchema>;
export type WorkflowState = z.infer<typeof WorkflowStateSchema>;
