import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SourcesPanel from "@/components/panels/SourcesPanel";
import ChatPanel from "@/components/panels/ChatPanel";
import StudioPanel from "@/components/panels/StudioPanel";
import type { Source, Workflow, ChatMessage, A2UIComponent } from "@/lib/types";

interface Report {
  id: string;
  name: string;
  type: 'analysis' | 'summary' | 'comparison';
  createdAt: Date;
}

interface Email {
  id: string;
  to: string;
  subject: string;
  status: 'draft' | 'sent' | 'failed';
  sentAt?: Date;
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  // todo: remove mock functionality
  const [sources, setSources] = useState<Source[]>([
    { id: '1', type: 'url', name: 'OpenAI Blog', content: 'https://openai.com/blog' },
    { id: '2', type: 'pdf', name: 'Research Paper.pdf', content: 'research-paper.pdf' },
    { id: '3', type: 'text', name: 'Meeting Notes', content: 'Notes from the Q4 planning meeting...' },
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
    { id: '1', name: 'Q4 Competitor Report', type: 'comparison', createdAt: new Date() },
    { id: '2', name: 'Market Analysis', type: 'analysis', createdAt: new Date(Date.now() - 86400000) },
  ]);

  const [emails, setEmails] = useState<Email[]>([
    { id: '1', to: 'team@company.com', subject: 'Weekly Report', status: 'sent', sentAt: new Date() },
  ]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleNewMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // todo: replace with actual API call
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
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Run workflow: ${workflow.name}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // todo: replace with actual workflow execution
    setTimeout(() => {
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
    }, 2000);
  };

  const handleSendEmail = (email: Omit<Email, 'id' | 'status'>) => {
    setEmails([
      ...emails,
      { ...email, id: Date.now().toString(), status: 'sent', sentAt: new Date() },
    ]);
  };

  const handleDeleteEmail = (id: string) => {
    setEmails(emails.filter((e) => e.id !== id));
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="home-page">
      <Navbar isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      <div className="flex-1 flex overflow-hidden">
        <SourcesPanel
          sources={sources}
          selectedSourceId={selectedSourceId}
          onAddSource={handleAddSource}
          onDeleteSource={handleDeleteSource}
          onSelectSource={(source) => setSelectedSourceId(source.id)}
        />
        <ChatPanel
          sources={sources}
          messages={messages}
          onNewMessage={handleNewMessage}
          isLoading={isLoading}
        />
        <StudioPanel
          workflows={workflows}
          reports={reports}
          emails={emails}
          onSaveWorkflow={handleSaveWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
          onRunWorkflow={handleRunWorkflow}
          onDeleteReport={(id) => console.log('Delete report:', id)}
          onDownloadReport={(id) => console.log('Download report:', id)}
          onSendEmail={handleSendEmail}
          onDeleteEmail={handleDeleteEmail}
        />
      </div>
    </div>
  );
}
