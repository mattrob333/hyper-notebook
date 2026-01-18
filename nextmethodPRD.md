I'll write a comprehensive PRD that Claude Code can use to transform your existing app. This will be a detailed instruction set covering architecture, UI changes, and integration points.

---

```markdown
# NextMethod Platform Transformation PRD
## From NotebookLM Clone to Claude Agent SDK-Powered Workspace

---

## Executive Summary

This PRD outlines the transformation of the existing NotebookLM-style application into **NextMethod**, a Claude Agent SDK-powered workspace with multi-persona orchestration, autonomous workflows, and advanced document creation capabilities.

**Current State:** A functional NotebookLM clone with three-panel layout, TipTap editor, source management, and basic studio tools.

**Target State:** A Claude Agent SDK-driven platform where:
- The core AI is powered by Claude Agent SDK with a custom system prompt
- AI persona agents can be invoked for collaborative debates
- Trigger.dev workflows run in the background
- TipTap handles all document creation with AI assistance
- Users interact through rich UI components (buttons, sliders, dropdowns)

---

## Part 1: Architecture Changes

### 1.1 Claude Agent SDK Integration

**Current:** The app likely uses direct API calls to Claude or another LLM.

**Required:** Replace the AI backbone with Claude Agent SDK.

#### Implementation Steps:

1. **Install Claude Agent SDK**
   ```bash
   npm install @anthropic-ai/agent-sdk
   ```

2. **Create Agent Configuration** (`/lib/agent/config.ts`)
   ```typescript
   import { Agent } from '@anthropic-ai/agent-sdk';
   
   export const createNextMethodAgent = (systemPrompt: string) => {
     return new Agent({
       name: "NextMethod",
       model: "claude-sonnet-4-20250514",
       system_prompt: systemPrompt,
       // Tools will be registered here
     });
   };
   ```

3. **System Prompt Location**
   - Store the system prompt at: `/lib/agent/system-prompt.md`
   - Load it at agent initialization
   - The system prompt file has already been created in the repo

4. **Agent Singleton Pattern**
   Create a singleton to manage the agent instance across the application:
   ```typescript
   // /lib/agent/instance.ts
   let agentInstance: Agent | null = null;
   
   export const getAgent = async () => {
     if (!agentInstance) {
       const systemPrompt = await loadSystemPrompt();
       agentInstance = createNextMethodAgent(systemPrompt);
       await registerTools(agentInstance);
     }
     return agentInstance;
   };
   ```

### 1.2 Tool Registration

The system prompt references several tools that must be registered with the Claude Agent SDK:

#### Required Tools:

| Tool Name | Purpose | Implementation |
|-----------|---------|----------------|
| `web_search` | Search the web for current information | Use existing search implementation or integrate SerpAPI/Tavily |
| `web_fetch` | Retrieve full page content from URLs | HTTP fetch with content extraction |
| `todo_write` | Create/update todo list items | State management + UI widget |
| `todo_read` | Read current todo state | State query |
| `ask_user` | Render interactive UI components | A2UI component system |
| `spawn_subagent` | Create background task agents | Agent SDK subagent spawning |
| `trigger_workflow` | Execute Trigger.dev workflows | Trigger.dev SDK integration |
| `open_tiptap` | Open document editor with template | UI state + TipTap initialization |
| `send_email` | Send email via Resend | Resend API integration |
| `invoke_persona` | Start persona debate session | Persona orchestration system |

#### Tool Registration Pattern:
```typescript
// /lib/agent/tools/index.ts
export const registerTools = async (agent: Agent) => {
  agent.registerTool({
    name: "ask_user",
    description: "Present interactive UI components to gather user input",
    parameters: {
      component_type: { type: "string", enum: ["ButtonGroup", "Dropdown", "Slider", "CheckboxGroup", "ConfirmButton", "ChipGroup"] },
      options: { type: "array" },
      prompt: { type: "string" }
    },
    execute: async (params) => {
      // Emit event to render A2UI component
      return await renderAndAwaitUserInput(params);
    }
  });
  
  // Register remaining tools...
};
```

### 1.3 Session & State Management

#### Conversation State
```typescript
// /lib/agent/state.ts
interface ConversationState {
  mode: 'direct' | 'orchestrator';
  activePersonas: PersonaAgent[];
  todoItems: TodoItem[];
  activeWorkflows: WorkflowStatus[];
  activeSubagents: SubagentStatus[];
  tiptapDocuments: TiptapDocument[];
}
```

#### State Persistence
- Use React Context or Zustand for client-side state
- Persist conversation history to database (existing Supabase integration)
- Workflow state managed by Trigger.dev

---

## Part 2: Persona Agent System

### 2.1 Persona Data Model

#### Database Schema (Supabase)
```sql
-- Persona agents table
CREATE TABLE persona_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  character_sheet TEXT NOT NULL, -- Full persona prompt
  voice_style JSONB, -- Tone, vocabulary, patterns
  expertise_areas TEXT[],
  context_files UUID[], -- References to loaded documents
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Departments enum
CREATE TYPE department AS ENUM (
  'leadership',
  'marketing', 
  'sales',
  'development',
  'research',
  'operations',
  'finance',
  'legal'
);

