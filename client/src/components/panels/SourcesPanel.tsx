import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Globe, 
  FileText, 
  Type, 
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Plus,
  Upload,
  FileUp
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Source } from "@/lib/types";

interface SourcesPanelProps {
  onSourcesChange?: (selectedSourceIds: string[]) => void;
  onSelectSource?: (source: Source) => void;
  selectedSourceId?: string;
}

const sourceTypeIcons: Record<string, typeof Globe> = {
  url: Globe,
  pdf: FileText,
  text: Type,
};

export default function SourcesPanel({ 
  onSourcesChange,
  onSelectSource,
  selectedSourceId 
}: SourcesPanelProps) {
  const { toast } = useToast();
  const [addUrlDialogOpen, setAddUrlDialogOpen] = useState(false);
  const [addTextDialogOpen, setAddTextDialogOpen] = useState(false);
  const [deepResearchDialogOpen, setDeepResearchDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textName, setTextName] = useState('');
  const [researchTopic, setResearchTopic] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [addSourcesModalOpen, setAddSourcesModalOpen] = useState(false);

  const { data: sources = [], isLoading, isError, error } = useQuery<Source[]>({
    queryKey: ['/api/sources'],
  });

  useEffect(() => {
    if (sources.length > 0) {
      const allIds = new Set(sources.map(s => s.id));
      setSelectedSources(allIds);
    }
  }, [sources]);

  useEffect(() => {
    onSourcesChange?.(Array.from(selectedSources));
  }, [selectedSources, onSourcesChange]);

  const createSourceMutation = useMutation({
    mutationFn: async (source: { type: string; name: string; content: string }) => {
      const res = await apiRequest('POST', '/api/sources', source);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
      toast({ title: "Source added successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add source", description: err.message, variant: "destructive" });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
      toast({ title: "Source deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete source", description: err.message, variant: "destructive" });
    },
  });

  const summarizeSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('POST', `/api/sources/${id}/summarize`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
      toast({ title: "Summary generated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to summarize", description: err.message, variant: "destructive" });
    },
  });

  const deepResearchMutation = useMutation({
    mutationFn: async (topic: string) => {
      const res = await apiRequest('POST', '/api/chat/simple', {
        messages: [{ role: 'user', content: `Research the following topic thoroughly and provide a comprehensive summary with key facts, recent developments, and important context: ${topic}` }],
        systemPrompt: 'You are a research assistant. Provide comprehensive, well-structured research summaries with factual information.',
      });
      return res.json();
    },
    onSuccess: async (data, topic) => {
      await createSourceMutation.mutateAsync({
        type: 'text',
        name: `Research: ${topic.slice(0, 50)}${topic.length > 50 ? '...' : ''}`,
        content: data.content,
      });
      setDeepResearchDialogOpen(false);
      setResearchTopic('');
    },
    onError: (err: Error) => {
      toast({ title: "Research failed", description: err.message, variant: "destructive" });
    },
  });

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    let name = urlInput.slice(0, 30);
    try {
      name = new URL(urlInput).hostname;
    } catch {
      // Use truncated URL as name
    }
    createSourceMutation.mutate({
      type: 'url',
      name,
      content: urlInput,
    });
    setAddUrlDialogOpen(false);
    setUrlInput('');
  };

  const handleAddText = () => {
    if (!textInput.trim() || !textName.trim()) return;
    createSourceMutation.mutate({
      type: 'text',
      name: textName,
      content: textInput,
    });
    setAddTextDialogOpen(false);
    setTextInput('');
    setTextName('');
  };

  const handleDeepResearch = () => {
    if (!researchTopic.trim()) return;
    deepResearchMutation.mutate(researchTopic.trim());
  };

  const toggleSourceSelection = (sourceId: string) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId);
    } else {
      newSelected.add(sourceId);
    }
    setSelectedSources(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSources.size === sources.length) {
      setSelectedSources(new Set());
    } else {
      setSelectedSources(new Set(sources.map(s => s.id)));
    }
  };

  const toggleExpand = (sourceId: string) => {
    setExpandedSourceId(expandedSourceId === sourceId ? null : sourceId);
  };

  return (
    <div className="flex flex-col h-full" data-testid="sources-panel">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-base" data-testid="text-sources-title">Sources</h2>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setDeepResearchDialogOpen(true)}
            data-testid="button-deep-research"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <Button 
          variant="outline" 
          size="default"
          className="w-full justify-center gap-2"
          onClick={() => setAddSourcesModalOpen(true)}
          data-testid="button-add-sources"
        >
          <Plus className="w-4 h-4" />
          Add sources
        </Button>
      </div>

      <div className="px-4 py-2 flex items-center justify-between border-t border-border/50">
        <span className="text-xs text-muted-foreground" data-testid="text-select-all-label">
          {selectedSources.size} of {sources.length} selected
        </span>
        <Checkbox
          checked={sources.length > 0 && selectedSources.size === sources.length}
          onCheckedChange={toggleSelectAll}
          data-testid="checkbox-select-all"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="space-y-2" data-testid="sources-loading">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 text-center" data-testid="sources-error">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-destructive">
                Failed to load sources
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(error as Error)?.message || 'Unknown error'}
              </p>
            </div>
          ) : sources.length === 0 ? (
            <div className="p-8 text-center" data-testid="sources-empty">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No sources yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add URLs or text to get started
              </p>
            </div>
          ) : (
            <div className="space-y-1" data-testid="sources-list">
              {sources.map((source) => {
                const Icon = sourceTypeIcons[source.type] || FileText;
                const isSelected = selectedSources.has(source.id);
                const isExpanded = expandedSourceId === source.id;
                const isActive = selectedSourceId === source.id;
                const isSummarizing = summarizeSourceMutation.isPending && 
                  summarizeSourceMutation.variables === source.id;

                return (
                  <div
                    key={source.id}
                    className={`rounded-xl border border-border/50 transition-colors ${
                      isActive ? 'bg-primary/10 border-primary/30' : 'bg-card'
                    }`}
                    data-testid={`source-item-${source.id}`}
                  >
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover-elevate"
                      onClick={() => {
                        toggleExpand(source.id);
                        onSelectSource?.(source);
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(source.id);
                        }}
                        className="shrink-0"
                        data-testid={`button-expand-${source.id}`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <div className="p-1.5 rounded-lg bg-muted shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="flex-1 text-sm truncate" data-testid={`text-source-name-${source.id}`}>
                        {source.name}
                      </span>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSourceSelection(source.id)}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`checkbox-source-${source.id}`}
                      />
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-border/30">
                        {source.summary ? (
                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed" data-testid={`text-summary-${source.id}`}>
                            {source.summary}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/50 mb-3 italic" data-testid={`text-no-summary-${source.id}`}>
                            No summary available
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              summarizeSourceMutation.mutate(source.id);
                            }}
                            disabled={isSummarizing}
                            data-testid={`button-summarize-${source.id}`}
                          >
                            {isSummarizing ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3 mr-1" />
                            )}
                            {source.summary ? 'Re-summarize' : 'Summarize'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSourceMutation.mutate(source.id);
                            }}
                            disabled={deleteSourceMutation.isPending}
                            data-testid={`button-delete-${source.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={addUrlDialogOpen} onOpenChange={setAddUrlDialogOpen}>
        <DialogContent className="rounded-2xl" data-testid="dialog-add-url">
          <DialogHeader>
            <DialogTitle>Add URL Source</DialogTitle>
            <DialogDescription>
              Enter a URL to add as a source
            </DialogDescription>
          </DialogHeader>
          <Input 
            placeholder="https://example.com/article"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            className="rounded-xl"
            data-testid="input-url"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUrlDialogOpen(false)} className="rounded-xl" data-testid="button-cancel-url">
              Cancel
            </Button>
            <Button 
              onClick={handleAddUrl} 
              className="rounded-xl" 
              disabled={createSourceMutation.isPending || !urlInput.trim()}
              data-testid="button-confirm-url"
            >
              {createSourceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addTextDialogOpen} onOpenChange={setAddTextDialogOpen}>
        <DialogContent className="rounded-2xl" data-testid="dialog-add-text">
          <DialogHeader>
            <DialogTitle>Add Text Source</DialogTitle>
            <DialogDescription>
              Paste text content to add as a source
            </DialogDescription>
          </DialogHeader>
          <Input 
            placeholder="Source name"
            value={textName}
            onChange={(e) => setTextName(e.target.value)}
            className="rounded-xl"
            data-testid="input-text-name"
          />
          <Textarea 
            placeholder="Paste your text content here..."
            className="min-h-32 rounded-xl"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            data-testid="input-text-content"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTextDialogOpen(false)} className="rounded-xl" data-testid="button-cancel-text">
              Cancel
            </Button>
            <Button 
              onClick={handleAddText} 
              className="rounded-xl" 
              disabled={createSourceMutation.isPending || !textInput.trim() || !textName.trim()}
              data-testid="button-confirm-text"
            >
              {createSourceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deepResearchDialogOpen} onOpenChange={setDeepResearchDialogOpen}>
        <DialogContent className="rounded-2xl" data-testid="dialog-deep-research">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Deep Research
            </DialogTitle>
            <DialogDescription>
              Enter a topic to research. AI will gather comprehensive information and create a new source.
            </DialogDescription>
          </DialogHeader>
          <Input 
            placeholder="Enter research topic..."
            value={researchTopic}
            onChange={(e) => setResearchTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !deepResearchMutation.isPending && handleDeepResearch()}
            className="rounded-xl"
            data-testid="input-research-topic"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeepResearchDialogOpen(false)} className="rounded-xl" data-testid="button-cancel-research">
              Cancel
            </Button>
            <Button 
              onClick={handleDeepResearch} 
              className="rounded-xl" 
              disabled={deepResearchMutation.isPending || !researchTopic.trim()}
              data-testid="button-start-research"
            >
              {deepResearchMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {deepResearchMutation.isPending ? 'Researching...' : 'Start Research'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addSourcesModalOpen} onOpenChange={setAddSourcesModalOpen}>
        <DialogContent className="rounded-2xl max-w-md" data-testid="dialog-add-sources">
          <DialogHeader>
            <DialogTitle>Add sources</DialogTitle>
            <DialogDescription>
              Add content to your notebook from URLs, files, or text
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <button
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover-elevate transition-colors text-left"
              onClick={() => {
                setAddSourcesModalOpen(false);
                setAddUrlDialogOpen(true);
              }}
              data-testid="button-modal-add-url"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Website URL</p>
                <p className="text-xs text-muted-foreground">Add a webpage or article</p>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover-elevate transition-colors text-left"
              onClick={() => {
                setAddSourcesModalOpen(false);
                setAddTextDialogOpen(true);
              }}
              data-testid="button-modal-add-text"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                <Type className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Paste text</p>
                <p className="text-xs text-muted-foreground">Add text content directly</p>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover-elevate transition-colors text-left opacity-60"
              data-testid="button-modal-upload-file"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                <FileUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload file</p>
                <p className="text-xs text-muted-foreground">PDF, TXT, or other documents (coming soon)</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
