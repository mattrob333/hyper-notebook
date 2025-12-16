import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Loader2,
  Globe,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BrowserAgentMonitorProps {
  isVisible: boolean;
  onDismiss: () => void;
  currentUrl?: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentStep?: string;
  stepNumber?: number;
  totalSteps?: number;
  logs?: string[];
}

export default function BrowserAgentMonitor({
  isVisible,
  onDismiss,
  currentUrl = 'about:blank',
  status,
  currentStep,
  stepNumber = 0,
  totalSteps = 0,
  logs = []
}: BrowserAgentMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const statusConfig: Record<typeof status, { icon: typeof Globe; color: string; bg: string; label: string; animate?: boolean }> = {
    idle: { icon: Globe, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Idle' },
    running: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10', label: 'Running', animate: true },
    paused: { icon: Pause, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Paused' },
    completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Completed' },
    error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Error' },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: 20 }}
          transition={{ duration: 0.2 }}
          className={`fixed z-50 ${
            isExpanded 
              ? 'top-4 right-4 bottom-4 w-[600px]' 
              : 'top-4 right-4 w-[400px]'
          }`}
          data-testid="browser-agent-monitor"
        >
          <Card className={`h-full flex flex-col rounded-2xl overflow-hidden shadow-xl border-2 ${
            status === 'running' ? 'border-primary/50' : 'border-border'
          }`}>
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${config.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Browser Agent</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {currentStep || config.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {totalSteps > 0 && (
                  <Badge variant="secondary" className="mr-2">
                    Step {stepNumber}/{totalSteps}
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setIsExpanded(!isExpanded)}
                  data-testid="button-expand-browser"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={onDismiss}
                  data-testid="button-dismiss-browser"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs">
                <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate text-muted-foreground">{currentUrl}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 shrink-0"
                data-testid="button-open-url"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>

            <div className={`flex-1 bg-muted/30 relative ${isExpanded ? 'min-h-[400px]' : 'min-h-[200px]'}`}>
              {status === 'running' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <Globe className="absolute inset-0 m-auto w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Agent is browsing...</p>
                    <p className="text-xs text-muted-foreground mt-1">{currentStep}</p>
                  </div>
                </div>
              ) : status === 'completed' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="text-sm font-medium">Workflow Complete</p>
                    <p className="text-xs text-muted-foreground mt-1">All steps executed successfully</p>
                  </div>
                </div>
              ) : status === 'error' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
                    <p className="text-sm font-medium">Error Occurred</p>
                    <p className="text-xs text-muted-foreground mt-1">Check logs for details</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click Run to launch the browser</p>
                  </div>
                </div>
              )}
            </div>

            {isExpanded && logs.length > 0 && (
              <div className="border-t max-h-32 overflow-auto bg-background">
                <div className="p-2 space-y-1">
                  {logs.map((log, idx) => (
                    <p key={idx} className="text-xs font-mono text-muted-foreground">
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 border-t bg-muted/30">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg"
                  onClick={() => setShowLogs(!showLogs)}
                  data-testid="button-toggle-logs"
                >
                  {showLogs ? 'Hide Logs' : 'Show Logs'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {status === 'running' && (
                  <Button variant="outline" size="sm" className="rounded-lg" data-testid="button-pause-agent">
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                )}
                {status === 'paused' && (
                  <Button size="sm" className="rounded-lg" data-testid="button-resume-agent">
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                )}
                {(status === 'completed' || status === 'error') && (
                  <Button variant="outline" size="sm" className="rounded-lg" data-testid="button-rerun-agent">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Run Again
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
