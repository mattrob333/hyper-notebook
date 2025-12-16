import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Paperclip, Loader2, Bot, User, Sparkles, ThumbsUp, ThumbsDown, Copy, Pin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import A2UIRenderer from "../a2ui/A2UIRenderer";
import type { ChatMessage, Source, A2UIComponent } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

interface SourceSummary {
  id: string;
  name: string;
  summary: string;
}

interface ChatPanelProps {
  sources: Source[];
  messages: ChatMessage[];
  onNewMessage: (message: string, response?: string, a2uiComponents?: A2UIComponent[]) => void;
  isLoading?: boolean;
  sourceSummaries?: SourceSummary[];
}

type ModelId = 'gpt-4.1' | 'gpt-4.1-mini' | 'gemini-2.5-pro' | 'gemini-2.5-flash';

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
  const [selectedModel, setSelectedModel] = useState<ModelId>('gpt-4.1');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  return (
    <div className="flex-1 flex flex-col h-full min-w-0" data-testid="chat-panel">
      <div className="h-14 border-b border-border/50 flex items-center justify-between gap-2 px-6 sticky top-0 bg-sidebar z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-semibold" data-testid="text-chat-title">Chat</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full" data-testid="text-source-count">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6" ref={scrollRef} data-testid="scroll-messages">
        <div className="max-w-3xl mx-auto py-6 space-y-6">
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
                  className={`flex gap-4 group ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`container-message-${message.id}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-9 h-9 shrink-0 rounded-xl">
                      <AvatarFallback className="bg-primary text-primary-foreground rounded-xl">
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-2xl ${message.role === 'user' ? 'order-first' : ''}`}>
                    {message.content && (
                      <Card
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                        data-testid={`card-message-content-${message.id}`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </Card>
                    )}
                    {message.a2uiComponents && message.a2uiComponents.length > 0 && (
                      <div className="mt-3" data-testid={`container-a2ui-${message.id}`}>
                        <A2UIRenderer components={message.a2uiComponents} />
                      </div>
                    )}
                    {message.role === 'assistant' && (
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
                    )}
                    <p className="text-xs text-muted-foreground mt-1 px-1" data-testid={`text-timestamp-${message.id}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="w-9 h-9 shrink-0 rounded-xl">
                      <AvatarFallback className="rounded-xl">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {(isStreaming || streamingContent) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
              data-testid="container-streaming-message"
            >
              <Avatar className="w-9 h-9 rounded-xl shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground rounded-xl">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted rounded-2xl px-4 py-3 max-w-2xl">
                {streamingContent ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" data-testid="text-streaming-content">
                    {streamingContent}
                    <span className="inline-block w-2 h-4 bg-foreground/60 ml-0.5 animate-pulse" />
                  </p>
                ) : (
                  <div className="flex gap-1.5" data-testid="container-typing-indicator">
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="p-6 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border/50">
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-9 w-9 rounded-xl" 
              data-testid="button-attach"
            >
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Textarea
              ref={textareaRef}
              placeholder="Ask about your sources..."
              className="min-h-[40px] max-h-32 resize-none border-0 focus-visible:ring-0 bg-transparent text-sm"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              data-testid="input-chat"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Select 
                value={selectedModel} 
                onValueChange={(value) => setSelectedModel(value as ModelId)}
                disabled={isLoading}
              >
                <SelectTrigger 
                  className="h-8 w-[120px] rounded-lg text-xs border-border/50 bg-muted/50" 
                  data-testid="select-model"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="gpt-4.1" className="rounded-lg text-xs" data-testid="option-gpt-4.1">
                    GPT-4.1
                  </SelectItem>
                  <SelectItem value="gpt-4.1-mini" className="rounded-lg text-xs" data-testid="option-gpt-4.1-mini">
                    GPT-4.1 Mini
                  </SelectItem>
                  <SelectItem value="gemini-2.5-pro" className="rounded-lg text-xs" data-testid="option-gemini-pro">
                    Gemini Pro
                  </SelectItem>
                  <SelectItem value="gemini-2.5-flash" className="rounded-lg text-xs" data-testid="option-gemini-flash">
                    Gemini Flash
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="shrink-0 h-9 w-9 rounded-full"
                data-testid="button-send"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
