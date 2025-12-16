import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Play, 
  Trash2, 
  GripVertical,
  Globe,
  FileText,
  Sparkles,
  LayoutGrid,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Workflow, WorkflowStep } from "@/lib/types";

interface WorkflowStudioProps {
  workflows: Workflow[];
  onSaveWorkflow: (workflow: Workflow) => void;
  onDeleteWorkflow: (id: string) => void;
  onRunWorkflow: (workflow: Workflow) => void;
}

const actionIcons: Record<WorkflowStep['action'], React.ReactNode> = {
  navigate: <Globe className="w-4 h-4" />,
  click: <LayoutGrid className="w-4 h-4" />,
  type: <FileText className="w-4 h-4" />,
  scrape: <Globe className="w-4 h-4" />,
  screenshot: <LayoutGrid className="w-4 h-4" />,
  wait: <LayoutGrid className="w-4 h-4" />,
  extract: <Sparkles className="w-4 h-4" />,
  summarize: <FileText className="w-4 h-4" />,
};

const actionLabels: Record<WorkflowStep['action'], string> = {
  navigate: 'Navigate',
  click: 'Click',
  type: 'Type',
  scrape: 'Scrape',
  screenshot: 'Screenshot',
  wait: 'Wait',
  extract: 'Extract',
  summarize: 'Summarize',
};

export default function WorkflowStudio({ 
  workflows, 
  onSaveWorkflow, 
  onDeleteWorkflow,
  onRunWorkflow 
}: WorkflowStudioProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    steps: [] as WorkflowStep[],
  });

  const addStep = (action: WorkflowStep['action']) => {
    setNewWorkflow({
      ...newWorkflow,
      steps: [
        ...newWorkflow.steps,
        { id: Date.now().toString(), action, params: {} },
      ],
    });
  };

  const removeStep = (stepId: string) => {
    setNewWorkflow({
      ...newWorkflow,
      steps: newWorkflow.steps.filter(s => s.id !== stepId),
    });
  };

  const handleSave = () => {
    if (newWorkflow.name && newWorkflow.steps.length > 0) {
      const workflow: Workflow = {
        id: Date.now().toString(),
        name: newWorkflow.name,
        description: newWorkflow.description || null,
        steps: newWorkflow.steps,
        isActive: false,
        createdAt: new Date(),
      };
      onSaveWorkflow(workflow);
      setNewWorkflow({ name: '', description: '', steps: [] });
      setDialogOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="workflow-studio">
      <div className="p-4 border-b">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" data-testid="button-create-workflow">
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Name</Label>
                <Input
                  id="workflow-name"
                  placeholder="e.g., Competitor Analysis"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  data-testid="input-workflow-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-desc">Description</Label>
                <Textarea
                  id="workflow-desc"
                  placeholder="What does this workflow do?"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  data-testid="input-workflow-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Steps</Label>
                <div className="space-y-2">
                  {newWorkflow.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2 p-2 border rounded-md">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="secondary" className="shrink-0">
                        {idx + 1}
                      </Badge>
                      {actionIcons[step.action]}
                      <span className="text-sm flex-1">{actionLabels[step.action]}</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeStep(step.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Select onValueChange={(v) => addStep(v as WorkflowStep['action'])}>
                  <SelectTrigger data-testid="select-add-step">
                    <SelectValue placeholder="Add a step..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="navigate">Navigate to URL</SelectItem>
                    <SelectItem value="click">Click Element</SelectItem>
                    <SelectItem value="type">Type Text</SelectItem>
                    <SelectItem value="scrape">Scrape Content</SelectItem>
                    <SelectItem value="screenshot">Take Screenshot</SelectItem>
                    <SelectItem value="wait">Wait</SelectItem>
                    <SelectItem value="extract">Extract Data</SelectItem>
                    <SelectItem value="summarize">Summarize</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!newWorkflow.name || newWorkflow.steps.length === 0}
                data-testid="button-save-workflow"
              >
                Save Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {workflows.length === 0 ? (
            <div className="p-8 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No workflows yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create reusable multi-step workflows
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-1">
              {workflows.map((workflow) => (
                <AccordionItem 
                  key={workflow.id} 
                  value={workflow.id}
                  className="border rounded-md px-3"
                  data-testid={`workflow-item-${workflow.id}`}
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <span className="font-medium text-sm">{workflow.name}</span>
                      <Badge variant="secondary">
                        {(workflow.steps || []).length} step{(workflow.steps || []).length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <p className="text-xs text-muted-foreground mb-3">
                      {workflow.description}
                    </p>
                    <div className="space-y-2 mb-3">
                      {(workflow.steps || []).map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="shrink-0">
                            {idx + 1}
                          </Badge>
                          {actionIcons[step.action]}
                          <span>{actionLabels[step.action]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => onRunWorkflow(workflow)}
                        data-testid={`button-run-workflow-${workflow.id}`}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Run
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => onDeleteWorkflow(workflow.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
