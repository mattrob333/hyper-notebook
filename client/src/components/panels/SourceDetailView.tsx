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

  const mockSummary = `The emergence of agent engineering is driven by the challenge of making non-deterministic Large Language Model (LLM) agents reliable in real-world production environments, which is vastly different from traditional software development. This new discipline is defined as the iterative process of refining these systems through a continuous cycle of build, test, ship, observe, refine, repeat. Successful implementation requires integrating three distinct skillsets: Product thinking to shape agent behavior and define success, Engineering to build robust infrastructure and tools, and Data science to measure performance and analyze usage patterns. This approach acknowledges that shipping an agent is not the endpoint but rather the first step for gaining the insights needed to harness the powerful, yet unpredictable, nature of agents operating complex workflows.`;

  const mockContent = `
## Agent Engineering: A New Discipline

If you've built an agent, you know that the delta between "it works on my machine" and "it works in production" can be huge. Traditional software assumes you directly control the inputs and outputs. Agents give you neither: users say literally anything, and the agent's responses—and their effects—are non-deterministic.

Over the past 3 years, we've watched thousands of teams struggle with this reality. The ones who've succeeded in shipping something reliable to production—companies like Clay, Yuma, LinkedIn, and Cloudflare—aren't following the traditional software playbook. They're pioneering something new: agent engineering.

### What is agent engineering?

Agent engineering is the iterative process of refining non-deterministic LLM systems into reliable production experiences. It is a cyclical process: build, test, ship, observe, refine, repeat.

The key here is that shipping isn't the end goal. It's just the way you keep moving to get new insights and improve your agent. To make improvements that matter, you need to understand what's happening in production. The faster you move through this cycle, the more reliable your agent becomes.

We see agent engineering as a new discipline that combines 3 skillsets working together:

### Product thinking
Product thinking defines the scope and shapes agent behavior. This includes:
- Defining what the agent should and shouldn't do
- Setting success criteria for different scenarios
- Understanding user expectations and edge cases

### Engineering
Engineering builds robust infrastructure and tools for:
- Handling non-deterministic outputs reliably
- Building feedback loops for continuous improvement
- Creating monitoring and debugging capabilities

### Data science
Data science measures performance and analyzes patterns:
- Tracking success metrics across user interactions
- Identifying failure modes and their root causes
- Quantifying improvements over time
  `;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-sidebar" data-testid="source-detail-view">
      <div className="h-14 border-b flex items-center justify-between px-6 sticky top-0 bg-background z-10">
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
            <p className="text-sm text-muted-foreground leading-relaxed">
              {mockSummary}
            </p>
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
              {mockContent}
            </div>
          </article>
        </div>
      </ScrollArea>
    </div>
  );
}
