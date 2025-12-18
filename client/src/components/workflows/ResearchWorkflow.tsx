import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  Save,
  FileText,
  Mail,
  BarChart3,
  MessageSquare,
  ClipboardList,
  Lightbulb,
  Target,
  Users,
  Loader2,
  Copy,
  RefreshCw,
  Download,
  Pencil,
  Image,
  Send,
  Share2,
  FileOutput
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import type { Source } from '@/lib/types';

interface ResearchWorkflowProps {
  onComplete: (content: string) => void;
  onCancel: () => void;
  onSendToEmail?: (content: string, subject: string) => void;
  onCreateReport?: (content: string, title: string) => void;
  notebookId?: string;
}

interface ExtractedPoint {
  id: string;
  text: string;
  source?: string;
  selected: boolean;
}

interface FocusAngle {
  id: string;
  label: string;
  description: string;
}

const CONTENT_TYPES = [
  { id: 'blog', label: 'Blog Post / Article', icon: FileText, description: 'Long-form written content for your blog or publication' },
  { id: 'email', label: 'Email / Newsletter', icon: Mail, description: 'Communication piece for subscribers or team' },
  { id: 'summary', label: 'Executive Summary', icon: BarChart3, description: 'Brief for leadership or stakeholders' },
  { id: 'social', label: 'Social Media Posts', icon: MessageSquare, description: 'LinkedIn posts, Twitter threads' },
  { id: 'report', label: 'Report / Analysis', icon: ClipboardList, description: 'Data-driven document with insights' },
  { id: 'brief', label: 'Talking Points / Brief', icon: Lightbulb, description: 'Meeting prep or presentation notes' },
];

const AUDIENCES = [
  { id: 'executives', label: 'Executives / C-Suite', icon: '👔' },
  { id: 'managers', label: 'Managers / Team Leads', icon: '💼' },
  { id: 'technical', label: 'Technical / Developers', icon: '🔧' },
  { id: 'sales', label: 'Sales / Business Dev', icon: '📈' },
  { id: 'general', label: 'General Public', icon: '🌐' },
  { id: 'experts', label: 'Industry Experts', icon: '🎓' },
];

const LENGTH_OPTIONS = [
  { id: 'brief', label: 'Brief', description: '300-500 words' },
  { id: 'standard', label: 'Standard', description: '500-1000 words' },
  { id: 'comprehensive', label: 'Comprehensive', description: '1000-2000 words' },
];

