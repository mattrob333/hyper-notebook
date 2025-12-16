import { useState, useEffect } from "react";
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
import type { Source, Workflow, ChatMessage, A2UIComponent } from "@/lib/types";

interface Report {
  id: string;
  name: string;
  type: 'analysis' | 'summary' | 'comparison';
  createdAt: Date;
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [showBrowserMonitor, setShowBrowserMonitor] = useState(false);
  const [browserStatus, setBrowserStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error'>('idle');
  const [browserStep, setBrowserStep] = useState<string>('');
  const [browserStepNum, setBrowserStepNum] = useState(0);
  const [browserTotalSteps, setBrowserTotalSteps] = useState(0);
  const [browserUrl, setBrowserUrl] = useState('about:blank');

  const [sources, setSources] = useState<Source[]>([
    { id: '1', type: 'url', name: 'A2UI', content: 'https://a2ui.dev' },
    { id: '2', type: 'url', name: 'Agent Engineering: A New Discipline', content: 'https://blog.langchain.dev/agent-engineering' },
    { id: '3', type: 'url', name: 'Cognitive Procurement Engine', content: 'https://docs.procurement.ai' },
    { id: '4', type: 'url', name: 'GitHub - google2Ax1i', content: 'https://github.com/google/a2ui' },
    { id: '5', type: 'url', name: 'Home - Hyperbrowser', content: 'https://hyperbrowser.ai' },
    { id: '6', type: 'url', name: 'Project Blueprint: The Hyper-Interactive Notebook', content: 'https://notion.so/blueprint' },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Competitor Analysis',
      description: 'Scrape competitor websites and generate comparison report',
      steps: [
        { id: 's1', action: 'scrape', params: { urls: ['https://competitor.com'] } },
        { id: 's2', action: 'summarize', params: {} },
        { id: 's3', action: 'generate_ui', params: { type: 'datatable' } },
      ],
    },
  ]);

  const [reports] = useState<Report[]>([
    { id: '1', name: 'AI-Executable PRD: The Hyper-Interactive Notebook', type: 'summary', createdAt: new Date(Date.now() - 31 * 60000) },
    { id: '2', name: 'Project Blueprint: The Hyper-Interactive Notebook', type: 'analysis', createdAt: new Date(Date.now() - 60 * 60000) },
  ]);

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

  const handleNewMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const mockA2UIComponents: A2UIComponent[] = content.toLowerCase().includes('analyze') || content.toLowerCase().includes('compare')
        ? [
            {
              id: 'card-' + Date.now(),
              type: 'card',
              properties: {
                title: 'Analysis Complete',
                description: `Based on ${sources.length} sources`,
                content: 'I\'ve analyzed the content and found key insights. Here\'s a summary of the main findings.',
                actions: [
                  { label: 'View Details', variant: 'default' },
                  { label: 'Export', variant: 'outline' },
                ],
              },
            },
          ]
        : [];

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mockA2UIComponents.length > 0 
          ? 'I\'ve completed the analysis based on your sources. Here are the results:'
          : 'I can help you with that. What specific information would you like me to extract or analyze from your sources?',
        a2uiComponents: mockA2UIComponents,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleAddSource = (source: Omit<Source, 'id'>) => {
    setSources([...sources, { ...source, id: Date.now().toString() }]);
  };

  const handleDeleteSource = (id: string) => {
    setSources(sources.filter((s) => s.id !== id));
  };

