import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mic, 
  BookOpen,
  FileText,
  HelpCircle,
  Clock,
  Network,
  BarChart3, 
  Presentation,
  Mail,
  MoreVertical,
  Plus,
  Trash2,
  Workflow,
  Globe,
  FileCode,
  Loader2,
  Sparkles,
  FileBarChart,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import WorkflowStudio from "../studio/WorkflowStudio";
import EmailBuilder from "../studio/EmailBuilder";
import HyperBrowserBuilder from "../studio/HyperBrowserBuilder";
import AIContextFileGenerator from "../studio/AIContextFileGenerator";
import A2UIRenderer from "../a2ui/A2UIRenderer";
import type { Workflow as WorkflowType, Source } from "@/lib/types";
import type { A2UIComponent, ContentType } from "@shared/schema";

interface Report {
  id: string;
  name: string;
  type: 'analysis' | 'summary' | 'comparison';
  createdAt: Date;
}

interface GeneratedContent {
  id: string;
  type: ContentType;
  title: string;
  content: any;
  sourceIds: string[];
  createdAt: string;
}

interface StudioPanelProps {
  selectedSourceIds?: string[];
}

interface ContentCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  contentType: ContentType;
  isLoading: boolean;
  onClick: () => void;
  testId: string;
}

function ContentCard({ icon: Icon, title, description, isLoading, onClick, testId }: ContentCardProps) {
  return (
    <Card 
      className="flex flex-col p-3 rounded-xl cursor-pointer hover-elevate transition-all bg-card border-border/50 group"
      onClick={isLoading ? undefined : onClick}
      data-testid={testId}
    >
      <div className="flex items-center justify-between w-full mb-2">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <Icon className="w-5 h-5 text-primary" />
        )}
      </div>
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</span>
    </Card>
  );
}

const CONTENT_TYPES: Array<{
  type: ContentType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}> = [
  {
    type: 'audio_overview',
    icon: Mic,
    title: 'Audio Overview',
    description: 'Generate a podcast-style audio summary of your sources'
  },
  {
    type: 'study_guide',
    icon: BookOpen,
    title: 'Study Guide',
    description: 'Create a comprehensive study guide with key concepts'
  },
  {
    type: 'briefing_doc',
    icon: FileText,
    title: 'Briefing Doc',
    description: 'Generate an executive briefing document'
  },
  {
    type: 'faq',
    icon: HelpCircle,
    title: 'FAQ',
    description: 'Create frequently asked questions from your sources'
  },
  {
    type: 'timeline',
    icon: Clock,
    title: 'Timeline',
    description: 'Build a chronological timeline of events'
  },
  {
    type: 'mindmap',
    icon: Network,
    title: 'Mind Map',
    description: 'Generate an interactive mind map visualization'
  },
  {
    type: 'infographic',
    icon: BarChart3,
    title: 'Infographic',
    description: 'Create visual data representations'
  },
  {
    type: 'slides',
    icon: Presentation,
    title: 'Slide Deck',
    description: 'Generate presentation slides from your content'
  }
];

const AI_MODELS = [
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash' },
];

type ActiveView = 'main' | 'email' | 'hyperbrowser' | 'context-file';

