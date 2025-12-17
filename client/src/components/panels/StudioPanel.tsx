import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
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
  X,
  ArrowLeft,
  Maximize2,
  Minimize2
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
import ReportsModal from "../studio/ReportsModal";
import CustomizeInfographicModal from "../studio/CustomizeInfographicModal";
import CustomizeSlideDeckModal from "../studio/CustomizeSlideDeckModal";
import SlideViewer from "../studio/SlideViewer";
import InfographicViewer from "../studio/InfographicViewer";
import ReportViewer from "../studio/ReportViewer";
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
  bgColor: string;
  iconColor: string;
}> = [
  {
    type: 'audio_overview',
    icon: Mic,
    title: 'Audio Overview',
    description: 'Generate a podcast-style audio summary of your sources',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
    iconColor: 'text-purple-500',
  },
  {
    type: 'mindmap',
    icon: Network,
    title: 'Mind Map',
    description: 'Generate an interactive mind map visualization',
    bgColor: 'bg-sky-500/10 dark:bg-sky-500/20',
    iconColor: 'text-sky-500',
  },
  {
    type: 'infographic',
    icon: BarChart3,
    title: 'Infographic',
    description: 'Create visual data representations',
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-500',
  },
  {
    type: 'slides',
    icon: Presentation,
    title: 'Slide Deck',
    description: 'Generate presentation slides from your content',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-500',
  }
];