-- Persona hierarchy for org chart
CREATE TABLE persona_hierarchy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona_id UUID REFERENCES persona_agents(id),
  reports_to UUID REFERENCES persona_agents(id),
  org_level INTEGER, -- 1=C-suite, 2=VP, 3=Director, 4=Manager, 5=IC
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Persona Agent Class

```typescript
// /lib/personas/PersonaAgent.ts
export interface PersonaAgent {
  id: string;
  name: string;
  role: string;
  department: Department;
  avatarUrl: string;
  characterSheet: string;
  voiceStyle: {
    tone: string;
    vocabulary: string[];
    patterns: string[];
  };
  expertiseAreas: string[];
  contextFiles: string[];
}

export class PersonaAgentRunner {
  private persona: PersonaAgent;
  private baseAgent: Agent;
  
  constructor(persona: PersonaAgent, baseAgent: Agent) {
    this.persona = persona;
    this.baseAgent = baseAgent;
  }
  
  async generateResponse(context: ConversationContext): Promise<string> {
    // Inject persona character sheet as additional system context
    const personaPrompt = this.buildPersonaPrompt();
    
    return await this.baseAgent.run({
      messages: context.messages,
      system_prompt_suffix: personaPrompt
    });
  }
  
  private buildPersonaPrompt(): string {
    return `
You are now speaking as ${this.persona.name}, ${this.persona.role}.

${this.persona.characterSheet}

Voice style:
- Tone: ${this.persona.voiceStyle.tone}
- Vocabulary preferences: ${this.persona.voiceStyle.vocabulary.join(', ')}

Stay fully in character. Do not break character or acknowledge being an AI.
    `;
  }
}
```

### 2.3 Orchestrator Mode Implementation

```typescript
// /lib/personas/Orchestrator.ts
export class DebateOrchestrator {
  private participants: PersonaAgentRunner[];
  private conversationHistory: Message[];
  private currentSpeaker: number = 0;
  
  constructor(personas: PersonaAgent[], baseAgent: Agent) {
    this.participants = personas.map(p => new PersonaAgentRunner(p, baseAgent));
    this.conversationHistory = [];
  }
  
  async initiate(topic: string): Promise<Message> {
    // First speaker addresses the topic
    const firstSpeaker = this.participants[0];
    const opening = await firstSpeaker.generateResponse({
      messages: [{
        role: 'user',
        content: `Address this topic directly, taking a clear position: ${topic}`
      }]
    });
    
    this.conversationHistory.push({
      role: 'assistant',
      persona: firstSpeaker.persona,
      content: opening
    });
    
    return this.conversationHistory[0];
  }
  
  async continueDebate(): Promise<Message> {
    // Rotate to next speaker
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
    
    const message = {
      role: 'assistant',
      persona: speaker.persona,
      content: response
    };
    
    this.conversationHistory.push(message);
    return message;
  }
  
  async detectToolCall(response: string): Promise<ToolCallIntent | null> {
    // Parse response for tool call indicators
    const toolPatterns = [
      { pattern: /I'll get my team on that/i, tool: 'spawn_subagent' },
      { pattern: /Let me research/i, tool: 'trigger_workflow', workflow: 'research' },
      { pattern: /I should draft/i, tool: 'open_tiptap' },
      { pattern: /I'll send that/i, tool: 'send_email' },
      { pattern: /We need data on/i, tool: 'spawn_subagent', type: 'analyst' }
    ];
    
    for (const { pattern, tool, ...params } of toolPatterns) {
      if (pattern.test(response)) {
        return { tool, params };
      }
    }
    return null;
  }
  
  synergize(): SynthesisResult {
    // Extract key points from debate
    return {
      executiveSummary: this.generateSummary(),
      keyDecisions: this.extractDecisions(),
      actionItems: this.extractActionItems(),
      openQuestions: this.extractOpenQuestions(),
      dissentingViews: this.extractDissent()
    };
  }
}
```

---

## Part 3: UI Changes

### 3.1 Main Layout Modifications

