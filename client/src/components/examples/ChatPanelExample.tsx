import { useState } from "react";
import ChatPanel from "../panels/ChatPanel";
import type { ChatMessage, Source, A2UIComponent } from "@/lib/types";

export default function ChatPanelExample() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'user',
      content: 'Analyze the competitor websites I added and create a comparison table.',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'I\'ve analyzed the 3 competitor sources you provided. Here\'s a summary of my findings:',
      a2uiComponents: [
        {
          id: 'card-1',
          type: 'card',
          properties: {
            title: 'Analysis Complete',
            description: 'Scraped and compared 3 competitor websites',
            actions: [
              { label: 'View Full Report', variant: 'default' },
              { label: 'Export PDF', variant: 'outline' },
            ],
          },
        },
      ],
      timestamp: new Date(Date.now() - 30000),
    },
  ]);

  const sources: Source[] = [
    { id: '1', type: 'url', name: 'Competitor A', content: 'https://competitor-a.com', summary: null, metadata: null, createdAt: null },
    { id: '2', type: 'url', name: 'Competitor B', content: 'https://competitor-b.com', summary: null, metadata: null, createdAt: null },
  ];

  const sourceSummaries = [
    { id: '1', name: 'Competitor A', summary: 'Leading enterprise SaaS platform with focus on automation.' },
    { id: '2', name: 'Competitor B', summary: 'Small business focused solution with affordable pricing.' },
  ];

  const handleNewMessage = (userContent: string, response?: string, a2uiComponents?: A2UIComponent[]) => {
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: Date.now().toString(),
        role: 'user' as const,
        content: userContent,
        timestamp: new Date(),
      },
    ];
    
    if (response) {
      newMessages.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response,
        a2uiComponents,
        timestamp: new Date(),
      });
    }
    
    setMessages(newMessages);
  };

  return (
    <div className="h-[600px] border rounded-lg overflow-hidden">
      <ChatPanel
        sources={sources}
        messages={messages}
        onNewMessage={handleNewMessage}
        isLoading={false}
        sourceSummaries={sourceSummaries}
      />
    </div>
  );
}
