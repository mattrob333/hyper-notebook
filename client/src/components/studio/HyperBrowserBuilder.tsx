import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Play, 
  Save, 
  Zap, 
  ChevronDown,
  Terminal,
  FileCode,
  Settings,
  RotateCcw,
  Minimize2,
  Pause,
  Square,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Download
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HyperBrowserBuilderProps {
  onBack: () => void;
  onRun?: (script: string) => void;
  onMinimize: () => void;
  onOutput?: (output: WorkflowOutput) => void;
}

interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'array' | 'boolean' | 'enum' | 'csv-column';
  required?: boolean;
  default?: any;
  values?: string[];
  description?: string;
  placeholder?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  variables: WorkflowVariable[];
  outputs: string[];
  code: string;
}

interface WorkflowOutput {
  type: 'table' | 'markdown' | 'json' | 'csv';
  title: string;
  data: any;
  columns?: string[];
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  variables: Record<string, any>;
  output?: WorkflowOutput;
  logs: string[];
  error?: string;
}

export default function HyperBrowserBuilder({ onBack, onRun, onMinimize, onOutput }: HyperBrowserBuilderProps) {
  const { toast } = useToast();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'config' | 'editor' | 'output'>('config');
  const [output, setOutput] = useState<string[]>([]);
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [previewCode, setPreviewCode] = useState('');
  const [browserUrl, setBrowserUrl] = useState('about:blank');
  const [showBrowser, setShowBrowser] = useState(false);

  // Fetch workflow templates from API
  const { data: workflowsData } = useQuery<{ workflows: WorkflowTemplate[]; configured: boolean }>({
    queryKey: ['/api/hyperbrowser/workflows'],
  });

  const workflows = workflowsData?.workflows || [];
  const isConfigured = workflowsData?.configured ?? false;
  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);

  // Initialize variables when workflow changes
  useEffect(() => {
    if (selectedWorkflow) {
      const defaults: Record<string, any> = {};
      selectedWorkflow.variables.forEach(v => {
        defaults[v.name] = v.default ?? '';
      });
      setVariables(defaults);
      setPreviewCode('');
      setExecution(null);
    }
  }, [selectedWorkflowId]);

  // Execute workflow mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/hyperbrowser/execute', {
        workflowId: selectedWorkflowId,
        variables
      });
      return response.json();
    },
    onSuccess: (data: WorkflowExecution) => {
      setExecution(data);
      setOutput(data.logs);
      setActiveTab('output');
      setShowBrowser(false);
      if (data.output) {
        onOutput?.(data.output);
        toast({ title: 'Workflow completed', description: data.output.title });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Workflow failed', description: error.message, variant: 'destructive' });
      setOutput(prev => [...prev, `Error: ${error.message}`]);
    }
  });

  // Preview code mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/hyperbrowser/preview-code', {
        workflowId: selectedWorkflowId,
        variables
      });
      return response.json();
    },
    onSuccess: (data: { code: string }) => {
      setPreviewCode(data.code);
      setActiveTab('editor');
    }
  });

  const handleWorkflowChange = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
  };

  const handleVariableChange = (name: string, value: any) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };

  const handleRun = () => {
    if (!selectedWorkflowId) {
      toast({ title: 'Select a workflow', variant: 'destructive' });
      return;
    }
    setShowBrowser(true);
    setBrowserUrl('Running workflow...');
    setOutput(['> Initializing HyperBrowser...', '> Connecting to browser instance...']);
    executeMutation.mutate();
    onRun?.(previewCode);
  };

  const isRunning = executeMutation.isPending;

  const handlePause = () => {
    setOutput(prev => [...prev, '> Script paused']);
  };

  const handleStop = () => {
    setShowBrowser(false);
    setOutput(prev => [...prev, '> Script stopped']);
  };

  const handleRefresh = () => {
    setOutput(prev => [...prev, '> Refreshing browser...']);
  };

  const handleMinimizeAndRun = () => {
    if (!isRunning) {
      handleRun();
    }
    onMinimize();
  };

  return (
    <div className="flex flex-col h-full" data-testid="hyperbrowser-builder">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-8 w-8"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Select value={selectedWorkflowId} onValueChange={handleWorkflowChange}>
            <SelectTrigger className="min-w-[280px] h-8 rounded-lg bg-amber-500/20 border-amber-500/30" data-testid="select-workflow">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id} className="rounded-lg">
                  <span className="flex items-center gap-2">
                    <span>{workflow.icon}</span>
                    <span>{workflow.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-lg gap-2"
            onClick={handleMinimizeAndRun}
            data-testid="button-minimize"
          >
            <Minimize2 className="w-4 h-4" />
            Run & Minimize
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg gap-2" data-testid="button-save-script">
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button 
            size="sm" 
            className="rounded-lg gap-2"
            onClick={handleRun}
            disabled={isRunning}
            data-testid="button-run-script"
          >
            <Play className="w-4 h-4" />
            Run
          </Button>
        </div>
      </div>

      {/* Main Content - Horizontal Split */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Workflow Configuration */}
        <div className="w-72 border-r border-border/50 flex flex-col shrink-0">
          <div className="p-3 border-b border-border/50">
            <h3 className="text-sm font-medium mb-1">Workflow Configuration</h3>
            {selectedWorkflow && (
              <p className="text-xs text-muted-foreground">{selectedWorkflow.description}</p>
            )}
          </div>
          <ScrollArea className="flex-1 p-3">
            {selectedWorkflow ? (
              <div className="space-y-4">
                {selectedWorkflow.variables.map((variable) => (
                  <div key={variable.name} className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      {variable.name}
                      {variable.required && <span className="text-destructive">*</span>}
                    </Label>
                    {variable.description && (
                      <p className="text-xs text-muted-foreground">{variable.description}</p>
                    )}
                    {variable.type === 'enum' ? (
                      <Select
                        value={String(variables[variable.name] || '')}
                        onValueChange={(v) => handleVariableChange(variable.name, v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={`Select ${variable.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {variable.values?.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : variable.type === 'number' ? (
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, parseInt(e.target.value) || 0)}
                        placeholder={variable.placeholder}
                      />
                    ) : variable.type === 'array' ? (
                      <Input
                        className="h-8 text-xs"
                        value={Array.isArray(variables[variable.name]) ? variables[variable.name].join(', ') : variables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value.split(',').map(s => s.trim()))}
                        placeholder={variable.placeholder || 'Values separated by commas'}
                      />
                    ) : (
                      <Input
                        className="h-8 text-xs"
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={variable.placeholder}
                      />
                    )}
                  </div>
                ))}
                
                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full gap-2"
                    onClick={handleRun}
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Run Workflow
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => previewMutation.mutate()}
                    disabled={previewMutation.isPending}
                  >
                    {previewMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    Preview Code
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm">Select a workflow above</p>
                <p className="text-xs mt-1">Choose from {workflows.length} available workflows</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Main Area - Browser on top, Code on bottom */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Browser Preview - Top (Landscape) */}
          <div className="flex-1 flex flex-col border-b border-border/50 min-h-0">
            {/* Browser Header */}
            <div className="flex items-center gap-2 p-2 border-b border-border/50 bg-muted/30 shrink-0">
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex items-center gap-1 px-2 py-1 bg-background/50 rounded text-xs text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate">{browserUrl}</span>
              </div>
            </div>

            {/* Browser Content */}
            <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center">
              {showBrowser ? (
                <div className="w-full h-full p-4">
                  <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="text-orange-500 text-4xl font-bold mb-2">Y</div>
                      <div className="text-gray-800 text-sm font-medium">Hacker News</div>
                      <div className="text-gray-500 text-xs mt-2">
                        {isRunning ? 'Extracting stories...' : 'Browser session active'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <Zap className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click Run to launch the browser
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your workflow will execute and appear here
                  </p>
                </div>
              )}
            </div>

            {/* Browser Controls */}
            <div className="p-2 border-t border-border/50 bg-muted/20 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {isRunning ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 gap-1 rounded-lg text-xs"
                        onClick={handlePause}
                      >
                        <Pause className="w-3 h-3" />
                        Pause
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 gap-1 rounded-lg text-xs"
                        onClick={handleStop}
                      >
                        <Square className="w-3 h-3" />
                        Stop
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      className="h-7 gap-1 rounded-lg text-xs"
                      onClick={handleRun}
                    >
                      <Play className="w-3 h-3" />
                      Run
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={handleRefresh}
                    disabled={!showBrowser}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  {showBrowser && (
                    <div className="text-xs text-muted-foreground">
                      {isRunning ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          Running
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Ready
                        </span>
                      )}
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 gap-1 rounded-lg text-xs"
                    onClick={onMinimize}
                    disabled={!showBrowser}
                  >
                    <Minimize2 className="w-3 h-3" />
                    Minimize
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Code Editor - Bottom */}
          <div className="h-[280px] flex flex-col shrink-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'output')} className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 shrink-0">
                <TabsList className="h-7 rounded-lg bg-muted/50">
                  <TabsTrigger value="editor" className="h-5 rounded-md text-xs gap-1 px-2">
                    <FileCode className="w-3 h-3" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="output" className="h-5 rounded-md text-xs gap-1 px-2">
                    <Terminal className="w-3 h-3" />
                    Output Logs
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
                <div className="h-full bg-[#1e1e1e] p-3 font-mono text-sm overflow-auto dark-scrollbar">
                  <textarea
                    value={previewCode}
                    onChange={(e) => setPreviewCode(e.target.value)}
                    className="w-full h-full bg-transparent text-[#d4d4d4] resize-none outline-none font-mono text-xs leading-relaxed dark-scrollbar"
                    spellCheck={false}
                    placeholder="Select a workflow and click Preview to see the generated code"
                    data-testid="textarea-script"
                  />
                </div>
              </TabsContent>

              <TabsContent value="output" className="flex-1 m-0 overflow-hidden">
                <div className="h-full bg-[#1e1e1e] p-3 font-mono text-xs dark-scrollbar overflow-auto">
                  {/* Logs */}
                  {output.map((line, i) => (
                    <div key={i} className="text-[#6a9955]">{line}</div>
                  ))}
                  {isRunning && (
                    <div className="text-amber-400 animate-pulse">Running...</div>
                  )}
                  {/* Scraped Content Output */}
                  {execution?.output?.data && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="text-cyan-400 mb-2 font-semibold">📄 Scraped Content:</div>
                      <div className="text-[#d4d4d4] whitespace-pre-wrap text-xs leading-relaxed max-h-[400px] overflow-auto">
                        {typeof execution.output.data === 'string' 
                          ? execution.output.data.slice(0, 5000) + (execution.output.data.length > 5000 ? '\n\n... (truncated)' : '')
                          : JSON.stringify(execution.output.data, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
