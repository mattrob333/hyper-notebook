import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
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
  Zap,
  CheckCircle2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

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

  const toggleSourceSelection = (sourceId: string) => {
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
    <div className="flex flex-col h-full bg-sidebar" data-testid="sources-panel">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Sources</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" data-testid="button-add-source">
                <Plus className="w-5 h-5" />
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
        </div>

        <Card className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Try Deep Research</p>
              <p className="text-xs text-muted-foreground mb-3">
                for an in-depth report and new sources
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a research topic..."
                  value={deepResearchQuery}
                  onChange={(e) => setDeepResearchQuery(e.target.value)}
                  className="rounded-xl text-sm h-9"
                  onKeyDown={(e) => e.key === 'Enter' && handleDeepResearch()}
                  data-testid="input-deep-research"
                />
                <Button 
                  size="sm" 
                  onClick={handleDeepResearch}
                  disabled={!deepResearchQuery.trim()}
                  className="rounded-xl shrink-0"
                  data-testid="button-start-deep-research"
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search the web for new sources"
            className="pl-9 rounded-xl"
            data-testid="input-search-sources"
          />
        </div>
      </div>

      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selectedSources.size > 0 
            ? `${selectedSources.size} selected` 
            : `Select all sources`
          }
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            if (selectedSources.size === sources.length) {
              setSelectedSources(new Set());
            } else {
              setSelectedSources(new Set(sources.map(s => s.id)));
            }
          }}
          className="text-xs h-7"
          data-testid="button-select-all"
        >
          {selectedSources.size === sources.length ? 'Deselect all' : 'Select all'}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 pb-4 px-2">
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
            sources.map((source) => {
              const Icon = sourceTypeIcons[source.type];
              const isSelected = selectedSources.has(source.id);
              const isActive = selectedSourceId === source.id;
              return (
                <Card
                  key={source.id}
                  className={`group p-3 rounded-xl cursor-pointer transition-all ${
                    isActive ? 'ring-2 ring-primary' : ''
                  } ${isSelected ? 'bg-primary/5' : ''}`}
                  onClick={() => onSelectSource(source)}
                  data-testid={`source-item-${source.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSourceSelection(source.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 rounded-md"
                      data-testid={`checkbox-source-${source.id}`}
                    />
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {source.type === 'url' ? source.content : `${source.type.toUpperCase()} source`}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 shrink-0 h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`button-source-menu-${source.id}`}
                        >
                          <MoreVertical className="w-4 h-4" />
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
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
