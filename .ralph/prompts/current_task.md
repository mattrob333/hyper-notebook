# OBJECTIVE: Set Up Tool Registration Framework

## Context

- **Pin:** Read `specs/README.md` and `specs/lookup.md` first
- **Plan:** Read `specs/implementation.md`, focus on first `[ ]` item
- **Feature Spec:** Read `specs/features/agent-sdk.md` (Section: Tools)

## Constraints

1. **Stack:** TypeScript, Express.js backend
2. **Patterns:** Follow existing codebase conventions in `server/`
3. **Testing:** Verify tools can be registered
4. **Scope:** Do NOT expand beyond creating the tool framework

## Task Details

Create tool registration framework that:
1. Defines a ToolDefinition interface
2. Exports a registerTools function
3. Creates placeholder tools for: web_search, web_fetch, ask_user
4. Integrates with the agent query options

Target file: `server/agent/tools/index.ts`

## Success Criteria

- [ ] `server/agent/tools/index.ts` created
- [ ] ToolDefinition interface defined
- [ ] At least one placeholder tool created
- [ ] No TypeScript errors (`npm run check`)
- [ ] Code committed: `feat(agent): add tool registration framework`
- [ ] `specs/implementation.md` updated with [x]

## Execution

Run until this specific objective is marked complete.
Do NOT proceed to next task without human confirmation.
