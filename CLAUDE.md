# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hyper-Notebook is an AI-powered research assistant that extends Google NotebookLM's concept with multi-model AI support, professional report editing, A2UI (Agent-to-User Interface) rendering, lead management, and workflow automation. Built on three pillars: a React/Express interface foundation, the A2UI declarative UI protocol, and Hyperbrowser for agentic web automation.

## Common Commands

```bash
npm run dev          # Start dev server (Express + Vite HMR) on port 5000
npm run build        # Build for production (outputs dist/public + dist/index.cjs)
npm run start        # Start production server
npm run check        # TypeScript type checking (tsc)
npm run db:push      # Push Drizzle schema changes to PostgreSQL
```

Note: `npm run dev` uses `tsx server/index.ts` directly (ESM, "type": "module" in package.json). Server binds to `127.0.0.1:5000`.

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite 5 + TypeScript + TailwindCSS 3 + Shadcn/ui
- **Backend**: Express 4 + Node.js 20+ (ESM)
- **Database**: PostgreSQL 14+ + Drizzle ORM 0.39
- **AI**: OpenRouter API via OpenAI SDK (compatible endpoint)
- **Visualization**: React Flow (@xyflow/react) for mindmaps, Recharts for charts, Framer Motion for animations
- **Rich Text**: TipTap editor with extensions (color, highlight, image, link, placeholder, text-align, underline)
- **Routing**: wouter (lightweight client-side router)
- **State**: TanStack React Query for server state, React Context for local state (LeadContext, EmailBuilderContext, DocumentPanelContext)

### Directory Structure
```
client/src/
├── components/
│   ├── a2ui/           # A2UI renderer + components (A2UIRenderer, A2Spreadsheet, A2HyperBrowser)
│   ├── browser/        # BrowserAgentMonitor for Hyperbrowser sessions
│   ├── mobile/         # Mobile-responsive views
│   ├── notebooks/      # CreateNotebookModal
│   ├── panels/         # Core layout: SourcesPanel, ChatPanel, StudioPanel, SourceDetailView
│   ├── studio/         # ReportEditor, EmailBuilder, WorkflowStudio, SlideViewer, InfographicViewer, etc.
│   ├── ui/             # Shadcn/ui primitives
│   └── workflows/      # OnboardingWorkflow, ResearchWorkflow
├── contexts/           # React Contexts (DocumentPanel, EmailBuilder, Lead)
├── pages/              # Routes: notebooks.tsx (/), home.tsx (/notebook/:id), settings.tsx
├── hooks/              # use-mobile, use-toast
└── lib/                # queryClient, types, utils, workflows

server/
├── index.ts            # Express entry point (dotenv, JSON limit 10mb, logging middleware)
├── routes.ts           # All API endpoints (sources, chat, generate, notebooks, workflows, reports, images)
├── ai-service.ts       # OpenRouter integration via OpenAI SDK, model registry, streaming, content generation
├── storage.ts          # IStorage interface + DatabaseStorage class (all CRUD operations)
├── db.ts               # Drizzle ORM pool setup
├── workflows.ts        # Server-side workflow definitions with system prompts
├── hyperbrowser-service.ts  # Hyperbrowser SDK integration for web automation
├── vite.ts             # Vite dev server middleware setup
└── static.ts           # Production static file serving

shared/
└── schema.ts           # Drizzle schema (all tables) + Zod schemas + TypeScript interfaces (A2UI, Lead, Spreadsheet, etc.)
```

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

### Key Architectural Patterns

**A2UI (Agent-to-User Interface)**: AI responds with declarative JSON describing UI intent. `A2UIRenderer.tsx` maps component types (card, progress, form, data_table, chart, mindmap, audio_transcript, report_suggestion) to pre-approved Shadcn components. Agents cannot execute code - they only describe what to render.

**SSE Streaming**: `POST /api/chat` uses Server-Sent Events. The server calls OpenRouter's streaming API and pipes chunks to the client. A2UI JSON blocks embedded in responses are parsed and rendered inline.