export default function ResearchWorkflow({ onComplete, onCancel, onSendToEmail, onCreateReport, notebookId }: ResearchWorkflowProps) {
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingAngles, setIsLoadingAngles] = useState(false);
  const [isExtractingPoints, setIsExtractingPoints] = useState(false);
  const { toast } = useToast();

  // Step 1: Content Type
  const [contentType, setContentType] = useState<string>('');
  
  // Step 2: Source Selection
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  
  // Step 3: Focus & Angle
  const [focusAngles, setFocusAngles] = useState<FocusAngle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<string>('');
  const [customAngle, setCustomAngle] = useState<string>('');
  
  // Step 4: Tone & Audience
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [tone, setTone] = useState<number>(50); // 0 = formal, 100 = casual
  const [contentLength, setContentLength] = useState<string>('standard');
  
  // Step 5: Key Points
  const [extractedInsights, setExtractedInsights] = useState<ExtractedPoint[]>([]);
  const [extractedQuotes, setExtractedQuotes] = useState<ExtractedPoint[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedPoint[]>([]);
  const [customPoints, setCustomPoints] = useState<string>('');
  
  // Step 6: Generated Content
  const [generatedContent, setGeneratedContent] = useState<string>('');
  
  // Step 7: Image Generation (for social/visual content)
  const [wantsImage, setWantsImage] = useState<boolean | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Distribution tracking
  const [distributedTo, setDistributedTo] = useState<string | null>(null);

  // Fetch sources from notebook
  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ['/api/sources', notebookId],
    queryFn: async () => {
      const url = notebookId ? `/api/sources?notebookId=${notebookId}` : '/api/sources';
      const res = await fetch(url);
      return res.json();
    },
  });

  // Check if content type benefits from images
  const needsImageOption = ['social', 'blog', 'email'].includes(contentType);

  const steps = [
    { title: 'Content Type', icon: FileText },
    { title: 'Select Sources', icon: ClipboardList },
    { title: 'Focus & Angle', icon: Target },
    { title: 'Tone & Audience', icon: Users },
    { title: 'Key Points', icon: Lightbulb },
    { title: 'Generate', icon: Sparkles },
    ...(needsImageOption ? [{ title: 'Add Image', icon: Image }] : []),
    { title: 'Distribute', icon: Share2 },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (step) {
      case 0: return contentType !== '';
      case 1: return selectedSources.length > 0;
      case 2: return selectedAngle !== '' || customAngle.trim() !== '';
      case 3: return selectedAudiences.length > 0;
      case 4: return extractedInsights.some(p => p.selected) || extractedQuotes.some(p => p.selected) || extractedData.some(p => p.selected) || customPoints.trim() !== '';
      case 5: return generatedContent !== '';
      case 6: return needsImageOption ? wantsImage !== null : true; // Image step or skip
      case 7: return true; // Distribute step
      default: return false;
    }
  };

  // Generate focus angles based on selected sources
  const generateFocusAngles = useCallback(async () => {
    setIsLoadingAngles(true);
    const selectedSourceData = sources.filter(s => selectedSources.includes(s.id.toString()));
    const sourceContext = selectedSourceData.map(s => `- ${s.name}: ${s.content?.substring(0, 500)}...`).join('\n');
    const contentTypeLabel = CONTENT_TYPES.find(c => c.id === contentType)?.label;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Based on these sources for a "${contentTypeLabel}", suggest 5 specific content angles/focuses. Return ONLY a JSON array like: [{"id": "angle1", "label": "Short Title", "description": "One sentence description"}]

Sources:
${sourceContext}`
          }],
          model: 'anthropic/claude-sonnet-4.5',
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
              if (data.token) content += data.token;
            } catch {}
          }
        }
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const angles = JSON.parse(jsonMatch[0]) as FocusAngle[];
        setFocusAngles(angles);
      }
    } catch (error) {
      console.error('Failed to generate angles:', error);
      // Fallback angles
      setFocusAngles([
        { id: 'overview', label: 'Comprehensive Overview', description: 'Cover all major points from your sources' },
        { id: 'practical', label: 'Practical Guide', description: 'Focus on actionable takeaways and how-tos' },
        { id: 'analysis', label: 'Critical Analysis', description: 'Compare and contrast different perspectives' },
        { id: 'trends', label: 'Trends & Insights', description: 'Highlight emerging patterns and predictions' },
      ]);
    } finally {
      setIsLoadingAngles(false);
    }
  }, [sources, selectedSources, contentType]);

  // Extract key points from selected sources
  const extractKeyPoints = useCallback(async () => {
    setIsExtractingPoints(true);
    const selectedSourceData = sources.filter(s => selectedSources.includes(s.id.toString()));
    const sourceContext = selectedSourceData.map(s => `[${s.name}]: ${s.content}`).join('\n\n---\n\n');
    const angleText = selectedAngle === 'custom' ? customAngle : focusAngles.find(a => a.id === selectedAngle)?.label;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Extract key information from these sources for content about "${angleText}". Return ONLY a JSON object with three arrays:
{
  "insights": [{"id": "i1", "text": "Key insight", "selected": true}],
  "quotes": [{"id": "q1", "text": "Notable quote", "source": "Source name", "selected": true}],
  "dataPoints": [{"id": "d1", "text": "Statistic or data point", "selected": true}]
}

Extract 5-8 insights, 3-5 quotes, and 3-5 data points.

Sources:
${sourceContext}`
          }],
          model: 'anthropic/claude-sonnet-4.5',
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
              if (data.token) content += data.token;
            } catch {}
          }
        }
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        setExtractedInsights(extracted.insights || []);
        setExtractedQuotes(extracted.quotes || []);
        setExtractedData(extracted.dataPoints || []);
      }
    } catch (error) {
      console.error('Failed to extract points:', error);
      toast({ title: 'Error', description: 'Failed to extract key points. Please try again.', variant: 'destructive' });
    } finally {
      setIsExtractingPoints(false);
    }
  }, [sources, selectedSources, selectedAngle, customAngle, focusAngles, toast]);

  // Generate final content
  const generateContent = useCallback(async () => {
    setIsGenerating(true);
    
    const contentTypeLabel = CONTENT_TYPES.find(c => c.id === contentType)?.label;
    const angleText = selectedAngle === 'custom' ? customAngle : focusAngles.find(a => a.id === selectedAngle)?.label;
    const audienceLabels = selectedAudiences.map(a => AUDIENCES.find(aud => aud.id === a)?.label).join(', ');
    const lengthInfo = LENGTH_OPTIONS.find(l => l.id === contentLength);
    const toneText = tone < 33 ? 'formal and professional' : tone < 66 ? 'balanced and clear' : 'casual and conversational';
    
    const selectedInsights = extractedInsights.filter(p => p.selected).map(p => `- ${p.text}`).join('\n');
    const selectedQuotesText = extractedQuotes.filter(p => p.selected).map(p => `- "${p.text}" — ${p.source}`).join('\n');
    const selectedDataText = extractedData.filter(p => p.selected).map(p => `- ${p.text}`).join('\n');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Create a ${contentTypeLabel} with the following specifications:

**Topic/Angle**: ${angleText}
**Target Audience**: ${audienceLabels}
**Tone**: ${toneText}
**Length**: ${lengthInfo?.description}

**Key Insights to Include**:
${selectedInsights}

**Quotes to Consider**:
${selectedQuotesText}

**Data Points**:
${selectedDataText}

${customPoints ? `**Additional Points**:\n${customPoints}` : ''}

Generate well-structured, engaging content in markdown format. Include:
- A compelling headline/title
- Clear sections with headers
- Smooth transitions
- A strong conclusion or call-to-action

Do NOT include any preamble or explanation. Output ONLY the content itself.`
          }],
          model: 'anthropic/claude-sonnet-4.5',
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
              if (data.token) {
                content += data.token;
                setGeneratedContent(content);
              }
            } catch {}
          }
        }
      }

      setGeneratedContent(content);
    } catch (error) {
      console.error('Failed to generate content:', error);
      toast({ title: 'Error', description: 'Failed to generate content. Please try again.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [contentType, selectedAngle, customAngle, focusAngles, selectedAudiences, tone, contentLength, extractedInsights, extractedQuotes, extractedData, customPoints, toast]);

  // Generate image using Nano Banana 3 Pro
  const generateImage = useCallback(async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      
      const data = await response.json();
      if (data.image) {
        setGeneratedImage(data.image);
        toast({ title: 'Image Generated!', description: 'Your image has been created.' });
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast({ title: 'Error', description: 'Failed to generate image. Please try again.', variant: 'destructive' });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [imagePrompt, toast]);

  // Generate a suggested image prompt based on content
  const generateImagePrompt = useCallback(() => {
    const angleText = selectedAngle === 'custom' ? customAngle : focusAngles.find(a => a.id === selectedAngle)?.label || '';
    const contentTypeLabel = CONTENT_TYPES.find(c => c.id === contentType)?.label || '';
    
    // Extract first headline from generated content
    const headlineMatch = generatedContent.match(/^#\s+(.+)$/m) || generatedContent.match(/^##\s+(.+)$/m);
    const headline = headlineMatch ? headlineMatch[1] : angleText;
    
    const prompt = `Professional, modern illustration for a ${contentTypeLabel} about "${headline}". Clean, minimalist design with abstract geometric shapes, corporate blue and teal color palette, suitable for LinkedIn or business blog. High quality, 4K resolution.`;
    setImagePrompt(prompt);
  }, [selectedAngle, customAngle, focusAngles, contentType, generatedContent]);

  const handleNext = async () => {
    if (step === 1) {
      // Moving to angle selection - generate angles
      setStep(2);
      generateFocusAngles();
    } else if (step === 3) {
      // Moving to key points - extract them
      setStep(4);
      extractKeyPoints();
    } else if (step === 4) {
      // Moving to generation
      setStep(5);
      generateContent();
    } else if (step === 5 && needsImageOption) {
      // Moving to image step - generate suggested prompt
      setStep(6);
      generateImagePrompt();
    } else if (step === 5 && !needsImageOption) {
      // Skip image step, go to distribute
      setStep(6);
    } else if (step === 6 && needsImageOption) {
      // Moving from image to distribute
      setStep(7);
    } else if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  // Distribution handlers
  const handleSendToEmail = async () => {
    const headlineMatch = generatedContent.match(/^#\s+(.+)$/m);
    const subject = headlineMatch ? headlineMatch[1] : 'Generated Content';
    // Save to Studio first
    await saveToStudio();
    if (onSendToEmail) {
      onSendToEmail(generatedContent, subject);
    }
    setDistributedTo('email');
    toast({ 
      title: '✅ Sent to Email Builder', 
      description: 'Check the Email panel in Studio. Also saved to Notes.',
      duration: 5000
    });
  };

  const handleCreateReport = async () => {
    const headlineMatch = generatedContent.match(/^#\s+(.+)$/m);
    const title = headlineMatch ? headlineMatch[1] : 'Generated Report';
    // Save to Studio first
    await saveToStudio();
    if (onCreateReport) {
      onCreateReport(generatedContent, title);
    }
    setDistributedTo('report');
    toast({ 
      title: '✅ Report Created', 
      description: 'Check the Notes tab in Studio to preview.',
      duration: 5000
    });
  };

  // Save to Studio (appears in Notes tab under generated content)
  const saveToStudio = async () => {
    const headlineMatch = generatedContent.match(/^#\s+(.+)$/m);
    const title = headlineMatch ? headlineMatch[1] : `${CONTENT_TYPES.find(c => c.id === contentType)?.label || 'Content'} - ${new Date().toLocaleDateString()}`;
    
    try {
      await apiRequest('POST', '/api/generated/save', {
        type: contentType === 'email' ? 'email_draft' : contentType === 'report' ? 'report' : 'workflow_content',
        title,
        content: {
          markdown: generatedContent,
          image: generatedImage || null,
          metadata: {
            contentType,
            angle: selectedAngle === 'custom' ? customAngle : focusAngles.find(a => a.id === selectedAngle)?.label,
            audiences: selectedAudiences,
            generatedAt: new Date().toISOString(),
          }
        },
        sourceIds: selectedSources,
      });
      // Refresh the generated content list
      queryClient.invalidateQueries({ queryKey: ['/api/generated'] });
      return true;
    } catch (error) {
      console.error('Failed to save to studio:', error);
      return false;
    }
  };

  const handleSaveToSources = async () => {
    try {
      // Save to both sources AND studio
      await apiRequest('POST', '/api/sources', {
        notebookId: notebookId || null,
        type: 'text',
        category: 'content',
        name: `Generated ${CONTENT_TYPES.find(c => c.id === contentType)?.label || 'Content'}`,
        content: generatedContent,
        metadata: {
          generatedBy: 'research-workflow',
          timestamp: new Date().toISOString(),
          contentType,
          angle: selectedAngle === 'custom' ? customAngle : focusAngles.find(a => a.id === selectedAngle)?.label,
          audiences: selectedAudiences,
        }
      });
      await saveToStudio();
      setDistributedTo('sources');
      toast({ 
        title: '✅ Saved to Studio', 
        description: 'Check the Notes tab in Studio to preview your content.',
        duration: 5000
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save content.', variant: 'destructive' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setDistributedTo('clipboard');
    toast({ 
      title: '✅ Copied to Clipboard', 
      description: 'Content copied! Paste it anywhere you need.',
      duration: 3000
    });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">What type of content do you want to create?</p>
            <div className="grid grid-cols-2 gap-3">
              {CONTENT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      contentType === type.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setContentType(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${contentType === type.id ? 'bg-primary/20' : 'bg-muted'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{type.label}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                        </div>
                        {contentType === type.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Select the sources to use for research ({sources.length} available)</p>
            {sources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No sources found in this notebook.</p>
                <p className="text-sm">Add some sources first to use this workflow.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{selectedSources.length} selected</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSources(sources.map(s => s.id.toString()))}
                  >
                    Select All
                  </Button>
                </div>
                <ScrollArea className="h-[300px] rounded-lg border p-2">
                  <div className="space-y-2">
                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedSources.includes(source.id.toString()) ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => {
                          if (selectedSources.includes(source.id.toString())) {
                            setSelectedSources(selectedSources.filter(s => s !== source.id.toString()));
                          } else {
                            setSelectedSources([...selectedSources, source.id.toString()]);
                          }
                        }}
                      >
                        <Checkbox checked={selectedSources.includes(source.id.toString())} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{source.name}</span>
                            <Badge variant="outline" className="text-xs">{source.type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {source.content?.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">What angle or focus should this content have?</p>
            {isLoadingAngles ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing your sources for content angles...</p>
              </div>
            ) : (
              <>
                <RadioGroup value={selectedAngle} onValueChange={setSelectedAngle}>
                  <div className="space-y-2">
                    {focusAngles.map((angle) => (
                      <div
                        key={angle.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedAngle === angle.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedAngle(angle.id)}
                      >
                        <RadioGroupItem value={angle.id} id={angle.id} />
                        <div className="flex-1">
                          <Label htmlFor={angle.id} className="font-medium text-sm cursor-pointer">{angle.label}</Label>
                          <p className="text-xs text-muted-foreground mt-1">{angle.description}</p>
                        </div>
                      </div>
                    ))}
                    <div
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedAngle === 'custom' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedAngle('custom')}
                    >
                      <RadioGroupItem value="custom" id="custom" />
                      <div className="flex-1">
                        <Label htmlFor="custom" className="font-medium text-sm cursor-pointer flex items-center gap-2">
                          <Pencil className="w-4 h-4" />
                          Custom Angle
                        </Label>
                        {selectedAngle === 'custom' && (
                          <Textarea
                            placeholder="Describe your custom angle or focus..."
                            value={customAngle}
                            onChange={(e) => setCustomAngle(e.target.value)}
                            className="mt-2"
                            rows={2}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-3">Who is this content for? (Select all that apply)</p>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map((audience) => (
                  <Badge
                    key={audience.id}
                    variant={selectedAudiences.includes(audience.id) ? 'default' : 'outline'}
                    className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                      selectedAudiences.includes(audience.id) ? '' : 'hover:bg-primary/10'
                    }`}
                    onClick={() => {
                      if (selectedAudiences.includes(audience.id)) {
                        setSelectedAudiences(selectedAudiences.filter(a => a !== audience.id));
                      } else {
                        setSelectedAudiences([...selectedAudiences, audience.id]);
                      }
                    }}
                  >
                    <span className="mr-2">{audience.icon}</span>
                    {audience.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-3">What tone should it have?</p>
              <div className="flex items-center gap-4">
                <span className="text-sm w-20">Formal</span>
                <Slider
                  value={[tone]}
                  onValueChange={([val]) => setTone(val)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm w-20 text-right">Casual</span>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-3">How long should it be?</p>
              <RadioGroup value={contentLength} onValueChange={setContentLength} className="flex gap-4">
                {LENGTH_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all text-center ${
                      contentLength === option.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setContentLength(option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                    <Label htmlFor={option.id} className="cursor-pointer">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Review and select the key points to include</p>
            {isExtractingPoints ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Extracting key points from your sources...</p>
              </div>
            ) : (
              <Accordion type="multiple" defaultValue={['insights', 'quotes', 'data']} className="w-full">
                <AccordionItem value="insights">
                  <AccordionTrigger className="text-sm font-medium">
                    📌 Key Insights ({extractedInsights.filter(p => p.selected).length}/{extractedInsights.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {extractedInsights.map((point, idx) => (
                        <div
                          key={point.id}
                          className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                            point.selected ? 'bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            const updated = [...extractedInsights];
                            updated[idx].selected = !updated[idx].selected;
                            setExtractedInsights(updated);
                          }}
                        >
                          <Checkbox checked={point.selected} />
                          <span className="text-sm">{point.text}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="quotes">
                  <AccordionTrigger className="text-sm font-medium">
                    💬 Notable Quotes ({extractedQuotes.filter(p => p.selected).length}/{extractedQuotes.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {extractedQuotes.map((point, idx) => (
                        <div
                          key={point.id}
                          className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                            point.selected ? 'bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            const updated = [...extractedQuotes];
                            updated[idx].selected = !updated[idx].selected;
                            setExtractedQuotes(updated);
                          }}
                        >
                          <Checkbox checked={point.selected} />
                          <div className="flex-1">
                            <span className="text-sm italic">"{point.text}"</span>
                            {point.source && <span className="text-xs text-muted-foreground ml-2">— {point.source}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data">
                  <AccordionTrigger className="text-sm font-medium">
                    📊 Data Points ({extractedData.filter(p => p.selected).length}/{extractedData.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {extractedData.map((point, idx) => (
                        <div
                          key={point.id}
                          className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                            point.selected ? 'bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            const updated = [...extractedData];
                            updated[idx].selected = !updated[idx].selected;
                            setExtractedData(updated);
                          }}
                        >
                          <Checkbox checked={point.selected} />
                          <span className="text-sm">{point.text}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="custom">
                  <AccordionTrigger className="text-sm font-medium">
                    ✏️ Add Custom Points
                  </AccordionTrigger>
                  <AccordionContent>
                    <Textarea
                      placeholder="Add any additional points you want to include..."
                      value={customPoints}
                      onChange={(e) => setCustomPoints(e.target.value)}
                      rows={3}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            {isGenerating && !generatedContent ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Crafting your content...</p>
              </div>
            ) : generatedContent ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Generated Content</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setGeneratedContent(''); generateContent(); }}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[350px] rounded-lg border bg-card">
                  <div className="prose prose-sm dark:prose-invert max-w-none p-6">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  </div>
                </ScrollArea>
                {isGenerating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Still generating...
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Sparkles className="w-8 h-8 text-primary mb-4" />
                <p className="text-muted-foreground">Ready to generate your content</p>
                <Button onClick={generateContent} className="mt-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                </Button>
              </div>
            )}
          </div>
        );

      case 6:
        // Image generation step (only shown for social/blog/email content)
        if (needsImageOption) {
          return (
            <div className="space-y-4">
              <p className="text-muted-foreground">Would you like to create an image for your {CONTENT_TYPES.find(c => c.id === contentType)?.label}?</p>
              
              {wantsImage === null && (
                <div className="flex gap-4 justify-center py-6">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 max-w-[200px] h-24 flex-col gap-2"
                    onClick={() => setWantsImage(true)}
                  >
                    <Image className="w-8 h-8" />
                    <span>Yes, create image</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 max-w-[200px] h-24 flex-col gap-2"
                    onClick={() => setWantsImage(false)}
                  >
                    <ChevronRight className="w-8 h-8" />
                    <span>Skip for now</span>
                  </Button>
                </div>
              )}

              {wantsImage === true && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Image Prompt</Label>
                    <Textarea
                      placeholder="Describe the image you want to generate..."
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Using Nano Banana 3 Pro for high-quality image generation
                    </p>
                  </div>

                  {!generatedImage && (
                    <Button 
                      onClick={generateImage} 
                      disabled={isGeneratingImage || !imagePrompt.trim()}
                      className="w-full"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Image...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  )}

                  {generatedImage && (
                    <div className="space-y-3">
                      <div className="rounded-lg border overflow-hidden bg-muted">
                        <img 
                          src={generatedImage.startsWith('http') ? generatedImage : 
                               generatedImage.startsWith('data:') ? generatedImage :
                               `data:image/png;base64,${generatedImage}`}
                          alt="Generated content image"
                          className="w-full h-auto max-h-[300px] object-contain"
                          onError={(e) => {
                            // Show placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23374151" width="400" height="200"/><text fill="%239CA3AF" font-size="16" x="50%" y="50%" text-anchor="middle">Image generated but preview unavailable</text></svg>';
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="w-4 h-4" />
                          Image ready
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => { setGeneratedImage(''); generateImage(); }}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {wantsImage === false && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No problem! Click Next to continue to distribution options.</p>
                </div>
              )}
            </div>
          );
        }
        // Fall through to distribute step if no image option
        return null;

      case 7:
      default:
        // Distribute step - final step with distribution options
        const finalStep = needsImageOption ? 7 : 6;
        if (step === finalStep || (!needsImageOption && step === 6)) {
          // Show success state if already distributed
          if (distributedTo) {
            const destinations: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
              email: { icon: <Mail className="w-8 h-8 text-blue-500" />, label: 'Email Builder', description: 'Open the Studio → Email panel to review and send' },
              report: { icon: <FileOutput className="w-8 h-8 text-purple-500" />, label: 'Reports', description: 'Open the Studio → Reports to view your document' },
              sources: { icon: <Save className="w-8 h-8 text-green-500" />, label: 'Sources', description: 'Check the Sources panel to find your saved content' },
              clipboard: { icon: <Copy className="w-8 h-8 text-gray-500" />, label: 'Clipboard', description: 'Content copied! Paste it anywhere you need' },
            };
            const dest = destinations[distributedTo];
            return (
              <div className="space-y-6 text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Content Sent!</h3>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    {dest?.icon}
                    <span className="font-medium">{dest?.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{dest?.description}</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setDistributedTo(null)}>
                    Send Elsewhere
                  </Button>
                  <Button onClick={() => onCancel()}>
                    Done
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <p className="text-muted-foreground">Your content is ready! Review and distribute.</p>
              
              {/* Full Preview Section */}
              <div className="rounded-lg border bg-card overflow-hidden">
                {/* Generated Image Preview */}
                {generatedImage && (
                  <div className="border-b bg-muted">
                    <img 
                      src={generatedImage.startsWith('http') ? generatedImage : 
                           generatedImage.startsWith('data:') ? generatedImage :
                           `data:image/png;base64,${generatedImage}`}
                      alt="Generated content image"
                      className="w-full h-48 object-contain"
                      onError={(e) => {
                        // Show placeholder if image fails
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150"><rect fill="%23374151" width="400" height="150"/><text fill="%2322c55e" font-size="14" x="50%" y="50%" text-anchor="middle">✓ Image ready (preview unavailable)</text></svg>';
                      }}
                    />
                  </div>
                )}
                
                {/* Content Preview */}
                <ScrollArea className="h-[200px]">
                  <div className="prose prose-sm dark:prose-invert max-w-none p-4">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </div>

              {/* Distribution Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Send to:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-14 flex-col gap-1"
                    onClick={handleSendToEmail}
                  >
                    <Mail className="w-5 h-5 text-blue-500" />
                    <span className="text-xs">Email Builder</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-14 flex-col gap-1"
                    onClick={handleCreateReport}
                  >
                    <FileOutput className="w-5 h-5 text-purple-500" />
                    <span className="text-xs">Reports</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-14 flex-col gap-1"
                    onClick={handleCopy}
                  >
                    <Copy className="w-5 h-5 text-gray-500" />
                    <span className="text-xs">Copy</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-14 flex-col gap-1"
                    onClick={handleSaveToSources}
                  >
                    <Save className="w-5 h-5 text-green-500" />
                    <span className="text-xs">Save Draft</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                    i < step ? 'bg-primary text-primary-foreground' :
                    i === step ? 'bg-primary/20 text-primary border-2 border-primary' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
              );
            })}
          </div>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="mt-4">{steps[step].title}</CardTitle>
        <CardDescription>Step {step + 1} of {steps.length}</CardDescription>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex justify-between pt-4 border-t">
        <Button
          variant="ghost"
          onClick={() => step === 0 ? onCancel() : setStep(step - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {/* Hide Next button on final distribute step - actions are in the step content */}
        {step < steps.length - 1 && (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating || isLoadingAngles || isExtractingPoints || isGeneratingImage}
          >
            {isGenerating || isLoadingAngles || isExtractingPoints || isGeneratingImage ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            Next
          </Button>
        )}

        {/* Show Done button on final step */}
        {step === steps.length - 1 && (
          <Button variant="outline" onClick={() => onCancel()}>
            Done
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
