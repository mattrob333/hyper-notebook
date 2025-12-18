/**
 * Hyper-Notebook Workflow Schema
 * 
 * This file defines the complete schema for Generative UI Workflows.
 * Workflows are step-based wizards that guide users through tasks using A2UI components.
 * 
 * AI systems can use this schema to programmatically generate new workflows.
 */

import { z } from 'zod';

// =============================================================================
// WORKFLOW CATEGORIES
// =============================================================================

export const WORKFLOW_CATEGORIES = [
  'onboarding',
  'strategy',
  'sales',
  'marketing',
  'content',
  'design',
  'product',
  'operations',
  'legal',
  'customer',
  'productivity',
  'meta',
] as const;

export type WorkflowCategory = typeof WORKFLOW_CATEGORIES[number];

// =============================================================================
// A2UI STEP COMPONENT TYPES
// =============================================================================

/**
 * All available A2UI components that can be used in workflow steps.
 * Each component has specific properties and behaviors.
 */
export const STEP_COMPONENT_TYPES = [
  // Selection Components
  'role_selector',      // Grid of role cards with icons (single select)
  'card_selector',      // Grid of cards (single or multi select)
  'icon_grid',          // Grid of icon buttons
  'checkbox_list',      // List of checkboxes
  'radio_list',         // List of radio buttons
  'chip_selector',      // Inline chips/badges (multi-select)
  'dropdown',           // Single dropdown select
  'multi_dropdown',     // Multi-select dropdown
  
  // Input Components
  'text_input',         // Single line text input
  'textarea',           // Multi-line text area
  'number_input',       // Number input with optional min/max
  'slider',             // Range slider with labels
  'rating',             // Star or numeric rating
  'date_picker',        // Date selection
  'time_picker',        // Time selection
  'file_upload',        // File upload zone
  'url_input',          // URL input with validation
  'tag_input',          // Tag/chip input
  
  // Display Components
  'hero_card',          // Large welcome/intro card
  'info_card',          // Informational card
  'stat_card',          // Statistics display
  'progress_ring',      // Circular progress indicator
  'progress_bar',       // Linear progress bar
  'checklist',          // Read-only checklist display
  'timeline_display',   // Timeline visualization
  'comparison_table',   // Side-by-side comparison
  'profile_card',       // User/entity profile display
  
  // Interactive Components
  'accordion',          // Expandable sections
  'tabs',               // Tab navigation
  'stepper',            // Step indicator
  'carousel',           // Swipeable cards
  'kanban',             // Kanban board layout
  
  // AI-Generated Components
  'ai_generate',        // Trigger AI generation with loading state
  'ai_suggestions',     // AI-generated suggestion cards
  'ai_summary',         // AI-generated summary display
  
  // Action Components
  'button_group',       // Group of action buttons
  'cta_card',           // Call-to-action card
  'confirmation',       // Confirmation dialog/step
  'celebration',        // Success/completion animation
] as const;

export type StepComponentType = typeof STEP_COMPONENT_TYPES[number];

// =============================================================================
// COMPONENT PROPERTY SCHEMAS
// =============================================================================

/**
 * Base properties shared by all step components
 */
const BaseComponentPropsSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional().default(false),
  disabled: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  className: z.string().optional(),
});

/**
 * Option item used in selectors
 */
export const OptionItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),           // Emoji or Lucide icon name
  image: z.string().optional(),          // Image URL
  badge: z.string().optional(),          // Badge text (e.g., "Popular", "New")
  badgeVariant: z.enum(['default', 'secondary', 'destructive', 'outline']).optional(),
  disabled: z.boolean().optional(),
  metadata: z.record(z.any()).optional(), // Additional data
});

export type OptionItem = z.infer<typeof OptionItemSchema>;

/**
 * Properties for selection components
 */
