import { Hyperbrowser } from "@hyperbrowser/sdk";
import { 
  workflowTemplates, 
  getWorkflowById, 
  interpolateCode,
  type WorkflowTemplate,
  type WorkflowExecution,
  type WorkflowOutput
} from '../shared/hyperbrowser-workflows';

const HYPERBROWSER_API_KEY = process.env.HYPERBROWSER_API_KEY;

// Store active executions in memory (could be moved to DB for persistence)
const activeExecutions: Map<string, WorkflowExecution> = new Map();

// Create SDK client
function getClient(): Hyperbrowser | null {
  if (!HYPERBROWSER_API_KEY) return null;
  return new Hyperbrowser({ apiKey: HYPERBROWSER_API_KEY });
}

/**
 * Execute a workflow template with given variables
 * Uses the Hyperbrowser SDK for scraping
 */
export async function executeWorkflow(
  workflowId: string,
  variables: Record<string, any>,
  onLog?: (log: string) => void
): Promise<WorkflowExecution> {
  const template = getWorkflowById(workflowId);
  if (!template) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const client = getClient();
  if (!client) {
    throw new Error('HyperBrowser API key not configured');
  }

  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const execution: WorkflowExecution = {
    id: executionId,
    workflowId,
    status: 'pending',
    variables,
    logs: [],
    startedAt: new Date().toISOString()
  };

  activeExecutions.set(executionId, execution);

  const addLog = (msg: string) => {
    execution.logs.push(msg);
    onLog?.(msg);
  };

  try {
    execution.status = 'running';
    addLog(`Starting workflow: ${template.name}`);

    // For now, use the SDK's scrape functionality for URL-based workflows
    // This is a simplified implementation - full Puppeteer scripts would need session management
    const url = variables.url || variables.companyUrl || 
                (variables.companySlug ? `https://www.linkedin.com/company/${variables.companySlug}/` : null) ||
                (variables.query ? `https://www.google.com/search?q=${encodeURIComponent(variables.query)}` : null) ||
                (variables.subreddit ? `https://old.reddit.com/r/${variables.subreddit}/top/` : null) ||
                (variables.owner && variables.repo ? `https://github.com/${variables.owner}/${variables.repo}` : null) ||
                (variables.topic ? `https://news.google.com/search?q=${encodeURIComponent(variables.topic)}` : null) ||
                'https://news.ycombinator.com';

    addLog(`Scraping URL: ${url}`);

    const scrapeResult = await client.scrape.startAndWait({
      url,
      scrapeOptions: {
        formats: ['markdown', 'html'],
      }
    });

    addLog('Scrape completed');

    // Create output based on scraped content
    const output: WorkflowOutput = {
      type: 'markdown',
      title: template.name,
      data: scrapeResult.data?.markdown || scrapeResult.data?.html || 'No content extracted'
    };

    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    execution.output = output;
    
    addLog(`Workflow completed successfully`);

  } catch (error: any) {
    execution.status = 'failed';
    execution.error = error.message;
    execution.completedAt = new Date().toISOString();
    addLog(`Error: ${error.message}`);
  }

  activeExecutions.set(executionId, execution);
  return execution;
}

/**
 * Get execution status
 */
export function getExecution(executionId: string): WorkflowExecution | undefined {
  return activeExecutions.get(executionId);
}

/**
 * Get all workflow templates
 */
export function getAllWorkflows(): WorkflowTemplate[] {
  return workflowTemplates;
}

/**
 * Get workflow template by ID
 */
export function getWorkflow(id: string): WorkflowTemplate | undefined {
  return getWorkflowById(id);
}

/**
 * Check if HyperBrowser is configured
 */
export function isConfigured(): boolean {
  return !!HYPERBROWSER_API_KEY;
}

/**
 * Scrape a single URL and return content (simplified helper)
 */
export async function scrapeUrl(url: string): Promise<{ title: string; content: string; url: string }> {
  const client = getClient();
  if (!client) {
    throw new Error('HyperBrowser API key not configured');
  }

  const scrapeResult = await client.scrape.startAndWait({
    url,
    scrapeOptions: {
      formats: ['markdown', 'html'],
    }
  });

  const title = scrapeResult.data?.metadata?.title;
  const markdown = scrapeResult.data?.markdown;
  const html = scrapeResult.data?.html;
  
  return {
    title: (Array.isArray(title) ? title[0] : title) || 'Untitled',
    content: (Array.isArray(markdown) ? markdown[0] : markdown) || (Array.isArray(html) ? html[0] : html) || '',
    url
  };
}

/**
 * Generate workflow code for AI to display/edit
 */
export function generateWorkflowCode(workflowId: string, variables: Record<string, any>): string {
  const template = getWorkflowById(workflowId);
  if (!template) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }
  
  return interpolateCode(template, variables);
}
