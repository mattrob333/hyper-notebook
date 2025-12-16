import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Workflow, 
  FileBarChart, 
  AudioLines,
  Plus,
  Play,
  Sparkles,
  Clock,
  Download
} from "lucide-react";
import WorkflowStudio from "../studio/WorkflowStudio";
import type { Workflow as WorkflowType } from "@/lib/types";

interface Report {
  id: string;
  name: string;
  type: 'analysis' | 'summary' | 'comparison';
  createdAt: Date;
}

interface StudioPanelProps {
  workflows: WorkflowType[];
  reports: Report[];
  onSaveWorkflow: (workflow: WorkflowType) => void;
  onDeleteWorkflow: (id: string) => void;
  onRunWorkflow: (workflow: WorkflowType) => void;
  onDeleteReport: (id: string) => void;
  onDownloadReport: (id: string) => void;
}

export default function StudioPanel({
  workflows,
  reports,
  onSaveWorkflow,
  onDeleteWorkflow,
  onRunWorkflow,
  onDeleteReport,
  onDownloadReport,
}: StudioPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background" data-testid="studio-panel">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Studio</h2>
        </div>

        <Card className="p-4 rounded-2xl">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-1">AI-Executable PRD</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Based on {reports.length} sources
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="rounded-xl text-xs h-9">
                <FileBarChart className="w-4 h-4 mr-1" />
                View Report
              </Button>
              <Button variant="outline" className="rounded-xl text-xs h-9">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="flex-1 flex flex-col">
        <TabsList className="mx-4 rounded-xl bg-muted/50">
          <TabsTrigger value="reports" className="flex-1 gap-1 rounded-lg text-xs" data-testid="tab-reports">
            <FileBarChart className="w-4 h-4" />
            Report
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex-1 gap-1 rounded-lg text-xs" data-testid="tab-audio">
            <AudioLines className="w-4 h-4" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex-1 gap-1 rounded-lg text-xs" data-testid="tab-workflows">
            <Workflow className="w-4 h-4" />
            Workflows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileBarChart className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No reports yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generate reports from your sources
                  </p>
                </div>
              ) : (
                reports.map((report) => (
                  <Card 
                    key={report.id} 
                    className="p-3 rounded-xl hover-elevate cursor-pointer"
                    data-testid={`report-item-${report.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{report.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {report.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {report.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 shrink-0"
                        onClick={() => onDownloadReport(report.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="audio" className="flex-1 mt-0">
          <div className="p-4">
            <Card className="p-6 rounded-2xl text-center">
              <AudioLines className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <h4 className="font-medium mb-1">Audio Overview</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Generate an audio discussion of your sources
              </p>
              <Button className="rounded-xl">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Audio
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="flex-1 mt-0 overflow-hidden">
          <WorkflowStudio
            workflows={workflows}
            onSaveWorkflow={onSaveWorkflow}
            onDeleteWorkflow={onDeleteWorkflow}
            onRunWorkflow={onRunWorkflow}
          />
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-xs justify-start gap-2">
            <span className="text-lg">Save to note</span>
          </Button>
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="text-lg">{"📎"}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="text-lg">{"❤️"}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="text-lg">{"📤"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
