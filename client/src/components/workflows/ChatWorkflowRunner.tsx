import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  Loader2,
  Mail,
  FileText,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { WorkflowDefinition } from '@shared/workflow-schema';
import { interpolateTemplate } from '@shared/workflow-schema';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatWorkflowRunnerProps {
  workflow: WorkflowDefinition;
  onComplete: (state: Record<string, any>) => void;
  onCancel: () => void;
  onSendToEmail?: (content: string, subject?: string) => void;
  onCreateReport?: (content: string, title: string) => void;
}

export default function ChatWorkflowRunner({
  workflow,
  onComplete,
  onCancel,
  onSendToEmail,
  onCreateReport,
}: ChatWorkflowRunnerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [state, setState] = useState<Record<string, any>>(workflow.initialState || {});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const { toast } = useToast();

  const currentStep = workflow.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / workflow.steps.length) * 100;
  const isLastStep = currentStepIndex === workflow.steps.length - 1;

  const updateState = useCallback((key: string, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const canProceed = useCallback(() => {
    if (!currentStep) return false;
    const requiredFields = currentStep.components
      .filter(c => c.props?.required)
      .map(c => c.stateKey);
    
    return requiredFields.every(key => {
      const value = state[key];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      return value !== undefined && value !== null;
    });
  }, [currentStep, state]);

  const generateContent = useCallback(async () => {
    if (!workflow.output.template) return;
    
    setIsGenerating(true);
    const prompt = interpolateTemplate(workflow.output.template, state);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'google/gemini-3-flash-preview',
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response');

      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'token' && data.token) {
                content += data.token;
                setGeneratedContent(content);
              }
            } catch {}
          }
        }
      }

      setGeneratedContent(content);
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [workflow.output.template, state, toast]);

  const handleNext = async () => {
    if (isLastStep) {
      await generateContent();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (generatedContent) {
      setGeneratedContent(null);
    } else if (currentStepIndex === 0) {
      onCancel();
    } else {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const renderComponent = (component: { type: string; stateKey: string; props: Record<string, any> }) => {
    const { type, stateKey, props } = component;
    const value = state[stateKey];

    switch (type) {
      case 'text_input':
        return (
          <div className="space-y-2">
            {props.label && <Label>{props.label}</Label>}
            <Input
              placeholder={props.placeholder}
              value={value || ''}
              onChange={(e) => updateState(stateKey, e.target.value)}
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            {props.label && <Label>{props.label}</Label>}
            <Textarea
              placeholder={props.placeholder}
              value={value || ''}
              onChange={(e) => updateState(stateKey, e.target.value)}
              rows={props.rows || 4}
            />
          </div>
        );

      case 'card_selector':
        return (
          <div className="space-y-2">
            {props.label && <Label>{props.label}</Label>}
            <div className={cn(
              "grid gap-2",
              props.columns === 2 ? "grid-cols-2" : props.columns === 3 ? "grid-cols-3" : "grid-cols-1"
            )}>
              {props.options?.map((option: any) => (
                <Card
                  key={option.id}
                  className={cn(
                    "p-3 cursor-pointer transition-all hover:border-primary/50",
                    value === option.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => updateState(stateKey, option.id)}
                >
                  <div className="flex items-center gap-2">
                    {option.icon && <span className="text-lg">{option.icon}</span>}
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'checkbox_list':
        return (
          <div className="space-y-2">
            {props.label && <Label>{props.label}</Label>}
            <div className="space-y-2">
              {props.options?.map((option: any) => (
                <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={(value || []).includes(option.id)}
                    onCheckedChange={(checked) => {
                      const current = value || [];
                      if (checked) {
                        updateState(stateKey, [...current, option.id]);
                      } else {
                        updateState(stateKey, current.filter((id: string) => id !== option.id));
                      }
                    }}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-2">
            {props.label && <Label>{props.label}</Label>}
            <div className="flex items-center gap-4">
              {props.leftLabel && <span className="text-xs text-muted-foreground">{props.leftLabel}</span>}
              <Slider
                value={[value || props.min || 0]}
                onValueChange={([val]) => updateState(stateKey, val)}
                min={props.min || 0}
                max={props.max || 100}
                step={props.step || 1}
                className="flex-1"
              />
              {props.rightLabel && <span className="text-xs text-muted-foreground">{props.rightLabel}</span>}
              {props.showValue && <span className="text-sm font-medium w-10 text-right">{value || props.min || 0}</span>}
            </div>
          </div>
        );

      case 'dropdown':
        return (
          <div className="space-y-2">
            {props.label && <Label>{props.label}</Label>}
            <Select value={value || ''} onValueChange={(val) => updateState(stateKey, val)}>
              <SelectTrigger>
                <SelectValue placeholder={props.placeholder || 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {props.options?.map((option: any) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'tag_input':
        return (
          <div className="space-y-2">
            {props.label && <Label>{props.label}</Label>}
            <Input
              placeholder={props.placeholder || 'Enter tags separated by commas'}
              value={(value || []).join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                updateState(stateKey, tags);
              }}
            />
            {(value || []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(value as string[]).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Show generated content
  if (generatedContent) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{workflow.emoji}</span>
              <div>
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                <CardDescription>Generated Content</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-h-[400px] overflow-y-auto p-4 bg-muted/30 rounded-lg">
            <ReactMarkdown>{generatedContent}</ReactMarkdown>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button size="sm" onClick={() => onComplete(state)}>
              <Save className="h-4 w-4 mr-1" />
              Done
            </Button>
            {onSendToEmail && (
              <Button size="sm" variant="outline" onClick={() => onSendToEmail(generatedContent, workflow.name)}>
                <Mail className="h-4 w-4 mr-1" />
                Send to Email
              </Button>
            )}
            {onCreateReport && (
              <Button size="sm" variant="outline" onClick={() => onCreateReport(generatedContent, workflow.name)}>
                <FileText className="h-4 w-4 mr-1" />
                Save as Report
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Edit Inputs
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show step form
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{workflow.emoji}</span>
            <div>
              <CardTitle className="text-lg">{workflow.name}</CardTitle>
              <CardDescription>Step {currentStepIndex + 1} of {workflow.steps.length}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-1 mt-3" />
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-1">{currentStep?.title}</h3>
          {currentStep?.description && (
            <p className="text-sm text-muted-foreground">{currentStep.description}</p>
          )}
        </div>

        <div className="space-y-4">
          {currentStep?.components.map((component, idx) => (
            <div key={`${component.stateKey}-${idx}`}>
              {renderComponent(component)}
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : isLastStep ? (
              <>
                Generate
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