export default function StudioPanel({
  selectedSourceIds = [],
}: StudioPanelProps) {
  const [activeView, setActiveView] = useState<ActiveView>('main');
  const [loadingType, setLoadingType] = useState<ContentType | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customType, setCustomType] = useState<ContentType>('study_guide');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customModel, setCustomModel] = useState('gpt-4.1');
  const [customSourceIds, setCustomSourceIds] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ['/api/sources'],
  });

  const { data: savedContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ['/api/generated'],
  });

  const { data: workflows = [] } = useQuery<WorkflowType[]>({
    queryKey: ['/api/workflows'],
  });

  const generateMutation = useMutation({
    mutationFn: async ({ type, sourceIds, model, customPrompt }: {
      type: ContentType;
      sourceIds: string[];
      model: string;
      customPrompt?: string;
    }) => {
      const res = await apiRequest('POST', '/api/generate', {
        type,
        sourceIds,
        model,
        customPrompt
      });
      return res.json();
    },
    onSuccess: (data: GeneratedContent) => {
      setGeneratedContent(data);
      setResultModalOpen(true);
      setLoadingType(null);
      queryClient.invalidateQueries({ queryKey: ['/api/generated'] });
      toast({
        title: 'Content Generated',
        description: `Your ${data.type.replace(/_/g, ' ')} has been created successfully.`
      });
    },
    onError: (error: Error) => {
      setLoadingType(null);
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleGenerateContent = (type: ContentType) => {
    if (selectedSourceIds.length === 0 && sources.length === 0) {
      toast({
        title: 'No Sources Available',
        description: 'Please add some sources before generating content.',
        variant: 'destructive'
      });
      return;
    }

    const idsToUse = selectedSourceIds.length > 0 
      ? selectedSourceIds 
      : sources.map(s => s.id);
    
    setLoadingType(type);
    generateMutation.mutate({
      type,
      sourceIds: idsToUse,
      model: 'gpt-4.1'
    });
  };

  const handleCustomGenerate = () => {
    const idsToUse = customSourceIds.length > 0 
      ? customSourceIds 
      : selectedSourceIds.length > 0 
        ? selectedSourceIds 
        : sources.map(s => s.id);

    if (idsToUse.length === 0 && !customPrompt) {
      toast({
        title: 'No Sources or Prompt',
        description: 'Please select sources or add a custom prompt.',
        variant: 'destructive'
      });
      return;
    }

    setLoadingType(customType);
    setCustomDialogOpen(false);
    generateMutation.mutate({
      type: customType,
      sourceIds: idsToUse,
      model: customModel,
      customPrompt: customPrompt || undefined
    });
  };

  const toggleSourceSelection = (sourceId: string) => {
    setCustomSourceIds(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const parseA2UIComponents = (content: any): A2UIComponent[] => {
    if (!content) return [];
    if (Array.isArray(content)) return content;
    if (content.components) return content.components;
    if (typeof content === 'object') {
      return [{
        id: 'generated-content',
        type: 'card',
        properties: {
          title: 'Generated Content',
          content: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
        }
      }];
    }
    return [{
      id: 'text-content',
      type: 'card',
      properties: {
        content: String(content)
      }
    }];
  };

  if (activeView === 'email') {
    return <EmailBuilder onBack={() => setActiveView('main')} />;
  }

  if (activeView === 'hyperbrowser') {
    return (
      <HyperBrowserBuilder 
        onBack={() => setActiveView('main')} 
        onRun={(script) => {
          toast({
            title: 'Browser Script Started',
            description: 'Executing browser automation...'
          });
        }}
        onMinimize={() => {
          setActiveView('main');
        }}
      />
    );
  }

  if (activeView === 'context-file') {
    return (
      <AIContextFileGenerator 
        onBack={() => setActiveView('main')} 
        sources={sources}
      />
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="studio-panel">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-base">Studio</h2>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 text-xs"
              onClick={() => setActiveView('hyperbrowser')}
              data-testid="button-hyperbrowser"
            >
              <Globe className="w-4 h-4" />
              Browser
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 text-xs"
              onClick={() => setActiveView('context-file')}
              data-testid="button-context-file"
            >
              <FileCode className="w-4 h-4" />
              Context
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Generate Content</h3>
            {selectedSourceIds.length > 0 && (
              <p className="text-xs text-muted-foreground mb-2">
                Using {selectedSourceIds.length} selected source{selectedSourceIds.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CONTENT_TYPES.map((item) => (
              <ContentCard
                key={item.type}
                icon={item.icon}
                title={item.title}
                description={item.description}
                contentType={item.type}
                isLoading={loadingType === item.type}
                onClick={() => handleGenerateContent(item.type)}
                testId={`card-generate-${item.type.replace(/_/g, '-')}`}
              />
            ))}
          </div>

          <div className="mt-3">
            <Card 
              className="flex flex-col p-3 rounded-xl cursor-pointer hover-elevate transition-all bg-card border-border/50 border-dashed"
              onClick={() => setCustomDialogOpen(true)}
              data-testid="card-generate-custom"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Generate Custom</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Create custom content with your own prompt and settings
              </span>
            </Card>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <Card 
              className="flex flex-col p-3 rounded-xl cursor-pointer hover-elevate transition-all bg-card border-border/50"
              onClick={() => setActiveView('email')}
              data-testid="card-email-builder"
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Email Builder</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Compose and send emails with AI assistance
              </span>
            </Card>
          </div>
        </div>
      </ScrollArea>

      <Tabs defaultValue="notes" className="flex-1 flex flex-col min-h-0 border-t border-border/50">
        <TabsList className="mx-4 mt-2 rounded-xl bg-muted/50">
          <TabsTrigger value="notes" className="flex-1 gap-1 rounded-lg text-xs" data-testid="tab-notes">
            <FileText className="w-4 h-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex-1 gap-1 rounded-lg text-xs" data-testid="tab-workflows">
            <Workflow className="w-4 h-4" />
            Workflows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full px-2">
            <div className="px-2 space-y-2 py-4">
              {savedContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notes yet</p>
                  <p className="text-xs mt-1">Generate content to create notes</p>
                </div>
              ) : (
                savedContent.map((content) => (
                  <Card 
                    key={content.id} 
                    className="p-3 rounded-xl hover-elevate cursor-pointer bg-card"
                    data-testid={`content-item-${content.id}`}
                    onClick={() => {
                      setGeneratedContent(content);
                      setResultModalOpen(true);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        {CONTENT_TYPES.find(t => t.type === content.type)?.icon ? (
                          (() => {
                            const Icon = CONTENT_TYPES.find(t => t.type === content.type)!.icon;
                            return <Icon className="w-4 h-4 text-muted-foreground" />;
                          })()
                        ) : (
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{content.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {content.sourceIds?.length || 0} sources · {formatTimeAgo(new Date(content.createdAt))}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" data-testid={`button-content-menu-${content.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem 
                            className="rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Download', content.id);
                            }}
                          >
                            <FileBarChart className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="rounded-lg text-destructive"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await apiRequest('DELETE', `/api/generated/${content.id}`);
                              queryClient.invalidateQueries({ queryKey: ['/api/generated'] });
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="workflows" className="flex-1 mt-0 overflow-hidden">
          <WorkflowStudio
            workflows={workflows}
            onSaveWorkflow={async (workflow) => {
              await apiRequest('POST', '/api/workflows', workflow);
              queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
            }}
            onDeleteWorkflow={async (id) => {
              await apiRequest('DELETE', `/api/workflows/${id}`);
              queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
            }}
            onRunWorkflow={(workflow) => {
              toast({
                title: 'Workflow Started',
                description: `Running "${workflow.name}"...`
              });
            }}
          />
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t flex justify-center">
        <Button variant="outline" size="sm" className="rounded-full gap-2" data-testid="button-add-note">
          <Plus className="w-4 h-4" />
          Add note
        </Button>
      </div>

      <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" data-testid="dialog-generated-content">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {generatedContent && (
                <>
                  {CONTENT_TYPES.find(t => t.type === generatedContent.type)?.icon && (
                    (() => {
                      const Icon = CONTENT_TYPES.find(t => t.type === generatedContent.type)!.icon;
                      return <Icon className="w-5 h-5" />;
                    })()
                  )}
                  {generatedContent.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Generated from {generatedContent?.sourceIds?.length || 0} source(s)
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            {generatedContent && (
              <A2UIRenderer components={parseA2UIComponents(generatedContent.content)} />
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultModalOpen(false)} data-testid="button-close-result">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-custom-generate">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate Custom Content
            </DialogTitle>
            <DialogDescription>
              Customize your content generation with specific settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select value={customType} onValueChange={(v) => setCustomType(v as ContentType)}>
                <SelectTrigger id="content-type" data-testid="select-content-type">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((item) => (
                    <SelectItem key={item.type} value={item.type} data-testid={`option-type-${item.type}`}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-model">AI Model</Label>
              <Select value={customModel} onValueChange={setCustomModel}>
                <SelectTrigger id="ai-model" data-testid="select-ai-model">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} data-testid={`option-model-${model.value}`}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-prompt">Custom Prompt (optional)</Label>
              <Textarea
                id="custom-prompt"
                placeholder="Add specific instructions for content generation..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-custom-prompt"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Sources</Label>
              <div className="max-h-[150px] overflow-auto border rounded-lg p-2 space-y-2">
                {sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No sources available
                  </p>
                ) : (
                  sources.map((source) => (
                    <div key={source.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`source-${source.id}`}
                        checked={customSourceIds.includes(source.id)}
                        onCheckedChange={() => toggleSourceSelection(source.id)}
                        data-testid={`checkbox-source-${source.id}`}
                      />
                      <label
                        htmlFor={`source-${source.id}`}
                        className="text-sm flex-1 truncate cursor-pointer"
                      >
                        {source.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {customSourceIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {customSourceIds.length} source(s) selected
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCustomDialogOpen(false)} data-testid="button-cancel-custom">
              Cancel
            </Button>
            <Button 
              onClick={handleCustomGenerate}
              disabled={generateMutation.isPending}
              data-testid="button-generate-custom"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
