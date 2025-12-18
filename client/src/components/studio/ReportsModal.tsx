import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import UnifiedContentEditor from './UnifiedContentEditor';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles,
  FileText,
  GraduationCap,
  Newspaper,
  Route,
  FileCode,
  Lightbulb,
  Monitor,
  Plus,
  Pencil,
  X,
  Save,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Source } from "@/lib/types";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  systemPrompt: string;
  isCustom?: boolean;
}

interface ReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSourceIds?: string[];
  onReportGenerated?: (content: any) => void;
  notebookId?: string;
}

interface DynamicSuggestion {
  id: string;
  name: string;
  description: string;
  reason: string;
}

const defaultReportTypes: ReportType[] = [
  {
    id: 'create-your-own',
    name: 'Create Your Own',
    description: 'Craft reports your way by specifying structure, style, tone, and more',
    icon: Pencil,
    systemPrompt: '', // Will be filled by user
  },
  {
    id: 'briefing-doc',
    name: 'Briefing Doc',
    description: 'Overview of your sources featuring key insights and quotes',
    icon: FileText,
    systemPrompt: `Create a comprehensive briefing document based on the provided sources. Structure it as follows:

1. **Executive Summary** (2-3 paragraphs capturing the essence)
2. **Key Insights** (5-7 bullet points with the most important findings)
3. **Notable Quotes** (3-5 direct quotes from sources with context)
4. **Implications** (What this means for the reader)
5. **Recommended Actions** (3-5 actionable next steps)

Format as a professional document with clear headers and well-organized sections. Use markdown formatting.`,
  },
  {
    id: 'study-guide',
    name: 'Study Guide',
    description: 'Short-answer quiz, suggested essay questions, and glossary of key terms',
    icon: GraduationCap,
    systemPrompt: `Create a comprehensive study guide based on the provided sources. Include:

1. **Key Concepts** (List and explain 8-10 main concepts)
2. **Short-Answer Questions** (10 questions with answers)
3. **Essay Questions** (3-5 thought-provoking questions for deeper analysis)
4. **Glossary** (Define 15-20 key terms)
5. **Study Tips** (How to effectively learn this material)

Format for easy studying with clear sections and formatting.`,
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Insightful takeaways distilled into a highly readable article',
    icon: Newspaper,
    systemPrompt: `Write an engaging blog post based on the provided sources. Include:

1. **Attention-grabbing headline**
2. **Hook introduction** (Draw readers in immediately)
3. **Main body** (3-5 well-structured sections with subheadings)
4. **Key takeaways** (Bulleted list of main points)
5. **Conclusion** (Call to action or thought-provoking ending)

Write in a conversational yet professional tone. Make it shareable and engaging.`,
  },
  {
    id: 'strategic-plan',
    name: 'Strategic Plan',
    description: 'A blueprint for developing a strategic initiative based on your sources',
    icon: Route,
    systemPrompt: `Create a strategic plan document based on the provided sources. Structure:

1. **Vision Statement** (Clear, inspiring goal)
2. **Current State Analysis** (Where we are now)
3. **Strategic Objectives** (3-5 measurable goals)
4. **Key Initiatives** (Specific projects/actions for each objective)
5. **Timeline & Milestones** (Phased approach with checkpoints)
6. **Resource Requirements** (What's needed to execute)
7. **Risk Assessment** (Potential challenges and mitigations)
8. **Success Metrics** (How we'll measure progress)

Format as an executive-ready strategic document.`,
  },
  {
    id: 'technical-spec',
    name: 'Technical Specification',
    description: 'A technical handoff document with architecture and implementation details',
    icon: FileCode,
    systemPrompt: `Create a technical specification document based on the provided sources. Include:

1. **Overview** (What the system/feature does)
2. **Architecture** (High-level system design)
3. **Components** (Detailed breakdown of each component)
4. **Data Models** (Key entities and relationships)
5. **API Specifications** (Endpoints, methods, payloads if applicable)
6. **Dependencies** (External systems, libraries, services)
7. **Implementation Notes** (Key considerations for developers)
8. **Testing Strategy** (How to verify correctness)
9. **Deployment Considerations** (Environment, scaling, monitoring)

Format as a technical reference document with code examples where relevant.`,
  },
  {
    id: 'concept-explainer',
    name: 'Concept Explainer',
    description: 'Break down complex concepts into easy-to-understand explanations',
    icon: Lightbulb,
    systemPrompt: `Create an educational concept explainer based on the provided sources. Include:

1. **What is it?** (Simple definition anyone can understand)
2. **Why does it matter?** (Real-world relevance and importance)
3. **How does it work?** (Step-by-step breakdown)
4. **Key Components** (The essential parts explained)
5. **Examples** (Concrete, relatable examples)
6. **Common Misconceptions** (What people often get wrong)
7. **Related Concepts** (How it connects to other ideas)
8. **Further Learning** (Where to go to learn more)

Write in an accessible, educational tone suitable for someone new to the topic.`,
  },
  {
    id: 'technology-overview',
    name: 'Technology Overview',
    description: 'Comprehensive overview of a technology, protocol, or system',
    icon: Monitor,
    systemPrompt: `Create a technology overview document based on the provided sources. Include:

1. **Introduction** (What the technology is and its purpose)
2. **Key Features** (Main capabilities and differentiators)
3. **Architecture** (How it's structured and works)
4. **Use Cases** (Practical applications and scenarios)
5. **Benefits** (Advantages and value proposition)
6. **Limitations** (Current constraints or challenges)
7. **Comparison** (How it compares to alternatives)
8. **Getting Started** (How to begin using it)
9. **Future Outlook** (Where the technology is heading)

Format as a comprehensive yet accessible technical overview.`,
  },
];

