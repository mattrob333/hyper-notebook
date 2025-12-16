export interface Source {
  id: string;
  type: 'url' | 'pdf' | 'text';
  content: string;
  name: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  action: 'scrape' | 'summarize' | 'generate_mindmap' | 'generate_ui';
  params: Record<string, any>;
}

export interface A2UIComponent {
  id: string;
  type: string;
  parentId?: string;
  properties: Record<string, any>;
  data?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  a2uiComponents?: A2UIComponent[];
  timestamp: Date;
}
