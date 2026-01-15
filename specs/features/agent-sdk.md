# Feature: Claude Agent SDK Integration

## Overview

Replace the current OpenRouter-based AI backend with Claude Agent SDK for the core conversation functionality. This enables tool use, better context management, and native support for the persona orchestration system.

## User Stories

- As a user, I want the AI to use tools (search, fetch, etc.) seamlessly during conversation
- As a user, I want faster, more capable responses from Claude models
- As a developer, I want a standardized tool registration pattern

## Installation

```bash
npm install @anthropic-ai/agent-sdk
```

## Configuration

### Agent Config (`server/agent/config.ts`)

```typescript
import { Agent } from '@anthropic-ai/agent-sdk';

export interface AgentConfig {
  name: string;
  model: string;
  systemPrompt: string;
}

export const createNextMethodAgent = (config: AgentConfig): Agent => {
  return new Agent({
    name: config.name,
    model: config.model,
    system_prompt: config.systemPrompt,
  });
};

export const defaultConfig: AgentConfig = {
  name: "NextMethod",
  model: "claude-sonnet-4-20250514",
  systemPrompt: "", // Loaded from file
};
```

## Instance Management

### Agent Singleton (`server/agent/instance.ts`)

```typescript
import { Agent } from '@anthropic-ai/agent-sdk';
import { createNextMethodAgent, defaultConfig } from './config';
import { loadSystemPrompt } from './system-prompt';
import { registerTools } from './tools';

let agentInstance: Agent | null = null;

export const getAgent = async (): Promise<Agent> => {
  if (!agentInstance) {
    const systemPrompt = await loadSystemPrompt();
    agentInstance = createNextMethodAgent({
      ...defaultConfig,
      systemPrompt,
    });
    await registerTools(agentInstance);
  }
  return agentInstance;
};

export const resetAgent = (): void => {
  agentInstance = null;
};
```

### System Prompt Loader (`server/agent/system-prompt.ts`)

```typescript
import { readFile } from 'fs/promises';
import { join } from 'path';

export const loadSystemPrompt = async (): Promise<string> => {
  const promptPath = join(process.cwd(), 'systemprompt.md');
  return readFile(promptPath, 'utf-8');
};
```

## Tools

### Tool Registration Pattern (`server/agent/tools/index.ts`)

```typescript
import { Agent } from '@anthropic-ai/agent-sdk';
import { webSearchTool } from './web-search';
import { webFetchTool } from './web-fetch';
import { askUserTool } from './ask-user';
import { todoWriteTool } from './todo-write';
import { openTipTapTool } from './open-tiptap';
import { triggerWorkflowTool } from './trigger-workflow';
import { sendEmailTool } from './send-email';
import { invokePersonaTool } from './invoke-persona';

export const registerTools = async (agent: Agent): Promise<void> => {
  const tools = [
    webSearchTool,
    webFetchTool,
    askUserTool,
    todoWriteTool,
    openTipTapTool,
    triggerWorkflowTool,
    sendEmailTool,
    invokePersonaTool,
  ];

  for (const tool of tools) {
    agent.registerTool(tool);
  }
};
```

### Tool Definition Example

```typescript
// server/agent/tools/ask-user.ts
import { ToolDefinition } from '@anthropic-ai/agent-sdk';

export const askUserTool: ToolDefinition = {
  name: "ask_user",
  description: "Present interactive UI components to gather user input",
  parameters: {
    type: "object",
    properties: {
      component_type: {
        type: "string",
        enum: ["ButtonGroup", "Dropdown", "Slider", "CheckboxGroup", "ConfirmButton", "ChipGroup"],
        description: "Type of UI component to render"
      },
      options: {
        type: "array",
        items: { type: "object" },
        description: "Options for the component"
      },
      prompt: {
        type: "string",
        description: "Question or prompt to display"
      }
    },
    required: ["component_type", "prompt"]
  },
  execute: async (params) => {
    // Emit event to render A2UI component
    // Return user's selection
    return { pending: true, componentId: generateId() };
  }
};
```

## API Route Updates

### Chat Endpoint (`server/routes.ts`)

```typescript
// Replace existing /api/chat with Agent SDK version
app.post('/api/chat', async (req, res) => {
  const { messages, conversationId } = req.body;

  const agent = await getAgent();

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await agent.stream({
      messages,
      conversationId,
    });

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});
```

## Integration Points

| Component | Integration |
|-----------|-------------|
| Chat Panel | Receives streamed responses |
| A2UI Renderer | Handles `ask_user` tool results |
| Active Tasks Panel | Shows tool execution status |
| Persona System | Uses agent for persona responses |

## Constraints

- Keep OpenRouter integration as fallback for model variety
- System prompt must be loaded from `systemprompt.md`
- All tools must follow the registration pattern
- Streaming must work with existing chat UI

## Out of Scope

- Custom model fine-tuning
- Multi-model orchestration
- Prompt caching optimization
