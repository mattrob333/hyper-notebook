/**
 * Agent Instance Singleton
 *
 * Manages the Claude Agent SDK session for NextMethod.
 * Provides lazy initialization and cleanup utilities.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Query, Options } from '@anthropic-ai/claude-agent-sdk';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { defaultConfig, createQueryOptions, type AgentConfig } from './config';

/** Cached system prompt content */
let cachedSystemPrompt: string | null = null;

/** Current agent configuration */
let currentConfig: AgentConfig = { ...defaultConfig };

/**
 * Load the system prompt from systemprompt.md
 *
 * @returns Promise resolving to the system prompt content
 */
export async function loadSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  const promptPath = join(process.cwd(), 'systemprompt.md');

  try {
    cachedSystemPrompt = await readFile(promptPath, 'utf-8');
    return cachedSystemPrompt;
  } catch (error) {
    console.warn('Could not load systemprompt.md, using default prompt');
    cachedSystemPrompt = 'You are NextMethod, an AI-powered workspace assistant.';
    return cachedSystemPrompt;
  }
}

/**
 * Create a new agent query with the current configuration
 *
 * The Claude Agent SDK uses a query-based API where each query
 * represents a conversation turn. The query handles streaming,
 * tool use, and response generation.
 *
 * @param prompt - The user's prompt/message
 * @param options - Optional overrides for the query
 * @returns Query object for streaming results
 */
export function createAgentQuery(
  prompt: string,
  options?: Partial<Options>
): Query {
  const baseOptions = createQueryOptions(currentConfig);

  return query({
    prompt,
    options: {
      ...baseOptions,
      ...options,
    },
  });
}

/**
 * Execute a simple prompt and get the result
 *
 * This is a convenience wrapper for simple queries where
 * you don't need streaming.
 *
 * @param prompt - The user's prompt/message
 * @param options - Optional overrides
 * @returns Promise resolving to the assistant's response
 */
export async function executePrompt(
  prompt: string,
  options?: Partial<Options>
): Promise<string> {
  const systemPrompt = await loadSystemPrompt();
  const baseOptions = createQueryOptions({
    ...currentConfig,
    systemPrompt,
  });

  const agentQuery = query({
    prompt,
    options: {
      ...baseOptions,
      ...options,
    },
  });

  let response = '';

  // Collect the full response from streaming
  for await (const message of agentQuery) {
    if (message.type === 'assistant' && 'content' in message) {
      // Extract text content from the message
      const content = message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if ('text' in block) {
            response += block.text;
          }
        }
      }
    }
  }

  return response;
}

/**
 * Update the agent configuration
 *
 * @param config - Partial configuration to merge
 */
export function updateConfig(config: Partial<AgentConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
  };
}

/**
 * Get the current agent configuration
 *
 * @returns Current configuration
 */
export function getConfig(): AgentConfig {
  return { ...currentConfig };
}

/**
 * Reset to default configuration and clear cached prompt
 */
export function resetAgent(): void {
  currentConfig = { ...defaultConfig };
  cachedSystemPrompt = null;
}

/**
 * Clear the cached system prompt (useful for development)
 */
export function clearSystemPromptCache(): void {
  cachedSystemPrompt = null;
}
