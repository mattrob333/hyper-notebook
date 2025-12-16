import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  FileText, 
  Globe,
  CheckCircle2,
  Loader2,
  Megaphone,
  Code,
  TrendingUp,
  Layers
} from "lucide-react";
import type { Source } from "@/lib/types";

interface AIContextFileGeneratorProps {
  onBack: () => void;
  sources: Source[];
}

type ContextType = 'full' | 'marketing' | 'technical' | 'investor';

const contextTypes = [
  { value: 'full' as ContextType, label: 'Full Context', icon: Layers, description: 'Complete project overview with all details' },
  { value: 'marketing' as ContextType, label: 'Marketing Context', icon: Megaphone, description: 'Branding, voice, style guidelines, and logos' },
  { value: 'technical' as ContextType, label: 'Technical Context', icon: Code, description: 'Tech stack, architecture, and implementation' },
  { value: 'investor' as ContextType, label: 'Investor Context', icon: TrendingUp, description: 'Business model, market, and growth metrics' },
];

export default function AIContextFileGenerator({ onBack, sources }: AIContextFileGeneratorProps) {
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(sources.map(s => s.id)));
  const [contextType, setContextType] = useState<ContextType>('full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleSource = (id: string) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSources(newSelected);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const selectedSourcesList = sources.filter(s => selectedSources.has(s.id));
      const content = generateContextFile(selectedSourcesList, contextType);
      setGeneratedContent(content);
      setIsGenerating(false);
    }, 1500);
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedContent) {
      const blob = new Blob([generatedContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contextType}-context-file.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const selectedContextType = contextTypes.find(t => t.value === contextType);

  return (
    <div className="flex flex-col h-full" data-testid="ai-context-generator">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-8 w-8"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-semibold text-base">AI Context File</h2>
            <p className="text-xs text-muted-foreground">Generate a summary to use with other AI tools</p>
          </div>
        </div>
        {generatedContent && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-lg gap-2"
              onClick={handleCopy}
              data-testid="button-copy"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button 
              size="sm" 
              className="rounded-lg gap-2"
              onClick={handleDownload}
              data-testid="button-download"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 border-b border-border/50">
        <Select value={contextType} onValueChange={(v) => setContextType(v as ContextType)}>
          <SelectTrigger className="w-full rounded-xl" data-testid="select-context-type">
            <SelectValue>
              <div className="flex items-center gap-2">
                {selectedContextType && <selectedContextType.icon className="w-4 h-4" />}
                <span>{selectedContextType?.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {contextTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="rounded-lg">
                <div className="flex items-center gap-3">
                  <type.icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-56 border-r border-border/50 flex flex-col">
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sources</span>
              <span className="text-xs text-muted-foreground">{selectedSources.size} selected</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                if (selectedSources.size === sources.length) {
                  setSelectedSources(new Set());
                } else {
                  setSelectedSources(new Set(sources.map(s => s.id)));
                }
              }}
            >
              {selectedSources.size === sources.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {sources.map((source) => (
                <div 
                  key={source.id}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover-elevate cursor-pointer"
                  onClick={() => toggleSource(source.id)}
                  data-testid={`source-checkbox-${source.id}`}
                >
                  <Checkbox 
                    checked={selectedSources.has(source.id)}
                    onCheckedChange={() => toggleSource(source.id)}
                    className="rounded-md shrink-0"
                  />
                  <div className="p-1 rounded bg-muted shrink-0">
                    {source.type === 'url' ? <Globe className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  </div>
                  <span className="text-xs truncate pr-1" title={source.name}>{source.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border/50">
            <Button 
              className="w-full rounded-lg gap-2"
              onClick={handleGenerate}
              disabled={isGenerating || selectedSources.size === 0}
              data-testid="button-generate"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Context File
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {generatedContent ? (
            <ScrollArea className="flex-1">
              <div className="p-6">
                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/50 p-4 rounded-xl">
                  {generatedContent}
                </pre>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Generate AI Context File</h3>
                <p className="text-sm text-muted-foreground">
                  Select the sources you want to include and click Generate to create a comprehensive context file you can use with other AI tools.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generateContextFile(sources: Source[], contextType: ContextType): string {
  const typeLabels: Record<ContextType, string> = {
    full: 'Full Context',
    marketing: 'Marketing Context',
    technical: 'Technical Context',
    investor: 'Investor Context',
  };

  const lines: string[] = [
    `# ${typeLabels[contextType]} File`,
    '',
    `Generated: ${new Date().toISOString()}`,
    `Context Type: ${typeLabels[contextType]}`,
    `Sources: ${sources.length}`,
    '',
    '---',
    '',
  ];

  if (contextType === 'full') {
    lines.push('## Project Overview');
    lines.push('');
    lines.push('This context file contains synthesized information from the following sources:');
    lines.push('');
    sources.forEach((source, index) => {
      lines.push(`${index + 1}. **${source.name}** (${source.type})`);
      if (source.type === 'url') {
        lines.push(`   - URL: ${source.content}`);
      }
    });
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Key Concepts');
    lines.push('');
    lines.push('### A2UI Protocol');
    lines.push('A2UI (Agent-to-User Interface) is a framework-agnostic protocol that allows AI agents to dynamically generate user interfaces.');
    lines.push('');
    lines.push('### Hyperbrowser SDK');
    lines.push('Hyperbrowser provides a cloud-based browser automation platform with support for Puppeteer, Playwright, and headless Chrome.');
    lines.push('');
  } else if (contextType === 'marketing') {
    lines.push('## Brand Identity');
    lines.push('');
    lines.push('### Brand Voice');
    lines.push('- Tone: Professional yet approachable');
    lines.push('- Style: Clear, concise, and action-oriented');
    lines.push('- Personality: Innovative, trustworthy, forward-thinking');
    lines.push('');
    lines.push('### Visual Guidelines');
    lines.push('- Primary Color: Hunter Green (#2D5A3D)');
    lines.push('- Secondary Color: Dark Gray (#222221)');
    lines.push('- Typography: Clean, modern sans-serif fonts');
    lines.push('- Logo Usage: Maintain clear space, minimum sizes apply');
    lines.push('');
    lines.push('### Key Messages');
    lines.push('- AI-native workspace for the modern researcher');
    lines.push('- Seamlessly blend AI assistance with human insight');
    lines.push('- Your intelligent companion for deep research');
    lines.push('');
  } else if (contextType === 'technical') {
    lines.push('## Tech Stack');
    lines.push('');
    lines.push('### Frontend');
    lines.push('- React 18 with TypeScript');
    lines.push('- Vite for build tooling');
    lines.push('- TailwindCSS for styling');
    lines.push('- Shadcn/UI component library');
    lines.push('- TanStack Query for data fetching');
    lines.push('');
    lines.push('### Backend');
    lines.push('- Node.js with Express');
    lines.push('- TypeScript');
    lines.push('- RESTful API architecture');
    lines.push('');
    lines.push('### Key Integrations');
    lines.push('- OpenAI API for AI capabilities');
    lines.push('- Hyperbrowser SDK for browser automation');
    lines.push('- A2UI Protocol for dynamic UI generation');
    lines.push('');
  } else if (contextType === 'investor') {
    lines.push('## Executive Summary');
    lines.push('');
    lines.push('The Hyper-Interactive Notebook is an AI-native workspace that combines:');
    lines.push('- Deep research capabilities with web automation');
    lines.push('- Dynamic UI generation via A2UI protocol');
    lines.push('- Multi-modal content creation (reports, presentations, etc.)');
    lines.push('');
    lines.push('### Market Opportunity');
    lines.push('- Target Market: Knowledge workers, researchers, analysts');
    lines.push('- TAM: $50B+ productivity software market');
    lines.push('- Growth Drivers: AI adoption, remote work trends');
    lines.push('');
    lines.push('### Competitive Advantages');
    lines.push('- First-mover in AI-native research workspaces');
    lines.push('- Proprietary A2UI protocol for generative interfaces');
    lines.push('- Deep integration with browser automation');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## Usage Instructions');
  lines.push('');
  lines.push('Copy this context file and paste it into your preferred AI tool (ChatGPT, Claude, etc.) to provide background context for your conversations.');
  lines.push('');

  return lines.join('\n');
}
