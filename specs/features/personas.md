# Feature: Persona Agent System

## Overview

Enable multi-persona collaborative discussions where AI agents with distinct personalities debate topics, providing diverse perspectives and richer outputs.

## User Stories

- As a user, I want to start a discussion with multiple AI personas about a topic
- As a user, I want each persona to have a distinct voice and expertise
- As a user, I want to synthesize the debate into actionable conclusions
- As a developer, I want personas defined in the database for easy management

## Data Model

### Database Schema (`shared/schema.ts`)

```typescript
// Add to existing schema

export const personaAgents = pgTable("persona_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  department: varchar("department", { length: 50 }).notNull(),
  avatarUrl: text("avatar_url"),
  characterSheet: text("character_sheet").notNull(),
  voiceStyle: jsonb("voice_style").$type<{
    tone: string;
    vocabulary: string[];
    patterns: string[];
  }>(),
  expertiseAreas: text("expertise_areas").array(),
  contextFiles: uuid("context_files").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personaHierarchy = pgTable("persona_hierarchy", {
  id: uuid("id").primaryKey().defaultRandom(),
  personaId: uuid("persona_id").references(() => personaAgents.id),
  reportsTo: uuid("reports_to").references(() => personaAgents.id),
  orgLevel: integer("org_level"), // 1=C-suite, 2=VP, 3=Director, 4=Manager, 5=IC
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type PersonaAgent = typeof personaAgents.$inferSelect;
export type NewPersonaAgent = typeof personaAgents.$inferInsert;
```

### Departments

```typescript
export const DEPARTMENTS = [
  'leadership',
  'marketing',
  'sales',
  'development',
  'research',
  'operations',
  'finance',
  'legal',
] as const;

export type Department = typeof DEPARTMENTS[number];
```

## Agent Class

### PersonaAgentRunner (`server/personas/PersonaAgent.ts`)

```typescript
import { Agent } from '@anthropic-ai/agent-sdk';
import type { PersonaAgent } from '@shared/schema';

interface ConversationContext {
  messages: Array<{ role: string; content: string }>;
}

export class PersonaAgentRunner {
  private persona: PersonaAgent;
  private baseAgent: Agent;

  constructor(persona: PersonaAgent, baseAgent: Agent) {
    this.persona = persona;
    this.baseAgent = baseAgent;
  }

  get id(): string {
    return this.persona.id;
  }

  get name(): string {
    return this.persona.name;
  }

  async generateResponse(context: ConversationContext): Promise<string> {
    const personaPrompt = this.buildPersonaPrompt();

    const response = await this.baseAgent.run({
      messages: context.messages,
      system_prompt_suffix: personaPrompt,
    });

    return response.content;
  }

  private buildPersonaPrompt(): string {
    const { voiceStyle } = this.persona;

    return `
You are now speaking as ${this.persona.name}, ${this.persona.role}.

${this.persona.characterSheet}

Voice style:
- Tone: ${voiceStyle?.tone || 'professional'}
- Vocabulary preferences: ${voiceStyle?.vocabulary?.join(', ') || 'standard business'}

Stay fully in character. Do not break character or acknowledge being an AI.
    `.trim();
  }
}
```

## Orchestrator

### DebateOrchestrator (`server/personas/Orchestrator.ts`)

