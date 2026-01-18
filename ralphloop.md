# RALPH: Autonomous Development Loop System

> **For Claude Code:** This document is your operational directive. Read it completely before executing any task. Treat it as immutable law.

---

## 1. What Is Ralph?

Ralph is a loop-based methodology for running coding agents continuously and autonomously. You (Claude Code) will execute in cycles, each cycle completing a single atomic objective before committing and looping.

**Core Principle:** Files are memory, not your context window. Progress persists but failures don't.

**Economics:** Autonomous development costs ~$10.42/hour. Your value lies in specification adherence and execution discipline, not invention.

---

## 2. Directory Structure

Your workspace must follow this structure:

```
/project-root
│
├── .ralph/                      # Your operational brain
│   ├── RALPH.md                 # This file (read first, always)
│   ├── prompts/
│   │   └── current_task.md      # Your immediate objective
│   ├── state/
│   │   └── checkpoint.json      # Persistent state between loops
│   └── scripts/
│       └── run_loop.sh          # Execution harness
│
├── specs/                       # The "Pin" - Source of Truth
│   ├── README.md                # Master specification
│   ├── lookup.md                # Search index (keywords → code locations)
│   ├── features/                # Feature specifications
│   │   └── [feature_name].md
│   └── implementation.md        # Checklist with [x] / [ ] status
│
├── src/                         # Application code
├── tests/                       # Test files
└── logs/                        # Your output logs
```

---

## 3. The Pin: Specification System

### 3.1 Master Spec (`specs/README.md`)

The high-level vision and constraints. Contains:
- Project purpose and scope
- Technology stack decisions
- Non-negotiable constraints
- Integration requirements

### 3.2 Lookup Table (`specs/lookup.md`)

**Critical:** You use search tools. This file improves your hit rate.

```markdown
# Context Lookup Table

| Concept              | Synonyms / Keywords                    | Related Files           |
|----------------------|----------------------------------------|-------------------------|
| Authentication       | Auth, Login, Session, Clerk, Identity  | /src/auth/*             |
| Database             | Supabase, Postgres, Schema, Migration  | /src/db/*               |
| Agents               | Claude SDK, MCP, Orchestration         | /src/agents/*           |
| Workflows            | Trigger.dev, Jobs, Tasks, Queue        | /src/trigger/*          |
| Billing              | Stripe, Subscription, Payment          | /src/billing/*          |
```

**Action:** When you don't find what you're looking for, update this table.

### 3.3 Implementation Plan (`specs/implementation.md`)

Your dynamic checklist. Each item links to specs and code.

```markdown
# Implementation Plan

## Current Phase: [PHASE_NAME]

- [x] **Completed Task**
    - Ref: `specs/features/feature.md` (Section: Data Model)
    - Files: `/src/db/schema.ts`
    
- [ ] **Current Task** ← YOU ARE HERE
    - Ref: `specs/features/feature.md` (Section: API Routes)
    - Action: Implement POST /api/events endpoint
    - Tests: Property-based tests for event validation
    
- [ ] **Next Task**
    - Ref: `specs/features/feature.md` (Section: SDK)
    - Blocked by: Current Task
```

---

## 4. Execution Protocol

### 4.1 Before Every Loop

1. **Read the Pin:** `specs/README.md` → `specs/lookup.md` → `specs/implementation.md`
2. **Identify Current Task:** Find the first `[ ]` item in implementation.md
3. **Load Context:** Read only the referenced spec sections and code files
4. **Confirm Understanding:** State what you're about to do in one sentence

### 4.2 During Each Loop

Execute this cycle:

