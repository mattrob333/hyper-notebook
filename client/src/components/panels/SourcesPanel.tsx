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
  ExternalLink
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
  selectedSourceId 
}: SourcesPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSourceType, setNewSourceType] = useState<'url' | 'pdf' | 'text'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textName, setTextName] = useState('');

  const handleAddSource = () => {
    if (newSourceType === 'url' && urlInput) {
      onAddSource({
        type: 'url',
        content: urlInput,
        name: new URL(urlInput).hostname,
      });
      setUrlInput('');
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

  return (
    <div className="w-70 border-r flex flex-col h-full bg-sidebar" data-testid="sources-panel">
      <div className="h-12 border-b flex items-center justify-between px-4 sticky top-0 bg-sidebar z-10">
        <h2 className="font-semibold text-sm">Sources</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-source">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Source</DialogTitle>
            </DialogHeader>
            <Tabs value={newSourceType} onValueChange={(v) => setNewSourceType(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="url" className="flex-1" data-testid="tab-url">
                  <Globe className="w-4 h-4 mr-1" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="pdf" className="flex-1" data-testid="tab-pdf">
                  <FileText className="w-4 h-4 mr-1" />
                  PDF
                </TabsTrigger>
                <TabsTrigger value="text" className="flex-1" data-testid="tab-text">
                  <Type className="w-4 h-4 mr-1" />
                  Text
                </TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-4 mt-4">
                <Input 
                  placeholder="https://example.com/article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  data-testid="input-url"
                />
              </TabsContent>
              <TabsContent value="pdf" className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
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
                  data-testid="input-text-name"
                />
                <Textarea 
                  placeholder="Paste your text content here..."
                  className="min-h-32"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  data-testid="input-text-content"
                />
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSource} data-testid="button-confirm-add-source">
                Add Source
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
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
              const isSelected = selectedSourceId === source.id;
              return (
                <div
                  key={source.id}
                  className={`group flex items-center gap-3 p-3 rounded-md cursor-pointer hover-elevate ${
                    isSelected ? 'bg-sidebar-accent' : ''
                  }`}
                  onClick={() => onSelectSource(source)}
                  data-testid={`source-item-${source.id}`}
                >
                  <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
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
                        className="opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-source-menu-${source.id}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {source.type === 'url' && (
                        <DropdownMenuItem>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open URL
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDeleteSource(source.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