```typescript
import { Agent } from '@anthropic-ai/agent-sdk';
import { PersonaAgentRunner } from './PersonaAgent';
import type { PersonaAgent } from '@shared/schema';

interface Message {
  role: 'assistant' | 'user';
  persona?: PersonaAgent;
  content: string;
  timestamp: Date;
}

interface SynthesisResult {
  executiveSummary: string;
  keyDecisions: string[];
  actionItems: Array<{ task: string; owner: string; priority: string }>;
  openQuestions: string[];
  dissentingViews: string[];
}

export class DebateOrchestrator {
  private participants: PersonaAgentRunner[];
  private conversationHistory: Message[] = [];
  private currentSpeaker: number = 0;
  private topic: string = '';

  constructor(personas: PersonaAgent[], baseAgent: Agent) {
    this.participants = personas.map(p => new PersonaAgentRunner(p, baseAgent));
  }

  async initiate(topic: string): Promise<Message> {
    this.topic = topic;
    const firstSpeaker = this.participants[0];

    const opening = await firstSpeaker.generateResponse({
      messages: [{
        role: 'user',
        content: `Address this topic directly, taking a clear position: ${topic}`
      }]
    });

    const message: Message = {
      role: 'assistant',
      persona: this.getPersonaForRunner(firstSpeaker),
      content: opening,
      timestamp: new Date(),
    };

    this.conversationHistory.push(message);
    return message;
  }

  async continueDebate(): Promise<Message> {
    this.currentSpeaker = (this.currentSpeaker + 1) % this.participants.length;
    const speaker = this.participants[this.currentSpeaker];

    const response = await speaker.generateResponse({
      messages: this.conversationHistory.map(m => ({
        role: m.persona ? 'assistant' : 'user',
        content: m.persona
          ? `[${m.persona.name}]: ${m.content}`
          : m.content
      }))
    });

    const message: Message = {
      role: 'assistant',
      persona: this.getPersonaForRunner(speaker),
      content: response,
      timestamp: new Date(),
    };

    this.conversationHistory.push(message);
    return message;
  }

  async synergize(): Promise<SynthesisResult> {
    // Use base agent to synthesize the debate
    const synthesisPrompt = `
Analyze this multi-persona debate and produce a synthesis:

Topic: ${this.topic}

Conversation:
${this.conversationHistory.map(m =>
  m.persona ? `[${m.persona.name}]: ${m.content}` : `[User]: ${m.content}`
).join('\n\n')}

Produce:
1. Executive Summary (2-3 sentences)
2. Key Decisions reached
3. Action Items with owners
4. Open Questions
5. Dissenting Views
    `;

    // Implementation would call base agent here
    return {
      executiveSummary: '',
      keyDecisions: [],
      actionItems: [],
      openQuestions: [],
      dissentingViews: [],
    };
  }

  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  private getPersonaForRunner(runner: PersonaAgentRunner): PersonaAgent | undefined {
    // Implementation to get persona object
    return undefined;
  }
}
```

## UI Components

### AgentPanel (`client/src/components/agents/AgentPanel.tsx`)

```typescript
interface AgentPanelProps {
  agents: PersonaAgent[];
  selectedAgents: string[];
  onSelectionChange: (ids: string[]) => void;
  onStartDiscussion: () => void;
  isDebateActive: boolean;
}
```

Component features:
- Department dropdown filter
- Checkbox list of agents
- Avatar + name + role display
- "Start Discussion" button
- Disabled state when debate active

### PersonaMessage (`client/src/components/chat/PersonaMessage.tsx`)

```typescript
interface PersonaMessageProps {
  message: {
    id: string;
    content: string;
    persona?: PersonaAgent;
    timestamp: Date;
  };
}
```

Component features:
- Persona avatar (left side)
- Name and role badge
- Message content with markdown
- Timestamp

## Chat Integration

### State Updates (`client/src/lib/store/index.ts`)

Add to Zustand store:

```typescript
interface PersonaSlice {
  mode: 'direct' | 'orchestrator';
  setMode: (mode: 'direct' | 'orchestrator') => void;

  availablePersonas: PersonaAgent[];
  setAvailablePersonas: (personas: PersonaAgent[]) => void;

  selectedPersonas: string[];
  selectPersona: (id: string) => void;
  deselectPersona: (id: string) => void;

  activeDebate: boolean;
  startDebate: (topic: string) => Promise<void>;
  continueDebate: () => Promise<void>;
  endDebate: () => void;
}
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/personas` | GET | List all personas |
| `/api/personas/:id` | GET | Get single persona |
| `/api/debates` | POST | Start new debate |
| `/api/debates/:id/continue` | POST | Continue debate |
| `/api/debates/:id/synergize` | POST | Synthesize debate |

## Constraints

- Personas must stay fully in character
- Maximum 5 personas per debate
- Debate history persisted to database
- Synthesis follows exact format from system prompt

## Out of Scope

- Custom persona creation UI
- Persona image generation
- Voice synthesis for personas
