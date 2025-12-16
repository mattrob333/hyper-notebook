import { useState } from "react";
import SourcesPanel from "../panels/SourcesPanel";
import type { Source } from "@/lib/types";

export default function SourcesPanelExample() {
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  return (
    <div className="h-[500px]">
      <SourcesPanel
        selectedSourceId={selectedId}
        onSelectSource={(source: Source) => setSelectedId(source.id)}
        onSourcesChange={(ids: string[]) => setSelectedSourceIds(ids)}
      />
      {selectedSourceIds.length > 0 && (
        <div className="mt-2 p-2 text-xs text-muted-foreground">
          Selected IDs: {selectedSourceIds.join(', ')}
        </div>
      )}
    </div>
  );
}
