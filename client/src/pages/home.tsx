import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle,
  type ImperativePanelHandle
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import SourcesPanel from "@/components/panels/SourcesPanel";
import ChatPanel from "@/components/panels/ChatPanel";
import StudioPanel from "@/components/panels/StudioPanel";
import SourceDetailView from "@/components/panels/SourceDetailView";
import BrowserAgentMonitor from "@/components/browser/BrowserAgentMonitor";
import { DocumentPanelProvider, useDocumentPanel } from "@/contexts/DocumentPanelContext";
import type { Source, ChatMessage, A2UIComponent, Notebook } from "@/lib/types";
import type { DocumentType } from "@/components/studio/DocumentPanel";

// Hook to detect mobile screen
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

function HomeContent() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const notebookId = params.id;
  const isMobile = useIsMobile();
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBrowserMonitor, setShowBrowserMonitor] = useState(false);
  const [mobileTab, setMobileTab] = useState<'sources' | 'chat' | 'studio'>('chat');
  const [viewingCsvSourceId, setViewingCsvSourceId] = useState<string | null>(null);
  const [browserStatus, setBrowserStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error'>('idle');
  const [browserStep, setBrowserStep] = useState<string>('');
  const [browserStepNum, setBrowserStepNum] = useState(0);
  const [browserTotalSteps, setBrowserTotalSteps] = useState(0);
  const [browserUrl, setBrowserUrl] = useState('about:blank');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Document panel context
  const documentPanel = useDocumentPanel();
  
  // Track if sources panel is collapsed (when document is open)
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const sourcesPanelRef = useRef<ImperativePanelHandle>(null);
  
  // Toggle sources panel collapse
  const toggleSourcesCollapse = () => {
    if (sourcesPanelRef.current) {
      if (sourcesCollapsed) {
        sourcesPanelRef.current.expand();
      } else {
        sourcesPanelRef.current.collapse();
      }
    }
    setSourcesCollapsed(!sourcesCollapsed);
  };
  
  // Collapse sources when document opens
  useEffect(() => {
    if (documentPanel.isOpen && sourcesPanelRef.current && !sourcesCollapsed) {
      sourcesPanelRef.current.collapse();
      setSourcesCollapsed(true);
    }
  }, [documentPanel.isOpen]);

  // Fetch notebook details
  const { data: notebook } = useQuery<Notebook>({
    queryKey: [`/api/notebooks/${notebookId}`],
    enabled: !!notebookId,
  });

  // Fetch all notebooks for the dropdown
  const { data: notebooks = [] } = useQuery<Notebook[]>({
    queryKey: ['/api/notebooks'],
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

  // Listen for openDocument events - opens content in the DocumentPanel (side panel)
  useEffect(() => {
    const handleOpenDocument = (event: CustomEvent) => {
      const { content, title, type, recipient, subject } = event.detail;
      documentPanel.openDocument({
        content: content || '',
        title: title || 'Untitled',
        type: type || 'report',
        recipient,
        subject,
      });
      // Collapse sources panel when document opens
      setSourcesCollapsed(true);
    };

    // Support multiple event names for compatibility
    window.addEventListener('openReportEditor', handleOpenDocument as EventListener);
    window.addEventListener('openContentEditor', handleOpenDocument as EventListener);
    window.addEventListener('openDocument', handleOpenDocument as EventListener);
    return () => {
      window.removeEventListener('openReportEditor', handleOpenDocument as EventListener);
      window.removeEventListener('openContentEditor', handleOpenDocument as EventListener);
      window.removeEventListener('openDocument', handleOpenDocument as EventListener);
    };
  }, [documentPanel]);

  const handleNewMessage = async (content: string, response?: string, a2uiComponents?: A2UIComponent[]) => {
    // Check if we have a response OR a2ui components to display
    const hasResponse = response || (a2uiComponents && a2uiComponents.length > 0);
    
    if (hasResponse) {
      const newMessages: ChatMessage[] = [];
      
      // Only add user message if content is not empty
      if (content && content.trim()) {
        newMessages.push({
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        });
      }
      
      // Always add assistant message with response or components
      newMessages.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || '',
        a2uiComponents,
        timestamp: new Date(),
      });
      
      console.log('Adding messages:', newMessages.length, 'with components:', a2uiComponents?.length || 0);
      setMessages(prev => [...prev, ...newMessages]);
    } else if (content && content.trim()) {
      // Only add user message if there's content
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  // Handle closing document panel
  const handleCloseDocument = () => {
    documentPanel.closeDocument();
    setSourcesCollapsed(false);
  };

  // Mobile layout with tabs
  const renderMobileLayout = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as typeof mobileTab)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-around bg-sidebar border-b rounded-none h-12 px-2">
          <TabsTrigger value="sources" className="flex-1 gap-2 data-[state=active]:bg-primary/10">
            <FileText className="w-4 h-4" />
            <span className="text-xs">Sources</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 gap-2 data-[state=active]:bg-primary/10">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="studio" className="flex-1 gap-2 data-[state=active]:bg-primary/10">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">Studio</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sources" className="flex-1 m-0 overflow-hidden">
          <div className="h-full bg-sidebar overflow-hidden">
            <SourcesPanel
              selectedSourceId={selectedSourceId}
              onSourcesChange={setSelectedSourceIds}
              collapsed={false}
              onToggleCollapse={() => {}}
              onSelectSource={(source) => {
                let isCsv = source.type === 'csv';
                if (!isCsv && source.content) {
                  try {
                    const parsed = JSON.parse(source.content);
                    isCsv = parsed.type === 'spreadsheet' && parsed.headers && parsed.rows;
                  } catch {}
                }
                if (isCsv) {
                  setViewingCsvSourceId(source.id);
                  setSelectedSourceId(undefined);
                  setMobileTab('studio');
                } else {
                  setSelectedSourceId(source.id);
                  setViewingCsvSourceId(null);
                  setMobileTab('chat');
                }
              }}
              notebookId={notebookId}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
          <div className="h-full bg-sidebar overflow-hidden">
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
                onClearMessages={handleClearMessages}
                isLoading={isLoading}
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="studio" className="flex-1 m-0 overflow-hidden">
          <div className="h-full bg-sidebar overflow-hidden">
            <StudioPanel
              selectedSourceIds={selectedSourceIds}
              viewingCsvSourceId={viewingCsvSourceId}
              onViewCsvSource={setViewingCsvSourceId}
              documentPanelOpen={documentPanel.isOpen}
              onCloseDocument={handleCloseDocument}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Desktop layout with resizable panels
  const renderDesktopLayout = () => (
    <div className="flex-1 p-4 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full gap-3">
        <ResizablePanel 
          ref={sourcesPanelRef}
          defaultSize={20} 
          minSize={4} 
          maxSize={30}
          collapsible={true}
          collapsedSize={4}
          onCollapse={() => setSourcesCollapsed(true)}
          onExpand={() => setSourcesCollapsed(false)}
        >
          <div className="h-full bg-sidebar rounded-2xl border border-sidebar-border overflow-hidden">
            <SourcesPanel
              selectedSourceId={selectedSourceId}
              onSourcesChange={setSelectedSourceIds}
              collapsed={sourcesCollapsed}
              onToggleCollapse={toggleSourcesCollapse}
              onSelectSource={(source) => {
                let isCsv = source.type === 'csv';
                if (!isCsv && source.content) {
                  try {
                    const parsed = JSON.parse(source.content);
                    isCsv = parsed.type === 'spreadsheet' && parsed.headers && parsed.rows;
                  } catch {}
                }
                if (isCsv) {
                  setViewingCsvSourceId(source.id);
                  setSelectedSourceId(undefined);
                } else {
                  setSelectedSourceId(source.id);
                  setViewingCsvSourceId(null);
                }
              }}
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
                onClearMessages={handleClearMessages}
                isLoading={isLoading}
              />
            )}
          </div>
        </ResizablePanel>
        
        <ResizableHandle className="w-1 bg-transparent hover:bg-primary/20 transition-colors rounded-full" />
        
        <ResizablePanel 
          defaultSize={documentPanel.isOpen ? 55 : 25} 
          minSize={documentPanel.isOpen ? 45 : 18} 
          maxSize={documentPanel.isOpen ? 70 : 35}
        >
          <div className="h-full bg-sidebar rounded-2xl border border-sidebar-border overflow-hidden">
            <StudioPanel
              selectedSourceIds={selectedSourceIds}
              viewingCsvSourceId={viewingCsvSourceId}
              onViewCsvSource={setViewingCsvSourceId}
              documentPanelOpen={documentPanel.isOpen}
              onCloseDocument={handleCloseDocument}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="home-page">
      <Navbar 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        notebookName={notebook?.name}
        notebookId={notebookId}
        notebooks={notebooks}
        onBackToDashboard={() => navigate('/')}
        onSelectNotebook={(id) => navigate(`/notebook/${id}`)}
        onCreateNotebook={() => navigate('/')}
      />
      
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}

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

// Wrap with DocumentPanelProvider
export default function Home() {
  return (
    <DocumentPanelProvider>
      <HomeContent />
    </DocumentPanelProvider>
  );
}
