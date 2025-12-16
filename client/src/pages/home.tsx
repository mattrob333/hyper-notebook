import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";
import Navbar from "@/components/Navbar";
import SourcesPanel from "@/components/panels/SourcesPanel";
import ChatPanel from "@/components/panels/ChatPanel";
import StudioPanel from "@/components/panels/StudioPanel";
import SourceDetailView from "@/components/panels/SourceDetailView";
import BrowserAgentMonitor from "@/components/browser/BrowserAgentMonitor";
import type { Source, ChatMessage, A2UIComponent, Notebook } from "@/lib/types";

export default function Home() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const notebookId = params.id;
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBrowserMonitor, setShowBrowserMonitor] = useState(false);
  const [browserStatus, setBrowserStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error'>('idle');
  const [browserStep, setBrowserStep] = useState<string>('');
  const [browserStepNum, setBrowserStepNum] = useState(0);
  const [browserTotalSteps, setBrowserTotalSteps] = useState(0);
  const [browserUrl, setBrowserUrl] = useState('about:blank');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Fetch notebook details
  const { data: notebook } = useQuery<Notebook>({
    queryKey: [`/api/notebooks/${notebookId}`],
    enabled: !!notebookId,
  });

  // Fetch sources for this notebook
  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'],
  });

  const selectedSource = selectedSourceId 
    ? sources.find(s => s.id === selectedSourceId) 
    : undefined;

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleNewMessage = async (content: string, response?: string, a2uiComponents?: A2UIComponent[]) => {
    if (response) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        a2uiComponents,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage, assistantMessage]);
    } else {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="home-page">
      <Navbar 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        notebookName={notebook?.name}
        onBackToDashboard={() => navigate('/')}
      />
      
      <div className="flex-1 p-4 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full gap-3">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full bg-sidebar rounded-2xl border border-sidebar-border overflow-hidden">
              <SourcesPanel
                selectedSourceId={selectedSourceId}
                onSourcesChange={setSelectedSourceIds}
                onSelectSource={(source) => setSelectedSourceId(source.id)}
                notebookId={notebookId}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-1 bg-transparent hover:bg-primary/20 transition-colors rounded-full" />
          
          <ResizablePanel defaultSize={55} minSize={35}>
            <div className="h-full bg-sidebar rounded-2xl border border-sidebar-border overflow-hidden">
              {selectedSource ? (
                <SourceDetailView 
                  source={selectedSource}
                  onClose={() => setSelectedSourceId(undefined)}
                />
              ) : (
                <ChatPanel
                  sources={sources.filter(s => selectedSourceIds.includes(s.id))}
                  messages={messages}
                  onNewMessage={handleNewMessage}
                  isLoading={isLoading}
                />
              )}
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-1 bg-transparent hover:bg-primary/20 transition-colors rounded-full" />
          
          <ResizablePanel defaultSize={25} minSize={18} maxSize={35}>
            <div className="h-full bg-sidebar rounded-2xl border border-sidebar-border overflow-hidden">
              <StudioPanel
                selectedSourceIds={selectedSourceIds}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <BrowserAgentMonitor
        isVisible={showBrowserMonitor}
        onDismiss={() => setShowBrowserMonitor(false)}
        status={browserStatus}
        currentStep={browserStep}
        stepNumber={browserStepNum}
        totalSteps={browserTotalSteps}
        currentUrl={browserUrl}
        logs={[
          '> Initializing browser agent...',
          '> Connected to Hyperbrowser SDK',
          '> Starting workflow execution...'
        ]}
      />
    </div>
  );
}
