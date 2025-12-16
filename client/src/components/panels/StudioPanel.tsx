import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workflow, FileBarChart, Mail } from "lucide-react";
import WorkflowStudio from "../studio/WorkflowStudio";
import CustomReports from "../studio/CustomReports";
import EmailStudio from "../studio/EmailStudio";
import type { Workflow as WorkflowType } from "@/lib/types";

interface Report {
  id: string;
  name: string;
  type: 'analysis' | 'summary' | 'comparison';
  createdAt: Date;
}

interface Email {
  id: string;
  to: string;
  subject: string;
  status: 'draft' | 'sent' | 'failed';
  sentAt?: Date;
}

interface StudioPanelProps {
  workflows: WorkflowType[];
  reports: Report[];
  emails: Email[];
  onSaveWorkflow: (workflow: WorkflowType) => void;
  onDeleteWorkflow: (id: string) => void;
  onRunWorkflow: (workflow: WorkflowType) => void;
  onDeleteReport: (id: string) => void;
  onDownloadReport: (id: string) => void;
  onSendEmail: (email: Omit<Email, 'id' | 'status'>) => void;
  onDeleteEmail: (id: string) => void;
}

export default function StudioPanel({
  workflows,
  reports,
  emails,
  onSaveWorkflow,
  onDeleteWorkflow,
  onRunWorkflow,
  onDeleteReport,
  onDownloadReport,
  onSendEmail,
  onDeleteEmail,
}: StudioPanelProps) {
  return (
    <div className="w-80 border-l flex flex-col h-full bg-sidebar" data-testid="studio-panel">
      <div className="h-12 border-b flex items-center px-4 sticky top-0 bg-sidebar z-10">
        <h2 className="font-semibold text-sm">Studio</h2>
      </div>

      <Tabs defaultValue="workflows" className="flex-1 flex flex-col">
        <TabsList className="mx-2 mt-2 w-auto">
          <TabsTrigger value="workflows" className="flex-1 gap-1" data-testid="tab-workflows">
            <Workflow className="w-4 h-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 gap-1" data-testid="tab-reports">
            <FileBarChart className="w-4 h-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1 gap-1" data-testid="tab-email">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="flex-1 mt-0">
          <WorkflowStudio
            workflows={workflows}
            onSaveWorkflow={onSaveWorkflow}
            onDeleteWorkflow={onDeleteWorkflow}
            onRunWorkflow={onRunWorkflow}
          />
        </TabsContent>

        <TabsContent value="reports" className="flex-1 mt-0">
          <CustomReports
            reports={reports}
            onDeleteReport={onDeleteReport}
            onDownloadReport={onDownloadReport}
          />
        </TabsContent>

        <TabsContent value="email" className="flex-1 mt-0">
          <EmailStudio
            emails={emails}
            onSendEmail={onSendEmail}
            onDeleteEmail={onDeleteEmail}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
