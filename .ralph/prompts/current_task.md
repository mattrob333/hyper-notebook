# OBJECTIVE: Create Agent Configuration

## Context

- **Pin:** Read `specs/README.md` and `specs/lookup.md` first
- **Plan:** Read `specs/implementation.md`, focus on first `[ ]` item
- **Feature Spec:** Read `specs/features/agent-sdk.md` (Section: Configuration)

## Constraints

1. **Stack:** TypeScript, Express.js backend
2. **Patterns:** Follow existing codebase conventions in `server/`
3. **Testing:** Verify configuration loads correctly
4. **Scope:** Do NOT expand beyond creating the config file

## Task Details

Create agent configuration that:
1. Imports from `@anthropic-ai/claude-agent-sdk`
2. Configures the model (claude-sonnet-4-20250514 or similar)
3. Sets up system prompt loading from file
4. Exports a function to create configured agent instances

Target file: `server/agent/config.ts`

## Success Criteria

- [ ] `server/agent/config.ts` created
- [ ] Configuration imports SDK correctly
- [ ] Model configuration specified
- [ ] System prompt path configured
- [ ] No TypeScript errors (`npm run check`)
- [ ] Code committed: `feat(agent): add agent configuration`
- [ ] `specs/implementation.md` updated with [x]

## Execution

Run until this specific objective is marked complete.
Do NOT proceed to next task without human confirmation.