```
┌─────────────────────────────────────────────────────────┐
│  1. READ: Load Pin + current task context               │
│  2. PLAN: State the single atomic objective             │
│  3. CODE: Implement the smallest working increment      │
│  4. TEST: Run test suite (npm test / cargo test)        │
│  5. GATE: Did tests pass?                               │
│     ├─ YES → Commit + Update implementation.md → Loop   │
│     └─ NO  → Fix without expanding scope → Retry        │
│  6. CHECKPOINT: Save state to .ralph/state/             │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Commit Protocol

Every commit must:
- Pass all tests
- Include only changes for the current task
- Have a descriptive message: `feat(scope): what was done`
- Update `specs/implementation.md` to mark task `[x]`

```bash
git add -A
git commit -m "feat(analytics): implement event ingestion endpoint"
git push origin main
```

### 4.4 Exit Conditions

**Stop the loop when:**
- All items in current phase are `[x]`
- You encounter an ambiguous spec (request clarification)
- Tests fail 3 times on the same issue (escalate)
- You're about to invent something not in the spec

---

## 5. PRD Generation Protocol

When starting a new feature, generate specs through interview:

### 5.1 Initiation Prompt

```
I want to add [FEATURE] to this system. 

Act as a Senior Product Engineer. Interview me to generate a robust 
specification. Ask about:
- User stories and acceptance criteria
- Data models and relationships
- API contracts and integration points
- Edge cases and error handling
- Security and privacy considerations

Do NOT write the spec yet. Gather requirements first.
```

### 5.2 Spec Output Format

After interview, generate:

```markdown
# Feature: [Name]

## Overview
[2-3 sentence description]

## User Stories
- As a [user], I want to [action] so that [benefit]

## Data Model
[Schema definitions with types]

## API Contract
[Endpoints with request/response shapes]

## Integration Points
[How this connects to existing systems]

## Constraints
[Non-negotiable requirements]

## Out of Scope
[Explicitly excluded items]
```

---

## 6. Quality Gates

### 6.1 Mandatory Checks

Before any commit, verify:

- [ ] Tests pass (`npm test` or `cargo test`)
- [ ] No TypeScript/ESLint errors (`npm run lint`)
- [ ] Types are correct (`npm run typecheck`)
- [ ] No hardcoded secrets
- [ ] Follows existing patterns in codebase

### 6.2 Pattern Compliance

**DO:**
- Use existing abstractions (check `specs/lookup.md`)
- Follow i18n patterns if present
- Use established error handling
- Match existing code style

**DO NOT:**
- Invent new patterns without spec approval
- Add dependencies without explicit need
- Refactor unrelated code
- Expand scope beyond current task

---

## 7. Back-Pressure Management

When things go wrong:

### 7.1 Context Rot Detected

Signs: Hallucinating file names, forgetting constraints, repeating mistakes

**Action:**
1. STOP immediately
2. Do NOT argue in chat
3. Save current state to checkpoint
4. Kill the loop
5. Restart with fresh context

### 7.2 Spec Ambiguity

**Action:**
1. STOP execution
2. Document the ambiguity
3. Request human clarification
4. Do NOT guess or invent

### 7.3 Repeated Failures

If the same test fails 3 times:

**Action:**
1. STOP execution
2. Log the failure pattern
3. Create remediation task in implementation.md
4. Escalate to human

---

## 8. State Management

### 8.1 Checkpoint Format (`.ralph/state/checkpoint.json`)

```json
{
  "last_updated": "2025-01-14T10:30:00Z",
  "current_phase": "Phase 2: API Implementation",
  "current_task": "Implement POST /api/events",
  "completed_tasks": ["schema", "migrations"],
  "blocked_tasks": [],
  "failure_count": 0,
  "notes": "Waiting for rate limiting spec clarification"
}
```

### 8.2 Recovery Protocol

On restart:
1. Read checkpoint.json
2. Verify git status matches expected state
3. Resume from last incomplete task
4. Reset failure_count if task changed

---

## 9. Loop Execution Script

### Bash Harness (`.ralph/scripts/run_loop.sh`)

```bash
#!/bin/bash
# Ralph Loop Execution Harness
# Usage: ./.ralph/scripts/run_loop.sh

set -e

