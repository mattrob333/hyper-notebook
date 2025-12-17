import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Paperclip, Loader2, Bot, User, Sparkles, ThumbsUp, ThumbsDown, Copy, Pin, Plus, SlidersHorizontal, History, ChevronDown, ArrowUp, Mail, Users, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import A2UIRenderer from "../a2ui/A2UIRenderer";
import OnboardingWorkflow from "../workflows/OnboardingWorkflow";
import ResearchWorkflow from "../workflows/ResearchWorkflow";
import type { ChatMessage, Source, A2UIComponent } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useEmailBuilder } from "@/contexts/EmailBuilderContext";
import { useToast } from "@/hooks/use-toast";

interface SourceSummary {
  id: string;
  name: string;
  summary: string;
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  description: string;
  supportsImages?: boolean;
  supportsStreaming?: boolean;
}

interface ModelsResponse {
  models: ModelInfo[];
  byProvider: Record<string, ModelInfo[]>;
  defaultModel: string;
}

interface ChatPanelProps {
  sources: Source[];
  messages: ChatMessage[];
  onNewMessage: (message: string, response?: string, a2uiComponents?: A2UIComponent[]) => void;
  onClearMessages?: () => void;
  isLoading?: boolean;
  sourceSummaries?: SourceSummary[];
}

function parseA2UIComponents(content: string): { components: A2UIComponent[]; cleanedContent: string } {
  const components: A2UIComponent[] = [];
  let cleanedContent = content;

  // Match JSON code blocks - be more flexible with the pattern
  const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  const blocksToRemove: string[] = [];

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      let isA2UIBlock = false;
      
      if (Array.isArray(parsed)) {
        parsed.forEach((item, idx) => {
          if (item.type && typeof item.type === 'string') {
            isA2UIBlock = true;
            components.push({
              id: item.id || `parsed-${Date.now()}-${idx}`,
              type: item.type,
              parentId: item.parentId,
              properties: item.properties || {},
              data: item.data,
            });
          }
        });
      } else if (parsed.type && typeof parsed.type === 'string') {
        isA2UIBlock = true;
        components.push({
          id: parsed.id || `parsed-${Date.now()}`,
          type: parsed.type,
          parentId: parsed.parentId,
          properties: parsed.properties || {},
          data: parsed.data,
        });
      } else if (parsed.components && Array.isArray(parsed.components)) {
        parsed.components.forEach((item: any, idx: number) => {
          if (item.type && typeof item.type === 'string') {
            isA2UIBlock = true;
            components.push({
              id: item.id || `parsed-${Date.now()}-${idx}`,
              type: item.type,
              parentId: item.parentId,
              properties: item.properties || {},
              data: item.data,
            });
          }
        });
      }
      
      // Mark block for removal if it's A2UI
      if (isA2UIBlock) {
        blocksToRemove.push(match[0]);
      }
    } catch (e) {
      // Not valid JSON, skip
      console.log('JSON parse error:', e);
    }
  }

  // Remove all A2UI blocks from content
  for (const block of blocksToRemove) {
    cleanedContent = cleanedContent.replace(block, '');
  }

  // Clean up extra whitespace
  cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n').trim();

  console.log('parseA2UIComponents result:', { componentsCount: components.length, cleanedContentLength: cleanedContent.length });

  return { components, cleanedContent };
}

// Workflow suggested prompts with special triggers
interface SuggestedPrompt {
  text: string;
  isWorkflow?: boolean;
  workflowId?: string;
  icon?: string;
}

function generateSuggestedPrompts(sources: Source[], sourceSummaries?: SourceSummary[]): SuggestedPrompt[] {
  // Always include workflow triggers first
  const workflowPrompts: SuggestedPrompt[] = [
    { 
      text: "🚀 User Onboarding - Set up your profile", 
      isWorkflow: true, 
      workflowId: 'user-onboarding',
      icon: '🚀'
    },
    { 
      text: "📊 Research & Create Content", 
      isWorkflow: true, 
      workflowId: 'research-content',
      icon: '📊'
    },
  ];

  const contextPrompts: SuggestedPrompt[] = [];

  if (sources.length > 0) {
    const sourceTypes = Array.from(new Set(sources.map(s => s.type)));
    if (sourceTypes.includes('url')) {
      contextPrompts.push({ text: "Summarize the web articles and highlight important links" });
    }
    contextPrompts.push({ text: "Summarize the key points from all sources" });
  } else {
    contextPrompts.push({ text: "Summarize the key points from all sources" });
    contextPrompts.push({ text: "Generate a study guide from this material" });
  }

  // Return 2 workflows + 2 context prompts
  return [...workflowPrompts, ...contextPrompts.slice(0, 2)];
}