export const SelectionComponentPropsSchema = BaseComponentPropsSchema.extend({
  options: z.array(OptionItemSchema),
  multiSelect: z.boolean().optional().default(false),
  minSelect: z.number().optional(),
  maxSelect: z.number().optional(),
  columns: z.number().optional().default(2),  // Grid columns
  showSearch: z.boolean().optional().default(false),
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * Properties for input components
 */
export const InputComponentPropsSchema = BaseComponentPropsSchema.extend({
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  validation: z.object({
    pattern: z.string().optional(),       // Regex pattern
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min: z.number().optional(),           // For numbers
    max: z.number().optional(),
    customMessage: z.string().optional(), // Custom error message
  }).optional(),
});

/**
 * Properties for slider component
 */
export const SliderComponentPropsSchema = BaseComponentPropsSchema.extend({
  min: z.number().default(0),
  max: z.number().default(100),
  step: z.number().default(1),
  defaultValue: z.number().optional(),
  showValue: z.boolean().optional().default(true),
  leftLabel: z.string().optional(),
  rightLabel: z.string().optional(),
  marks: z.array(z.object({
    value: z.number(),
    label: z.string(),
  })).optional(),
});

/**
 * Properties for file upload component
 */
export const FileUploadPropsSchema = BaseComponentPropsSchema.extend({
  acceptedTypes: z.array(z.string()).optional(), // e.g., ['.pdf', '.docx', 'image/*']
  maxFiles: z.number().optional().default(10),
  maxSizeBytes: z.number().optional(),
  showPreview: z.boolean().optional().default(true),
});

/**
 * Properties for AI generation component
 */
export const AIGeneratePropsSchema = BaseComponentPropsSchema.extend({
  prompt: z.string(),                     // AI prompt template (can use {{variables}})
  outputFormat: z.enum(['text', 'json', 'markdown', 'options']).default('text'),
  outputSchema: z.record(z.any()).optional(), // JSON schema for structured output
  model: z.string().optional(),           // Override default model
  loadingText: z.string().optional().default('Generating...'),
  autoTrigger: z.boolean().optional().default(false), // Auto-run when step loads
});

/**
 * Properties for display components
 */
export const DisplayComponentPropsSchema = BaseComponentPropsSchema.extend({
  title: z.string().optional(),
  content: z.string().optional(),         // Markdown content
  icon: z.string().optional(),
  variant: z.enum(['default', 'success', 'warning', 'error', 'info']).optional(),
});

// =============================================================================
// WORKFLOW STEP SCHEMA
// =============================================================================

/**
 * Conditional logic for showing/hiding steps or components
 */
export const ConditionalSchema = z.object({
  field: z.string(),                      // Reference to another field's value
  operator: z.enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty']),
  value: z.any().optional(),
});

/**
 * A single step in the workflow - using interface for simpler typing
 */
export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  components: Array<{
    type: string;
    props: Record<string, any>;
    stateKey: string;
    conditional?: {
      field: string;
      operator: string;
      value?: any;
    };
  }>;
  canSkip?: boolean;
  autoAdvance?: boolean;
  showInStepper?: boolean;
  validation?: {
    required?: string[];
    custom?: string;
  };
  aiEnhanced?: boolean;
  aiPrompt?: string;
  conditional?: {
    field: string;
    operator: string;
    value?: any;
  };
}

// =============================================================================
// WORKFLOW OUTPUT SCHEMA
// =============================================================================

/**
 * Workflow output configuration
 */
export interface WorkflowOutput {
  type: 'source' | 'generated_content' | 'profile' | 'workflow_data' | 'action';
  template?: string;
  title?: string;
  actionType?: string;
  actionParams?: Record<string, any>;
  nextWorkflow?: string;
  redirectTo?: string;
}

/**
 * Complete workflow definition - using interface for simpler typing
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: WorkflowCategory;
  tags?: string[];
  icon?: string;
  emoji?: string;
  color?: string;
  version?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  estimatedMinutes?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  premium?: boolean;
  steps: WorkflowStep[];
  output: WorkflowOutput;
  initialState?: Record<string, any>;
  requiresSources?: boolean;
  requiredSourceTypes?: string[];
  minSources?: number;
}

// =============================================================================
// WORKFLOW INSTANCE (RUNTIME)
// =============================================================================

/**
 * Runtime state of a workflow being executed
 */
export interface WorkflowInstance {
  id: string;
  workflowId: string;
  notebookId?: string;
  currentStepIndex: number;
  completedSteps: string[];
  state: Record<string, any>;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  outputId?: string;
}

// =============================================================================
// USER WORKFLOW PREFERENCES
// =============================================================================

/**
 * User's workflow preferences and favorites
 */
export interface WorkflowPreferences {
  favorites: string[];
  recentlyUsed: Array<{ workflowId: string; usedAt: string }>;
  hidden: string[];
  customOrder?: string[];
}

// =============================================================================
// AI WORKFLOW BUILDER PRIMER
// =============================================================================

/**
 * This constant contains the AI primer/prompt that can be used to instruct
 * an AI system to generate new workflows programmatically.
 */
export const AI_WORKFLOW_BUILDER_PRIMER = `
# Hyper-Notebook Workflow Builder Primer

You are a workflow builder for Hyper-Notebook, a research and intelligence platform.
Your task is to create step-based wizards that guide users through complex tasks.

## Available Components

### Selection Components
- **role_selector**: Grid of role cards with icons (single select). Use for role/persona selection.
- **card_selector**: Grid of cards (single or multi select). Use for choosing options with descriptions.
- **icon_grid**: Grid of icon buttons. Use for quick visual selection.
- **checkbox_list**: List of checkboxes. Use for multi-select lists.
- **radio_list**: List of radio buttons. Use for single-select lists.
- **chip_selector**: Inline chips/badges (multi-select). Use for tags/categories.
- **dropdown**: Single dropdown select. Use for long lists with single selection.
- **multi_dropdown**: Multi-select dropdown. Use for long lists with multiple selections.

### Input Components
- **text_input**: Single line text. Use for names, titles, short answers.
- **textarea**: Multi-line text. Use for descriptions, long-form input.
- **number_input**: Number input. Use for quantities, scores, budgets.
- **slider**: Range slider. Use for ratings, percentages, scales.
- **rating**: Star or numeric rating. Use for satisfaction, priority.
- **date_picker**: Date selection. Use for deadlines, schedules.
- **time_picker**: Time selection. Use for scheduling.
- **file_upload**: File upload zone. Use for documents, images.
- **url_input**: URL input. Use for website/resource links.
- **tag_input**: Tag/chip input. Use for keywords, categories.

### Display Components
- **hero_card**: Large welcome card. Use for step introductions.
- **info_card**: Informational card. Use for tips, guidance.
- **stat_card**: Statistics display. Use for metrics, scores.
- **progress_ring**: Circular progress. Use for completion status.
- **progress_bar**: Linear progress. Use for step progress.
- **profile_card**: Profile display. Use for showing collected user info.
- **comparison_table**: Side-by-side comparison. Use for options analysis.

### AI Components
- **ai_generate**: Trigger AI generation. Use for creating content based on inputs.
- **ai_suggestions**: AI suggestion cards. Use for recommended options.
- **ai_summary**: AI summary display. Use for generated summaries.

### Action Components
- **button_group**: Group of buttons. Use for actions within a step.
- **cta_card**: Call-to-action. Use for important next steps.
- **confirmation**: Confirmation dialog. Use before finalizing.
- **celebration**: Success animation. Use for completion.

## Workflow Structure

\`\`\`json
{
  "id": "unique-workflow-id",
  "name": "Workflow Name",
  "description": "Full description of what this workflow does",
  "shortDescription": "One-line summary for cards",
  "category": "sales|marketing|strategy|onboarding|...",
  "tags": ["tag1", "tag2"],
  "icon": "LucideIconName",
  "emoji": "🎯",
  "color": "#hexcolor",
  "estimatedMinutes": 10,
  "difficulty": "beginner|intermediate|advanced",
  "steps": [
    {
      "id": "step-1",
      "title": "Step Title",
      "description": "What this step is about",
      "icon": "IconName",
      "components": [
        {
          "type": "component_type",
          "stateKey": "uniqueKeyForValue",
          "props": {
            // Component-specific properties
          }
        }
      ]
    }
  ],
  "output": {
    "type": "source|generated_content|profile|workflow_data",
    "template": "Markdown template with {{stateKey}} variables",
    "title": "Output Title with {{stateKey}}"
  }
}
\`\`\`

## Best Practices

1. **Start with context**: First step should gather basic context (role, objective)
2. **Progressive disclosure**: Each step builds on previous answers
3. **Use AI enhancement**: For steps 2+, use AI to generate personalized options
4. **Mix component types**: Variety keeps users engaged
5. **Clear progress**: Show progress indicator, estimated time remaining
6. **Valuable output**: End with a tangible deliverable (document, profile, plan)
7. **5-9 steps max**: Keep workflows focused and completable
8. **Required fields**: Mark critical fields as required, allow skipping optional steps

## Example: Client Discovery Workflow

\`\`\`json
{
  "id": "client-discovery",
  "name": "Client Discovery & Onboarding",
  "description": "Structured intake process for new client engagements. Gather company info, pain points, goals, and generate a professional client brief.",
  "shortDescription": "New client intake wizard",
  "category": "sales",
  "tags": ["client", "discovery", "onboarding", "intake"],
  "icon": "Users",
  "emoji": "🤝",
  "color": "#10B981",
  "estimatedMinutes": 15,
  "difficulty": "beginner",
  "steps": [
    {
      "id": "company-info",
      "title": "Company Information",
      "description": "Basic details about the client company",
      "icon": "Building",
      "components": [
        {
          "type": "text_input",
          "stateKey": "companyName",
          "props": {
            "label": "Company Name",
            "placeholder": "Enter company name",
            "required": true
          }
        },
        {
          "type": "dropdown",
          "stateKey": "industry",
          "props": {
            "label": "Industry",
            "options": [
              {"id": "tech", "label": "Technology"},
              {"id": "finance", "label": "Finance"},
              {"id": "healthcare", "label": "Healthcare"},
              {"id": "retail", "label": "Retail"},
              {"id": "other", "label": "Other"}
            ]
          }
        },
        {
          "type": "card_selector",
          "stateKey": "companySize",
          "props": {
            "label": "Company Size",
            "columns": 4,
            "options": [
              {"id": "startup", "label": "Startup", "icon": "🚀", "description": "1-10 employees"},
              {"id": "small", "label": "Small", "icon": "🏢", "description": "11-50 employees"},
              {"id": "medium", "label": "Medium", "icon": "🏛️", "description": "51-200 employees"},
              {"id": "enterprise", "label": "Enterprise", "icon": "🌐", "description": "200+ employees"}
            ]
          }
        }
      ]
    },
    {
      "id": "pain-points",
      "title": "Current Challenges",
      "description": "What problems are they trying to solve?",
      "icon": "AlertTriangle",
      "aiEnhanced": true,
      "components": [
        {
          "type": "checkbox_list",
          "stateKey": "painPoints",
          "props": {
            "label": "Select all challenges that apply",
            "options": [
              {"id": "growth", "label": "Struggling to grow revenue", "icon": "📈"},
              {"id": "efficiency", "label": "Operational inefficiency", "icon": "⚙️"},
              {"id": "competition", "label": "Competitive pressure", "icon": "🎯"},
              {"id": "talent", "label": "Hiring/retaining talent", "icon": "👥"},
              {"id": "technology", "label": "Outdated technology", "icon": "💻"}
            ],
            "multiSelect": true
          }
        },
        {
          "type": "textarea",
          "stateKey": "painDetails",
          "props": {
            "label": "Describe the main challenge in detail",
            "placeholder": "What's keeping them up at night?",
            "rows": 4
          }
        },
        {
          "type": "slider",
          "stateKey": "urgency",
          "props": {
            "label": "How urgent is solving this?",
            "min": 1,
            "max": 10,
            "defaultValue": 5,
            "leftLabel": "Nice to have",
            "rightLabel": "Critical"
          }
        }
      ]
    },
    {
      "id": "goals",
      "title": "Desired Outcomes",
      "description": "What does success look like?",
      "icon": "Target",
      "components": [
        {
          "type": "tag_input",
          "stateKey": "goals",
          "props": {
            "label": "Key goals (press Enter to add)",
            "placeholder": "e.g., Increase revenue by 20%"
          }
        },
        {
          "type": "card_selector",
          "stateKey": "timeline",
          "props": {
            "label": "Expected timeline",
            "columns": 3,
            "options": [
              {"id": "immediate", "label": "Immediate", "description": "Within 1 month", "icon": "⚡"},
              {"id": "quarter", "label": "This Quarter", "description": "1-3 months", "icon": "📅"},
              {"id": "year", "label": "This Year", "description": "3-12 months", "icon": "🗓️"}
            ]
          }
        }
      ]
    },
    {
      "id": "budget",
      "title": "Budget & Resources",
      "description": "Investment capacity",
      "icon": "DollarSign",
      "components": [
        {
          "type": "card_selector",
          "stateKey": "budgetRange",
          "props": {
            "label": "Approximate budget range",
            "columns": 2,
            "options": [
              {"id": "small", "label": "$5K - $25K", "icon": "💵"},
              {"id": "medium", "label": "$25K - $100K", "icon": "💰"},
              {"id": "large", "label": "$100K - $500K", "icon": "🏦"},
              {"id": "enterprise", "label": "$500K+", "icon": "💎"}
            ]
          }
        },
        {
          "type": "checkbox_list",
          "stateKey": "resources",
          "props": {
            "label": "Available internal resources",
            "options": [
              {"id": "team", "label": "Dedicated project team"},
              {"id": "executive", "label": "Executive sponsor"},
              {"id": "budget_approved", "label": "Budget pre-approved"},
              {"id": "timeline_flexible", "label": "Flexible timeline"}
            ],
            "multiSelect": true
          }
        }
      ]
    },
    {
      "id": "generate-brief",
      "title": "Client Brief",
      "description": "AI-generated summary of the discovery",
      "icon": "FileText",
      "components": [
        {
          "type": "ai_generate",
          "stateKey": "clientBrief",
          "props": {
            "prompt": "Generate a professional client discovery brief based on: Company: {{companyName}} ({{industry}}, {{companySize}}). Pain points: {{painPoints}}. Details: {{painDetails}}. Urgency: {{urgency}}/10. Goals: {{goals}}. Timeline: {{timeline}}. Budget: {{budgetRange}}. Resources: {{resources}}. Format as a markdown document with sections for Company Overview, Challenges, Goals, Budget & Timeline, and Recommended Next Steps.",
            "outputFormat": "markdown",
            "loadingText": "Generating client brief...",
            "autoTrigger": true
          }
        },
        {
          "type": "ai_summary",
          "stateKey": "clientBriefDisplay",
          "props": {
            "sourceKey": "clientBrief"
          }
        }
      ]
    }
  ],
  "output": {
    "type": "source",
    "title": "Client Brief - {{companyName}}",
    "template": "{{clientBrief}}"
  }
}
\`\`\`

When asked to create a workflow, output ONLY the JSON definition, properly formatted.
`;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate a workflow definition (type assertion)
 */
export function validateWorkflow(workflow: unknown): WorkflowDefinition {
  // Basic runtime validation
  const w = workflow as WorkflowDefinition;
  if (!w.id || !w.name || !w.steps || !Array.isArray(w.steps)) {
    throw new Error('Invalid workflow definition');
  }
  return w;
}

/**
 * Create a new workflow instance
 */
export function createWorkflowInstance(
  workflowId: string,
  notebookId?: string
): WorkflowInstance {
  return {
    id: crypto.randomUUID(),
    workflowId,
    notebookId,
    currentStepIndex: 0,
    completedSteps: [],
    state: {},
    status: 'in_progress',
    startedAt: new Date().toISOString(),
  };
}

/**
 * Get the next step in a workflow
 */
export function getNextStep(
  workflow: WorkflowDefinition,
  instance: WorkflowInstance
): WorkflowStep | null {
  const nextIndex = instance.currentStepIndex + 1;
  if (nextIndex >= workflow.steps.length) {
    return null;
  }
  return workflow.steps[nextIndex];
}

/**
 * Check if a step should be shown based on conditional logic
 */
export function shouldShowStep(
  step: WorkflowStep,
  state: Record<string, any>
): boolean {
  if (!step.conditional) return true;
  
  const { field, operator, value } = step.conditional;
  const fieldValue = state[field];
  
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'notEquals':
      return fieldValue !== value;
    case 'contains':
      return Array.isArray(fieldValue) ? fieldValue.includes(value) : String(fieldValue).includes(value);
    case 'greaterThan':
      return Number(fieldValue) > Number(value);
    case 'lessThan':
      return Number(fieldValue) < Number(value);
    case 'isEmpty':
      return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
    case 'isNotEmpty':
      return !!fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0);
    default:
      return true;
  }
}

/**
 * Interpolate template strings with state values
 */
export function interpolateTemplate(
  template: string,
  state: Record<string, any>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = state[key];
    if (value === undefined) return match;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}
