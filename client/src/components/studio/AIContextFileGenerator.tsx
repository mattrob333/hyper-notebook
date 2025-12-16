import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  FileText, 
  Globe,
  CheckCircle2,
  Loader2
} from "lucide-react";
import type { Source } from "@/lib/types";

interface AIContextFileGeneratorProps {
  onBack: () => void;
  sources: Source[];
}

export default function AIContextFileGenerator({ onBack, sources }: AIContextFileGeneratorProps) {
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(sources.map(s => s.id)));
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
      const content = generateContextFile(selectedSourcesList);
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
      a.download = 'ai-context-file.md';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

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

      <div className="flex flex-1 min-h-0">
        <div className="w-64 border-r border-border/50 flex flex-col">
          <div className="p-4 border-b border-border/50">
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
            <div className="p-2 space-y-1">
              {sources.map((source) => (
                <div 
                  key={source.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                  onClick={() => toggleSource(source.id)}
                  data-testid={`source-checkbox-${source.id}`}
                >
                  <Checkbox 
                    checked={selectedSources.has(source.id)}
                    onCheckedChange={() => toggleSource(source.id)}
                    className="rounded-md"
                  />
                  <div className="p-1.5 rounded-lg bg-muted shrink-0">
                    {source.type === 'url' ? <Globe className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  </div>
                  <span className="text-sm truncate flex-1">{source.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border/50">
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
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
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

function generateContextFile(sources: Source[]): string {
  const lines: string[] = [
    '# AI Context File',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Sources: ${sources.length}`,
    '',
    '---',
    '',
    '## Project Overview',
    '',
    'This context file contains synthesized information from the following sources:',
    '',
  ];

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
  lines.push('A2UI (Agent-to-User Interface) is a framework-agnostic protocol that allows AI agents to dynamically generate user interfaces. The agent sends a declarative JSON format describing the intent of the UI, and the client renders it using native widgets.');
  lines.push('');
  lines.push('### Hyperbrowser SDK');
  lines.push('Hyperbrowser provides a cloud-based browser automation platform with support for Puppeteer, Playwright, and headless Chrome. It enables web scraping, data extraction, and browser-based workflows.');
  lines.push('');
  lines.push('### Deep Research');
  lines.push('Deep Research is an AI-powered research methodology that combines web search, source analysis, and synthesis to generate comprehensive reports on any topic.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Usage Instructions');
  lines.push('');
  lines.push('Copy this context file and paste it into your preferred AI tool (ChatGPT, Claude, etc.) to provide background context for your conversations about this project.');
  lines.push('');

  return lines.join('\n');
}