export default function ChatPanel({
  sources,
  messages,
  onNewMessage,
  onClearMessages,
  isLoading: externalLoading,
  sourceSummaries
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Email builder context for AI integration
  const emailContext = useEmailBuilder();
  const { toast } = useToast();
  
  // Convert markdown to HTML for email builder
  const markdownToHtml = (markdown: string): string => {
    // Split into lines for processing
    const lines = markdown.split('\n');
    const htmlParts: string[] = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Headers
      if (line.startsWith('### ')) {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push(`<h3>${line.slice(4)}</h3>`);
      } else if (line.startsWith('## ')) {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push(`<h2>${line.slice(3)}</h2>`);
      } else if (line.startsWith('# ')) {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push(`<h1>${line.slice(2)}</h1>`);
      }
      // List items
      else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
        if (!inList) { htmlParts.push('<ul>'); inList = true; }
        const content = line.slice(2);
        htmlParts.push(`<li>${content}</li>`);
      }
      // Horizontal rule
      else if (line === '---' || line === '***') {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push('<hr>');
      }
      // Regular paragraph
      else {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        htmlParts.push(`<p>${line}</p>`);
      }
    }
    
    if (inList) htmlParts.push('</ul>');
    
    // Apply inline formatting
    let html = htmlParts.join('')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
    
    return html;
  };
  
  const handleSendToEmailBuilder = (content: string) => {
    // Parse subject line if present (format: "**Subject:** ..." or "Subject: ...")
    let subject: string | undefined;
    let body = content;
    
    const subjectMatch = content.match(/^\*?\*?Subject:\*?\*?\s*(.+?)(?:\n|$)/im);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      // Remove subject line from body
      body = content.replace(/^\*?\*?Subject:\*?\*?\s*.+?(?:\n|$)/im, '').trim();
    }
    
    const htmlContent = markdownToHtml(body);
    emailContext.sendToEmailBuilder(htmlContent, subject);
    toast({
      title: 'Sent to Email Builder',
      description: subject ? 'Subject and body added to email' : 'Content has been sent to the email editor',
    });
  };

  // Fetch available models
  const { data: modelsData } = useQuery<ModelsResponse>({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await fetch('/api/models');
      return response.json();
    },
    staleTime: Infinity,
  });

  // Set default model once loaded
  useEffect(() => {
    if (modelsData?.defaultModel && !selectedModel) {
      setSelectedModel(modelsData.defaultModel);
    }
  }, [modelsData, selectedModel]);

  const isLoading = externalLoading || isStreaming;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const createConversation = useCallback(async (): Promise<string> => {
    try {
      const response = await apiRequest('POST', '/api/conversations', {
        title: 'New Chat',
        model: selectedModel,
      });
      const data = await response.json();
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }, [selectedModel]);

  // Stream chat - showUserMessage controls whether to display the user message
  const handleStreamChat = useCallback(async (userMessage: string, showUserMessage: boolean = true) => {
    setIsStreaming(true);
    setStreamingContent('');

    try {
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        currentConversationId = await createConversation();
      }

      // Build chat messages with email mode context if active
      const chatMessages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];
      
      // Add email mode system context
      if (emailContext.isEmailMode) {
        chatMessages.push({
          role: 'system',
          content: `You are helping write email content. The user is in the Email Builder creating emails with pre-designed templates that already have a letterhead/header and signature/footer.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
**Subject:** [Write a compelling subject line here]

[Then write the email body content here]

IMPORTANT RULES:
- Always start with "**Subject:** " followed by your subject line
- Then add a blank line and write the body content
- Do NOT include To/From/Date lines (the UI handles this)
- Do NOT include signature or closing (the template has this)
- Do NOT use markdown tables (use simple lists instead)

Write clean, professional body content that flows naturally. Use:
- Short paragraphs for readability
- Bullet points for lists (use - or •)
- Bold (**text**) for emphasis
- Simple section headers (## Header) only if needed for long content

Start the body with a greeting (e.g., "Dear [Name],") or dive into content.
End before the signature - the user's signature is already in the template.

Current context:
- Template type: ${emailContext.currentTemplate}
- Company: ${emailContext.companyName}
${emailContext.contacts.length > 0 ? `- Recipients loaded: ${emailContext.contacts.length} contacts` : ''}`
        });
      }
      
      // Add conversation history
      chatMessages.push(...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      chatMessages.push({ role: 'user' as const, content: userMessage });
      
      // Track if we should show the user message
      const displayUserMessage = showUserMessage ? userMessage : '';

      abortControllerRef.current = new AbortController();

      // Build source context for the AI
      const sourceContext = sources.length > 0 ? sources.map(s => ({
        name: s.name,
        type: s.type,
        content: s.content?.slice(0, 5000), // Limit content size
        summary: s.summary,
      })) : [];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          model: selectedModel,
          conversationId: currentConversationId,
          sources: sourceContext,
          sourceSummaries: sourceSummaries,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let messageHandled = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'token' && data.token) {
                fullContent += data.token;
                setStreamingContent(fullContent);
              } else if (data.type === 'done' && !messageHandled) {
                const { components: a2uiComponents, cleanedContent } = parseA2UIComponents(fullContent);
                console.log('Stream done - components:', a2uiComponents.length, 'cleanedContent:', cleanedContent.substring(0, 100));
                onNewMessage(displayUserMessage, cleanedContent, a2uiComponents);
                setStreamingContent('');
                messageHandled = true;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Fallback: only add message if not already handled
      if (fullContent && !messageHandled) {
        const { components: a2uiComponents, cleanedContent } = parseA2UIComponents(fullContent);
        onNewMessage(displayUserMessage, cleanedContent, a2uiComponents);
      }

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error('Streaming error:', error);
        onNewMessage(userMessage, 'Sorry, an error occurred while processing your request.', []);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [conversationId, createConversation, messages, onNewMessage, selectedModel]);

  const handleSubmit = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      const message = inputValue.trim();
      setInputValue('');
      handleStreamChat(message);
    }
  }, [inputValue, isLoading, handleStreamChat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = useCallback((prompt: SuggestedPrompt) => {
    if (!isLoading) {
      if (prompt.isWorkflow && prompt.workflowId) {
        // Launch the workflow component directly
        setActiveWorkflow(prompt.workflowId);
      } else {
        handleStreamChat(prompt.text);
      }
    }
  }, [isLoading, handleStreamChat]);

  // Handle A2UI button actions
  const handleA2UIAction = useCallback(async (action: string, data?: any) => {
    console.log('A2UI Action:', action, data);
    
    // Workflow step instructions - explicit prompts for each step
    const workflowStepPrompts: Record<string, string> = {
      // After role selection -> Step 2
      'role:': `[WORKFLOW_STEP:2]
The user selected their role. Now generate Step 2: Daily Tasks.
You MUST respond with ONLY this JSON (no other text):
\`\`\`json
[
  { "id": "progress-2", "type": "progress", "properties": { "value": 33, "label": "Step 2 of 6: Daily Tasks" } },
  { "id": "step2-card", "type": "card", "properties": { 
    "title": "What do you spend most time on?",
    "description": "Select your primary daily activities",
    "actions": [
      { "label": "🔍 Research & Analysis", "variant": "outline", "action": "task:research" },
      { "label": "👥 Meetings & Calls", "variant": "outline", "action": "task:meetings" },
      { "label": "✍️ Creating Content", "variant": "outline", "action": "task:content" },
      { "label": "📊 Data & Reporting", "variant": "outline", "action": "task:analysis" },
      { "label": "🔄 Coordinating Projects", "variant": "outline", "action": "task:coordination" }
    ]
  }}
]
\`\`\``,
      // After task selection -> Step 3
      'task:': `[WORKFLOW_STEP:3]
The user selected their tasks. Now generate Step 3: Information Sources.
You MUST respond with ONLY this JSON (no other text):
\`\`\`json
[
  { "id": "progress-3", "type": "progress", "properties": { "value": 50, "label": "Step 3 of 6: Information Sources" } },
  { "id": "step3-card", "type": "card", "properties": {
    "title": "Where do you get your information?",
    "description": "Select your main sources",
    "actions": [
      { "label": "📰 News & Industry Sites", "variant": "outline", "action": "source:news" },
      { "label": "💬 Social Media & Communities", "variant": "outline", "action": "source:social" },
      { "label": "📁 Internal Documents", "variant": "outline", "action": "source:internal" },
      { "label": "📊 Research Reports", "variant": "outline", "action": "source:reports" },
      { "label": "🎯 Competitor Intelligence", "variant": "outline", "action": "source:competitor" }
    ]
  }}
]
\`\`\``,
      // After source selection -> Step 4
      'source:': `[WORKFLOW_STEP:4]
The user selected their sources. Now generate Step 4: Team Communication.
You MUST respond with ONLY this JSON (no other text):
\`\`\`json
[
  { "id": "progress-4", "type": "progress", "properties": { "value": 66, "label": "Step 4 of 6: Team Communication" } },
  { "id": "step4-card", "type": "card", "properties": {
    "title": "How do you share information with your team?",
    "actions": [
      { "label": "📧 Email Updates", "variant": "outline", "action": "share:email" },
      { "label": "💬 Slack/Teams Messages", "variant": "outline", "action": "share:chat" },
      { "label": "🗓️ Team Meetings", "variant": "outline", "action": "share:meetings" },
      { "label": "📄 Written Reports", "variant": "outline", "action": "share:reports" },
      { "label": "📊 Dashboards", "variant": "outline", "action": "share:dashboards" }
    ]
  }}
]
\`\`\``,
      // After share selection -> Step 5
      'share:': `[WORKFLOW_STEP:5]
The user selected their sharing method. Now generate Step 5: Pain Points.
You MUST respond with ONLY this JSON (no other text):
\`\`\`json
[
  { "id": "progress-5", "type": "progress", "properties": { "value": 83, "label": "Step 5 of 6: Pain Points" } },
  { "id": "step5-card", "type": "card", "properties": {
    "title": "What's your biggest challenge?",
    "description": "What frustrates you most about managing information?",
    "actions": [
      { "label": "🔀 Information is scattered everywhere", "variant": "outline", "action": "pain:scattered" },
      { "label": "⏱️ Takes too long to find what I need", "variant": "outline", "action": "pain:slow" },
      { "label": "✋ Too much manual copy-paste work", "variant": "outline", "action": "pain:manual" },
      { "label": "🤷 Hard to get actionable insights", "variant": "outline", "action": "pain:insights" },
      { "label": "📈 Can't keep up with changes", "variant": "outline", "action": "pain:keepup" }
    ]
  }}
]
\`\`\``,
      // After pain selection -> Step 6
      'pain:': `[WORKFLOW_STEP:6]
The user selected their pain point. Now generate Step 6: Goals.
You MUST respond with ONLY this JSON (no other text):
\`\`\`json
[
  { "id": "progress-6", "type": "progress", "properties": { "value": 100, "label": "Step 6 of 6: Your Goals" } },
  { "id": "step6-card", "type": "card", "properties": {
    "title": "What do you want to achieve?",
    "description": "What's most important to you?",
    "actions": [
      { "label": "⏰ Save time on research", "variant": "outline", "action": "goal:time" },
      { "label": "🎯 Make better decisions", "variant": "outline", "action": "goal:decisions" },
      { "label": "🤖 Automate repetitive tasks", "variant": "outline", "action": "goal:automate" },
      { "label": "📡 Stay informed automatically", "variant": "outline", "action": "goal:informed" },
      { "label": "✍️ Create content faster", "variant": "outline", "action": "goal:content" }
    ]
  }}
]
\`\`\``,
      // After goal selection -> Complete
      'goal:': `[WORKFLOW_COMPLETE]
The user completed all steps. Now show the completion card.
You MUST respond with ONLY this JSON (no other text):
\`\`\`json
[
  { "id": "complete", "type": "card", "properties": {
    "title": "✅ Profile Complete!",
    "description": "Great! I've learned about your role, tasks, sources, communication style, challenges, and goals. Save your profile to personalize your experience.",
    "actions": [
      { "label": "💾 Save My Profile", "variant": "default", "action": "save_profile" },
      { "label": "🔄 Start Over", "variant": "outline", "action": "restart" }
    ]
  }}
]
\`\`\``,
    };
    
    // Check if this is a workflow action
    const workflowPrefix = Object.keys(workflowStepPrompts).find(prefix => action.startsWith(prefix));
    
    if (workflowPrefix) {
      // Send the explicit workflow step prompt
      handleStreamChat(workflowStepPrompts[workflowPrefix], false);
    } else if (action === 'save_context' || action === 'save_profile') {
      // Save the conversation context as a source
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMessage) {
        try {
          // Get notebook ID from URL if available
          const notebookId = window.location.pathname.split('/').pop();
          await apiRequest('POST', '/api/sources', {
            notebookId: notebookId || null,
            type: 'text',
            category: 'context',
            name: 'User Profile Context',
            content: lastAssistantMessage.content,
            metadata: { generatedBy: 'onboarding-workflow', timestamp: new Date().toISOString() }
          });
          toast({ title: 'Profile Saved', description: 'Your profile has been saved as a context source.' });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
        }
      }
    } else if (action === 'save_report') {
      // Save as generated content/report
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMessage) {
        try {
          const notebookId = window.location.pathname.split('/').pop();
          await apiRequest('POST', '/api/sources', {
            notebookId: notebookId || null,
            type: 'text',
            category: 'reference',
            name: 'Research Report - ' + new Date().toLocaleDateString(),
            content: lastAssistantMessage.content,
            metadata: { generatedBy: 'research-workflow', timestamp: new Date().toISOString() }
          });
          toast({ title: 'Report Saved', description: 'Your report has been saved to sources.' });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to save report', variant: 'destructive' });
        }
      }
    } else if (action === 'send_email') {
      // Send to email builder
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMessage) {
        handleSendToEmailBuilder(lastAssistantMessage.content);
      }
    } else if (action === 'copy') {
      // Copy to clipboard
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMessage) {
        navigator.clipboard.writeText(lastAssistantMessage.content);
        toast({ title: 'Copied', description: 'Content copied to clipboard.' });
      }
    } else {
      // Unknown action - treat as workflow step selection (sent silently)
      handleStreamChat(`Selected: ${action}`, false);
    }
  }, [messages, handleStreamChat, toast, handleSendToEmailBuilder]);

  const suggestedQuestions = generateSuggestedPrompts(sources, sourceSummaries);

  // Get model display name
  const getModelDisplayName = (modelId: string) => {
    const model = modelsData?.models.find(m => m.id === modelId);
    return model?.name || modelId.split('/').pop() || modelId;
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0" data-testid="chat-panel">
      <div className="h-14 border-b border-border/50 flex items-center justify-between gap-2 px-4 sticky top-0 bg-sidebar z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-semibold" data-testid="text-chat-title">Chat</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full" data-testid="text-source-count">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </span>
        </div>
        {messages.length > 0 && onClearMessages && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              onClearMessages();
              setConversationId(null);
              setStreamingContent('');
            }}
            data-testid="button-clear-chat"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-4" ref={scrollRef} data-testid="scroll-messages">
        <div className="py-6 space-y-6">
          {/* Active Workflow */}
          {activeWorkflow === 'user-onboarding' && (
            <OnboardingWorkflow
              notebookId={window.location.pathname.split('/').pop()}
              onComplete={(profileData) => {
                console.log('Onboarding complete:', profileData);
                setActiveWorkflow(null);
                queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
                toast({ title: 'Welcome!', description: 'Your profile has been set up. Start exploring!' });
              }}
              onCancel={() => setActiveWorkflow(null)}
            />
          )}

          {activeWorkflow === 'research-content' && (
            <ResearchWorkflow
              notebookId={window.location.pathname.split('/').pop()}
              onComplete={(content) => {
                console.log('Content generated:', content);
                setActiveWorkflow(null);
                queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
                toast({ title: 'Content Created!', description: 'Your content has been generated and saved.' });
              }}
              onCancel={() => setActiveWorkflow(null)}
              onSendToEmail={(content, subject) => {
                // Defer to avoid setState during render
                setTimeout(() => {
                  if (emailContext?.sendToEmailBuilder) {
                    emailContext.sendToEmailBuilder(content, subject);
                  }
                  setActiveWorkflow(null);
                }, 0);
              }}
              onCreateReport={(content, title) => {
                // For now, save as a report-type source
                apiRequest('POST', '/api/sources', {
                  notebookId: window.location.pathname.split('/').pop() || null,
                  type: 'text',
                  category: 'reports',
                  name: title,
                  content: content,
                  metadata: { type: 'report', createdAt: new Date().toISOString() }
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
                });
                setActiveWorkflow(null);
              }}
            />
          )}
          
          {/* Empty State / Suggested Prompts */}
          {!activeWorkflow && messages.length === 0 && !streamingContent ? (
            <div className="text-center py-12" data-testid="container-empty-state">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2" data-testid="text-empty-title">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8" data-testid="text-empty-description">
                Ask questions about your sources, run workflows, or request analysis.
                I can generate interactive UI components to help visualize results.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                {suggestedQuestions.map((prompt, idx) => (
                  <Card
                    key={idx}
                    className={`p-3 rounded-xl cursor-pointer hover-elevate text-left ${prompt.isWorkflow ? 'border-primary/30 bg-primary/5' : ''}`}
                    onClick={() => handleSuggestionClick(prompt)}
                    data-testid={`card-suggestion-${idx}`}
                  >
                    <p className="text-sm">{prompt.text}</p>
                    {prompt.isWorkflow && (
                      <span className="text-xs text-primary mt-1 block">Interactive workflow</span>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ) : !activeWorkflow && (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`group ${message.role === 'user' ? 'flex justify-end' : ''}`}
                  data-testid={`container-message-${message.id}`}
                >
                  {message.role === 'user' ? (
                    <div className="flex items-start gap-3 max-w-[85%]">
                      <div className="flex flex-col items-end">
                        <div
                          className="bg-emerald-600 text-white rounded-2xl px-4 py-3"
                          data-testid={`card-message-content-${message.id}`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1" data-testid={`text-timestamp-${message.id}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Avatar className="w-8 h-8 shrink-0 rounded-full">
                        <AvatarFallback className="rounded-full bg-muted">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 shrink-0 rounded-full mt-1">
                        <AvatarFallback className="bg-emerald-600 text-white rounded-full">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {message.content && (
                          <div
                            className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                            data-testid={`card-message-content-${message.id}`}
                          >
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                        {message.a2uiComponents && message.a2uiComponents.length > 0 && (
                          <div className="mt-3" data-testid={`container-a2ui-${message.id}`}>
                            <A2UIRenderer components={message.a2uiComponents} onAction={handleA2UIAction} />
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-thumbsup-${message.id}`}>
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-thumbsdown-${message.id}`}>
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            data-testid={`button-copy-${message.id}`}
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              toast({ title: 'Copied', description: 'Message copied to clipboard' });
                            }}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-pin-${message.id}`}>
                            <Pin className="w-3.5 h-3.5" />
                          </Button>
                          {emailContext.isEmailMode && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 gap-1 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" 
                              data-testid={`button-send-to-email-${message.id}`}
                              onClick={() => handleSendToEmailBuilder(message.content)}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Send to Email
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1" data-testid={`text-timestamp-${message.id}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {(isStreaming || streamingContent) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3"
              data-testid="container-streaming-message"
            >
              <Avatar className="w-8 h-8 shrink-0 rounded-full mt-1">
                <AvatarFallback className="bg-emerald-600 text-white rounded-full">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {streamingContent ? (
                  <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none" data-testid="text-streaming-content">
                    {/* Hide JSON code blocks during streaming - just show loading indicator */}
                    {streamingContent.includes('```') ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="animate-pulse">Generating interactive components...</span>
                      </div>
                    ) : (
                      <ReactMarkdown>{streamingContent}</ReactMarkdown>
                    )}
                    <span className="inline-block w-2 h-4 bg-foreground/60 ml-0.5 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex gap-1.5 py-2" data-testid="container-typing-indicator">
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 pb-4 pt-2">
        <div className="bg-muted/60 dark:bg-muted rounded-2xl overflow-hidden transition-colors focus-within:bg-muted/80 dark:focus-within:bg-muted/90">
          <div className="px-4 pt-3 pb-2">
            <Textarea
              ref={textareaRef}
              placeholder="Reply..."
              className="min-h-[24px] max-h-32 resize-none border-0 shadow-none ring-0 focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none outline-none bg-transparent text-sm placeholder:text-muted-foreground/60 p-0"
              style={{ outline: 'none', boxShadow: 'none' }}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              data-testid="input-chat"
            />
          </div>
          <div className="flex items-center justify-between px-3 pb-3 gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground"
                data-testid="button-sparkles"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground"
                data-testid="button-attach"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground"
                data-testid="button-settings"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground"
                data-testid="button-history"
              >
                <History className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isLoading}
              >
                <SelectTrigger
                  className="h-8 border-0 bg-transparent text-xs text-muted-foreground gap-1 px-2 min-w-[120px]"
                  data-testid="select-model"
                >
                  <SelectValue placeholder="Select model">
                    {selectedModel && getModelDisplayName(selectedModel)}
                  </SelectValue>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[300px]">
                  {modelsData?.byProvider && Object.entries(modelsData.byProvider).map(([provider, models]) => (
                    <SelectGroup key={provider}>
                      <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                        {provider}
                      </SelectLabel>
                      {models.map((model) => (
                        <SelectItem
                          key={model.id}
                          value={model.id}
                          className="rounded-lg text-xs"
                          data-testid={`option-${model.id.replace('/', '-')}`}
                        >
                          <div className="flex flex-col">
                            <span>{model.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {(model.contextLength / 1000).toFixed(0)}k context
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="shrink-0 h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                data-testid="button-send"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
