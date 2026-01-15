/**
 * Claude Agent SDK Configuration
 *
 * This module configures the Claude Agent SDK for NextMethod.
 * The SDK uses Claude Code's underlying infrastructure for agent capabilities.
 *
 * The SDK provides two main APIs:
 * - `query()` for one-shot queries with Options
 * - `unstable_v2_createSession()` for persistent sessions with SDKSessionOptions
 */

import type { Options, SDKSessionOptions } from '@anthropic-ai/claude-agent-sdk';

/**
 * Agent configuration interface for NextMethod
 */
export interface AgentConfig {
  /** Display name for the agent */
  name: string;
  /** Claude model to use */
  model: string;
  /** System prompt (loaded from file or custom) */
  systemPrompt?: string;
  /** Additional system prompt content to append */
  appendSystemPrompt?: string;
  /** Tools that are auto-allowed without prompting */
  allowedTools?: string[];
  /** Tools that are blocked from use */
  disallowedTools?: string[];
}

/**
 * Default configuration for NextMethod agent
 */
export const defaultConfig: AgentConfig = {
  name: 'NextMethod',
  model: 'claude-sonnet-4-5-20250929',
  allowedTools: [
    'Read',
    'Glob',
    'Grep',
    'WebFetch',
    'WebSearch',
  ],
  disallowedTools: [
    // Disable dangerous file operations by default
    'Write',
    'Edit',
    'Bash',
  ],
};

/**
 * Create SDK query options from agent config
 * Used with the `query()` function for one-shot queries
 *
 * @param config - Agent configuration
 * @returns Options for query() function
 */
export function createQueryOptions(config: AgentConfig): Options {
  const options: Options = {
    model: config.model,
    allowedTools: config.allowedTools,
    disallowedTools: config.disallowedTools,
  };

  // Configure system prompt
  if (config.systemPrompt) {
    options.systemPrompt = config.systemPrompt;
  } else if (config.appendSystemPrompt) {
    // Use Claude Code preset with custom additions
    options.systemPrompt = {
      type: 'preset',
      preset: 'claude_code',
      append: config.appendSystemPrompt,
    };
  }

  return options;
}

/**
 * Create SDK session options from agent config
 * Used with unstable_v2_createSession() for persistent sessions
 *
 * @param config - Agent configuration
 * @returns SDK session options ready for session creation
 */
export function createSessionOptions(config: AgentConfig): SDKSessionOptions {
  return {
    model: config.model,
    allowedTools: config.allowedTools,
    disallowedTools: config.disallowedTools,
  };
}

/**
 * Available models for NextMethod
 */
export const availableAgentModels = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: 'Balanced performance and cost' },
  { id: 'claude-opus-4-5-20250929', name: 'Claude Opus 4.5', description: 'Most capable, complex reasoning' },
  { id: 'claude-haiku-4-5-20250929', name: 'Claude Haiku 4.5', description: 'Fastest, most economical' },
] as const;

export type AgentModelId = typeof availableAgentModels[number]['id'];
