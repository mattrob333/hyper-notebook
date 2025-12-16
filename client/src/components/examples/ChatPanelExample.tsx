import { useState } from "react";
import ChatPanel from "../panels/ChatPanel";
import type { ChatMessage, Source } from "@/lib/types";

export default function ChatPanelExample() {
  // todo: remove mock functionality
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
    { id: '1', type: 'url', name: 'Competitor A', content: 'https://competitor-a.com' },
    { id: '2', type: 'url', name: 'Competitor B', content: 'https://competitor-b.com' },
  ];

  const handleNewMessage = (content: string) => {
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="h-[600px] border rounded-lg overflow-hidden">
      <ChatPanel
        sources={sources}
        messages={messages}
        onNewMessage={handleNewMessage}
        isLoading={false}
      />
    </div>
  );
}
