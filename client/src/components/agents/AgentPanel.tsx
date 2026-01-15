/**
 * AgentPanel
 *
 * A collapsible panel for selecting persona agents to participate in debates.
 * Shows available agents with checkboxes and displays selected count.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useNextMethodStore, selectSelectedPersonas } from '@/lib/store';
import { AgentCheckbox } from './AgentCheckbox';
import { PersonaChip } from './PersonaChip';

interface AgentPanelProps {
  className?: string;
  defaultOpen?: boolean;
}

export function AgentPanel({ className, defaultOpen = true }: AgentPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const availablePersonas = useNextMethodStore((state) => state.availablePersonas);
  const selectedPersonaIds = useNextMethodStore((state) => state.selectedPersonaIds);
  const isDebateActive = useNextMethodStore((state) => state.isDebateActive);
  const selectPersona = useNextMethodStore((state) => state.selectPersona);
  const deselectPersona = useNextMethodStore((state) => state.deselectPersona);
  const startDebate = useNextMethodStore((state) => state.startDebate);
  const endDebate = useNextMethodStore((state) => state.endDebate);

  const selectedPersonas = useNextMethodStore(selectSelectedPersonas);

  const handleCheckChange = (personaId: string, checked: boolean) => {
    if (checked) {
      selectPersona(personaId);
    } else {
      deselectPersona(personaId);
    }
  };

  const handleDebateToggle = () => {
    if (isDebateActive) {
      endDebate();
    } else if (selectedPersonaIds.length >= 2) {
      startDebate();
    }
  };

  const canStartDebate = selectedPersonaIds.length >= 2;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('space-y-2', className)}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center justify-between w-full p-2 h-auto"
        >
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Users className="h-4 w-4" />
            <span className="font-medium">Agents</span>
          </div>
          {selectedPersonaIds.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedPersonaIds.length} selected
            </span>
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3">
        {/* Selected personas chips */}
        {selectedPersonas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2">
            {selectedPersonas.map((persona) => (
              <PersonaChip
                key={persona.id}
                persona={persona}
                onClick={() => deselectPersona(persona.id)}
              />
            ))}
          </div>
        )}

        {/* Debate controls */}
        <div className="px-2">
          <Button
            onClick={handleDebateToggle}
            disabled={!canStartDebate && !isDebateActive}
            variant={isDebateActive ? 'destructive' : 'default'}
            size="sm"
            className="w-full"
          >
            {isDebateActive ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                End Debate
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Debate {!canStartDebate && '(Select 2+)'}
              </>
            )}
          </Button>
        </div>

        {/* Agent list */}
        <ScrollArea className="h-[200px] px-2">
          <div className="space-y-2">
            {availablePersonas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No agents available. Create personas for this notebook.
              </p>
            ) : (
              availablePersonas.map((persona) => (
                <AgentCheckbox
                  key={persona.id}
                  persona={persona}
                  checked={selectedPersonaIds.includes(persona.id)}
                  onCheckedChange={(checked) => handleCheckChange(persona.id, checked)}
                  disabled={isDebateActive}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default AgentPanel;
