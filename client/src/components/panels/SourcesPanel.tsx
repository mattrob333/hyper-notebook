import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
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
  X,
  Table2,
  Rss,
  RefreshCw,
  Tag,
  Pencil,
  FolderArchive
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Source, Feed } from "@/lib/types";

interface SourcesPanelProps {
  onSourcesChange?: (selectedSourceIds: string[]) => void;
  onSelectSource?: (source: Source) => void;
  selectedSourceId?: string;
  notebookId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const sourceTypeIcons: Record<string, typeof Globe> = {
  url: Globe,
  pdf: FileText,
  text: Type,
  csv: Table2,
};

export default function SourcesPanel({ 
  onSourcesChange,
  onSelectSource,
  selectedSourceId,
  notebookId,
  collapsed = false,
  onToggleCollapse
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
  const [feedsExpanded, setFeedsExpanded] = useState(false);
  const [discoveringRss, setDiscoveringRss] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameSourceId, setRenameSourceId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const { data: sources = [], isLoading, isError, error } = useQuery<Source[]>({
    queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'],
  });

  const { data: feedsList = [] } = useQuery<Feed[]>({
    queryKey: notebookId ? [`/api/notebooks/${notebookId}/feeds`] : ['/api/feeds'],
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

  const renameSourceMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest('PATCH', `/api/sources/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'] });
      toast({ title: "Source renamed" });
      setRenameDialogOpen(false);
      setRenameSourceId(null);
      setRenameValue('');
    },
    onError: (err: Error) => {
      toast({ title: "Failed to rename", description: err.message, variant: "destructive" });
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

  const updateSourceCategoryMutation = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: 'context' | 'feed' | 'reference' }) => {
      const res = await apiRequest('PATCH', `/api/sources/${id}`, { category });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'] });
      toast({ title: "Category updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update category", description: err.message, variant: "destructive" });
    },
  });

  const refreshFeedsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/refresh-feeds', { notebookId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'] });
      toast({ title: "Feeds refreshed", description: `Updated ${data.updated || 0} feed sources` });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to refresh feeds", description: err.message, variant: "destructive" });
    },
  });

  const deepResearchMutation = useMutation({
    mutationFn: async (topic: string) => {
      const res = await apiRequest('POST', '/api/firecrawl-deep-research', {
        query: topic,
        maxDepth: 5,
        timeLimit: 180,
        maxUrls: 15,
        notebookId,
      });
      return res.json();
    },
    onSuccess: async (data) => {
      // Sources are automatically created by the server endpoint
      queryClient.invalidateQueries({ queryKey: notebookId ? [`/api/notebooks/${notebookId}/sources`] : ['/api/sources'] });
      if (notebookId) {
        queryClient.invalidateQueries({ queryKey: ['/api/notebooks'] });
      }
      toast({ 
        title: "Deep Research Complete", 
        description: `Created ${data.createdSources || 0} sources from research` 
      });
      setDeepResearchDialogOpen(false);
      setResearchTopic('');
    },
    onError: (err: Error) => {
      toast({ title: "Research failed", description: err.message, variant: "destructive" });
    },
  });

  const createFeedMutation = useMutation({
    mutationFn: async (feed: { name: string; url: string; sourceUrl?: string }) => {
      const res = await apiRequest('POST', '/api/feeds', { ...feed, notebookId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookId ? [`/api/notebooks/${notebookId}/feeds`] : ['/api/feeds'] });
      toast({ title: "Feed added" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add feed", description: err.message, variant: "destructive" });
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/feeds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookId ? [`/api/notebooks/${notebookId}/feeds`] : ['/api/feeds'] });
      toast({ title: "Feed removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to remove feed", description: err.message, variant: "destructive" });
    },
  });

  const getSourceUrl = (source: Source): string | null => {
    // For URL sources, content should be the URL, but check if it's valid
    if (source.content?.startsWith('http://') || source.content?.startsWith('https://')) {
      return source.content;
    }
    // Check metadata for URL
    if (source.metadata?.url) {
      return source.metadata.url as string;
    }
    if (source.metadata?.sourceUrl) {
      return source.metadata.sourceUrl as string;
    }
    return null;
  };

  const discoverRssFeed = async (source: Source) => {
    const sourceUrl = getSourceUrl(source);
    if (!sourceUrl) {
      toast({ title: "Cannot find URL", description: "This source doesn't have a valid URL", variant: "destructive" });
      return;
    }
    
    setDiscoveringRss(source.id);
    try {
      const res = await apiRequest('POST', '/api/discover-rss', { url: sourceUrl });
      const data = await res.json();
      if (data.feeds && data.feeds.length > 0) {
        // Auto-add the first discovered feed
        const feedUrl = data.feeds[0];
        const feedName = new URL(feedUrl).hostname + ' RSS Feed';
        await createFeedMutation.mutateAsync({ name: feedName, url: feedUrl, sourceUrl });
        toast({ title: "RSS feed discovered", description: `Found ${data.feeds.length} feed(s)` });
      } else {
        toast({ title: "No RSS feeds found", description: "This website doesn't appear to have an RSS feed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Failed to discover RSS", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setDiscoveringRss(null);
    }
  };

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

  // Collapsed view - just a filing cabinet icon
  if (collapsed) {
    return (
      <div className="flex flex-col h-full items-center pt-3" data-testid="sources-panel-collapsed">
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 rounded-lg hover:bg-primary/10"
          onClick={onToggleCollapse}
          title="Expand Sources"
        >
          <FolderArchive className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="sources-panel">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="font-semibold text-base" data-testid="text-sources-title">Sources</h2>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 rounded-lg hover:bg-muted"
          onClick={onToggleCollapse}
          title="Collapse Sources"
        >
          <FolderArchive className="w-4 h-4 text-muted-foreground" />
        </Button>
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

            <Button
              variant="outline"
              size="sm"
              className="gap-1 rounded-lg"
              onClick={() => refreshFeedsMutation.mutate()}
              disabled={refreshFeedsMutation.isPending}
              data-testid="button-refresh-feeds"
            >
              {refreshFeedsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Refresh Feeds
            </Button>
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
            <div className="h-64 overflow-y-scroll scrollbar-thin">
              <div className="space-y-1 pr-2 pb-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      result.selected ? 'bg-primary/10' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSearchResult(result.id);
                    }}
                    data-testid={`search-result-${result.id}`}
                  >
                    <Checkbox
                      checked={result.selected}
                      onCheckedChange={() => toggleSearchResult(result.id)}
                      className="mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.description || result.url}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
          className="mr-2"
          data-testid="checkbox-select-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
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
            <div className="space-y-1 w-full" data-testid="sources-list">
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
                    className={`w-full rounded-xl border border-border/50 transition-colors overflow-hidden ${
                      isActive ? 'bg-primary/10 border-primary/30' : 'bg-card'
                    }`}
                    data-testid={`source-item-${source.id}`}
                  >
                    <div
                      className="flex items-center gap-2 px-2 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors min-w-0"
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
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <span className="text-sm block truncate" data-testid={`text-source-name-${source.id}`}>
                          {source.name}
                        </span>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSourceSelection(source.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 ml-1"
                        data-testid={`checkbox-source-${source.id}`}
                      />
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-border/30">
                        {source.summary ? (
                          <div className="text-xs text-muted-foreground mb-3 leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none" data-testid={`text-summary-${source.id}`}>
                            <ReactMarkdown>{source.summary}</ReactMarkdown>
                          </div>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameSourceId(source.id);
                              setRenameValue(source.name);
                              setRenameDialogOpen(true);
                            }}
                            data-testid={`button-rename-${source.id}`}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Rename
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
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`dropdown-category-${source.id}`}
                              >
                                {source.category === 'feed' ? (
                                  <Rss className="w-3 h-3 mr-1" />
                                ) : source.category === 'reference' ? (
                                  <FileText className="w-3 h-3 mr-1" />
                                ) : (
                                  <Tag className="w-3 h-3 mr-1" />
                                )}
                                {source.category || 'context'}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem 
                                onClick={() => updateSourceCategoryMutation.mutate({ id: source.id, category: 'context' })}
                              >
                                <Tag className="w-3 h-3 mr-2" />
                                Context
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateSourceCategoryMutation.mutate({ id: source.id, category: 'feed' })}
                              >
                                <Rss className="w-3 h-3 mr-2" />
                                Feed (auto-refresh)
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateSourceCategoryMutation.mutate({ id: source.id, category: 'reference' })}
                              >
                                <FileText className="w-3 h-3 mr-2" />
                                Reference
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {source.type === 'url' && getSourceUrl(source) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                discoverRssFeed(source);
                              }}
                              disabled={discoveringRss === source.id}
                            >
                              {discoveringRss === source.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Rss className="w-3 h-3 mr-1" />
                              )}
                              Find RSS
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feeds Section */}
      <div className="border-t border-border/50">
        <button
          onClick={() => setFeedsExpanded(!feedsExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Rss className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">RSS Feeds</span>
            <span className="text-xs text-muted-foreground">({feedsList.length})</span>
          </div>
          {feedsExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        {feedsExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {feedsList.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 italic py-2">
                No RSS feeds yet. Click "Find RSS" on a URL source to discover feeds.
              </p>
            ) : (
              feedsList.map((feed) => (
                <div
                  key={feed.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Rss className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{feed.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{feed.url}</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteFeedMutation.mutate(feed.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

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
              AI will autonomously explore the web, gather relevant sources, and create a comprehensive research report with source attribution.
            </DialogDescription>
          </DialogHeader>
          <Input 
            placeholder="What would you like to research?"
            value={researchTopic}
            onChange={(e) => setResearchTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !deepResearchMutation.isPending && handleDeepResearch()}
            className="rounded-xl"
            data-testid="input-research-topic"
          />
          {deepResearchMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Researching... This may take 2-3 minutes.</span>
            </div>
          )}
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
                <p className="text-xs text-muted-foreground">PDF, TXT, Markdown, or CSV files</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv,text/plain,application/pdf,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="input-file-upload"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Source</DialogTitle>
            <DialogDescription>Enter a new name for this source</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Source name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameSourceId && renameValue.trim()) {
                  renameSourceMutation.mutate({ id: renameSourceId, name: renameValue.trim() });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (renameSourceId && renameValue.trim()) {
                  renameSourceMutation.mutate({ id: renameSourceId, name: renameValue.trim() });
                }
              }}
              disabled={renameSourceMutation.isPending || !renameValue.trim()}
            >
              {renameSourceMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
