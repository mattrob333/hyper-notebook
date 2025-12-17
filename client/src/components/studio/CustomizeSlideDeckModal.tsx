import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const [slideSelectedSources, setSlideSelectedSources] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ['/api/sources'],
  });

  // Initialize selected sources when modal opens
  useEffect(() => {
    if (open && sources.length > 0) {
      setSlideSelectedSources(
        selectedSourceIds.length > 0 ? selectedSourceIds : sources.map(s => s.id)
      );
    }
  }, [open, sources, selectedSourceIds]);
  
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
    if (slideSelectedSources.length === 0) {
      toast({
        title: 'No Sources Selected',
        description: 'Please select at least one source.',
        variant: 'destructive'
      });
      return;
    }
    
    generateMutation.mutate({
      sourceIds: slideSelectedSources,
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Presentation className="w-5 h-5 text-emerald-500" />
            </div>
            Create Slide Deck
          </DialogTitle>
          <DialogDescription>
            Generate a professional presentation from your sources
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-5">
          {/* Source Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sources to Include</Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  if (slideSelectedSources.length === sources.length) {
                    setSlideSelectedSources([]);
                  } else {
                    setSlideSelectedSources(sources.map(s => s.id));
                  }
                }}
              >
                {slideSelectedSources.length === sources.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-[160px] overflow-y-auto rounded-lg border bg-muted/30">
              {sources.map((source, idx) => (
                <label
                  key={source.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${idx !== sources.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  <Checkbox
                    checked={slideSelectedSources.includes(source.id)}
                    onCheckedChange={(checked) => {
                      setSlideSelectedSources(prev =>
                        checked
                          ? [...prev, source.id]
                          : prev.filter(id => id !== source.id)
                      );
                    }}
                  />
                  <span className="text-sm flex-1 truncate">{source.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {slideSelectedSources.length} of {sources.length} sources selected
            </p>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Presentation Style</Label>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    format === fmt.value
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500'
                      : 'border-border hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{fmt.label}</span>
                    {format === fmt.value && (
                      <Check className="w-4 h-4 text-emerald-500" />
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
              <Label className="text-sm font-medium">Language</Label>
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
              <Label className="text-sm font-medium">Length</Label>
              <div className="flex rounded-lg border overflow-hidden">
                {LENGTHS.map((len) => (
                  <button
                    key={len.value}
                    onClick={() => setLength(len.value)}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      length === len.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {len.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Topic Focus <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should the presentation focus on? e.g., Key insights for executives, step-by-step tutorial..."
              className="rounded-lg min-h-[80px] resize-none"
            />
          </div>
        </div>
        
        <DialogFooter className="pt-4 border-t gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={generateMutation.isPending || slideSelectedSources.length === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Presentation className="w-4 h-4" />
                Generate Slides
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