PROMPT_FILE=".ralph/prompts/current_task.md"
IMPL_FILE="specs/implementation.md"
MAX_FAILURES=3
FAILURE_COUNT=0

echo "🚀 Starting Ralph Loop..."
echo "📌 Pin: specs/README.md"
echo "📋 Task: $(head -n 1 $PROMPT_FILE 2>/dev/null || echo 'No task file')"

while true; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔄 Loop iteration starting..."
    
    # Execute Claude Code with the current task
    if claude --dangerously-skip-permissions -p "$(cat $PROMPT_FILE)"; then
        echo "✅ Iteration completed successfully"
        FAILURE_COUNT=0
    else
        ((FAILURE_COUNT++))
        echo "❌ Iteration failed (attempt $FAILURE_COUNT/$MAX_FAILURES)"
        
        if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
            echo "🛑 Max failures reached. Stopping loop."
            echo "Review logs and update specs before restarting."
            exit 1
        fi
    fi
    
    # Check if current phase is complete
    if ! grep -q "\- \[ \]" "$IMPL_FILE" 2>/dev/null; then
        echo "🎉 All tasks complete! Stopping loop."
        break
    fi
    
    echo "⏳ Cooling down before next iteration..."
    sleep 5
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 Ralph Loop finished"
```

---

## 10. Current Task Template

### Template (`.ralph/prompts/current_task.md`)

```markdown
# OBJECTIVE: [Single Atomic Goal]

## Context
- **Pin:** Read `specs/README.md` and `specs/lookup.md` first
- **Plan:** Read `specs/implementation.md`, focus on first `[ ]` item
- **Feature Spec:** Read `specs/features/[relevant_feature].md`

## Constraints
1. **Stack:** [TypeScript/Python/Rust as per repo]
2. **Patterns:** Follow existing codebase conventions
3. **Testing:** Write tests before or with implementation
4. **Scope:** Do NOT expand beyond this single objective

## Success Criteria
- [ ] Implementation matches spec exactly
- [ ] All tests pass
- [ ] No lint/type errors
- [ ] Code committed and pushed
- [ ] implementation.md updated with [x]

## Execution
Run until this specific objective is marked complete.
Do NOT proceed to next task without human confirmation.
```

---

## 11. Commands Reference

### For Claude Code

```bash
# Read the Pin
cat specs/README.md
cat specs/lookup.md
cat specs/implementation.md

# Run tests
npm test          # JavaScript/TypeScript
cargo test        # Rust
pytest            # Python

# Lint and typecheck
npm run lint
npm run typecheck

# Commit cycle
git add -A
git commit -m "feat(scope): description"
git push origin main

# Update implementation status
# Edit specs/implementation.md: change [ ] to [x]
```

---

## 12. Anti-Patterns (DO NOT DO)

❌ **Invention:** Creating solutions not specified in the Pin  
❌ **Scope Creep:** Fixing "while I'm here" issues  
❌ **Context Hoarding:** Keeping too much in working memory  
❌ **Argument:** Debating in chat instead of editing specs  
❌ **Skipping Tests:** Committing without green test suite  
❌ **Guessing:** Proceeding when specs are unclear  
❌ **Batch Commits:** Multiple features in one commit  

---

## 13. Quick Start Checklist

For humans setting up a new Ralph workspace:

1. [ ] Create directory structure (Section 2)
2. [ ] Write `specs/README.md` (master spec)
3. [ ] Create `specs/lookup.md` (search index)
4. [ ] Generate feature specs via interview (Section 5)
5. [ ] Create `specs/implementation.md` (task checklist)
6. [ ] Write `.ralph/prompts/current_task.md`
7. [ ] Make `run_loop.sh` executable: `chmod +x .ralph/scripts/run_loop.sh`
8. [ ] Run attended first: watch logs, adjust specs
9. [ ] Scale to unattended once stable

---

**Remember:** The prompt is your steering wheel. The code is just the exhaust.

When in doubt: STOP → READ THE PIN → CLARIFY → CONTINUE