**OpenRouter Integration**: Uses the OpenAI SDK with `baseURL: "https://openrouter.ai/api/v1"`. Model registry in `ai-service.ts` defines 15+ models with metadata (context length, capabilities, image support). Default model: `google/gemini-3-flash-preview`.

**Content Generation Pipeline**: User selects sources → backend extracts content → AI generates structured JSON → frontend renders via A2UI or specialized viewers (MindmapView, SlideViewer, InfographicViewer, ReportEditor).

**Lead Context Injection**: When a CSV source is loaded and a lead selected, the lead's data is injected into the AI system prompt so the AI can reference contact details in chat and email generation.

**Workflow System**: `server/workflows.ts` defines trigger-based workflows (e.g., `[WORKFLOW:USER_ONBOARDING]`) with custom system prompts that force A2UI-only responses for guided step-by-step flows.

### Database Schema (shared/schema.ts)
- `users` - Auth scaffolding (not yet implemented)
- `notebooks` - Top-level containers with letterhead settings (JSONB)
- `sources` - Research materials (url, pdf, text, csv, audio, video) scoped to notebooks
- `feeds` - RSS/Atom feed subscriptions per notebook
- `conversations` / `messages` - Chat history with optional A2UI component arrays (JSONB)
- `notes` - User notes
- `workflows` - Automation step sequences
- `generatedContent` - Saved outputs (study guides, mindmaps, etc.)

All tables use `varchar` UUIDs (`gen_random_uuid()`), not `serial`. Foreign keys cascade on delete from notebooks.

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - API key from openrouter.ai

Optional:
- `PORT` - Server port (default: 5000)
- `DEFAULT_MODEL` - Default AI model ID (default: `google/gemini-3-flash-preview`)
- `SITE_URL` / `SITE_NAME` - For OpenRouter HTTP-Referer/X-Title headers
- `ELEVENLABS_API_KEY` - For audio overview TTS generation
- `HYPERBROWSER_API_KEY` - For web automation/scraping
- `FIRECRAWL_API_KEY` - For fast web scraping

## API Endpoints

**Notebooks**: `GET/POST /api/notebooks`, `GET/PATCH/DELETE /api/notebooks/:id`

**Sources**: `GET/POST /api/sources`, `POST /api/sources/upload` (multipart, 10MB limit), `GET/PATCH/DELETE /api/sources/:id`

**Chat**: `POST /api/chat` (streaming SSE), `POST /api/chat/simple` (non-streaming), `GET /api/models`

**Content Generation**: `POST /api/generate` (types: study_guide, faq, mindmap, timeline, slides, infographic, audio_overview, etc.)

**Reports**: `POST /api/reports/generate`, `POST /api/reports/analyze-sources`, `POST /api/ai/rewrite`

**Images**: `POST /api/images/generate` (via Gemini 3 Pro Image)

**Workflows**: `GET/POST/PATCH/DELETE /api/workflows`

## Design Guidelines

See `design_guidelines.md` for full spec. Key rules:
- Three-panel layout: Sources (280px) | Chat (flex) | Studio (320px), collapsible via react-resizable-panels
- Productivity-first dark theme, Shadcn/ui components
- Animations: Framer Motion, 150-200ms only, no decorative motion
- Typography: Inter for UI, JetBrains Mono for code
- Tailwind spacing: 2, 3, 4, 6, 8
- Icons: lucide-react throughout
- Responsive: Desktop 3-panel, tablet 2-panel, mobile single-panel with bottom nav

## Technical Debt / Known Limitations

- Authentication is scaffolded (users table, passport deps) but not implemented
- Web search (`/api/search/web`) uses AI-generated results, not a real search API
- Browser automation workflows have UI but backend execution is partially implemented
- `.env.example` still references old default model (`anthropic/claude-3.5-sonnet`) but actual default is `google/gemini-3-flash-preview`
- No test suite exists
- Build uses esbuild via custom `script/build.ts`
