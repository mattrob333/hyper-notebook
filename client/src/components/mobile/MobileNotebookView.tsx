import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Trash2, Share2, Settings } from "lucide-react";
import MobileHeader from "./MobileHeader";
import MobileBottomNav, { type MobileTab } from "./MobileBottomNav";
import MobileSourcesView from "./MobileSourcesView";
import MobileChatView from "./MobileChatView";
import MobileStudioView from "./MobileStudioView";
import type { Notebook, Source, ChatMessage, A2UIComponent } from "@/lib/types";

interface MobileNotebookViewProps {
  notebookId: string;
}

export default function MobileNotebookView({ notebookId }: MobileNotebookViewProps) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<MobileTab>('chat');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notebook details
  const { data: notebook } = useQuery<Notebook>({
    queryKey: [`/api/notebooks/${notebookId}`],
    enabled: !!notebookId,
  });

  // Fetch sources for this notebook
  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: [`/api/notebooks/${notebookId}/sources`],
    enabled: !!notebookId,
  });

  // Auto-select all sources initially
  useEffect(() => {
    if (sources.length > 0 && selectedSourceIds.length === 0) {
      setSelectedSourceIds(sources.map(s => s.id));
    }
  }, [sources]);

  const handleBack = () => {
    navigate('/');
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          notebookId,
          sourceIds: selectedSourceIds,
          conversationHistory: messages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'I apologize, but I could not generate a response.',
        a2uiComponents: data.a2uiComponents,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = (type: string) => {
    // TODO: Implement generation logic
    console.log('Generate:', type);
  };

  const menuItems = [
    {
      label: 'Share',
      icon: <Share2 className="w-4 h-4" />,
      onClick: () => console.log('Share'),
    },
    {
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => console.log('Settings'),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {
        if (confirm('Delete this notebook?')) {
          // TODO: Delete notebook
          navigate('/');
        }
      },
      destructive: true,
    },
  ];

  const selectedSources = sources.filter(s => selectedSourceIds.includes(s.id));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <MobileHeader
        title={notebook?.name || 'Loading...'}
        showBack
        onBack={handleBack}
        showMenu
        menuItems={menuItems}
      />

      {/* Content Area - with bottom padding for nav */}
      <div className="flex-1 overflow-hidden pb-16">
        {activeTab === 'sources' && (
          <MobileSourcesView
            notebookId={notebookId}
            selectedSourceIds={selectedSourceIds}
            onSourcesChange={setSelectedSourceIds}
            onAddSource={() => {
              // TODO: Open add source modal
              console.log('Add source');
            }}
          />
        )}

        {activeTab === 'chat' && (
          <MobileChatView
            messages={messages}
            sources={selectedSources}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        )}

        {activeTab === 'studio' && (
          <MobileStudioView
            notebookId={notebookId}
            onGenerate={handleGenerate}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
