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
import { Presentation, Loader2, Sparkles, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Source } from "@/lib/types";

interface CustomizeSlideDeckModalProps {
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

const FORMATS = [
  { 
    value: 'detailed', 
    label: 'Detailed Deck',
    description: 'A comprehensive deck with full text and details, perfect for emailing or reading on its own.',
  },
  { 
    value: 'presenter', 
    label: 'Presenter Slides',
    description: 'Clean, visual slides with key talking points to support you while you speak.',
  },
];

const LENGTHS = [
  { value: 'short', label: 'Short', description: '5-8 slides' },
  { value: 'default', label: 'Default', description: '10-15 slides' },
];

export default function CustomizeSlideDeckModal({
  open,
  onOpenChange,
  selectedSourceIds = [],
  onGenerated,
}: CustomizeSlideDeckModalProps) {
  const [format, setFormat] = useState('detailed');
  const [language, setLanguage] = useState('en');
  const [length, setLength] = useState('default');
  const [description, setDescription] = useState('');
  
  const { toast } = useToast();
  
  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ['/api/sources'],
  });
  
  const generateMutation = useMutation({
    mutationFn: async (params: {
      sourceIds: string[];
      format: string;
      language: string;
      length: string;
      description: string;
    }) => {
      const systemPrompt = buildSlideDeckPrompt(params);
      const res = await apiRequest('POST', '/api/generate', {
        type: 'slides',
        sourceIds: params.sourceIds,
        model: 'google/gemini-3-pro-image-preview', // Use Gemini for image generation
        customPrompt: systemPrompt,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/generated'] });
      toast({
        title: 'Slide Deck Generated',
        description: 'Your presentation has been created successfully.'
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
  
  const buildSlideDeckPrompt = (params: {
    format: string;
    language: string;
    length: string;
    description: string;
  }) => {
    const langName = LANGUAGES.find(l => l.value === params.language)?.label || 'English';
    const slideCount = params.length === 'short' ? '5-8' : '10-15';
    
    const formatDesc = params.format === 'detailed'
      ? 'Create a comprehensive presentation with full text content on each slide. Include detailed explanations, data, and context that allows the deck to stand alone without a presenter.'
      : 'Create clean, visual slides with minimal text. Focus on key talking points, impactful visuals, and speaker notes. The slides should support a live presentation.';
    
    return `Create a professional slide deck presentation based on the provided sources.

**Language:** ${langName}
**Format:** ${formatDesc}
**Target Length:** ${slideCount} slides

**User Instructions:** ${params.description || 'Create a clear, engaging presentation that communicates the key insights.'}

**Slide Structure:**
1. Title Slide - Compelling title and subtitle
2. Overview/Agenda - What the presentation covers
3-${params.length === 'short' ? '7' : '13'}. Content Slides - Main points with supporting visuals
${params.length === 'short' ? '8' : '14'}. Key Takeaways - Summary of main points
${params.length === 'short' ? '' : '15. Call to Action/Next Steps'}

**Requirements:**
- Each slide should have a clear, concise title
- Use bullet points for easy scanning
- Include relevant data points and statistics
- Add speaker notes for context
- Maintain consistent visual theme
- Ensure logical flow between slides

Generate a polished, professional presentation.`;
  };
  
  const handleGenerate = () => {
    const idsToUse = selectedSourceIds.length > 0 
      ? selectedSourceIds 
      : sources.map(s => s.id);
    
    if (idsToUse.length === 0) {
      toast({
        title: 'No Sources',
        description: 'Please add sources before generating a slide deck.',
        variant: 'destructive'
      });
      return;
    }
    
    generateMutation.mutate({
      sourceIds: idsToUse,
      format,
      language,
      length,
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
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Presentation className="w-5 h-5 text-emerald-500" />
            Customize Slide Deck
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    format === fmt.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{fmt.label}</span>
                    {format === fmt.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {fmt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Language and Length Row */}
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
              <Label>Length</Label>
              <div className="flex rounded-lg border overflow-hidden">
                {LENGTHS.map((len) => (
                  <button
                    key={len.value}
                    onClick={() => setLength(len.value)}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      length === len.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {length === len.value && '✓ '}
                    {len.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label>Describe the slide deck you want to create</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Add a high-level outline, or guide the audience, style, and focus: "Create a deck for beginners using a bold and playful style with a focus on step-by-step instructions."'
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
