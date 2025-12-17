import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ExternalLink, 
  Bookmark, 
  Copy, 
  MoreVertical,
  FileText,
  Globe,
  Sparkles,
  ChevronDown,
  ArrowUpRight
} from "lucide-react";
import type { Source } from "@/lib/types";

interface SourceDetailViewProps {
  source: Source;
  onClose: () => void;
}

export default function SourceDetailView({ source, onClose }: SourceDetailViewProps) {
  const getSourceIcon = () => {
    switch (source.type) {
      case 'url':
        return <Globe className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Use actual source data instead of mock content
  const sourceSummary = source.summary || 'No summary available for this source.';
  const sourceContent = source.content || 'No content available.';

  return (
    <div className="flex-1 flex flex-col h-full min-w-0" data-testid="source-detail-view">
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-6 sticky top-0 bg-sidebar z-10">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold truncate">{source.name}</h2>
          <Badge variant="secondary" className="shrink-0">
            {source.type.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {source.type === 'url' && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.open(source.content, '_blank')}
              data-testid="button-open-external"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" data-testid="button-bookmark">
            <Bookmark className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-copy">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-more">
            <MoreVertical className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-source">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          <Card className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-xl bg-primary/20 shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Source guide</p>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                    <ChevronDown className="w-3 h-3" />
                    Skip to content
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown>{sourceSummary}</ReactMarkdown>
            </div>
          </Card>

          {source.type === 'url' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getSourceIcon()}
              <a 
                href={source.content} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                {source.content}
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            5 min read · Dec 9, 2025
          </div>

          <article className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-foreground leading-relaxed whitespace-pre-wrap">
              {sourceContent}
            </div>
          </article>
        </div>
      </ScrollArea>
    </div>
  );
}
