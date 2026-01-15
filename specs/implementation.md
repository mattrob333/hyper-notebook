# Implementation Plan

## Current Phase: Phase 1 - Core Infrastructure

---

### Phase 1: Core Infrastructure

- [x] **Install Claude Agent SDK**
    - Ref: `specs/features/agent-sdk.md` (Section: Installation)
    - Action: `npm install @anthropic-ai/claude-agent-sdk --legacy-peer-deps`
    - Files: `package.json`
    - Note: Used --legacy-peer-deps due to zod version conflict

- [x] **Create agent configuration**
    - Ref: `specs/features/agent-sdk.md` (Section: Configuration)
    - Action: Created config with Options and SDKSessionOptions support
    - Files: `server/agent/config.ts`

- [x] **Create agent singleton pattern**
    - Ref: `specs/features/agent-sdk.md` (Section: Instance Management)
    - Action: Created query-based agent with system prompt loading
    - Files: `server/agent/instance.ts`

- [x] **Load system prompt from file**
    - Ref: `systemprompt.md`
    - Action: Included in instance.ts with caching
    - Files: `server/agent/instance.ts`

- [x] **Set up tool registration framework**
    - Ref: `specs/features/agent-sdk.md` (Section: Tools)
    - Action: Created MCP server with web_search, web_fetch, ask_user, todo_write tools
    - Files: `server/agent/tools/index.ts`

- [x] **Create Zustand store structure**
    - Ref: `specs/features/state-management.md`
    - Action: Created store with mode, persona, task, todo, tiptap slices
    - Files: `client/src/lib/store/index.ts`

---

### Phase 2: Persona System

- [x] **Create persona database schema**
    - Ref: `specs/features/personas.md` (Section: Data Model)
    - Action: Added persona_agents, persona_hierarchy, debate_sessions tables
    - Files: `shared/schema.ts`, ran `npm run db:push`

- [x] **Implement PersonaAgent class**
    - Ref: `specs/features/personas.md` (Section: Agent Class)
    - Action: Created PersonaAgentRunner with character injection
    - Files: `server/personas/PersonaAgent.ts`

- [x] **Build DebateOrchestrator**
    - Ref: `specs/features/personas.md` (Section: Orchestrator)
    - Action: Implemented multi-persona debate management with turn-taking, tool detection, consensus detection, and synthesis
    - Files: `server/personas/Orchestrator.ts`

- [ ] **Create agent selection UI components**
    - Ref: `specs/features/personas.md` (Section: UI)
    - Action: Build AgentPanel, AgentCheckbox, PersonaChip components
    - Files: `client/src/components/agents/`

- [ ] **Add persona message rendering**
    - Ref: `specs/features/personas.md` (Section: Chat Integration)
    - Action: Update chat to show persona avatars and names
    - Files: `client/src/components/chat/PersonaMessage.tsx`

---

### Phase 3: UI Updates

- [ ] **Restructure right panel**
    - Ref: `nextmethodPRD.md` (Part 6: Right Panel Restructure)
    - Action: Create collapsible sections: Agents → Tools → Tasks
    - Files: `client/src/components/panels/RightPanel.tsx`

- [ ] **Build A2UI component library**
    - Ref: `specs/features/a2ui.md`
    - Action: Create ButtonGroup, Slider, CheckboxGroup, Dropdown, ChipGroup, ConfirmButton
    - Files: `client/src/components/a2ui/`

- [ ] **Add Synergize button**
    - Ref: `systemprompt.md` (synergize_thread section)
    - Action: Add button above chat input that triggers thread synthesis
    - Files: `client/src/components/chat/SynergizeButton.tsx`

- [ ] **Implement TipTap slide-in behavior**
    - Ref: `nextmethodPRD.md` (Part 3.3)
    - Action: Create slide-in panel that overlays from right
    - Files: `client/src/components/editor/TipTapSlidePanel.tsx`

- [ ] **Add active tasks panel**
    - Ref: `nextmethodPRD.md` (Section 3.2.2)
    - Action: Show running workflows/subagents with progress
    - Files: `client/src/components/tasks/ActiveTasksPanel.tsx`

---

### Phase 4: Tool Integrations

- [ ] **Set up Trigger.dev project**
    - Ref: `specs/features/workflows.md`
    - Action: Initialize Trigger.dev, create first workflow
    - Files: `trigger.config.ts`, `trigger/workflows/`

- [ ] **Implement research workflow**
    - Ref: `specs/features/workflows.md` (Section: Research)
    - Action: Create competitor research workflow
    - Files: `trigger/workflows/research-competitor.ts`

- [ ] **Add workflow status streaming**
    - Ref: `nextmethodPRD.md` (Section 4.2)
    - Action: Subscribe to workflow status updates
    - Files: `client/src/lib/trigger/status.ts`

- [ ] **Integrate Resend email sending**
    - Ref: `nextmethodPRD.md` (Part 5)
    - Action: Set up Resend client and send_email tool
    - Files: `server/email/resend.ts`

- [ ] **Add TipTap AI slash commands**
    - Ref: `nextmethodPRD.md` (Section 3.3.2)
    - Action: Implement /generate, /expand, /compress, /rewrite commands
    - Files: `client/src/components/editor/extensions/AICommands.ts`

- [ ] **Connect document templates**
    - Ref: `nextmethodPRD.md` (Section 3.3.3)
    - Action: Create email, proposal, SOP, blog templates
    - Files: `client/src/lib/templates/`

---

### Phase 5: Polish & Testing

- [ ] **End-to-end testing of persona debates**
    - Action: Test full debate flow with multiple personas
    - Tests: Create integration tests

- [ ] **Workflow execution testing**
    - Action: Test Trigger.dev workflow triggers and results
    - Tests: Create workflow tests

- [ ] **Email delivery testing**
    - Action: Test Resend integration
    - Tests: Create email tests

- [ ] **UI/UX refinement**
    - Action: Polish animations, transitions, loading states
    - Files: Various component files

- [ ] **Performance optimization**
    - Action: Profile and optimize slow paths
    - Files: Various

---

## Completion Log

| Date | Task | Commit |
|------|------|--------|
| | | |
