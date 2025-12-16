import { useState, useEffect, useRef } from "react";
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
  FileUp,
  Search,
  ArrowRight,
  Hourglass,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Source } from "@/lib/types";

interface SourcesPanelProps {
  onSourcesChange?: (selectedSourceIds: string[]) => void;
  onSelectSource?: (source: Source) => void;
  selectedSourceId?: string;
  notebookId?: string;
}

const sourceTypeIcons: Record<string, typeof Globe> = {
  url: Globe,
  pdf: FileText,
  text: Type,
};

export default function SourcesPanel({ 
  onSourcesChange,
  onSelectSource,
  selectedSourceId,
  notebookId
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Web search state
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'web' | 'youtube' | 'news'>('web');
  const [researchMode, setResearchMode] = useState<'fast' | 'deep'>('fast');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    title: string;
    url: string;
    description: string;
    selected: boolean;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { data: sources = [], isLoading, isError, error } = useQuery<Source[]>({
    queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'],
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
    mutationFn: async (source: { type: string; name: string; content: string; notebookId?: string }) => {
      const res = await apiRequest('POST', '/api/sources', { ...source, notebookId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'] });
      if (notebookId) {
        queryClient.invalidateQueries({ queryKey: ['/api/notebooks'] });
      }
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
      queryClient.invalidateQueries({ queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'] });
      if (notebookId) {
        queryClient.invalidateQueries({ queryKey: ['/api/notebooks'] });
      }
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
      queryClient.invalidateQueries({ queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'] });
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

  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  
  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    
    setIsFetchingMetadata(true);
    setAddUrlDialogOpen(false);
    
    let name = urlInput.slice(0, 30);
    try {
      name = new URL(urlInput).hostname;
    } catch {
      // Use truncated URL as name
    }
    
    // Try to fetch better metadata
    try {
      const res = await apiRequest('POST', '/api/url/metadata', { url: urlInput });
      const metadata = await res.json();
      if (metadata.title && metadata.title !== name) {
        name = metadata.title;
      }
    } catch {
      // Use hostname as fallback
    }
    
    setIsFetchingMetadata(false);
    
    createSourceMutation.mutate({
      type: 'url',
      name,
      content: urlInput,
    });
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setAddSourcesModalOpen(false);
    
    const formData = new FormData();
    formData.append('file', file);
    if (notebookId) {
      formData.append('notebookId', notebookId);
    }

    try {
      const response = await fetch('/api/sources/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // Invalidate the correct query based on notebook context
      await queryClient.invalidateQueries({ 
        queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'] 
      });
      if (notebookId) {
        await queryClient.invalidateQueries({ queryKey: ['/api/notebooks'] });
      }
      toast({ title: "File uploaded successfully" });
    } catch (err) {
      toast({ 
        title: "Failed to upload file", 
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeepResearch = () => {
    if (!researchTopic.trim()) return;
    deepResearchMutation.mutate(researchTopic.trim());
  };

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) return;
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      const res = await apiRequest('POST', '/api/search/web', {
        query: webSearchQuery,
        type: searchType,
        mode: researchMode,
      });
      const data = await res.json();
      setSearchResults(data.results.map((r: any, i: number) => ({
        id: `search-${i}`,
        title: r.title,
        url: r.url,
        description: r.description || '',
        selected: false,
      })));
    } catch (err) {
      toast({ 
        title: "Search failed", 
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive" 
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSearchResult = (id: string) => {
    setSearchResults(prev => prev.map(r => 
      r.id === id ? { ...r, selected: !r.selected } : r
    ));
  };

  const addSelectedSearchResults = async () => {
    const selected = searchResults.filter(r => r.selected);
    for (const result of selected) {
      let name = result.title;
      if (!name) {
        try {
          name = new URL(result.url).hostname;
        } catch {
          name = result.url.slice(0, 50);
        }
      }
      try {
        await createSourceMutation.mutateAsync({
          type: 'url',
          name,
          content: result.url,
        });
      } catch (err) {
        toast({
          title: "Failed to add source",
          description: `Could not add: ${name}`,
          variant: "destructive"
        });
      }
    }
    setSearchResults([]);
    setShowSearchResults(false);
    setWebSearchQuery('');
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
    const newExpandedId = expandedSourceId === sourceId ? null : sourceId;
    setExpandedSourceId(newExpandedId);
    
    // Auto-summarize when expanding a source without a summary
    if (newExpandedId) {
      const source = sources.find(s => s.id === newExpandedId);
      if (source && !source.summary && !summarizeSourceMutation.isPending) {
        summarizeSourceMutation.mutate(newExpandedId);
      }
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="sources-panel">
      <div className="p-4 border-b border-border/50">
        <h2 className="font-semibold text-base" data-testid="text-sources-title">Sources</h2>
      </div>

      <div className="p-4 space-y-3">
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

        {/* Deep Research Banner */}
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 hover-elevate transition-colors text-left"
          onClick={() => setDeepResearchDialogOpen(true)}
          data-testid="button-deep-research-banner"
        >
          <Hourglass className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm">
            <span className="text-primary font-medium">Try Deep Research</span>
            <span className="text-muted-foreground"> for an in-depth report and new sources!</span>
          </span>
        </button>

        {/* Web Search Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              placeholder="Search the web for new sources"
              value={webSearchQuery}
              onChange={(e) => setWebSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              data-testid="input-web-search"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={handleWebSearch}
              disabled={isSearching || !webSearchQuery.trim()}
              data-testid="button-search-submit"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 rounded-lg" data-testid="dropdown-search-type">
                  <Globe className="w-3.5 h-3.5" />
                  {searchType === 'web' ? 'Web' : searchType === 'youtube' ? 'YouTube' : 'News'}
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setSearchType('web')} data-testid="menu-item-web">
                  Web
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchType('youtube')} data-testid="menu-item-youtube">
                  YouTube
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchType('news')} data-testid="menu-item-news">
                  News
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 rounded-lg" data-testid="dropdown-research-mode">
                  <Hourglass className="w-3.5 h-3.5" />
                  {researchMode === 'fast' ? 'Fast Research' : 'Deep Research'}
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setResearchMode('fast')} data-testid="menu-item-fast">
                  Fast Research
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResearchMode('deep')} data-testid="menu-item-deep">
                  Deep Research
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {showSearchResults && (
        <div className="px-4 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {isSearching ? 'Searching...' : `${searchResults.length} results found`}
            </span>
            <div className="flex items-center gap-2">
              {searchResults.some(r => r.selected) && (
                <Button
                  size="sm"
                  onClick={addSelectedSearchResults}
                  disabled={createSourceMutation.isPending}
                  className="h-7 text-xs"
                  data-testid="button-add-selected-results"
                >
                  {createSourceMutation.isPending ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3 mr-1" />
                  )}
                  Add {searchResults.filter(r => r.selected).length} selected
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchResults([]);
                }}
                data-testid="button-close-search-results"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {isSearching ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer hover-elevate transition-colors ${
                      result.selected ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => toggleSearchResult(result.id)}
                    data-testid={`search-result-${result.id}`}
                  >
                    <Checkbox
                      checked={result.selected}
                      onCheckedChange={() => toggleSearchResult(result.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.description || result.url}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
          )}
        </div>
      )}

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
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover-elevate transition-colors text-left"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="button-modal-upload-file"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                ) : (
                  <FileUp className="w-5 h-5 text-purple-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Upload file</p>
                <p className="text-xs text-muted-foreground">PDF, TXT, or Markdown files</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="input-file-upload"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
