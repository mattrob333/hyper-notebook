# Hyper-Notebook Migration Plan

## Overview
Migrate from Replit-hosted application to standalone deployment with OpenRouter AI backend.

---

## Phase 1: Remove Replit Dependencies

### 1.1 Remove Replit Vite Plugins
- [ ] Uninstall `@replit/vite-plugin-cartographer`
- [ ] Uninstall `@replit/vite-plugin-dev-banner`
- [ ] Uninstall `@replit/vite-plugin-runtime-error-modal`
- [ ] Update `vite.config.ts` to remove conditional Replit plugin loading

### 1.2 Remove Replit Configuration
- [ ] Delete `.replit` file
- [ ] Delete `replit.nix` if present
- [ ] Update any Replit-specific paths or references

### 1.3 Environment Variable Updates
- [ ] Create `.env.example` template
- [ ] Rename `AI_INTEGRATIONS_OPENAI_*` to standard names
- [ ] Rename `AI_INTEGRATIONS_GEMINI_*` to standard names
- [ ] Add `OPENROUTER_API_KEY` variable
- [ ] Update `.gitignore` to exclude `.env`

---

## Phase 2: OpenRouter Integration

### 2.1 Install OpenRouter SDK
- [ ] Install OpenRouter-compatible SDK (uses OpenAI SDK format)
- [ ] Remove Google GenAI SDK dependency

### 2.2 Rewrite AI Service
- [ ] Create new `server/ai-service.ts` with OpenRouter
- [ ] Map existing model IDs to OpenRouter model IDs
- [ ] Implement chat completion (streaming and non-streaming)
- [ ] Implement content generation
- [ ] Test all AI functions

### 2.3 Model Configuration
**OpenRouter Model Mapping:**
| Current Model | OpenRouter Model |
|--------------|------------------|
| gpt-4.1 | openai/gpt-4-turbo |
| gpt-4.1-mini | openai/gpt-4o-mini |
| gpt-4o | openai/gpt-4o |
| gpt-4o-mini | openai/gpt-4o-mini |
| gemini-2.5-pro | google/gemini-pro-1.5 |
| gemini-2.5-flash | google/gemini-flash-1.5 |

**Additional Models to Add:**
- anthropic/claude-3.5-sonnet
- anthropic/claude-3-opus
- meta-llama/llama-3.1-405b
- mistral/mistral-large

### 2.4 Update Frontend Model Selector
- [ ] Update model list in ChatPanel.tsx
- [ ] Add model descriptions and context lengths
- [ ] Group models by provider

---

## Phase 3: Local Development Setup

### 3.1 Database Setup
- [ ] Document PostgreSQL local installation
- [ ] Create database initialization script
- [ ] Test Drizzle migrations locally

### 3.2 Development Scripts
- [ ] Verify `npm run dev` works without Replit
- [ ] Test `npm run build` produces valid output
- [ ] Verify production start works

### 3.3 Documentation
- [ ] Update README.md with local setup instructions
- [ ] Document environment variables
- [ ] Add development workflow guide

---

## Phase 4: GitHub Deployment

### 4.1 Repository Setup
- [ ] Initialize Git if needed
- [ ] Create `.gitignore` with all exclusions
- [ ] Create initial commit
- [ ] Push to GitHub repository

### 4.2 CI/CD (Optional)
- [ ] GitHub Actions for linting/type checking
- [ ] Deployment workflow (Vercel/Railway/Render)

---

## Phase 5: Feature Parity Testing

### 5.1 Core Features
- [ ] Source upload (URL, PDF, text)
- [ ] AI chat with streaming
- [ ] Model switching
- [ ] Content generation (all types)
- [ ] Mindmap visualization
- [ ] Slides generation

### 5.2 Studio Features
- [ ] Workflow creation
- [ ] Custom reports
- [ ] Email builder

---

## Phase 6: NotebookLM Feature Additions (Future)

### 6.1 Core NotebookLM Features
- [ ] Audio Overview generation (podcast-style)
- [ ] Source highlighting and citations
- [ ] Multi-notebook support
- [ ] Source pinning for context control

### 6.2 Enhanced Features
- [ ] Real web search integration (Serper/Tavily API)
- [ ] YouTube transcript extraction
- [ ] Website crawling for sources
- [ ] Voice input/output
- [ ] Collaborative features (multi-user)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API key exposure | Use environment variables, never commit secrets |
| Database migration issues | Test migrations on copy of data first |
| Model compatibility | Test all content types with OpenRouter models |
| Build failures | Incremental changes with testing between steps |

---

## Success Criteria
1. Application runs locally without any Replit dependencies
2. All AI features work via OpenRouter
3. All existing features function identically
4. Code pushed to GitHub repository
5. Documentation complete for new contributors

---

## Timeline
- Phase 1: Remove Replit dependencies (immediate)
- Phase 2: OpenRouter integration (same session)
- Phase 3: Local development setup (same session)
- Phase 4: GitHub deployment (same session)
- Phase 5: Feature testing (same session)
- Phase 6: Future enhancements (ongoing)