  const handleSaveWorkflow = (workflow: Workflow) => {
    setWorkflows([...workflows, workflow]);
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter((w) => w.id !== id));
  };

  const handleRunWorkflow = (workflow: Workflow) => {
    setShowBrowserMonitor(true);
    setBrowserStatus('running');
    setBrowserTotalSteps(workflow.steps.length);
    setBrowserStepNum(1);
    setBrowserStep(`Executing: ${workflow.steps[0].action}`);
    setBrowserUrl('https://hyperbrowser.ai/agent');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Run workflow: ${workflow.name}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < workflow.steps.length) {
        setBrowserStepNum(stepIndex + 1);
        setBrowserStep(`Executing: ${workflow.steps[stepIndex].action}`);
      } else {
        clearInterval(stepInterval);
        setBrowserStatus('completed');
        setBrowserStep('All steps completed');
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Workflow "${workflow.name}" completed successfully with ${workflow.steps.length} steps.`,
          a2uiComponents: [
            {
              id: 'workflow-result-' + Date.now(),
              type: 'card',
              properties: {
                title: 'Workflow Complete',
                description: workflow.description,
                actions: [
                  { label: 'View Results', variant: 'default' },
                  { label: 'Run Again', variant: 'outline' },
                ],
              },
            },
          ],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleStartDeepResearch = (query: string) => {
    setShowBrowserMonitor(true);
    setBrowserStatus('running');
    setBrowserTotalSteps(5);
    setBrowserStepNum(1);
    setBrowserStep('Searching the web for sources...');
    setBrowserUrl('https://www.google.com/search?q=' + encodeURIComponent(query));

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Deep Research: ${query}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const steps = [
      'Searching the web for sources...',
      'Analyzing search results...',
      'Extracting key information...',
      'Cross-referencing sources...',
      'Generating research report...'
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setBrowserStepNum(stepIndex + 1);
        setBrowserStep(steps[stepIndex]);
      } else {
        clearInterval(stepInterval);
        setBrowserStatus('completed');
        setBrowserStep('Research complete');
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Deep research on "${query}" completed. I found several relevant sources and synthesized the information into a comprehensive report.`,
          a2uiComponents: [
            {
              id: 'research-result-' + Date.now(),
              type: 'card',
              properties: {
                title: 'Research Report',
                description: `Based on 12 sources found for: ${query}`,
                content: 'The analysis reveals key insights across multiple dimensions. View the full report for detailed findings.',
                actions: [
                  { label: 'View Full Report', variant: 'default' },
                  { label: 'Add Sources', variant: 'outline' },
                ],
              },
            },
          ],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="home-page">
      <Navbar isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      
      {/* Floating Card Layout with resizable panels */}
      <div className="flex-1 p-4 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full gap-3">
          {/* Left Panel - Sources */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full bg-sidebar rounded-2xl border border-sidebar-border overflow-hidden">
              <SourcesPanel
                sources={sources}
                selectedSourceId={selectedSourceId}
                onAddSource={handleAddSource}
                onDeleteSource={handleDeleteSource}
                onSelectSource={(source) => setSelectedSourceId(source.id)}
                onStartDeepResearch={handleStartDeepResearch}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-1 bg-transparent hover:bg-primary/20 transition-colors rounded-full" />
          
          {/* Center Panel - Chat or Source Detail */}
          <ResizablePanel defaultSize={55} minSize={35}>
            <div className="h-full bg-sidebar rounded-2xl border border-sidebar-border overflow-hidden">
              {selectedSourceId ? (
                <SourceDetailView 
                  source={sources.find(s => s.id === selectedSourceId)!}
                  onClose={() => setSelectedSourceId(undefined)}
                />
              ) : (
                <ChatPanel
                  sources={sources}
                  messages={messages}
                  onNewMessage={handleNewMessage}
                  isLoading={isLoading}
                />
              )}
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-1 bg-transparent hover:bg-primary/20 transition-colors rounded-full" />
          
          {/* Right Panel - Studio */}
          <ResizablePanel defaultSize={25} minSize={18} maxSize={35}>
            <div className="h-full bg-sidebar rounded-2xl border border-sidebar-border overflow-hidden">
              <StudioPanel
                workflows={workflows}
                reports={reports}
                sources={sources}
                onSaveWorkflow={handleSaveWorkflow}
                onDeleteWorkflow={handleDeleteWorkflow}
                onRunWorkflow={handleRunWorkflow}
                onDeleteReport={(id) => console.log('Delete report:', id)}
                onDownloadReport={(id) => console.log('Download report:', id)}
                onOpenMindMap={() => console.log('Open Mind Map')}
                onOpenEmailBuilder={() => console.log('Open Email Builder')}
                onRunBrowserScript={(script) => {
                  setShowBrowserMonitor(true);
                  setBrowserStatus('running');
                  setBrowserTotalSteps(5);
                  setBrowserStepNum(1);
                  setBrowserStep('Initializing browser...');
                  setBrowserUrl('https://hyperbrowser.ai');
                  
                  const steps = [
                    'Initializing browser...',
                    'Loading target page...',
                    'Executing script...',
                    'Extracting data...',
                    'Completing task...'
                  ];
                  
                  let stepIndex = 0;
                  const stepInterval = setInterval(() => {
                    stepIndex++;
                    if (stepIndex < steps.length) {
                      setBrowserStepNum(stepIndex + 1);
                      setBrowserStep(steps[stepIndex]);
                    } else {
                      clearInterval(stepInterval);
                      setBrowserStatus('completed');
                      setBrowserStep('Script completed');
                    }
                  }, 1000);
                }}
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