const AI_MODELS = [
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

const CONTENT_TYPE_DEFAULT_MODELS: Partial<Record<ContentType, string>> = {
  'slides': 'gemini-2.5-pro',
  'infographic': 'gemini-2.5-pro',
};

type ActiveView = 'main' | 'email' | 'hyperbrowser' | 'context-file' | 'canvas';

export default function StudioPanel({
  selectedSourceIds = [],
}: StudioPanelProps) {
  const [activeView, setActiveView] = useState<ActiveView>('main');
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [infographicModalOpen, setInfographicModalOpen] = useState(false);
  const [slideDeckModalOpen, setSlideDeckModalOpen] = useState(false);
  const [infographicViewerOpen, setInfographicViewerOpen] = useState(false);
  const [infographicImageUrl, setInfographicImageUrl] = useState<string | undefined>();
  const [infographicLoading, setInfographicLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<ContentType | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customType, setCustomType] = useState<ContentType>('study_guide');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customModel, setCustomModel] = useState('gpt-4.1');
  const [customSourceIds, setCustomSourceIds] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Config dialog for slides/infographics
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configType, setConfigType] = useState<ContentType | null>(null);
  const [configModel, setConfigModel] = useState('gemini-2.5-pro');
  const [configPrompt, setConfigPrompt] = useState('');

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

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
      setActiveView('canvas');
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

    // Show custom modals for slides and infographics
    if (type === 'infographic') {
      setInfographicModalOpen(true);
      return;
    }
    if (type === 'slides') {
      setSlideDeckModalOpen(true);
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

  const handleConfigGenerate = () => {
    if (!configType) return;
    
    const idsToUse = selectedSourceIds.length > 0 
      ? selectedSourceIds 
      : sources.map(s => s.id);
    
    setConfigDialogOpen(false);
    setLoadingType(configType);
    generateMutation.mutate({
      type: configType,
      sourceIds: idsToUse,
      model: configModel,
      customPrompt: configPrompt || undefined
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
    
    // Check if it's an array of slides (has slideType property)
    if (Array.isArray(content) && content.length > 0 && content[0].slideType) {
      const transformedSlides = content.map((slide: any) => ({
        title: slide.title,
        content: slide.bullets?.length > 0 
          ? slide.bullets.join('\n\n') 
          : slide.notes || '',
      }));
      
      return [{
        id: 'slides-content',
        type: 'slides',
        properties: {},
        data: { slides: transformedSlides }
      }];
    }
    
    // Check if it's mind map data (has nodes and edges arrays - React Flow format)
    if (!Array.isArray(content) && content.nodes && content.edges && Array.isArray(content.nodes)) {
      return [{
        id: 'mindmap-content',
        type: 'mindmap',
        properties: {},
        data: { 
          nodes: content.nodes, 
          edges: content.edges,
          format: 'reactflow'
        }
      }];
    }
    
    // Check if it's hierarchical mind map data (has id, label, children)
    if (!Array.isArray(content) && content.id && content.label) {
      return [{
        id: 'mindmap-content',
        type: 'mindmap',
        properties: {},
        data: content
      }];
    }
    
    // Check if it's an array of A2UI components (has type and id)
    if (Array.isArray(content) && content.length > 0 && content[0].type && content[0].id) {
      return content;
    }
    
    // Check if it's a raw array of other content
    if (Array.isArray(content)) {
      return [{
        id: 'generated-list',
        type: 'card',
        properties: {
          title: 'Generated Content',
          content: JSON.stringify(content, null, 2)
        }
      }];
    }
    
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

  // Canvas view for displaying generated content
  if (activeView === 'canvas' && generatedContent) {
    const contentTypeInfo = CONTENT_TYPES.find(t => t.type === generatedContent.type);
    const Icon = contentTypeInfo?.icon || FileText;
    
    // Render specialized viewers based on content type
    if (generatedContent.type === 'slides') {
      const slidesData = generatedContent.content?.slides || generatedContent.content || [];
      return (
        <SlideViewer
          slides={Array.isArray(slidesData) ? slidesData : []}
          title={generatedContent.title}
          onClose={() => {
            setActiveView('main');
            setIsFullscreen(false);
          }}
        />
      );
    }

    if (generatedContent.type === 'briefing_doc' || generatedContent.type === 'study_guide') {
      const reportContent = typeof generatedContent.content === 'string' 
        ? generatedContent.content 
        : generatedContent.content?.raw || JSON.stringify(generatedContent.content, null, 2);
      return (
        <ReportViewer
          content={reportContent}
          title={generatedContent.title}
          sourceCount={generatedContent.sourceIds?.length}
          generatedAt={generatedContent.createdAt}
          onClose={() => {
            setActiveView('main');
            setIsFullscreen(false);
          }}
        />
      );
    }

    // Workflow-generated content (has markdown field)
    // Use type assertion to handle workflow content types not in the original enum
    const contentType = generatedContent.type as string;
    if (generatedContent.content?.markdown || contentType === 'workflow_content' || contentType === 'email_draft' || contentType === 'report') {
      const markdownContent = generatedContent.content?.markdown || 
        (typeof generatedContent.content === 'string' ? generatedContent.content : '');
      const imageData = generatedContent.content?.image;
      
      return (
        <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
          <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setActiveView('main');
                  setIsFullscreen(false);
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="p-1.5 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm truncate">{generatedContent.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {generatedContent.sourceIds?.length || 0} sources
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Image preview if available */}
              {imageData && (
                <div className="rounded-lg border overflow-hidden bg-muted">
                  <img 
                    src={imageData.startsWith('http') ? imageData : 
                         imageData.startsWith('data:') ? imageData :
                         `data:image/png;base64,${imageData}`}
                    alt="Generated content image"
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                </div>
              )}
              {/* Markdown content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{markdownContent}</ReactMarkdown>
              </div>
            </div>
          </ScrollArea>
        </div>
      );
    }
    
    const canvasView = (
      <div 
        className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}
        data-testid="studio-canvas"
      >
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setActiveView('main');
                setIsFullscreen(false);
              }}
              data-testid="button-canvas-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className={`p-1.5 rounded-lg ${contentTypeInfo?.bgColor || 'bg-muted'}`}>
              <Icon className={`w-4 h-4 ${contentTypeInfo?.iconColor || 'text-muted-foreground'}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-sm truncate">{generatedContent.title}</h3>
              <p className="text-xs text-muted-foreground">
                {generatedContent.sourceIds?.length || 0} sources
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            data-testid="button-canvas-fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <A2UIRenderer components={parseA2UIComponents(generatedContent.content)} />
          </div>
        </ScrollArea>
      </div>
    );
    
    return canvasView;
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

      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {CONTENT_TYPES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                className={`flex items-center gap-2 p-2.5 rounded-lg ${item.bgColor} hover-elevate transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1`}
                onClick={() => handleGenerateContent(item.type)}
                disabled={loadingType === item.type}
                data-testid={`button-generate-${item.type.replace(/_/g, '-')}`}
              >
                {loadingType === item.type ? (
                  <Loader2 className={`w-4 h-4 ${item.iconColor} animate-spin`} />
                ) : (
                  <Icon className={`w-4 h-4 ${item.iconColor}`} />
                )}
                <span className="text-xs font-medium">{item.title}</span>
              </button>
            );
          })}
          <button
            className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 hover-elevate transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            onClick={() => setReportsModalOpen(true)}
            data-testid="button-reports"
          >
            <FileBarChart className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-medium">Reports</span>
          </button>
          <button
            className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 hover-elevate transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            onClick={() => setActiveView('email')}
            data-testid="button-email-builder"
          >
            <Mail className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium">Email</span>
          </button>
        </div>
        <div className="flex justify-end mt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCustomDialogOpen(true)}
            data-testid="button-custom-generate"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

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
                      setActiveView('canvas');
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

      <ReportsModal
        open={reportsModalOpen}
        onOpenChange={setReportsModalOpen}
        selectedSourceIds={selectedSourceIds}
        onReportGenerated={(content) => {
          setGeneratedContent(content);
          setActiveView('canvas');
        }}
      />

      <CustomizeInfographicModal
        open={infographicModalOpen}
        onOpenChange={setInfographicModalOpen}
        selectedSourceIds={selectedSourceIds}
        onGenerated={(content) => {
          // For infographics, open the viewer modal with the image
          if (content?.content?.imageUrl) {
            setInfographicImageUrl(content.content.imageUrl);
            setInfographicViewerOpen(true);
          } else {
            setGeneratedContent(content);
            setActiveView('canvas');
          }
        }}
      />

      <InfographicViewer
        open={infographicViewerOpen}
        onOpenChange={setInfographicViewerOpen}
        imageUrl={infographicImageUrl}
        title="Generated Infographic"
        isLoading={infographicLoading}
      />

      <CustomizeSlideDeckModal
        open={slideDeckModalOpen}
        onOpenChange={setSlideDeckModalOpen}
        selectedSourceIds={selectedSourceIds}
        onGenerated={(content) => {
          setGeneratedContent(content);
          setActiveView('canvas');
        }}
      />

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

      {/* Configuration Dialog for Slides/Infographics */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-config">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {configType && (
                <>
                  {CONTENT_TYPES.find(t => t.type === configType)?.icon && (
                    (() => {
                      const Icon = CONTENT_TYPES.find(t => t.type === configType)!.icon;
                      const color = CONTENT_TYPES.find(t => t.type === configType)!.iconColor;
                      return <Icon className={`w-5 h-5 ${color}`} />;
                    })()
                  )}
                  {CONTENT_TYPES.find(t => t.type === configType)?.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Configure your {configType?.replace(/_/g, ' ')} generation settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="config-model">AI Model</Label>
              <Select value={configModel} onValueChange={setConfigModel}>
                <SelectTrigger id="config-model" data-testid="select-config-model">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} data-testid={`option-config-model-${model.value}`}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Gemini 2.5 Pro is recommended for best results
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="config-prompt">Additional Instructions (optional)</Label>
              <Textarea
                id="config-prompt"
                placeholder={
                  configType === 'slides' 
                    ? "e.g., Focus on key takeaways, limit to 10 slides..."
                    : "e.g., Use a modern color scheme, emphasize statistics..."
                }
                value={configPrompt}
                onChange={(e) => setConfigPrompt(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-config-prompt"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <span className="text-muted-foreground">Using </span>
              <span className="font-medium">{selectedSourceIds.length > 0 ? selectedSourceIds.length : sources.length}</span>
              <span className="text-muted-foreground"> source(s) for generation</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)} data-testid="button-cancel-config">
              Cancel
            </Button>
            <Button 
              onClick={handleConfigGenerate}
              disabled={generateMutation.isPending}
              data-testid="button-generate-config"
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
