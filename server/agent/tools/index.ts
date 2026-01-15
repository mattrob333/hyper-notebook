/**
 * Tool Registration Framework
 *
 * This module provides custom tools for the NextMethod agent using
 * the Claude Agent SDK's MCP (Model Context Protocol) server system.
 *
 * Tools are defined using Zod schemas and bundled into an MCP server
 * that can be passed to agent queries.
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * Web Search Tool
 *
 * Searches the web for information. In production, this would
 * integrate with a search API like Tavily or SerpAPI.
 */
export const webSearchTool = tool(
  'web_search',
  'Search the web for current information on a topic',
  {
    query: z.string().describe('The search query'),
    maxResults: z.number().optional().describe('Maximum number of results to return'),
  },
  async (args) => {
    // TODO: Integrate with actual search API
    console.log(`[web_search] Searching for: ${args.query}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            query: args.query,
            results: [
              {
                title: 'Search result placeholder',
                snippet: `Results for "${args.query}" would appear here`,
                url: 'https://example.com',
              },
            ],
            note: 'This is a placeholder. Integrate with a search API for real results.',
          }),
        },
      ],
    };
  }
);

/**
 * Web Fetch Tool
 *
 * Fetches and extracts content from a URL.
 */
export const webFetchTool = tool(
  'web_fetch',
  'Fetch and extract content from a URL',
  {
    url: z.string().url().describe('The URL to fetch'),
    extractText: z.boolean().optional().describe('Whether to extract text content only'),
  },
  async (args) => {
    // TODO: Integrate with actual fetch/scraping service
    console.log(`[web_fetch] Fetching: ${args.url}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            url: args.url,
            content: `Content from ${args.url} would appear here`,
            note: 'This is a placeholder. Implement actual fetch logic.',
          }),
        },
      ],
    };
  }
);

/**
 * Ask User Tool
 *
 * Presents interactive UI components to gather user input.
 * This integrates with the A2UI system in the frontend.
 */
export const askUserTool = tool(
  'ask_user',
  'Present interactive UI components to gather user input',
  {
    componentType: z.enum([
      'ButtonGroup',
      'Dropdown',
      'Slider',
      'CheckboxGroup',
      'ConfirmButton',
      'ChipGroup',
    ]).describe('Type of UI component to render'),
    prompt: z.string().describe('Question or prompt to display'),
    options: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).optional().describe('Options for selection components'),
  },
  async (args) => {
    // This tool returns a pending state - the actual response
    // comes from the frontend via the A2UI system
    console.log(`[ask_user] Rendering ${args.componentType}: ${args.prompt}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            pending: true,
            componentType: args.componentType,
            prompt: args.prompt,
            options: args.options,
            note: 'User response will be provided via A2UI callback',
          }),
        },
      ],
    };
  }
);

/**
 * Todo Write Tool
 *
 * Creates or updates todo list items visible in the UI.
 */
export const todoWriteTool = tool(
  'todo_write',
  'Create or update todo list items for task tracking',
  {
    items: z.array(z.object({
      id: z.string().optional(),
      content: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed']),
    })).describe('Todo items to create or update'),
  },
  async (args) => {
    console.log(`[todo_write] Updating ${args.items.length} items`);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            items: args.items,
          }),
        },
      ],
    };
  }
);

/**
 * All available tools
 */
export const allTools = [
  webSearchTool,
  webFetchTool,
  askUserTool,
  todoWriteTool,
];

/**
 * Create the NextMethod MCP server with all tools
 *
 * @returns MCP server configuration for use with agent queries
 */
export function createNextMethodMcpServer() {
  return createSdkMcpServer({
    name: 'nextmethod-tools',
    version: '1.0.0',
    tools: allTools,
  });
}

/**
 * Get tool names for configuration
 */
export function getToolNames(): string[] {
  return allTools.map((t) => t.name);
}
