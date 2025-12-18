import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Star,
  ChevronDown,
  Play,
  Clock,
} from 'lucide-react';
import { BUILTIN_WORKFLOWS } from '@shared/builtin-workflows';
import type { WorkflowDefinition } from '@shared/workflow-schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WorkflowsLibraryProps {
  onRunWorkflow: (workflow: WorkflowDefinition) => void;
}

export default function WorkflowsLibrary({ onRunWorkflow }: WorkflowsLibraryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflow preferences (favorites)
  const { data: preferences } = useQuery({
    queryKey: ['workflow-preferences'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/workflows/preferences');
        return res.json();
      } catch {
        return { favorites: [] };
      }
    },
  });

  // Update favorites from preferences
  useEffect(() => {
    if (preferences?.favorites) {
      setFavorites(preferences.favorites);
    }
  }, [preferences]);

  // Save favorites mutation
  const saveFavoritesMutation = useMutation({
    mutationFn: async (newFavorites: string[]) => {
      await apiRequest('POST', '/api/workflows/preferences', {
        favorites: newFavorites,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-preferences'] });
    },
  });

  // Toggle favorite
  const toggleFavorite = (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    const isFavorite = favorites.includes(workflowId);
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== workflowId)
      : [...favorites, workflowId];
    
    setFavorites(newFavorites);
    saveFavoritesMutation.mutate(newFavorites);
    
    toast({
      title: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      description: isFavorite 
        ? 'Workflow removed from quick actions'
        : 'Workflow added to quick actions in chat',
    });
  };

  const handleRun = (e: React.MouseEvent, workflow: WorkflowDefinition) => {
    e.stopPropagation();
    onRunWorkflow(workflow);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {BUILTIN_WORKFLOWS.map((workflow) => {
          const isExpanded = expandedId === workflow.id;
          const isFavorite = favorites.includes(workflow.id);

          return (
            <Collapsible
              key={workflow.id}
              open={isExpanded}
              onOpenChange={() => setExpandedId(isExpanded ? null : workflow.id)}
            >
              <CollapsibleTrigger asChild>
                <div
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                    "hover:bg-muted/50",
                    isExpanded && "bg-muted/50"
                  )}
                >
                  {/* Emoji */}
                  <span className="text-lg shrink-0">{workflow.emoji}</span>
                  
                  {/* Title */}
                  <span className="flex-1 text-sm font-medium text-left truncate">
                    {workflow.name}
                  </span>

                  {/* Favorite star */}
                  <button
                    onClick={(e) => toggleFavorite(e, workflow.id)}
                    className={cn(
                      "p-1 rounded hover:bg-muted transition-colors shrink-0",
                      isFavorite ? "text-yellow-400" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                  </button>

                  {/* Expand arrow */}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                      isExpanded && "rotate-180"
                    )}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="pl-9 pr-2 pb-2 space-y-2">
                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {workflow.shortDescription || workflow.description}
                  </p>

                  {/* Meta info */}
                  {workflow.estimatedMinutes && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{workflow.estimatedMinutes} min</span>
                    </div>
                  )}

                  {/* Run button */}
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={(e) => handleRun(e, workflow)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run Workflow
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  );
}
