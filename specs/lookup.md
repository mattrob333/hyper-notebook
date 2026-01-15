# Context Lookup Table

> **Purpose:** Improve search hit rate. Update when you don't find what you're looking for.

## Core Concepts

| Concept | Synonyms / Keywords | Related Files |
|---------|---------------------|---------------|
| AI Chat | OpenRouter, Claude, streaming, SSE, messages | `server/ai-service.ts`, `server/routes.ts` |
| Sources | Files, uploads, URLs, documents, RSS | `client/src/components/panels/SourcesPanel.tsx`, `server/routes.ts` |
| Studio | Canvas, outputs, generation, tools | `client/src/components/panels/StudioPanel.tsx` |
| Chat Panel | Conversation, messages, input | `client/src/components/panels/ChatPanel.tsx` |
| A2UI | Agent UI, interactive, components, render | `client/src/components/a2ui/` |
| Database | PostgreSQL, Drizzle, schema, storage | `server/db.ts`, `server/storage.ts`, `shared/schema.ts` |
| Editor | TipTap, rich text, document | `client/src/components/editor/` |
| Mindmap | React Flow, nodes, edges, visualization | `client/src/components/studio/` |

## New Concepts (To Implement)

| Concept | Synonyms / Keywords | Target Files |
|---------|---------------------|--------------|
| Agent SDK | Claude SDK, Anthropic, agent instance | `server/agent/`, `client/src/lib/agent/` |
| Personas | Agents, debate, orchestrator, characters | `client/src/lib/personas/`, `client/src/components/agents/` |
| Workflows | Trigger.dev, tasks, background, jobs | `trigger/workflows/`, `server/workflows/` |
| Email | Resend, send, templates | `server/email/`, `client/src/lib/email/` |
| State Store | Zustand, global state, store | `client/src/lib/store/` |
| Active Tasks | Sub-agents, progress, status | `client/src/components/tasks/` |

## File Patterns

| Pattern | Purpose |
|---------|---------|
| `*.tsx` | React components |
| `*.ts` | TypeScript logic |
| `shared/schema.ts` | Database schema + types |
| `server/routes.ts` | All API endpoints |
| `server/ai-service.ts` | AI model integration |

## API Endpoints

| Endpoint | Purpose | File |
|----------|---------|------|
| `POST /api/chat` | Streaming chat (SSE) | `server/routes.ts` |
| `POST /api/chat/simple` | Non-streaming chat | `server/routes.ts` |
| `GET/POST /api/sources` | Source management | `server/routes.ts` |
| `POST /api/generate` | Content generation | `server/routes.ts` |
| `GET /api/models` | Available AI models | `server/routes.ts` |

## Component Hierarchy

```
App
├── HomePage (client/src/pages/home.tsx)
│   ├── SourcesPanel
│   ├── ChatPanel
│   │   ├── ChatMessages
│   │   ├── A2UIRenderer
│   │   └── ChatInput
│   └── StudioPanel
│       ├── ToolsGrid
│       └── GeneratedContent
└── NotebookList (client/src/pages/notebooks.tsx)
```

## Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `sources` | Research materials | id, type, title, content, url |
| `conversations` | Chat sessions | id, notebookId, title |
| `messages` | Chat messages | id, conversationId, role, content |
| `workflows` | Automation sequences | id, name, steps |
| `generatedContent` | Saved outputs | id, type, content, notebookId |

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `OPENROUTER_API_KEY` | Yes | Current AI backend |
| `ANTHROPIC_API_KEY` | New | Claude Agent SDK |
| `TRIGGER_API_KEY` | New | Trigger.dev workflows |
| `RESEND_API_KEY` | New | Email sending |
