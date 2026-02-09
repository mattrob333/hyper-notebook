import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Link as LinkIcon, 
  Youtube, 
  FileSpreadsheet,
  Plus,
  Check,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Source } from "@/lib/types";

interface MobileSourcesViewProps {
  notebookId?: string;
  selectedSourceIds: string[];
  onSourcesChange: (ids: string[]) => void;
  onAddSource?: () => void;
}

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'youtube':
      return Youtube;
    case 'url':
    case 'website':
      return LinkIcon;
    case 'csv':
    case 'spreadsheet':
      return FileSpreadsheet;
    default:
      return FileText;
  }
};

export default function MobileSourcesView({
  notebookId,
  selectedSourceIds,
  onSourcesChange,
  onAddSource,
}: MobileSourcesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sources = [], isLoading } = useQuery<Source[]>({
    queryKey: notebookId 
      ? [`/api/notebooks/${notebookId}/sources`] 
      : ['/api/sources'],
  });

  const filteredSources = sources.filter(source =>
    source.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSource = (sourceId: string) => {
    if (selectedSourceIds.includes(sourceId)) {
      onSourcesChange(selectedSourceIds.filter(id => id !== sourceId));
    } else {
      onSourcesChange([...selectedSourceIds, sourceId]);
    }
  };

  const selectAll = () => {
    if (selectedSourceIds.length === sources.length) {
      onSourcesChange([]);
    } else {
      onSourcesChange(sources.map(s => s.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/50 border-0"
          />
        </div>
      </div>

      {/* Source Count & Select All */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm text-muted-foreground">
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={selectAll}
          className="text-xs"
        >
          {selectedSourceIds.length === sources.length ? 'Deselect all' : 'Select all'}
        </Button>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No sources match your search' : 'No sources yet'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onAddSource}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add source
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredSources.map((source) => {
              const Icon = getSourceIcon(source.type);
              const isSelected = selectedSourceIds.includes(source.id);

              return (
                <div
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 cursor-pointer transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  {/* Selection Checkbox */}
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                    isSelected 
                      ? "bg-primary border-primary" 
                      : "border-muted-foreground/30"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>

                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {source.name || 'Untitled'}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {source.content?.slice(0, 100) || 'No content'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Source Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onAddSource}
        >
          <Plus className="w-4 h-4" />
          Add source
        </Button>
      </div>
    </div>
  );
}
