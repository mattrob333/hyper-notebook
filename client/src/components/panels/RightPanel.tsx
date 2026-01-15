/**
 * RightPanel
 *
 * NextMethod right panel with collapsible sections:
 * - Agents: Persona selection for debates
 * - Tools: Available tools and triggers
 * - Tasks: Active running tasks and workflows
 *
 * This panel can work alongside or replace StudioPanel based on mode.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Wrench,
  ListTodo,
  Search,
  Globe,
  Mail,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useNextMethodStore, selectRunningTasks, selectActiveTasks } from '@/lib/store';
import { AgentPanel } from '@/components/agents';

interface RightPanelProps {
  className?: string;
}

// Available tools/triggers
const AVAILABLE_TOOLS = [
  { id: 'web_search', name: 'Web Search', icon: Search, description: 'Search the web for information' },
  { id: 'web_fetch', name: 'Web Fetch', icon: Globe, description: 'Fetch content from URLs' },
  { id: 'send_email', name: 'Send Email', icon: Mail, description: 'Send emails via Resend' },
  { id: 'open_tiptap', name: 'Open Editor', icon: FileText, description: 'Open TipTap document editor' },
];

export function RightPanel({ className }: RightPanelProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(true);

  const activeTasks = useNextMethodStore(selectActiveTasks);
  const runningTasks = useNextMethodStore(selectRunningTasks);
  const updateTask = useNextMethodStore((state) => state.updateTask);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-sidebar', className)}>
      {/* Header */}
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-4">
        <h2 className="font-semibold">NextMethod</h2>
        {runningTasks.length > 0 && (
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/50">
            {runningTasks.length} running
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Agents Section */}
          <AgentPanel defaultOpen={true} />

          {/* Tools Section */}
          <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center justify-between w-full p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  {toolsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Wrench className="h-4 w-4" />
                  <span className="font-medium">Tools</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {AVAILABLE_TOOLS.length} available
                </span>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-2 px-2">
              <div className="grid grid-cols-2 gap-2 pt-2">
                {AVAILABLE_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">{tool.name}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Tasks Section */}
          <Collapsible open={tasksOpen} onOpenChange={setTasksOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center justify-between w-full p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  {tasksOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <ListTodo className="h-4 w-4" />
                  <span className="font-medium">Tasks</span>
                </div>
                {activeTasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {activeTasks.length} active
                  </span>
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="px-2">
              <div className="space-y-2 pt-2">
                {activeTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active tasks. Tasks appear here when subagents or workflows run.
                  </p>
                ) : (
                  activeTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'p-3 rounded-lg border',
                        task.status === 'running' && 'border-blue-500/30 bg-blue-500/5',
                        task.status === 'completed' && 'border-green-500/30 bg-green-500/5',
                        task.status === 'failed' && 'border-red-500/30 bg-red-500/5',
                        task.status === 'pending' && 'border-yellow-500/30 bg-yellow-500/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{task.name}</span>
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] px-1.5', getStatusColor(task.status))}
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {task.description}
                          </p>
                          {task.status === 'running' && (
                            <Progress value={task.progress} className="h-1 mt-2" />
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Started {formatTimeAgo(task.startedAt)}
                          </p>
                        </div>
                        {task.status === 'running' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => updateTask(task.id, { status: 'pending' })}
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {task.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => updateTask(task.id, { status: 'running' })}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default RightPanel;
