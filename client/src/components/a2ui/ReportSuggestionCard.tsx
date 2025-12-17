import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  FileText,
  ChevronDown,
  ExternalLink,
  Eye,
} from 'lucide-react';

interface ReportSuggestionCardProps {
  suggestedFormat: string;
  description: string;
  onPreviewHere: () => void;
  onOpenInEditor: () => void;
  onChangeFormat: (format: string) => void;
  availableFormats?: { id: string; name: string }[];
}

const DEFAULT_FORMATS = [
  { id: 'briefing-doc', name: 'Briefing Doc' },
  { id: 'blog-post', name: 'Blog Post' },
  { id: 'linkedin-article', name: 'LinkedIn Article' },
  { id: 'twitter-thread', name: 'Twitter Thread' },
  { id: 'executive-summary', name: 'Executive Summary' },
  { id: 'case-study', name: 'Case Study' },
  { id: 'newsletter', name: 'Newsletter' },
  { id: 'whitepaper', name: 'Whitepaper' },
];

export default function ReportSuggestionCard({
  suggestedFormat,
  description,
  onPreviewHere,
  onOpenInEditor,
  onChangeFormat,
  availableFormats = DEFAULT_FORMATS,
}: ReportSuggestionCardProps) {
  return (
    <Card className="p-4 rounded-xl border-primary/20 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm mb-3">
            I can create a <strong>{suggestedFormat}</strong> {description}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={onPreviewHere}
            >
              <Eye className="w-4 h-4" />
              Preview Here
            </Button>

            <Button
              size="sm"
              className="gap-2"
              onClick={onOpenInEditor}
            >
              <FileText className="w-4 h-4" />
              Open in Editor
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Change Format
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {availableFormats.map((format) => (
                  <DropdownMenuItem
                    key={format.id}
                    onClick={() => onChangeFormat(format.id)}
                  >
                    {format.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Helper function to detect report intent from user message
export function detectReportIntent(message: string): {
  detected: boolean;
  format?: string;
  description?: string;
} {
  const lowerMessage = message.toLowerCase();
  
  // Patterns that indicate report creation intent
  const reportPatterns = [
    { pattern: /write\s+(?:a|an)\s+(\w+(?:\s+\w+)?)\s+(?:about|on|for)/i, extractFormat: true },
    { pattern: /create\s+(?:a|an)\s+(\w+(?:\s+\w+)?)\s+(?:about|on|for|from)/i, extractFormat: true },
    { pattern: /make\s+(?:a|an)\s+(\w+(?:\s+\w+)?)\s+(?:about|on|for|from)/i, extractFormat: true },
    { pattern: /turn\s+this\s+into\s+(?:a|an)\s+(\w+(?:\s+\w+)?)/i, extractFormat: true },
    { pattern: /draft\s+(?:a|an)\s+(\w+(?:\s+\w+)?)/i, extractFormat: true },
    { pattern: /generate\s+(?:a|an)\s+(\w+(?:\s+\w+)?)/i, extractFormat: true },
  ];

  // Format keywords mapping
  const formatKeywords: Record<string, string> = {
    'report': 'Briefing Doc',
    'briefing': 'Briefing Doc',
    'brief': 'Briefing Doc',
    'summary': 'Executive Summary',
    'executive summary': 'Executive Summary',
    'blog': 'Blog Post',
    'blog post': 'Blog Post',
    'article': 'Blog Post',
    'linkedin': 'LinkedIn Article',
    'linkedin post': 'LinkedIn Article',
    'linkedin article': 'LinkedIn Article',
    'twitter': 'Twitter Thread',
    'tweet': 'Twitter Thread',
    'twitter thread': 'Twitter Thread',
    'thread': 'Twitter Thread',
    'case study': 'Case Study',
    'newsletter': 'Newsletter',
    'whitepaper': 'Whitepaper',
    'white paper': 'Whitepaper',
    'thought leadership': 'LinkedIn Article',
    'thought piece': 'LinkedIn Article',
  };

  for (const { pattern, extractFormat } of reportPatterns) {
    const match = message.match(pattern);
    if (match) {
      let format = 'report';
      if (extractFormat && match[1]) {
        const extracted = match[1].toLowerCase().trim();
        format = formatKeywords[extracted] || 'Briefing Doc';
      }
      
      return {
        detected: true,
        format,
        description: 'from this research',
      };
    }
  }

  // Check for general report-related keywords
  const generalPatterns = [
    /write.*report/i,
    /create.*content/i,
    /draft.*document/i,
    /thought leadership/i,
    /social media.*post/i,
  ];

  for (const pattern of generalPatterns) {
    if (pattern.test(message)) {
      return {
        detected: true,
        format: 'Briefing Doc',
        description: 'based on your sources',
      };
    }
  }

  return { detected: false };
}
