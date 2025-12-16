import { useState } from "react";
import SourcesPanel from "../panels/SourcesPanel";
import type { Source } from "@/lib/types";

export default function SourcesPanelExample() {
  // todo: remove mock functionality
  const [sources, setSources] = useState<Source[]>([
    { id: '1', type: 'url', name: 'OpenAI Blog', content: 'https://openai.com/blog' },
    { id: '2', type: 'pdf', name: 'Research Paper.pdf', content: 'research-paper.pdf' },
    { id: '3', type: 'text', name: 'Meeting Notes', content: 'Notes from the Q4 planning meeting...' },
  ]);
  const [selectedId, setSelectedId] = useState<string>();

  return (
    <div className="h-[500px]">
      <SourcesPanel
        sources={sources}
        selectedSourceId={selectedId}
        onAddSource={(source) => {
          setSources([...sources, { ...source, id: Date.now().toString() }]);
        }}
        onDeleteSource={(id) => {
          setSources(sources.filter(s => s.id !== id));
        }}
        onSelectSource={(source) => setSelectedId(source.id)}
      />
    </div>
  );
}
