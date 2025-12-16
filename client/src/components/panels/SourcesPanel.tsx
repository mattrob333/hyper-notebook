import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Globe, 
  FileText, 
  Type, 
  Trash2,
  MoreVertical,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Source } from "@/lib/types";

interface SourcesPanelProps {
  sources: Source[];
  onAddSource: (source: Omit<Source, 'id'>) => void;
  onDeleteSource: (id: string) => void;
  onSelectSource: (source: Source) => void;
  onStartDeepResearch?: (query: string) => void;
  selectedSourceId?: string;
}

const sourceTypeIcons = {
  url: Globe,
  pdf: FileText,
  text: Type,
};

export default function SourcesPanel({ 
  sources, 
  onAddSource, 
  onDeleteSource,
  onSelectSource,
  onStartDeepResearch,
  selectedSourceId 
}: SourcesPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSourceType, setNewSourceType] = useState<'url' | 'pdf' | 'text'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textName, setTextName] = useState('');
  const [deepResearchQuery, setDeepResearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(sources.map(s => s.id)));

  const handleAddSource = () => {
    if (newSourceType === 'url' && urlInput) {
      try {
        onAddSource({
          type: 'url',
          content: urlInput,
          name: new URL(urlInput).hostname,
        });
        setUrlInput('');
      } catch {
        onAddSource({
          type: 'url',
          content: urlInput,
          name: urlInput.slice(0, 30),
        });
        setUrlInput('');
      }
    } else if (newSourceType === 'text' && textInput && textName) {
      onAddSource({
        type: 'text',
        content: textInput,
        name: textName,
      });
      setTextInput('');
      setTextName('');
    }
    setDialogOpen(false);
  };

  const toggleSourceSelection = (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedSources);
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId);
    } else {
      newSelected.add(sourceId);
    }
    setSelectedSources(newSelected);
  };

  const handleDeepResearch = () => {
    if (deepResearchQuery.trim() && onStartDeepResearch) {
      onStartDeepResearch(deepResearchQuery.trim());
      setDeepResearchQuery('');
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="sources-panel">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Sources</h2>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full rounded-full justify-center gap-2 h-10"
              data-testid="button-add-source"
            >
              <Plus className="w-4 h-4" />
              Add sources
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Source</DialogTitle>
            </DialogHeader>
            <Tabs value={newSourceType} onValueChange={(v) => setNewSourceType(v as any)}>
              <TabsList className="w-full rounded-xl">
                <TabsTrigger value="url" className="flex-1 rounded-lg" data-testid="tab-url">
                  <Globe className="w-4 h-4 mr-1" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="pdf" className="flex-1 rounded-lg" data-testid="tab-pdf">
                  <FileText className="w-4 h-4 mr-1" />
                  PDF
                </TabsTrigger>
                <TabsTrigger value="text" className="flex-1 rounded-lg" data-testid="tab-text">
                  <Type className="w-4 h-4 mr-1" />
                  Text
                </TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-4 mt-4">
                <Input 
                  placeholder="https://example.com/article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="rounded-xl"
                  data-testid="input-url"
                />
              </TabsContent>
              <TabsContent value="pdf" className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-2xl p-8 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop a PDF or click to browse
                  </p>
                  <Input 
                    type="file" 
                    accept=".pdf" 
                    className="mt-2"
                    data-testid="input-pdf-upload"
                  />
                </div>
              </TabsContent>
              <TabsContent value="text" className="space-y-4 mt-4">
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
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleAddSource} className="rounded-xl" data-testid="button-confirm-add-source">
                Add Source
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/50">
          <div className="p-1.5 rounded-lg bg-blue-500/20">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm">
            <span className="text-blue-400 font-medium">Try Deep Research</span>
            <span className="text-muted-foreground"> for an in-depth report and new sources!</span>
          </span>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search the web for new sources"
              value={deepResearchQuery}
              onChange={(e) => setDeepResearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDeepResearch()}
              className="pl-9 pr-10 rounded-xl bg-card"
              data-testid="input-search-sources"
            />
            {deepResearchQuery && (
              <Button 
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={handleDeepResearch}
                data-testid="button-start-deep-research"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full h-7 gap-1 text-xs px-3">
              <Globe className="w-3 h-3" />
              Web
              <ChevronDown className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-full h-7 gap-1 text-xs px-3">
              <Sparkles className="w-3 h-3" />
              Fast Research
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 flex items-center justify-between border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          Select all sources
        </span>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => {
            if (selectedSources.size === sources.length) {
              setSelectedSources(new Set());
            } else {
              setSelectedSources(new Set(sources.map(s => s.id)));
            }
          }}
          className="h-6 w-6"
          data-testid="button-select-all"
        >
          <Check className={`w-4 h-4 ${selectedSources.size === sources.length ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-4">
          {sources.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No sources yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add URLs, PDFs, or text to get started
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sources.map((source) => {
                const Icon = sourceTypeIcons[source.type];
                const isSelected = selectedSources.has(source.id);
                const isActive = selectedSourceId === source.id;
                return (
                  <div
                    key={source.id}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors hover-elevate ${
                      isActive ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => onSelectSource(source)}
                    data-testid={`source-item-${source.id}`}
                  >
                    <div className="p-1.5 rounded-lg bg-muted shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-sm truncate">{source.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`button-source-menu-${source.id}`}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        {source.type === 'url' && (
                          <DropdownMenuItem className="rounded-lg">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open URL
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive rounded-lg"
                          onClick={() => onDeleteSource(source.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                      onClick={(e) => toggleSourceSelection(source.id, e)}
                      className="shrink-0 flex items-center justify-center"
                      data-testid={`checkbox-source-${source.id}`}
                    >
                      <Check className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground/30'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
