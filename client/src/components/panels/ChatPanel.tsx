import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, Loader2, Bot, User } from "lucide-react";
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

  return (
    <div className="flex-1 flex flex-col h-full min-w-[480px] bg-background" data-testid="chat-panel">
      <div className="h-12 border-b flex items-center justify-between px-4 sticky top-0 bg-background z-10">
        <h2 className="font-semibold text-sm">Chat</h2>
        <span className="text-xs text-muted-foreground">
          {sources.length} source{sources.length !== 1 ? 's' : ''} active
        </span>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ask questions about your sources, run workflows, or request analysis. 
                I can generate interactive UI components to help visualize results.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.id}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-2xl ${message.role === 'user' ? 'order-first' : ''}`}>
                    {message.content && (
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )}
                    {message.a2uiComponents && message.a2uiComponents.length > 0 && (
                      <div className="mt-3">
                        <A2UIRenderer uiStream={message.a2uiComponents} />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback>
                        <User className="w-4 h-4" />
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
              className="flex gap-3"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4 bg-background">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Button variant="outline" size="icon" data-testid="button-attach">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            placeholder="Ask about your sources or run a workflow..."
            className="min-h-[48px] max-h-32 resize-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="input-chat"
          />
          <Button 
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            data-testid="button-send"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
