# OBJECTIVE: Create Agent Singleton Pattern

## Context

- **Pin:** Read `specs/README.md` and `specs/lookup.md` first
- **Plan:** Read `specs/implementation.md`, focus on first `[ ]` item
- **Feature Spec:** Read `specs/features/agent-sdk.md` (Section: Instance Management)

## Constraints

1. **Stack:** TypeScript, Express.js backend
2. **Patterns:** Follow existing codebase conventions in `server/`
3. **Testing:** Verify singleton works correctly
4. **Scope:** Do NOT expand beyond creating the instance manager

## Task Details

Create agent singleton that:
1. Manages a single agent session per application
2. Loads system prompt from `systemprompt.md`
3. Uses the config from `server/agent/config.ts`
4. Provides `getAgent()` and `resetAgent()` functions
5. Handles lazy initialization

Target file: `server/agent/instance.ts`

## Success Criteria

- [ ] `server/agent/instance.ts` created
- [ ] Singleton pattern implemented correctly
- [ ] System prompt loaded from file
- [ ] No TypeScript errors (`npm run check`)
- [ ] Code committed: `feat(agent): add agent instance singleton`
- [ ] `specs/implementation.md` updated with [x]

## Execution

Run until this specific objective is marked complete.
Do NOT proceed to next task without human confirmation.
