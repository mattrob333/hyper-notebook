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

---

### 2024-12-16 - Notebook Management & Studio Features Enhancement

**Status:** Major feature implementation complete

**Completed Tasks:**

1. **Notebook Management System**
   - Added `notebooks` table to database schema with fields: id, name, description, emoji, color, sourceCount, timestamps
   - Added `notebookId` foreign key to `sources`, `conversations`, and `generatedContent` tables
   - Created CRUD API routes for notebooks (`/api/notebooks`)
   - Created `NotebooksDashboard` page at root route (`/`)
   - Created `CreateNotebookModal` component with multi-step source upload flow
   - Updated routing: `/` = notebooks dashboard, `/notebook/:id` = individual notebook view
   - Made all components notebook-aware (SourcesPanel, Home page)

2. **Reports Feature (NotebookLM-style)**
   - Created `ReportsModal` with 8 built-in report templates:
     - Create Your Own, Briefing Doc, Study Guide, Blog Post
     - Strategic Plan, Technical Specification, Concept Explainer, Technology Overview
   - Each template has professional system prompts for high-quality output
   - Report configuration view with title, model selection, additional instructions
   - Custom report type creation (session-based, persistence pending)
   - Generated reports appear in Studio sidebar Notes section

3. **Mind Map Enhancement**
   - Refactored `MindmapView.tsx` to NotebookLM-style hierarchical layout
   - Implemented teal/cyan color scheme matching NotebookLM
   - Added custom bezier edges for smooth curved connections
   - Made read-only (non-draggable, non-editable) for clean presentation
   - Added ChevronRight indicators for nodes with children
   - Custom node styling based on hierarchy level

4. **Infographic Generation Modal**
   - Created `CustomizeInfographicModal` component
   - Options: Language (9 languages), Orientation (Landscape/Portrait/Square), Detail Level (Concise/Standard/Detailed)
   - Description textarea for custom instructions
   - Connected to Gemini 3 Pro Image model via OpenRouter

5. **Slide Deck Generation Modal**
   - Created `CustomizeSlideDeckModal` component
   - Format options: Detailed Deck (standalone) vs Presenter Slides (talking points)
   - Language selection, Length toggle (Short 5-8 / Default 10-15 slides)
   - Description textarea for outline and style guidance
   - Connected to Gemini 3 Pro Image model via OpenRouter

6. **AI Model Updates**
   - Added Gemini image generation models to `ai-service.ts`:
     - `google/gemini-3-pro-image-preview` (Nano Banana Pro)
     - `google/gemini-2.5-flash-image` (Nano Banana)
   - Updated model definitions with `supportsImageGeneration` flag

7. **Type System Fixes**
   - Fixed drizzle-zod type issues in `shared/schema.ts`
   - Extended insert schemas with proper Zod enum types for type safety
   - Removed outdated example files that caused TypeScript errors

**New Files Created:**
- `client/src/pages/notebooks.tsx` - Notebooks dashboard page
- `client/src/components/notebooks/CreateNotebookModal.tsx` - Notebook creation wizard
- `client/src/components/studio/ReportsModal.tsx` - Report generation modal
- `client/src/components/studio/CustomizeInfographicModal.tsx` - Infographic config modal
- `client/src/components/studio/CustomizeSlideDeckModal.tsx` - Slide deck config modal

**Files Modified:**
- `shared/schema.ts` - Added notebooks table, foreign keys, fixed Zod schemas
- `server/storage.ts` - Added notebook CRUD methods, updated source/content methods
- `server/routes.ts` - Added notebook API routes
- `server/ai-service.ts` - Added Gemini image models
- `client/src/App.tsx` - Updated routing for notebooks
- `client/src/components/panels/StudioPanel.tsx` - Integrated new modals
- `client/src/components/panels/SourcesPanel.tsx` - Made notebook-aware
- `client/src/components/MindmapView.tsx` - NotebookLM-style refactor
- `client/src/lib/types.ts` - Added Notebook type export

**Files Deleted:**
- `client/src/components/examples/` - Removed outdated example files

---

---

### 2024-12-17 - Audio Overview & Slide Deck Enhancements

**Status:** Major feature improvements complete

**Completed Tasks:**

1. **Audio Overview - Full Implementation**
   - Created `A2AudioTranscript` component in `A2UIRenderer.tsx` for displaying podcast-style transcripts
   - Added `audio_transcript` type to `A2UIComponent` interface in `shared/schema.ts`
   - Integrated ElevenLabs TTS API for audio generation in `server/routes.ts`
   - Audio generation triggered during `/api/generate` for `audio_overview` content type
   - Added "Generate Audio" button for existing transcripts without audio
   - Created dedicated Audio Overview modal with:
     - Source selection checkboxes with Select All/Deselect All
     - Topic Focus instructions field
     - Purple-themed styling
   - Fixed content parsing in `StudioPanel.tsx` to properly detect audio overview format

2. **Slide Deck - Enhanced Modal & Viewer**
   - Redesigned `CustomizeSlideDeckModal.tsx` with source selection (matching Audio Overview UX)
   - Added source checkboxes with Select All/Deselect All functionality
   - Updated styling with emerald theme for consistency
   - Rewrote `SlideViewer.tsx` with:
     - **16:9 aspect ratio** (proper PowerPoint/Google Slides format)
     - **Vertical scrolling layout** - all slides stacked, first on top
     - Slide number labels above each slide
     - Professional dark gradient design
     - Fullscreen support
     - Download as Markdown option

