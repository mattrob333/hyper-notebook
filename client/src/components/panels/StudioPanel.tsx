import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mic, 
  Video, 
  BrainCircuit, 
  FileBarChart, 
  Layers, 
  BarChart3, 
  Presentation,
  Mail,
  Pencil,
  FileText,
  MoreVertical,
  Plus,
  Trash2,
  Workflow,
  Globe,
  FileCode
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WorkflowStudio from "../studio/WorkflowStudio";
import EmailBuilder from "../studio/EmailBuilder";
import HyperBrowserBuilder from "../studio/HyperBrowserBuilder";
import AIContextFileGenerator from "../studio/AIContextFileGenerator";
import ReportsModal from "../studio/ReportsModal";
import type { Workflow as WorkflowType, Source } from "@/lib/types";

interface Report {
  id: string;
  name: string;
  type: 'analysis' | 'summary' | 'comparison';
  createdAt: Date;
}

interface StudioPanelProps {
  workflows: WorkflowType[];
  reports: Report[];
  sources: Source[];
  onSaveWorkflow: (workflow: WorkflowType) => void;
  onDeleteWorkflow: (id: string) => void;
  onRunWorkflow: (workflow: WorkflowType) => void;
  onDeleteReport: (id: string) => void;
  onDownloadReport: (id: string) => void;
  onOpenMindMap?: () => void;
  onOpenEmailBuilder?: () => void;
  onRunBrowserScript?: (script: string) => void;
}

interface StudioCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick?: () => void;
  testId?: string;
}

function StudioCard({ icon: Icon, title, onClick, testId }: StudioCardProps) {
  return (
    <Card 
      className="flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer hover-elevate transition-all gap-2 bg-card border-border/50 group"
      onClick={onClick}
      data-testid={testId}
    >
      <div className="flex items-center justify-between w-full">
        <Icon className="w-5 h-5 text-primary" />
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <span className="text-xs font-medium text-foreground self-start">{title}</span>
    </Card>
  );
}

type ActiveView = 'main' | 'email' | 'hyperbrowser' | 'context-file';

export default function StudioPanel({
  workflows,
  reports,
  sources,
  onSaveWorkflow,
  onDeleteWorkflow,
  onRunWorkflow,
  onDeleteReport,
  onDownloadReport,
  onOpenMindMap,
  onRunBrowserScript,
}: StudioPanelProps) {
  const [activeView, setActiveView] = useState<ActiveView>('main');
  const [reportsModalOpen, setReportsModalOpen] = useState(false);

  if (activeView === 'email') {
    return <EmailBuilder onBack={() => setActiveView('main')} />;
  }

  if (activeView === 'hyperbrowser') {
    return (
      <HyperBrowserBuilder 
        onBack={() => setActiveView('main')} 
        onRun={(script) => {
          onRunBrowserScript?.(script);
        }}
      />
    );
  }

  if (activeView === 'context-file') {
    return (
      <AIContextFileGenerator 
        onBack={() => setActiveView('main')} 
        sources={sources}
      />
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="studio-panel">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Studio</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Layers className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-4 gap-2">
          <StudioCard 
            icon={Mic} 
            title="Audio Overview" 
            testId="studio-card-audio"
          />
          <StudioCard 
            icon={Video} 
            title="Video Overview" 
            testId="studio-card-video"
          />
          <StudioCard 
            icon={BrainCircuit} 
            title="Mind Map" 
            onClick={onOpenMindMap}
            testId="studio-card-mindmap"
          />
          <StudioCard 
            icon={FileBarChart} 
            title="Reports" 
            onClick={() => setReportsModalOpen(true)}
            testId="studio-card-reports"
          />
          <StudioCard 
            icon={Globe} 
            title="Hyper Browser" 
            onClick={() => setActiveView('hyperbrowser')}
            testId="studio-card-hyperbrowser"
          />
          <StudioCard 
            icon={FileCode} 
            title="AI Context File" 
            onClick={() => setActiveView('context-file')}
            testId="studio-card-context-file"
          />
          <StudioCard 
            icon={BarChart3} 
            title="Infographic" 
            testId="studio-card-infographic"
          />
          <StudioCard 
            icon={Presentation} 
            title="Slide Deck" 
            testId="studio-card-slides"
          />
        </div>

        <div className="mt-3">
          <StudioCard 
            icon={Mail} 
            title="Email Builder" 
            onClick={() => setActiveView('email')}
            testId="studio-card-email"
          />
        </div>
      </div>

      <Tabs defaultValue="notes" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 rounded-xl bg-muted/50">
          <TabsTrigger value="notes" className="flex-1 gap-1 rounded-lg text-xs" data-testid="tab-notes">
            <FileText className="w-4 h-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex-1 gap-1 rounded-lg text-xs" data-testid="tab-workflows">
            <Workflow className="w-4 h-4" />
            Workflows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full px-2">
            <div className="px-2 space-y-2 py-4">
              {reports.map((report, index) => (
                <Card 
                  key={report.id} 
                  className="p-3 rounded-xl hover-elevate cursor-pointer bg-card"
                  data-testid={`report-item-${report.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{report.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Create Your Own · {index === 0 ? 10 : 7} sources · {formatTimeAgo(report.createdAt)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem 
                          className="rounded-lg"
                          onClick={() => onDownloadReport(report.id)}
                        >
                          <FileBarChart className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="rounded-lg text-destructive"
                          onClick={() => onDeleteReport(report.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
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

      <div className="p-4 border-t flex justify-center">
        <Button variant="outline" size="sm" className="rounded-full gap-2">
          <Plus className="w-4 h-4" />
          Add note
        </Button>
      </div>

      <ReportsModal
        open={reportsModalOpen}
        onOpenChange={setReportsModalOpen}
        onSelectReport={(reportType) => {
          console.log('Selected report type:', reportType);
        }}
      />
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