#### Current Layout (from screenshots):
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Project Name | Tabs                    | Actions    │
├──────────────┬────────────────────┬─────────────────────────┤
│              │                    │ Studio                  │
│   Sources    │       Chat         │ ┌─────────┬───────────┐ │
│              │                    │ │Audio    │ Mind Map  │ │
│  - Files     │  [Conversation]    │ │Overview │           │ │
│  - RSS       │                    │ ├─────────┼───────────┤ │
│  - Links     │                    │ │Infograph│ Slide Deck│ │
│              │                    │ ├─────────┼───────────┤ │
│              │                    │ │Reports  │ Email     │ │
│              │                    │ └─────────┴───────────┘ │
│              │                    │                         │
│              │                    │ [Notes] [Workflows]     │
│              │                    │                         │
│              │                    │ - Generated outputs     │
│              ├────────────────────┤                         │
│              │ [Input field]      │                         │
└──────────────┴────────────────────┴─────────────────────────┘
```

#### Target Layout:
```
┌─────────────────────────────────────────────────────────────┐
│ Header: NextMethod | Project Name              | Actions    │
├──────────────┬────────────────────┬─────────────────────────┤
│              │                    │ ┌─────────────────────┐ │
│   Sources    │       Chat         │ │ 👥 AGENTS           │ │
│              │                    │ │ [Select Team ▾]     │ │
│  + Add       │  ┌──────────────┐  │ │ ○ Sarah (Marketing) │ │
│              │  │ Persona      │  │ │ ○ David (Tech)      │ │
│  - Files     │  │ avatars when │  │ │ ○ Elena (Dev)       │ │
│  - RSS       │  │ in debate    │  │ │ [Start Discussion]  │ │
│  - Links     │  └──────────────┘  │ ├─────────────────────┤ │
│              │                    │ │ 🛠️ TOOLS            │ │
│  [Search]    │  [Conversation     │ │ Audio | Mind | Slide│ │
│              │   messages with    │ │ Report| Email| Doc  │ │
│              │   A2UI components] │ ├─────────────────────┤ │
│              │                    │ │ ⚡ ACTIVE TASKS     │ │
│              │                    │ │ ┌─────────────────┐ │ │
│              │                    │ │ │ 🔄 Research...  │ │ │
│              │                    │ │ │ ████░░ 67%     │ │ │
│              │                    │ │ └─────────────────┘ │ │
│              ├────────────────────┤ └─────────────────────┘ │
│              │[Synergize] [Input] │                         │
└──────────────┴────────────────────┴─────────────────────────┘
```

### 3.2 New Components Required

#### 3.2.1 Agent Selector Panel (`/components/agents/AgentPanel.tsx`)

```tsx
interface AgentPanelProps {
  agents: PersonaAgent[];
  selectedAgents: string[];
  onSelectionChange: (ids: string[]) => void;
  onStartDiscussion: () => void;
  isDebateActive: boolean;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  agents,
  selectedAgents,
  onSelectionChange,
  onStartDiscussion,
  isDebateActive
}) => {
  const departments = groupBy(agents, 'department');
  
  return (
    <div className="agent-panel">
      <div className="panel-header">
        <Users className="icon" />
        <span>AGENTS</span>
      </div>
      
      <Dropdown
        options={Object.keys(departments)}
        placeholder="Select Team"
        onChange={(dept) => {/* Filter by department */}}
      />
      
      <div className="agent-list">
        {agents.map(agent => (
          <AgentCheckbox
            key={agent.id}
            agent={agent}
            checked={selectedAgents.includes(agent.id)}
            onChange={(checked) => {
              onSelectionChange(
                checked 
                  ? [...selectedAgents, agent.id]
                  : selectedAgents.filter(id => id !== agent.id)
              );
            }}
          />
        ))}
      </div>
      
      <Button
        onClick={onStartDiscussion}
        disabled={selectedAgents.length < 2 || isDebateActive}
      >
        {isDebateActive ? 'Discussion Active' : 'Start Discussion'}
      </Button>
    </div>
  );
};
```

#### 3.2.2 Active Tasks Panel (`/components/tasks/ActiveTasksPanel.tsx`)

```tsx
interface ActiveTask {
  id: string;
  type: 'subagent' | 'workflow';
  name: string;
  description: string;
  progress: number; // 0-100
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  estimatedCompletion?: Date;
}

