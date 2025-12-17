import { useState, useRef, useEffect, useCallback } from "react";
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
import type { ChatMessage, Source, A2UIComponent } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
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

function parseA2UIComponents(content: string): A2UIComponent[] {
  const components: A2UIComponent[] = [];

  const jsonBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)```/g;
  let match;

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        parsed.forEach((item, idx) => {
          if (item.type && typeof item.type === 'string') {
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
    } catch {
      // Not valid JSON, skip
    }
  }

  return components;
}

function generateSuggestedPrompts(sources: Source[], sourceSummaries?: SourceSummary[]): string[] {
  const defaultPrompts = [
    "Summarize the key points from all sources",
    "Compare and contrast the different perspectives",
    "Generate a study guide from this material",
    "Create a timeline of events mentioned"
  ];

  if (!sources.length && !sourceSummaries?.length) {
    return defaultPrompts;
  }

  const prompts: string[] = [];

  if (sourceSummaries && sourceSummaries.length > 0) {
    const firstSummary = sourceSummaries[0];
    if (firstSummary.summary) {
      prompts.push(`Explain the main concepts from "${firstSummary.name}"`);
    }

    if (sourceSummaries.length > 1) {
      prompts.push(`Compare "${sourceSummaries[0].name}" with "${sourceSummaries[1].name}"`);
    }
  }

  if (sources.length > 0) {
    const sourceTypes = Array.from(new Set(sources.map(s => s.type)));
    if (sourceTypes.includes('pdf')) {
      prompts.push("Extract key findings from the PDF documents");
    }
    if (sourceTypes.includes('url')) {
      prompts.push("Summarize the web articles and highlight important links");
    }
  }

  while (prompts.length < 4) {
    const remaining = defaultPrompts.filter(p => !prompts.includes(p));
    if (remaining.length === 0) break;
    prompts.push(remaining[0]);
  }

  return prompts.slice(0, 4);
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

  const handleStreamChat = useCallback(async (userMessage: string) => {
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

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          model: selectedModel,
          conversationId: currentConversationId,
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
                const a2uiComponents = parseA2UIComponents(fullContent);
                onNewMessage(userMessage, fullContent, a2uiComponents);
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
        const a2uiComponents = parseA2UIComponents(fullContent);
        onNewMessage(userMessage, fullContent, a2uiComponents);
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

  const handleSuggestionClick = useCallback((question: string) => {
    if (!isLoading) {
      handleStreamChat(question);
    }
  }, [isLoading, handleStreamChat]);

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
          {messages.length === 0 && !streamingContent ? (
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
                {suggestedQuestions.map((question, idx) => (
                  <Card
                    key={idx}
                    className="p-3 rounded-xl cursor-pointer hover-elevate text-left"
                    onClick={() => handleSuggestionClick(question)}
                    data-testid={`card-suggestion-${idx}`}
                  >
                    <p className="text-sm">{question}</p>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
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
                            className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                            data-testid={`card-message-content-${message.id}`}
                          >
                            {message.content}
                          </div>
                        )}
                        {message.a2uiComponents && message.a2uiComponents.length > 0 && (
                          <div className="mt-3" data-testid={`container-a2ui-${message.id}`}>
                            <A2UIRenderer components={message.a2uiComponents} />
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
                  <div className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none" data-testid="text-streaming-content">
                    {streamingContent}
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
