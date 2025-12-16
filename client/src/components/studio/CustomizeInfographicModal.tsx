import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { BarChart3, Loader2, Sparkles, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Source } from "@/lib/types";

interface CustomizeInfographicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSourceIds?: string[];
  onGenerated?: (content: any) => void;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
];

const ORIENTATIONS = [
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'square', label: 'Square' },
];

const DETAIL_LEVELS = [
  { value: 'concise', label: 'Concise', description: 'Brief overview with key points' },
  { value: 'standard', label: 'Standard', description: 'Balanced detail and visuals' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive with rich data', beta: true },
];

export default function CustomizeInfographicModal({
  open,
  onOpenChange,
  selectedSourceIds = [],
  onGenerated,
}: CustomizeInfographicModalProps) {
  const [language, setLanguage] = useState('en');
  const [orientation, setOrientation] = useState('landscape');
  const [detailLevel, setDetailLevel] = useState('standard');
  const [description, setDescription] = useState('');
  
  const { toast } = useToast();
  
  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ['/api/sources'],
  });
  
  const generateMutation = useMutation({
    mutationFn: async (params: {
      sourceIds: string[];
      language: string;
      orientation: string;
      detailLevel: string;
      description: string;
    }) => {
      const systemPrompt = buildInfographicPrompt(params);
      const res = await apiRequest('POST', '/api/generate', {
        type: 'infographic',
        sourceIds: params.sourceIds,
        model: 'google/gemini-3-pro-image-preview', // Use Gemini for image generation
        customPrompt: systemPrompt,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/generated'] });
      toast({
        title: 'Infographic Generated',
        description: 'Your infographic has been created successfully.'
      });
      onGenerated?.(data);
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const buildInfographicPrompt = (params: {
    language: string;
    orientation: string;
    detailLevel: string;
    description: string;
  }) => {
    const langName = LANGUAGES.find(l => l.value === params.language)?.label || 'English';
    const orientationDesc = params.orientation === 'landscape' 
      ? 'wide horizontal layout (16:9 aspect ratio)'
      : params.orientation === 'portrait'
        ? 'tall vertical layout (9:16 aspect ratio)'
        : 'square layout (1:1 aspect ratio)';
    
    const detailDesc = params.detailLevel === 'concise'
      ? 'Keep it brief with only the most essential information. Use large, clear visuals and minimal text.'
      : params.detailLevel === 'detailed'
        ? 'Include comprehensive data, multiple sections, detailed statistics, and thorough explanations.'
        : 'Balance visual elements with informative text. Include key statistics and clear sections.';
    
    return `Create a professional infographic based on the provided sources.

**Language:** ${langName}
**Orientation:** ${orientationDesc}
**Detail Level:** ${detailDesc}

**User Instructions:** ${params.description || 'Create a visually appealing infographic that highlights the key information.'}

**Requirements:**
1. Use a modern, professional design aesthetic
2. Include relevant icons and visual elements
3. Highlight key statistics and data points
4. Use a cohesive color scheme
5. Ensure text is readable and well-organized
6. Create clear visual hierarchy

Generate a visually stunning infographic that effectively communicates the main insights from the sources.`;
  };
  
  const handleGenerate = () => {
    const idsToUse = selectedSourceIds.length > 0 
      ? selectedSourceIds 
      : sources.map(s => s.id);
    
    if (idsToUse.length === 0) {
      toast({
        title: 'No Sources',
        description: 'Please add sources before generating an infographic.',
        variant: 'destructive'
      });
      return;
    }
    
    generateMutation.mutate({
      sourceIds: idsToUse,
      language,
      orientation,
      detailLevel,
      description,
    });
  };
  
  const handleClose = () => {
    setDescription('');
    onOpenChange(false);
  };
  
  const sourceCount = selectedSourceIds.length > 0 ? selectedSourceIds.length : sources.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Customize Infographic
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          {/* Language and Orientation Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Choose language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Choose orientation</Label>
              <div className="flex rounded-lg border overflow-hidden">
                {ORIENTATIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOrientation(opt.value)}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      orientation === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {orientation === opt.value && '✓ '}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Detail Level */}
          <div className="space-y-2">
            <Label>Level of detail</Label>
            <div className="flex rounded-lg border overflow-hidden">
              {DETAIL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setDetailLevel(level.value)}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    detailLevel === level.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  {detailLevel === level.value && '✓ '}
                  {level.label}
                  {level.beta && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground ml-1">
                      BETA
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label>Describe the infographic you want to create</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Guide the style, color, or focus: "Use a blue color theme and highlight the 3 key stats."'
              className="rounded-lg min-h-[100px] resize-none"
            />
          </div>
          
          {/* Source Count */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <span className="text-muted-foreground">Using </span>
            <span className="font-medium">{sourceCount}</span>
            <span className="text-muted-foreground"> source(s) for generation</span>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="gap-2 bg-primary"
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
      </DialogContent>
    </Dialog>
  );
}