3. **Database Persistence Fix**
   - Identified PostgreSQL Docker container was stopped after server restart
   - Documented need for `--restart unless-stopped` flag for container persistence

**Technical Details:**

- **ElevenLabs Integration:**
  - Uses `eleven_turbo_v2_5` model for fast TTS
  - Voice ID: `EXAVITQu4vr4xnSDxMaL` (Sarah)
  - Audio returned as base64 data URL embedded in content
  - Graceful fallback if API key missing or fails

- **A2UIComponent Schema Update:**
  - Added `'audio_transcript'` to type union
  - Updated Zod validation schema for message components

**Files Changed:**
- `client/src/components/a2ui/A2UIRenderer.tsx` - Added A2AudioTranscript component
- `client/src/components/panels/StudioPanel.tsx` - Added audio modal, fixed parsing
- `client/src/components/studio/CustomizeSlideDeckModal.tsx` - Added source selection
- `client/src/components/studio/SlideViewer.tsx` - Complete rewrite for vertical 16:9 layout
- `server/routes.ts` - ElevenLabs TTS integration
- `shared/schema.ts` - Added audio_transcript type

**Environment Requirements:**
- `ELEVENLABS_API_KEY` - Required for audio generation (needs `text_to_speech` permission)

---

### 2024-12-17 - CSV Upload & Lead Management System

**Status:** Feature Complete

**Summary:**
Implemented a comprehensive CSV upload and lead management system that allows users to upload CSV files as sources, view them as interactive spreadsheets, select leads for AI context, and integrate with the email builder.

**Features Implemented:**

1. **CSV Upload & Parsing**
   - Added `papaparse` for robust CSV parsing on server
   - Auto-detects column types (email, name, company, phone, title)
   - Enforces 5,000 row limit for performance
   - Stores parsed data as JSON in source content field
   - Skips AI summarization on upload (handled separately)

2. **Spreadsheet Display Component (`A2Spreadsheet.tsx`)**
   - Interactive table with horizontal/vertical scrolling
   - Editable cells (double-click to edit)
   - Row selection for lead context
   - Column type indicators (email, name, company icons)
   - Export to CSV functionality
   - Close button to return to Studio tools

3. **Lead Context System**
   - New `LeadContext` provider for global lead state
   - Selected lead indicator above chat input
   - Lead data injected into AI system prompt
   - AI can reference lead's name, email, company, and all row data

4. **Source Management Improvements**
   - Rename sources via dialog
   - Spreadsheet-aware summarization prompt
   - CSV icon in sources list
   - Click CSV source → opens in Studio panel

5. **Email Builder Integration**
   - Recipient email pre-filled from selected lead

**Technical Details:**

- **Column Detection Patterns:**
  - Email: `/email/, /e-mail/, /mail/`
  - Name: `/^name$/, /respondent/, /contact/`
  - Company: `/company/, /organization/, /org/`
  - Flexible matching with fallback detection in client

- **Lead Context in Chat:**
  - Server builds `leadContextSection` with lead details
  - Injected into both default and workflow system prompts
  - Includes all row data as "Additional Info"

**Files Created:**
- `client/src/components/a2ui/A2Spreadsheet.tsx` - Spreadsheet component
- `client/src/contexts/LeadContext.tsx` - Lead state management

**Files Modified:**
- `shared/schema.ts` - Added `csv` type, `SpreadsheetContent`, `Lead` interfaces
- `server/routes.ts` - CSV parsing, column detection, lead context in chat, name in PATCH
- `server/ai-service.ts` - Spreadsheet-aware summarization
- `client/src/components/panels/StudioPanel.tsx` - CSV view rendering, close button
- `client/src/components/panels/SourcesPanel.tsx` - CSV icon, rename dialog
- `client/src/components/panels/ChatPanel.tsx` - Lead indicator, context passing
- `client/src/components/studio/EmailBuilder.tsx` - Pre-fill recipient
- `client/src/pages/home.tsx` - CSV source click handling
- `client/src/App.tsx` - Added LeadProvider

**Dependencies Added:**
- `papaparse` - CSV parsing
- `@types/papaparse` - TypeScript types

---

## Current Feature Status

### Completed Features ✓
- [x] Multi-notebook management system
- [x] OpenRouter AI integration (15+ models)
- [x] Reports generation with templates
- [x] Mind map visualization (NotebookLM-style)
- [x] Infographic generation modal
- [x] Slide deck generation with 16:9 viewer
- [x] **Audio Overview with ElevenLabs TTS**
- [x] Source selection modals for content generation
- [x] **CSV Upload & Lead Management System**
- [x] Spreadsheet viewer with editable cells
- [x] Lead context injection for AI chat
- [x] Source renaming

### Pending Features
- [ ] Custom report type persistence (save to database)
- [ ] Real web search integration (Serper/Tavily)
- [ ] YouTube transcript extraction
- [ ] Source pinning for context control
- [ ] Voice input/output
- [ ] Export functionality (PDF, Markdown)
- [ ] CRM integration for lead management

---

## Next Steps
See MIGRATION_PLAN.md for detailed implementation steps.
