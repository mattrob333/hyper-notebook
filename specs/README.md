# NextMethod Platform Specification

## Project Purpose

Transform the existing NotebookLM-style application into **NextMethod**, a Claude Agent SDK-powered workspace with multi-persona orchestration, autonomous workflows, and advanced document creation capabilities.

## Current State

A functional NotebookLM clone with:
- Three-panel layout (Sources | Chat | Studio)
- TipTap editor for rich text
- Source management (files, URLs, text)
- Basic studio tools (mindmaps, slides, audio, etc.)
- OpenRouter API integration for AI
- PostgreSQL + Drizzle ORM database

## Target State

A Claude Agent SDK-driven platform where:
- Core AI is powered by Claude Agent SDK with custom system prompt
- AI persona agents can be invoked for collaborative debates
- Trigger.dev workflows run in the background
- TipTap handles all document creation with AI assistance
- Users interact through rich UI components (A2UI)

## Technology Stack

### Existing (Keep)
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + Shadcn/ui
- **Backend**: Express.js + Node.js 20+
- **Database**: PostgreSQL + Drizzle ORM
- **Visualization**: React Flow, Recharts, Framer Motion
- **Rich Text**: TipTap editor

### New Integrations
- **AI Core**: Claude Agent SDK (`@anthropic-ai/agent-sdk`)
- **Workflows**: Trigger.dev
- **Email**: Resend API
- **State Management**: Zustand (replace current context-based state)

## Non-Negotiable Constraints

1. **Preserve existing functionality** - Current features must continue working
2. **Incremental migration** - No big-bang rewrites; each phase must be deployable
3. **Type safety** - All new code must be fully typed TypeScript
4. **Test coverage** - New features require tests
5. **Database compatibility** - Schema changes via Drizzle migrations only

## Architecture Decisions

### Path Aliases (Existing)
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

### Directory Structure (Target)
```
client/src/
├── components/
│   ├── a2ui/           # A2UI interactive components
│   ├── agents/         # Persona agent UI components
│   ├── chat/           # Chat interface with persona support
│   ├── editor/         # TipTap with AI commands
│   ├── panels/         # Three-panel layout
│   ├── tasks/          # Active tasks display
│   └── ui/             # Shadcn/ui components
├── lib/
│   ├── agent/          # Claude Agent SDK integration
│   ├── personas/       # Persona orchestration
│   ├── store/          # Zustand state management
│   ├── templates/      # Document templates
│   └── trigger/        # Trigger.dev client
└── hooks/

server/
├── agent/              # Agent endpoint handlers
├── workflows/          # Trigger.dev webhook handlers
├── email/              # Resend integration
└── (existing files)

trigger/
└── workflows/          # Trigger.dev task definitions
```

## Environment Variables Required

```env
# Existing
DATABASE_URL=
OPENROUTER_API_KEY=

# New Required
ANTHROPIC_API_KEY=       # Claude Agent SDK
TRIGGER_API_KEY=         # Trigger.dev
RESEND_API_KEY=          # Email sending

# Optional
TRIGGER_API_URL=https://api.trigger.dev
```

## Integration Points

| System | Integration Method | Purpose |
|--------|-------------------|---------|
| Claude Agent SDK | Direct SDK | Core AI backbone |
| Trigger.dev | SDK + Webhooks | Background workflows |
| Resend | REST API | Email delivery |
| Existing OpenRouter | Keep for fallback | Model variety |

## Out of Scope (This Phase)

- Authentication system overhaul
- Multi-tenancy / organization support
- Custom persona creation UI
- Billing/subscription integration
- Mobile responsiveness improvements

## Success Metrics

- [ ] All existing tests pass
- [ ] New persona debate feature functional
- [ ] At least 3 Trigger.dev workflows operational
- [ ] TipTap AI commands working
- [ ] A2UI components rendering in chat
- [ ] No regression in existing features