export const ActiveTasksPanel: React.FC<{ tasks: ActiveTask[] }> = ({ tasks }) => {
  return (
    <div className="active-tasks-panel">
      <div className="panel-header">
        <Zap className="icon" />
        <span>ACTIVE TASKS</span>
      </div>
      
      {tasks.length === 0 ? (
        <div className="empty-state">No active tasks</div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

const TaskCard: React.FC<{ task: ActiveTask }> = ({ task }) => (
  <div className="task-card">
    <div className="task-header">
      {task.type === 'subagent' ? <Bot /> : <Workflow />}
      <span className="task-name">{task.name}</span>
    </div>
    <div className="task-description">{task.description}</div>
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${task.progress}%` }}
      />
    </div>
    <div className="task-meta">
      {task.status === 'running' && <Spinner />}
      <span>{task.progress}%</span>
    </div>
  </div>
);
```

#### 3.2.3 Chat Message with Persona Avatar (`/components/chat/PersonaMessage.tsx`)

```tsx
interface PersonaMessageProps {
  message: {
    id: string;
    content: string;
    persona?: PersonaAgent;
    timestamp: Date;
    toolCalls?: ToolCallResult[];
  };
}

export const PersonaMessage: React.FC<PersonaMessageProps> = ({ message }) => {
  const isPersona = !!message.persona;
  
  return (
    <div className={`message ${isPersona ? 'persona-message' : 'user-message'}`}>
      {isPersona && (
        <div className="persona-avatar">
          <img src={message.persona.avatarUrl} alt={message.persona.name} />
          <div className="persona-info">
            <span className="persona-name">{message.persona.name}</span>
            <span className="persona-role">{message.persona.role}</span>
          </div>
        </div>
      )}
      
      <div className="message-content">
        <ReactMarkdown>{message.content}</ReactMarkdown>
        
        {message.toolCalls?.map(tc => (
          <ToolCallIndicator key={tc.id} toolCall={tc} />
        ))}
      </div>
      
      <div className="message-timestamp">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};
```

#### 3.2.4 A2UI Interactive Components (`/components/a2ui/`)

Create a component library for interactive elements the AI can render:

```tsx
// /components/a2ui/ButtonGroup.tsx
export const A2UIButtonGroup: React.FC<{
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
}> = ({ options, onSelect }) => (
  <div className="a2ui-button-group">
    {options.map(opt => (
      <button key={opt.value} onClick={() => onSelect(opt.value)}>
        {opt.label}
      </button>
    ))}
  </div>
);

// /components/a2ui/Slider.tsx
export const A2UISlider: React.FC<{
  min: number;
  max: number;
  labels: { left: string; right: string };
  onChange: (value: number) => void;
}> = ({ min, max, labels, onChange }) => (
  <div className="a2ui-slider">
    <span className="label-left">{labels.left}</span>
    <input 
      type="range" 
      min={min} 
      max={max} 
      onChange={(e) => onChange(Number(e.target.value))}
    />
    <span className="label-right">{labels.right}</span>
  </div>
);

// /components/a2ui/CheckboxGroup.tsx
export const A2UICheckboxGroup: React.FC<{
  options: { label: string; value: string; checked?: boolean }[];
  onChange: (selected: string[]) => void;
}> = ({ options, onChange }) => {
  const [selected, setSelected] = useState<string[]>(
    options.filter(o => o.checked).map(o => o.value)
  );
  
  const toggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    setSelected(newSelected);
    onChange(newSelected);
  };
  
  return (
    <div className="a2ui-checkbox-group">
      {options.map(opt => (
        <label key={opt.value}>
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
};

// /components/a2ui/index.tsx - Renderer
export const A2UIRenderer: React.FC<{
  component: A2UIComponent;
  onResponse: (response: any) => void;
}> = ({ component, onResponse }) => {
  switch (component.type) {
    case 'ButtonGroup':
      return <A2UIButtonGroup {...component.props} onSelect={onResponse} />;
    case 'Slider':
      return <A2UISlider {...component.props} onChange={onResponse} />;
    case 'CheckboxGroup':
      return <A2UICheckboxGroup {...component.props} onChange={onResponse} />;
    case 'Dropdown':
      return <A2UIDropdown {...component.props} onSelect={onResponse} />;
    case 'ChipGroup':
      return <A2UIChipGroup {...component.props} onSelect={onResponse} />;
    case 'ConfirmButton':
      return <A2UIConfirmButton {...component.props} onConfirm={onResponse} />;
    default:
      return null;
  }
};
```

#### 3.2.5 Synergize Button & Output (`/components/chat/SynergizeButton.tsx`)

```tsx
export const SynergizeButton: React.FC<{
  isDebateActive: boolean;
  onSynergize: () => void;
}> = ({ isDebateActive, onSynergize }) => (
  <button 
    className="synergize-button"
    disabled={!isDebateActive}
    onClick={onSynergize}
  >
    <Sparkles className="icon" />
    Synergize Thread
  </button>
);
```

### 3.3 TipTap Editor Enhancements

#### Current State (from screenshot):
- Basic toolbar present
- Document type tabs (Email, Newsletter, Report, Article, Executive Report)
- Edit/Preview/HTML mode toggle
- Basic formatting options

#### Required Enhancements:

##### 3.3.1 Slide-in Behavior (`/components/editor/TipTapSlidePanel.tsx`)

```tsx
export const TipTapSlidePanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: DocumentTemplate;
  initialContent?: string;
}> = ({ isOpen, onClose, initialTemplate, initialContent }) => {
  return (
    <div className={`tiptap-slide-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <button onClick={onClose}>
          <ChevronRight />
        </button>
        <DocumentTabs />
        <div className="panel-actions">
          <button>Preview</button>
          <button>HTML</button>
          <button>Save</button>
          <button>Export</button>
        </div>
      </div>
      
      <div className="panel-content">
        <TipTapEditor
          template={initialTemplate}
          content={initialContent}
        />
        <DocumentPreview />
      </div>
    </div>
  );
};
```

##### 3.3.2 AI Slash Commands (`/components/editor/extensions/AICommands.ts`)

```typescript
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export const AICommands = Extension.create({
  name: 'aiCommands',
  
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },
  
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const aiCommandItems = [
  {
    title: 'Generate',
    command: '/generate',
    description: 'AI writes content from context',
    action: async (editor, agent) => {
      const content = await agent.run({
        tool: 'generate_content',
        context: editor.getHTML()
      });
      editor.commands.insertContent(content);
    }
  },
  {
    title: 'Expand',
    command: '/expand',
    description: 'Elaborate on selected text',
    action: async (editor, agent) => {
      const selection = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(selection.from, selection.to);
      const expanded = await agent.run({
        tool: 'expand_text',
        text: selectedText
      });
      editor.commands.insertContentAt(selection.to, expanded);
    }
  },
  {
    title: 'Compress',
    command: '/compress',
    description: 'Tighten selected text',
    action: async (editor, agent) => {
      // Similar pattern
    }
  },
  {
    title: 'Rewrite',
    command: '/rewrite',
    description: 'Rewrite with specified tone',
    action: async (editor, agent, tone) => {
      // Similar pattern with tone parameter
    }
  },
  {
    title: 'Proofread',
    command: '/proofread',
    description: 'Fix grammar and clarity',
    action: async (editor, agent) => {
      // Similar pattern
    }
  },
  {
    title: 'Research',
    command: '/research',
    description: 'Insert research findings',
    action: async (editor, agent, topic) => {
      // Trigger research workflow, insert results
    }
  },
  {
    title: 'Outline',
    command: '/outline',
    description: 'Generate document structure',
    action: async (editor, agent) => {
      // Generate and insert outline
    }
  }
];
```

##### 3.3.3 Template System (`/lib/templates/`)

```typescript
// /lib/templates/types.ts
export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'email' | 'proposal' | 'sop' | 'blog' | 'social' | 'report' | 'blank';
  structure: TemplateSection[];
  styles: TemplateStyles;
  letterhead?: LetterheadConfig;
}

export interface TemplateSection {
  id: string;
  name: string;
  placeholder: string;
  required: boolean;
}

export interface LetterheadConfig {
  logoUrl: string;
  companyName: string;
  tagline?: string;
  contactInfo: {
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  colors: {
    primary: string;
    secondary: string;
  };
}

// /lib/templates/email.ts
export const emailTemplate: DocumentTemplate = {
  id: 'email-default',
  name: 'Email',
  type: 'email',
  structure: [
    { id: 'subject', name: 'Subject Line', placeholder: 'Enter subject...', required: true },
    { id: 'greeting', name: 'Greeting', placeholder: 'Hi [Name],', required: true },
    { id: 'body', name: 'Body', placeholder: 'Your message...', required: true },
    { id: 'cta', name: 'Call to Action', placeholder: 'What should they do?', required: false },
    { id: 'signature', name: 'Signature', placeholder: 'Best regards,...', required: true }
  ],
  styles: {
    fontFamily: 'system-ui',
    fontSize: '14px',
    lineHeight: 1.6
  }
};

// /lib/templates/proposal.ts
export const proposalTemplate: DocumentTemplate = {
  id: 'proposal-default',
  name: 'Proposal',
  type: 'proposal',
  structure: [
    { id: 'title', name: 'Title', placeholder: 'Proposal Title', required: true },
    { id: 'executive-summary', name: 'Executive Summary', placeholder: '...', required: true },
    { id: 'problem', name: 'Problem Statement', placeholder: '...', required: true },
    { id: 'solution', name: 'Proposed Solution', placeholder: '...', required: true },
    { id: 'scope', name: 'Scope of Work', placeholder: '...', required: true },
    { id: 'timeline', name: 'Timeline', placeholder: '...', required: true },
    { id: 'investment', name: 'Investment', placeholder: '...', required: true },
    { id: 'terms', name: 'Terms & Conditions', placeholder: '...', required: false },
    { id: 'signature', name: 'Signature Block', placeholder: '...', required: true }
  ],
  styles: {
    fontFamily: 'Georgia, serif',
    fontSize: '12pt',
    lineHeight: 1.5
  },
  letterhead: {
    // Loaded from organization settings
  }
};
```

---

## Part 4: Trigger.dev Integration

### 4.1 Workflow Definitions

Create workflow definitions that can be triggered by the agent:

```typescript
// /trigger/workflows/research-competitor.ts
import { task } from "@trigger.dev/sdk/v3";

export const researchCompetitor = task({
  id: "research-competitor",
  run: async (payload: { companyName: string; depth: 'quick' | 'standard' | 'deep' }) => {
    const { companyName, depth } = payload;
    
    // Step 1: Web search for company info
    const searchResults = await webSearch(`${companyName} company overview`);
    
    // Step 2: Fetch detailed pages
    const detailedInfo = await Promise.all(
      searchResults.slice(0, depth === 'deep' ? 10 : 5).map(fetchAndExtract)
    );
    
    // Step 3: Analyze with Claude
    const analysis = await analyzeCompetitor(companyName, detailedInfo);
    
    // Step 4: Generate report
    const report = await generateReport(analysis);
    
    return {
      companyName,
      analysis,
      report,
      sources: searchResults.map(r => r.url)
    };
  }
});

// /trigger/workflows/content-blog-post.ts
export const contentBlogPost = task({
  id: "content-blog-post",
  run: async (payload: { 
    topic: string; 
    keywords: string[]; 
    tone: string;
    length: 'short' | 'medium' | 'long';
  }) => {
    // Step 1: Research topic
    const research = await researchTopic(payload.topic);
    
    // Step 2: Generate outline
    const outline = await generateOutline(payload.topic, research);
    
    // Step 3: Write sections
    const sections = await Promise.all(
      outline.sections.map(section => writeSection(section, payload.tone))
    );
    
    // Step 4: Compile and optimize
    const draft = await compileBlogPost(sections);
    const optimized = await seoOptimize(draft, payload.keywords);
    
    return {
      title: optimized.title,
      content: optimized.content,
      meta: optimized.meta,
      readingTime: calculateReadingTime(optimized.content)
    };
  }
});

// /trigger/workflows/outreach-email-campaign.ts
export const outreachEmailCampaign = task({
  id: "outreach-email-campaign",
  run: async (payload: {
    recipients: { email: string; name: string; context?: string }[];
    template: string;
    subject: string;
    sendAt?: Date;
  }) => {
    const results = [];
    
    for (const recipient of payload.recipients) {
      // Personalize email
      const personalized = await personalizeEmail(
        payload.template,
        recipient
      );
      
      // Send via Resend
      const result = await resend.emails.send({
        from: 'sender@nextmethod.ai',
        to: recipient.email,
        subject: payload.subject,
        html: personalized
      });
      
      results.push({
        recipient: recipient.email,
        messageId: result.id,
        status: 'sent'
      });
    }
    
    return { sent: results.length, results };
  }
});
```

### 4.2 Workflow Status Streaming

```typescript
// /lib/trigger/status.ts
import { runs } from "@trigger.dev/sdk/v3";

export const subscribeToWorkflowStatus = (
  runId: string,
  onUpdate: (status: WorkflowStatus) => void
) => {
  const subscription = runs.subscribeToRun(runId);
  
  subscription.on('status', (status) => {
    onUpdate({
      id: runId,
      status: status.status,
      progress: calculateProgress(status),
      currentStep: status.currentStep,
      output: status.output
    });
  });
  
  return () => subscription.unsubscribe();
};
```

---

## Part 5: Resend Email Integration

### 5.1 Email Service (`/lib/email/resend.ts`)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  html,
  from = 'NextMethod <noreply@nextmethod.ai>',
  replyTo,
  attachments
}: SendEmailParams) => {
  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    replyTo,
    attachments
  });
  
  return {
    id: result.id,
    status: 'sent',
    timestamp: new Date()
  };
};

export const sendBatch = async (emails: SendEmailParams[]) => {
  const results = await resend.batch.send(
    emails.map(email => ({
      from: email.from || 'NextMethod <noreply@nextmethod.ai>',
      to: email.to,
      subject: email.subject,
      html: email.html
    }))
  );
  
  return results;
};
```

### 5.2 Email Templates (`/lib/email/templates/`)

```typescript
// /lib/email/templates/render.ts
export const renderEmailTemplate = async (
  template: EmailTemplate,
  variables: Record<string, string>
): Promise<string> => {
  let html = template.html;
  
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return html;
};
```

---

## Part 6: Right Panel Restructure

### 6.1 New Panel Structure

The right panel should be reorganized into three collapsible sections:

```tsx
// /components/panels/RightPanel.tsx
export const RightPanel: React.FC = () => {
  return (
    <div className="right-panel">
      {/* Section 1: Agents */}
      <CollapsibleSection 
        title="AGENTS" 
        icon={<Users />}
        defaultOpen={true}
      >
        <AgentPanel />
      </CollapsibleSection>
      
      {/* Section 2: Tools */}
      <CollapsibleSection 
        title="TOOLS" 
        icon={<Wrench />}
        defaultOpen={true}
      >
        <ToolsGrid />
      </CollapsibleSection>
      
      {/* Section 3: Active Tasks */}
      <CollapsibleSection 
        title="ACTIVE TASKS" 
        icon={<Zap />}
        defaultOpen={true}
      >
        <ActiveTasksPanel />
      </CollapsibleSection>
    </div>
  );
};
```

### 6.2 Tools Grid

```tsx
// /components/panels/ToolsGrid.tsx
const tools = [
  { id: 'audio', name: 'Audio Overview', icon: <Headphones />, color: 'green' },
  { id: 'mindmap', name: 'Mind Map', icon: <GitBranch />, color: 'blue' },
  { id: 'slides', name: 'Slide Deck', icon: <Presentation />, color: 'purple' },
  { id: 'infographic', name: 'Infographic', icon: <BarChart />, color: 'orange' },
  { id: 'report', name: 'Reports', icon: <FileText />, color: 'red' },
  { id: 'email', name: 'Email', icon: <Mail />, color: 'cyan' },
  { id: 'document', name: 'Document', icon: <File />, color: 'gray' }
];

export const ToolsGrid: React.FC = () => {
  const handleToolClick = (toolId: string) => {
    switch (toolId) {
      case 'email':
      case 'document':
      case 'report':
        // Open TipTap with appropriate template
        openTipTap({ template: toolId });
        break;
      case 'audio':
        // Trigger audio generation workflow
        triggerWorkflow('audio-overview');
        break;
      // ... etc
    }
  };
  
  return (
    <div className="tools-grid">
      {tools.map(tool => (
        <button
          key={tool.id}
          className={`tool-button tool-${tool.color}`}
          onClick={() => handleToolClick(tool.id)}
        >
          {tool.icon}
          <span>{tool.name}</span>
        </button>
      ))}
    </div>
  );
};
```

---

## Part 7: Chat Interface Updates

### 7.1 Enhanced Chat Container

```tsx
// /components/chat/ChatContainer.tsx
export const ChatContainer: React.FC = () => {
  const { 
    messages, 
    mode, 
    activePersonas,
    isDebateActive 
  } = useChatState();
  
  return (
    <div className="chat-container">
      {/* Persona indicators when in orchestrator mode */}
      {mode === 'orchestrator' && activePersonas.length > 0 && (
        <div className="active-personas-bar">
          {activePersonas.map(persona => (
            <PersonaChip key={persona.id} persona={persona} />
          ))}
        </div>
      )}
      
      {/* Message list */}
      <div className="message-list">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      
      {/* Input area with Synergize button */}
      <div className="chat-input-area">
        {isDebateActive && (
          <SynergizeButton onSynergize={handleSynergize} />
        )}
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
};
```

### 7.2 Message Rendering with A2UI

```tsx
// /components/chat/ChatMessage.tsx
export const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  // Check if message contains A2UI components
  const a2uiComponents = extractA2UIComponents(message.content);
  
  return (
    <div className={`chat-message ${message.role}`}>
      {message.persona && (
        <PersonaAvatar persona={message.persona} />
      )}
      
      <div className="message-body">
        {/* Render text content */}
        <div className="message-text">
          <ReactMarkdown>{stripA2UITags(message.content)}</ReactMarkdown>
        </div>
        
        {/* Render any A2UI components */}
        {a2uiComponents.map((component, i) => (
          <A2UIRenderer
            key={i}
            component={component}
            onResponse={(response) => handleA2UIResponse(message.id, response)}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## Part 8: State Management

### 8.1 Zustand Store

```typescript
// /lib/store/index.ts
import { create } from 'zustand';

interface NextMethodState {
  // Mode
  mode: 'direct' | 'orchestrator';
  setMode: (mode: 'direct' | 'orchestrator') => void;
  
  // Conversation
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  
  // Personas
  availablePersonas: PersonaAgent[];
  selectedPersonas: string[];
  activeDebate: DebateOrchestrator | null;
  selectPersona: (id: string) => void;
  deselectPersona: (id: string) => void;
  startDebate: (topic: string) => Promise<void>;
  continueDebate: () => Promise<void>;
  endDebate: () => void;
  
  // Tasks
  activeTasks: ActiveTask[];
  addTask: (task: ActiveTask) => void;
  updateTask: (id: string, updates: Partial<ActiveTask>) => void;
  removeTask: (id: string) => void;
  
  // TipTap
  isTipTapOpen: boolean;
  tipTapTemplate: DocumentTemplate | null;
  tipTapContent: string;
  openTipTap: (params: { template?: string; content?: string }) => void;
  closeTipTap: () => void;
  
  // Todo
  todoItems: TodoItem[];
  addTodo: (item: TodoItem) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  
  // Sources
  sources: Source[];
  addSource: (source: Source) => void;
  removeSource: (id: string) => void;
}

export const useNextMethodStore = create<NextMethodState>((set, get) => ({
  // Implementation...
}));
```

---

## Part 9: File Structure Summary

After implementation, the project structure should include:

```
/app
  /api
    /agent
      route.ts              # Claude Agent SDK endpoint
    /workflows
      /[workflowId]
        route.ts            # Trigger.dev webhook handlers
    /email
      route.ts              # Resend email endpoint
  /page.tsx                 # Main app page
  
/components
  /a2ui
    ButtonGroup.tsx
    Slider.tsx
    CheckboxGroup.tsx
    Dropdown.tsx
    ChipGroup.tsx
    ConfirmButton.tsx
    index.tsx               # A2UI Renderer
  /agents
    AgentPanel.tsx
    AgentCheckbox.tsx
    PersonaChip.tsx
    PersonaAvatar.tsx
  /chat
    ChatContainer.tsx
    ChatMessage.tsx
    ChatInput.tsx
    PersonaMessage.tsx
    SynergizeButton.tsx
  /editor
    TipTapSlidePanel.tsx
    TipTapEditor.tsx
    DocumentTabs.tsx
    /extensions
      AICommands.ts
  /panels
    RightPanel.tsx
    ToolsGrid.tsx
    ActiveTasksPanel.tsx
    CollapsibleSection.tsx
  /tasks
    TaskCard.tsx
    
/lib
  /agent
    config.ts
    instance.ts
    system-prompt.md        # The NextMethod system prompt
    /tools
      index.ts
      askUser.ts
      webSearch.ts
      triggerWorkflow.ts
      openTipTap.ts
      sendEmail.ts
      spawnSubagent.ts
  /personas
    PersonaAgent.ts
    Orchestrator.ts
    debateProtocol.ts
  /templates
    types.ts
    email.ts
    proposal.ts
    sop.ts
    blog.ts
    social.ts
  /email
    resend.ts
    /templates
      render.ts
  /store
    index.ts
  /trigger
    status.ts
    
/trigger
  /workflows
    research-competitor.ts
    research-market.ts
    content-blog-post.ts
    content-email-sequence.ts
    outreach-email-campaign.ts
    document-proposal.ts
    
/skills
  /docx
    SKILL.md
  /email
    SKILL.md
  /social
    SKILL.md
  /research
    SKILL.md
  /code
    SKILL.md
```

---

## Part 10: Implementation Order

### Phase 1: Core Infrastructure (Week 1)
1. Install Claude Agent SDK
2. Create agent configuration and singleton
3. Integrate system prompt
4. Set up basic tool registration framework
5. Create Zustand store structure

### Phase 2: Persona System (Week 1-2)
1. Create persona database schema
2. Implement PersonaAgent class
3. Build DebateOrchestrator
4. Create agent selection UI components
5. Add persona message rendering

### Phase 3: UI Updates (Week 2)
1. Restructure right panel (Agents → Tools → Tasks)
2. Build A2UI component library
3. Add Synergize button and functionality
4. Implement TipTap slide-in behavior
5. Add active tasks panel

### Phase 4: Tool Integrations (Week 2-3)
1. Implement Trigger.dev workflow triggers
2. Add workflow status streaming
3. Integrate Resend email sending
4. Add TipTap AI slash commands
5. Connect document templates

### Phase 5: Polish & Testing (Week 3)
1. End-to-end testing of persona debates
2. Workflow execution testing
3. Email delivery testing
4. UI/UX refinement
5. Performance optimization

---

## Appendix A: Component CSS (Tailwind)

```css
/* Agent Panel */
.agent-panel {
  @apply flex flex-col gap-3 p-3;
}

.agent-list {
  @apply flex flex-col gap-2 max-h-48 overflow-y-auto;
}

/* Active Tasks */
.task-card {
  @apply bg-gray-800 rounded-lg p-3 flex flex-col gap-2;
}

.progress-bar {
  @apply h-1.5 bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-green-500 transition-all duration-300;
}

/* TipTap Slide Panel */
.tiptap-slide-panel {
  @apply fixed right-0 top-0 h-full w-0 bg-gray-900 transition-all duration-300 overflow-hidden z-50;
}

.tiptap-slide-panel.open {
  @apply w-[60vw];
}

/* A2UI Components */
.a2ui-button-group {
  @apply flex gap-2 my-3;
}

.a2ui-button-group button {
  @apply px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors;
}

/* Persona Message */
.persona-message {
  @apply flex gap-3 p-4;
}

.persona-avatar {
  @apply flex-shrink-0 flex flex-col items-center gap-1;
}

.persona-avatar img {
  @apply w-10 h-10 rounded-full;
}

/* Synergize Button */
.synergize-button {
  @apply flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors;
}

.synergize-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}
```

---

## Appendix B: Environment Variables Required

```env
# Claude Agent SDK
ANTHROPIC_API_KEY=sk-ant-...

# Trigger.dev
TRIGGER_API_KEY=tr_...
TRIGGER_API_URL=https://api.trigger.dev

# Resend
RESEND_API_KEY=re_...

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# App Config
NEXT_PUBLIC_APP_NAME=NextMethod
NEXT_PUBLIC_APP_URL=https://nextmethod.ai
```

---

This PRD provides Claude Code with comprehensive instructions for transforming the existing application. It covers architecture, component structure, data models, integrations, and implementation order.
```

---

That's the complete PRD. It's designed to give Claude Code everything it needs to understand the transformation from your current NotebookLM clone to the NextMethod platform with Claude Agent SDK integration.

Want me to also create the SKILL.md files for the key capabilities, or the persona character sheet template?