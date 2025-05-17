/**
 * LiteLLM API implementation
 * This provides a compatible interface with the litellm package
 */

import axios from 'axios';

// Configuration
const API_KEY = process.env.LLM_API_KEY || '';
const DEFAULT_MODEL = process.env.LLM_MODEL || 'gpt-4o';
const BASE_URL = 'https://api.litellm.ai/v1';

// Helper function to make API requests
async function makeRequest(endpoint: string, data: unknown) {
  try {
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data
    });
    return response.data;
  } catch (error: unknown) {
    console.error('LiteLLM API error:', error.response?.data || error.message);
    throw error;
  }
}

// Completion function
export async function completion(options: unknown = {}) {
  console.log("LiteLLM completion called with model:", options.model);

  const requestData = {
    model: options.model || DEFAULT_MODEL,
    messages: options.messages || [],
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 1000,
    stream: options.stream || false,
    ...options
  };

  return makeRequest('/chat/completions', requestData);
}

// Embedding function
export async function embedding(options: unknown = {}) {
  console.log("LiteLLM embedding called with model:", options.model);

  const requestData = {
    model: options.model || 'text-embedding-ada-002',
    input: options.input || '',
    ...options
  };

  return makeRequest('/embeddings', requestData);
}

// For backward compatibility with code that uses the class-based approach
export class LiteLLM {
  private options: unknown;

  constructor(options: unknown = {}) {
    this.options = options;
    console.log("LiteLLM class initialized with model:", options.model || DEFAULT_MODEL);
  }

  async chatCompletion(options: unknown = {}) {
    return completion({
      ...this.options,
      ...options,
    });
  }

  async embedding(options: unknown = {}) {
    return embedding({
      ...this.options,
      ...options,
    });
  }
}
