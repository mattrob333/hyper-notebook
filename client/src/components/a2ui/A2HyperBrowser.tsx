import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Code, Eye, CheckCircle2, XCircle, Globe, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

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

interface A2HyperBrowserProps {
  workflowId?: string;
  prefilledVariables?: Record<string, any>;
  onOutput?: (output: WorkflowOutput) => void;
  onClose?: () => void;
}

export default function A2HyperBrowser({ 
  workflowId: initialWorkflowId, 
  prefilledVariables = {},
  onOutput,
  onClose 
}: A2HyperBrowserProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(initialWorkflowId || '');
  const [variables, setVariables] = useState<Record<string, any>>(prefilledVariables);
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'output'>('config');
  const [previewCode, setPreviewCode] = useState('');
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);

  // Fetch available workflows
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
        defaults[v.name] = prefilledVariables[v.name] ?? v.default ?? '';
      });
      setVariables(defaults);
    }
  }, [selectedWorkflowId, selectedWorkflow]);

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
      setActiveTab('output');
      if (data.output) {
        onOutput?.(data.output);
      }
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
      setActiveTab('code');
    }
  });

  const handleVariableChange = (name: string, value: any) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };

  const renderVariableInput = (variable: WorkflowVariable) => {
    const value = variables[variable.name] ?? '';

    switch (variable.type) {
      case 'enum':
        return (
          <Select
            value={String(value)}
            onValueChange={(v) => handleVariableChange(variable.name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${variable.name}`} />
            </SelectTrigger>
            <SelectContent>
              {variable.values?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleVariableChange(variable.name, parseInt(e.target.value) || 0)}
            placeholder={variable.placeholder}
          />
        );

      case 'array':
        return (
          <Input
            value={Array.isArray(value) ? value.join(', ') : value}
            onChange={(e) => handleVariableChange(variable.name, e.target.value.split(',').map(s => s.trim()))}
            placeholder={variable.placeholder || 'Enter values separated by commas'}
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
            placeholder={variable.placeholder}
          />
        );
    }
  };

  const renderOutput = () => {
    if (!execution) return null;

    if (execution.status === 'running') {
      return (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Running workflow...</p>
          <div className="w-full max-h-40 overflow-auto bg-muted/50 rounded-lg p-3 font-mono text-xs">
            {execution.logs.map((log, i) => (
              <div key={i} className="text-muted-foreground">{log}</div>
            ))}
          </div>
        </div>
      );
    }

    if (execution.status === 'failed') {
      return (
        <div className="flex flex-col items-center py-8 gap-4">
          <XCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{execution.error}</p>
          <ScrollArea className="w-full h-40 bg-muted/50 rounded-lg p-3 font-mono text-xs">
            {execution.logs.map((log, i) => (
              <div key={i} className="text-muted-foreground">{log}</div>
            ))}
          </ScrollArea>
        </div>
      );
    }

    if (execution.status === 'completed' && execution.output) {
      const output = execution.output;

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Workflow completed</span>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b">
              <h4 className="font-medium">{output.title}</h4>
              <Badge variant="outline" className="mt-1">{output.type}</Badge>
            </div>

            <ScrollArea className="max-h-[400px]">
              {output.type === 'table' && Array.isArray(output.data) ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {output.columns?.map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {output.data.map((row: any, i: number) => (
                      <tr key={i} className="border-t hover:bg-muted/30">
                        {output.columns?.map(col => (
                          <td key={col} className="px-3 py-2 max-w-[200px] truncate">
                            {typeof row[col] === 'string' && row[col].startsWith('http') ? (
                              <a href={row[col]} target="_blank" rel="noopener" className="text-primary hover:underline">
                                {row[col].slice(0, 40)}...
                              </a>
                            ) : (
                              String(row[col] ?? '')
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : output.type === 'markdown' ? (
                <div className="p-4 prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {output.data}
                </div>
              ) : (
                <pre className="p-4 text-xs overflow-auto">
                  {JSON.stringify(output.data, null, 2)}
                </pre>
              )}
            </ScrollArea>
          </div>

          {/* Logs */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">View logs ({execution.logs.length})</summary>
            <ScrollArea className="mt-2 h-32 bg-muted/50 rounded-lg p-2 font-mono">
              {execution.logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </ScrollArea>
          </details>
        </div>
      );
    }

    return null;
  };

  if (!isConfigured) {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            HyperBrowser Not Configured
          </CardTitle>
          <CardDescription>
            Add your HYPERBROWSER_API_KEY to the .env file to enable browser automation workflows.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <CardTitle>HyperBrowser Workflow</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          )}
        </div>
        <CardDescription>
          Run automated browser workflows to scrape data and gather research
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Workflow selector */}
        <div className="space-y-2">
          <Label>Select Workflow</Label>
          <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a workflow..." />
            </SelectTrigger>
            <SelectContent>
              {workflows.map(w => (
                <SelectItem key={w.id} value={w.id}>
                  <span className="flex items-center gap-2">
                    <span>{w.icon}</span>
                    <span>{w.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedWorkflow && (
          <>
            <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="config">Configure</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-4 mt-4">
                {selectedWorkflow.variables.map(variable => (
                  <div key={variable.name} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {variable.name}
                      {variable.required && <span className="text-destructive">*</span>}
                    </Label>
                    {variable.description && (
                      <p className="text-xs text-muted-foreground">{variable.description}</p>
                    )}
                    {renderVariableInput(variable)}
                  </div>
                ))}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => executeMutation.mutate()}
                    disabled={executeMutation.isPending}
                    className="flex-1"
                  >
                    {executeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Run Workflow
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => previewMutation.mutate()}
                    disabled={previewMutation.isPending}
                  >
                    {previewMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="code" className="mt-4">
                <div className="relative">
                  <pre className="bg-muted rounded-lg p-4 text-xs overflow-auto max-h-[400px] font-mono">
                    {previewCode || '// Click the preview button to see the generated code'}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => navigator.clipboard.writeText(previewCode)}
                  >
                    <Code className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="output" className="mt-4">
                {renderOutput()}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
