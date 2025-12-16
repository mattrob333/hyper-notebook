import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Paperclip, Loader2, Bot, User, Sparkles, ThumbsUp, ThumbsDown, Copy, Pin, Plus, SlidersHorizontal, History, ChevronDown, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import A2UIRenderer from "../a2ui/A2UIRenderer";
import type { ChatMessage, Source, A2UIComponent } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

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

      const chatMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMessage }
      ];

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
              } else if (data.type === 'done') {
                const a2uiComponents = parseA2UIComponents(fullContent);
                onNewMessage(userMessage, fullContent, a2uiComponents);
                setStreamingContent('');
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      if (fullContent && !streamingContent) {
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
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-copy-${message.id}`}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-pin-${message.id}`}>
                            <Pin className="w-3.5 h-3.5" />
                          </Button>
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
