import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Paperclip, Loader2, Bot, User, Sparkles, ThumbsUp, ThumbsDown, Copy, Pin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import A2UIRenderer from "../a2ui/A2UIRenderer";
import type { ChatMessage, Source } from "@/lib/types";

interface ChatPanelProps {
  sources: Source[];
  messages: ChatMessage[];
  onNewMessage: (message: string) => void;
  isLoading?: boolean;
}

export default function ChatPanel({ sources, messages, onNewMessage, isLoading }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (inputValue.trim() && !isLoading) {
      onNewMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const suggestedQuestions = [
    "Summarize the key points from all sources",
    "Compare and contrast the different perspectives",
    "Generate a study guide from this material",
    "Create a timeline of events mentioned"
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-w-0" data-testid="chat-panel">
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-6 sticky top-0 bg-sidebar z-10">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Chat</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
                Ask questions about your sources, run workflows, or request analysis. 
                I can generate interactive UI components to help visualize results.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                {suggestedQuestions.map((question, idx) => (
                  <Card 
                    key={idx}
                    className="p-3 rounded-xl cursor-pointer hover-elevate text-left"
                    onClick={() => onNewMessage(question)}
                    data-testid={`suggestion-${idx}`}
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
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.id}`}
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
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </Card>
                    )}
                    {message.a2uiComponents && message.a2uiComponents.length > 0 && (
                      <div className="mt-3">
                        <A2UIRenderer uiStream={message.a2uiComponents} />
                      </div>
                    )}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Pin className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 px-1">
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
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <Avatar className="w-9 h-9 rounded-xl">
                <AvatarFallback className="bg-primary text-primary-foreground rounded-xl">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <Card className="flex items-end gap-2 p-2 rounded-2xl">
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" data-testid="button-attach">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              placeholder="Ask about your sources..."
              className="min-h-[44px] max-h-32 resize-none border-0 focus-visible:ring-0 bg-transparent rounded-xl"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="input-chat"
            />
            <Button 
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="shrink-0 rounded-xl"
              data-testid="button-send"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </Card>
          <p className="text-xs text-center text-muted-foreground mt-2">
            NotebookLM can make mistakes. Consider verifying important information.
          </p>
        </div>
      </div>
    </div>
  );
}