const AI_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro' },
  { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
];

export default function ReportsModal({ open, onOpenChange, selectedSourceIds = [], onReportGenerated, notebookId }: ReportsModalProps) {
  const [customReports, setCustomReports] = useState<ReportType[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  
  // Report configuration state
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportInstructions, setReportInstructions] = useState('');
  const [reportModel, setReportModel] = useState('google/gemini-3-flash-preview');
  
  // Editor state - opens full-screen editor after generation
  const [showEditor, setShowEditor] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  
  // Dynamic suggestions state
  const [dynamicSuggestions, setDynamicSuggestions] = useState<DynamicSuggestion[]>([]);
  
  const { toast } = useToast();
  
  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ['/api/sources'],
  });

  // Fetch dynamic suggestions when sources change
  const analyzeMutation = useMutation({
    mutationFn: async (sourceIds: string[]) => {
      const res = await apiRequest('POST', '/api/reports/analyze-sources', { sourceIds });
      return res.json();
    },
    onSuccess: (data) => {
      setDynamicSuggestions(data.suggestions || []);
    },
  });

  // Analyze sources when modal opens
  useEffect(() => {
    if (open && selectedSourceIds.length > 0) {
      analyzeMutation.mutate(selectedSourceIds);
    } else if (open && sources.length > 0) {
      analyzeMutation.mutate(sources.map(s => s.id));
    }
  }, [open, selectedSourceIds, sources]);
  
  const generateMutation = useMutation({
    mutationFn: async ({ title, systemPrompt, sourceIds, model }: {
      title: string;
      systemPrompt: string;
      sourceIds: string[];
      model: string;
    }) => {
      const res = await apiRequest('POST', '/api/reports/generate', {
        title,
        systemPrompt,
        sourceIds,
        model,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/generated'] });
      // Store generated markdown content and open editor
      setGeneratedContent(data.content || '');
      setShowEditor(true);
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAddCustomReport = () => {
    if (customName.trim() && customSystemPrompt.trim()) {
      const newReport: ReportType = {
        id: `custom-${Date.now()}`,
        name: customName.trim(),
        description: customDescription.trim() || 'Custom report type',
        icon: FileText,
        systemPrompt: customSystemPrompt.trim(),
        isCustom: true,
      };
      setCustomReports([...customReports, newReport]);
      setCustomName('');
      setCustomDescription('');
      setCustomSystemPrompt('');
      setIsAddingCustom(false);
      toast({
        title: 'Custom Report Type Saved',
        description: 'Your custom report type has been added.'
      });
    }
  };
  
  const handleSelectReport = (report: ReportType) => {
    setSelectedReport(report);
    setReportTitle(`${report.name} - ${new Date().toLocaleDateString()}`);
    setReportInstructions('');
  };
  
  const handleGenerateReport = () => {
    if (!selectedReport) return;
    
    const idsToUse = selectedSourceIds.length > 0 
      ? selectedSourceIds 
      : sources.map(s => s.id);
    
    if (idsToUse.length === 0) {
      toast({
        title: 'No Sources',
        description: 'Please add sources before generating a report.',
        variant: 'destructive'
      });
      return;
    }
    
    const finalPrompt = selectedReport.id === 'create-your-own'
      ? reportInstructions
      : `${selectedReport.systemPrompt}\n\nAdditional instructions: ${reportInstructions || 'None'}`;
    
    generateMutation.mutate({
      title: reportTitle,
      systemPrompt: finalPrompt,
      sourceIds: idsToUse,
      model: reportModel,
    });
  };
  
  const handleClose = () => {
    setSelectedReport(null);
    setReportTitle('');
    setReportInstructions('');
    setShowEditor(false);
    setGeneratedContent('');
    onOpenChange(false);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setGeneratedContent('');
    handleClose();
  };
  
  const handleBack = () => {
    setSelectedReport(null);
    setReportTitle('');
    setReportInstructions('');
  };

  const handleDeleteCustomReport = (id: string) => {
    setCustomReports(customReports.filter(r => r.id !== id));
  };

  const allReportTypes = [...defaultReportTypes, ...customReports];
  const formatReports = allReportTypes.slice(0, 4);
  const suggestedReports = allReportTypes.slice(4);
  
  const sourceCount = selectedSourceIds.length > 0 ? selectedSourceIds.length : sources.length;

  // Show full-screen editor when report is generated
  if (showEditor) {
    return (
      <UnifiedContentEditor
        initialContent={generatedContent}
        initialType="report"
        title={reportTitle}
        onClose={handleEditorClose}
        notebookId={notebookId}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] rounded-2xl p-0 overflow-hidden">
        {selectedReport ? (
          // Report Configuration View
          <>
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <selectedReport.icon className="w-5 h-5 text-primary" />
                  <DialogTitle className="text-lg">{selectedReport.name}</DialogTitle>
                </div>
              </div>
            </DialogHeader>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-title">Report Title</Label>
                <Input
                  id="report-title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter report title..."
                  className="rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="report-model">AI Model</Label>
                <Select value={reportModel} onValueChange={setReportModel}>
                  <SelectTrigger id="report-model" className="rounded-lg">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="report-instructions">
                  {selectedReport.id === 'create-your-own' 
                    ? 'Report Instructions (required)' 
                    : 'Additional Instructions (optional)'}
                </Label>
                <Textarea
                  id="report-instructions"
                  value={reportInstructions}
                  onChange={(e) => setReportInstructions(e.target.value)}
                  placeholder={selectedReport.id === 'create-your-own'
                    ? "Describe the structure, style, tone, and content you want in your report..."
                    : "Add any specific requirements or focus areas..."
                  }
                  className="rounded-lg min-h-[120px]"
                />
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground">Using </span>
                <span className="font-medium">{sourceCount}</span>
                <span className="text-muted-foreground"> source(s) for generation</span>
              </div>
            </div>
            
            <DialogFooter className="p-6 pt-0 gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleGenerateReport}
                disabled={generateMutation.isPending || (selectedReport.id === 'create-your-own' && !reportInstructions.trim())}
                className="gap-2"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Report Type Selection View
          <>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Pencil className="w-5 h-5" />
                Create report
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] px-6 pb-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Format</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {formatReports.map((report) => (
                      <ReportTypeCard 
                        key={report.id} 
                        report={report} 
                        onClick={() => handleSelectReport(report)}
                        onDelete={report.isCustom ? () => handleDeleteCustomReport(report.id) : undefined}
                      />
                    ))}
                  </div>
                </div>

                {/* AI-Powered Dynamic Suggestions */}
                {(dynamicSuggestions.length > 0 || analyzeMutation.isPending) && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium">Suggested For Your Sources</h3>
                      {analyzeMutation.isPending && (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {dynamicSuggestions.map((suggestion) => (
                        <Card 
                          key={suggestion.id}
                          className="p-4 rounded-xl cursor-pointer hover-elevate transition-all group"
                          onClick={() => handleSelectReport({
                            id: suggestion.id,
                            name: suggestion.name,
                            description: suggestion.description,
                            icon: Sparkles,
                            systemPrompt: `Create a ${suggestion.name} based on the provided sources. ${suggestion.description}. Focus on: ${suggestion.reason}`,
                          })}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                              <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{suggestion.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {suggestion.description}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Static Suggested Formats */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">More Formats</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestedReports.map((report) => (
                      <ReportTypeCard 
                        key={report.id} 
                        report={report} 
                        onClick={() => handleSelectReport(report)}
                        onDelete={report.isCustom ? () => handleDeleteCustomReport(report.id) : undefined}
                      />
                    ))}
                  </div>
                </div>

                {isAddingCustom ? (
                  <Card className="p-4 rounded-xl">
                    <div className="space-y-3">
                      <Input
                        placeholder="Report type name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="rounded-lg"
                        data-testid="input-custom-report-name"
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        className="rounded-lg resize-none"
                        rows={2}
                        data-testid="input-custom-report-description"
                      />
                      <Textarea
                        placeholder="System prompt - instructions for the AI to generate this report type..."
                        value={customSystemPrompt}
                        onChange={(e) => setCustomSystemPrompt(e.target.value)}
                        className="rounded-lg resize-none"
                        rows={4}
                        data-testid="input-custom-report-prompt"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-lg"
                          onClick={() => {
                            setIsAddingCustom(false);
                            setCustomName('');
                            setCustomDescription('');
                            setCustomSystemPrompt('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          className="rounded-lg gap-2"
                          onClick={handleAddCustomReport}
                          disabled={!customName.trim() || !customSystemPrompt.trim()}
                          data-testid="button-save-custom-report"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl gap-2"
                    onClick={() => setIsAddingCustom(true)}
                    data-testid="button-add-custom-report"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Report Type
                  </Button>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ReportTypeCardProps {
  report: ReportType;
  onClick: () => void;
  onDelete?: () => void;
}

function ReportTypeCard({ report, onClick, onDelete }: ReportTypeCardProps) {
  const Icon = report.icon;
  
  return (
    <Card 
      className="p-4 rounded-xl cursor-pointer hover-elevate transition-all group relative"
      onClick={onClick}
      data-testid={`report-type-${report.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium truncate">{report.name}</h4>
            {report.isCustom && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">Custom</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {report.description}
          </p>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-2 right-2"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            data-testid={`button-delete-report-${report.id}`}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}
