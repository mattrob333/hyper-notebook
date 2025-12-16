# Hyper-Notebook Engineering Log

## Project Overview
A NotebookLM-style research assistant application originally built on Replit, now being migrated for local/cloud deployment with OpenRouter as the unified AI backend.

---

## Log Entries

### 2024-12-16 - Initial Codebase Analysis & Migration Planning

**Status:** Starting migration from Replit

**Codebase Summary:**
- **Frontend:** React 18.3 + Vite 5.4 + TypeScript + Shadcn/ui + TailwindCSS
- **Backend:** Express.js 4.21 + Node.js 20+
- **Database:** PostgreSQL 16 + Drizzle ORM 0.39
- **Current AI:** OpenAI SDK + Google GenAI SDK (separate integrations)
- **Key Libraries:** React Flow (mindmaps), TipTap (rich text), Recharts (charts), Framer Motion (animations)

**Architecture:**
```
client/                 # React SPA
├── src/
│   ├── components/     # UI components including A2UI renderer
│   ├── pages/          # Route pages (home.tsx main)
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities
server/                 # Express API
├── index.ts            # Entry point
├── routes.ts           # All API endpoints
├── ai-service.ts       # LLM integration (TO BE REPLACED)
├── storage.ts          # Database abstraction
└── db.ts               # Drizzle setup
shared/                 # Shared types
└── schema.ts           # Database schema
```

**Current Features:**
1. Three-panel interface (Sources | Chat | Studio)
2. Source management (URL, PDF, text upload)
3. AI chat with streaming (SSE)
4. Content generation: study guides, FAQs, mindmaps, timelines, slides, podcasts, emails
5. A2UI component rendering (dynamic UI from AI responses)
6. Workflow automation system
7. Custom reports

**Replit Dependencies to Remove:**
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-dev-banner`
- `@replit/vite-plugin-runtime-error-modal`
- `.replit` configuration file
- Replit-specific environment variable naming

**Migration Tasks Identified:**
1. Remove Replit-specific dependencies and configs
2. Replace OpenAI + Gemini SDK with OpenRouter
3. Update environment variable handling
4. Set up local development environment
5. Prepare for GitHub deployment
6. Test all features post-migration

---

## Architecture Decisions

### ADR-001: OpenRouter as Unified AI Backend
**Decision:** Replace separate OpenAI and Gemini SDK integrations with OpenRouter API
**Rationale:**
- Single API for 100+ models (OpenAI, Anthropic, Google, Meta, Mistral, etc.)
- Simplified key management
- Easy model switching
- Cost optimization through model selection
- Future-proof for new models

### ADR-002: Environment Configuration
**Decision:** Use `.env` file for local development, environment variables for production
**Rationale:**
- Standard practice for Node.js applications
- Easy local development setup
- Secure production deployment

---

## Technical Debt

1. Authentication scaffolded but not implemented
2. Web search is simulated (AI-generated results, not real search)
3. Browser automation workflows UI exists but backend execution not implemented

---

### 2024-12-16 - Migration Completed

**Status:** Migration from Replit complete

**Completed Tasks:**

1. **Removed Replit Dependencies**
   - Uninstalled `@replit/vite-plugin-cartographer`
   - Uninstalled `@replit/vite-plugin-dev-banner`
   - Uninstalled `@replit/vite-plugin-runtime-error-modal`
   - Deleted `.replit` configuration file
   - Deleted `replit.md` documentation file
   - Updated `vite.config.ts` to remove Replit plugin imports

2. **Implemented OpenRouter Integration**
   - Rewrote `server/ai-service.ts` to use OpenRouter API
   - Added 15 AI models across 7 providers:
     - Anthropic: Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3.5 Haiku
     - OpenAI: GPT-4o, GPT-4o Mini, o1, o1-mini
     - Google: Gemini 2.0 Flash, Gemini Pro 1.5, Gemini Flash 1.5
     - Meta: Llama 3.3 70B
     - Mistral: Mistral Large, Mistral Small
     - DeepSeek: DeepSeek V3
     - Qwen: Qwen 2.5 72B
   - Removed `@google/genai` dependency (using OpenRouter instead)
   - Added `/api/models` endpoint for frontend model discovery

3. **Updated Frontend**
   - Updated `ChatPanel.tsx` to fetch models from API
   - Implemented model selector grouped by provider
   - Shows model name and context window size
   - Dynamic default model selection

4. **Environment Configuration**
   - Created `.env.example` template
   - Updated `.gitignore` for local development
   - Renamed environment variables from Replit format

5. **Documentation**
   - Created comprehensive `README.md` with setup instructions
   - Updated package.json with proper name and description
   - Created migration plan document

**Files Changed:**
- `package.json` - Removed Replit deps, added description
- `vite.config.ts` - Removed Replit plugins
- `server/ai-service.ts` - Complete rewrite for OpenRouter
- `server/routes.ts` - Added models endpoint, updated default model
- `client/src/components/panels/ChatPanel.tsx` - Dynamic model loading
- `.gitignore` - Expanded for local development
- `.env.example` - New file
- `README.md` - New file
- `ENGINEERING_LOG.md` - Updated
- `MIGRATION_PLAN.md` - New file

**Deleted Files:**
- `.replit`
- `replit.md`

---

## Next Steps

### Phase 1: Testing & Validation
- [ ] Test all AI features with OpenRouter
- [ ] Verify streaming works correctly
- [ ] Test content generation (all types)
- [ ] Verify mindmap visualization

### Phase 2: NotebookLM Feature Parity
- [ ] Add real web search integration (Serper/Tavily)
- [ ] Add YouTube transcript extraction
- [ ] Implement source citations in responses
- [ ] Add audio overview generation

### Phase 3: Enhanced Features
- [ ] Multi-notebook support
- [ ] Source pinning for context control
- [ ] Voice input/output
- [ ] Export functionality (PDF, Markdown)

---

## Next Steps
See MIGRATION_PLAN.md for detailed implementation steps.
