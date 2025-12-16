# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hyper-Notebook is an AI-powered research assistant inspired by Google NotebookLM. It provides a three-panel interface for managing research sources, chatting with AI about content, and generating various output formats (study guides, mindmaps, timelines, slides, etc.).

## Common Commands

```bash
# Development
npm run dev          # Start development server (Express + Vite HMR) on port 5000

# Build and Production
npm run build        # Build for production (outputs to dist/)
npm run start        # Start production server

# Type Checking
npm run check        # Run TypeScript type checking

# Database
npm run db:push      # Push Drizzle schema changes to PostgreSQL
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + Shadcn/ui
- **Backend**: Express.js + Node.js 20+
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenRouter API (provides access to Claude, GPT, Gemini, Llama, Mistral, etc.)
- **Visualization**: React Flow (mindmaps), Recharts (charts), Framer Motion (animations)
- **Rich Text**: TipTap editor

### Directory Structure
```
client/src/
├── components/
│   ├── a2ui/           # A2UI component system - renders AI-generated interactive UIs
│   ├── panels/         # Main layout: SourcesPanel, ChatPanel, StudioPanel
│   ├── studio/         # Workflow, email builder, reports tools
│   └── ui/             # Shadcn/ui components
├── pages/              # Route pages (home.tsx is the main interface)
├── hooks/              # Custom React hooks
└── lib/                # Utilities and types

server/
├── index.ts            # Express server entry point
├── routes.ts           # All API endpoints
├── ai-service.ts       # OpenRouter integration, model definitions, content generation
├── storage.ts          # Database abstraction layer (CRUD operations)
└── db.ts               # Drizzle ORM setup

shared/
└── schema.ts           # Database schema (Drizzle) + TypeScript types for A2UI, workflows, etc.
```

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

### Key Architectural Patterns

**A2UI (Agent-to-User Interface)**: The system can render AI-generated interactive components in the chat. The AI responds with JSON describing UI intent (cards, charts, mindmaps, etc.), and `A2UIRenderer.tsx` renders these using pre-approved Shadcn components. This follows a declarative protocol - agents describe what to show, not executable code.

**SSE Streaming**: Chat responses use Server-Sent Events for real-time token streaming (`POST /api/chat`).

**Content Generation Pipeline**:
1. User selects sources →
2. Backend extracts content →
3. AI generates structured JSON output →
4. Frontend renders via A2UI or specialized components

### Database Schema (shared/schema.ts)
- `sources` - Research materials (URLs, PDFs, text)
- `conversations` / `messages` - Chat history with optional A2UI components
- `workflows` - Automation step sequences
- `generatedContent` - Saved outputs (study guides, mindmaps, etc.)

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - API key from openrouter.ai

Optional:
- `PORT` - Server port (default: 5000)
- `DEFAULT_MODEL` - Default AI model ID
- `SITE_URL` / `SITE_NAME` - For OpenRouter headers

## API Endpoints

**Sources**: `GET/POST /api/sources`, `POST /api/sources/upload` (file upload), `DELETE /api/sources/:id`

**Chat**: `POST /api/chat` (streaming SSE), `POST /api/chat/simple` (non-streaming), `GET /api/models`

**Content Generation**: `POST /api/generate` (type: study_guide, faq, mindmap, timeline, slides, etc.)

**Workflows**: `GET/POST/PATCH/DELETE /api/workflows`

## Design Guidelines

The interface follows a productivity-first design system (see `design_guidelines.md`):
- Three-panel layout: Sources (280px) | Chat (flexible) | Studio (320px)
- Dark theme with Shadcn/ui components
- Minimal animations using Framer Motion (150-200ms transitions)
- Typography: Inter for UI, JetBrains Mono for code
- Use Tailwind spacing units: 2, 3, 4, 6, 8

## Technical Debt / Known Limitations

- Authentication is scaffolded but not implemented
- Web search endpoint (`/api/search/web`) uses AI-generated results, not real search API
- Browser automation workflows have UI but backend execution is not implemented
