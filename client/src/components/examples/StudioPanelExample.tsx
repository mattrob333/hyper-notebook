import { useState } from "react";
import StudioPanel from "../panels/StudioPanel";
import type { Workflow } from "@/lib/types";

export default function StudioPanelExample() {
  // todo: remove mock functionality
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Competitor Analysis',
      description: 'Scrape competitor websites and generate comparison report',
      steps: [
        { id: 's1', action: 'scrape', params: { urls: ['https://competitor.com'] } },
        { id: 's2', action: 'summarize', params: {} },
        { id: 's3', action: 'generate_ui', params: { type: 'datatable' } },
      ],
    },
    {
      id: '2',
      name: 'Research Summary',
      description: 'Summarize research papers and create mindmap',
      steps: [
        { id: 's1', action: 'summarize', params: {} },
        { id: 's2', action: 'generate_mindmap', params: {} },
      ],
    },
  ]);

  const [reports] = useState([
    { id: '1', name: 'Q4 Competitor Report', type: 'comparison' as const, createdAt: new Date() },
    { id: '2', name: 'Market Analysis', type: 'analysis' as const, createdAt: new Date(Date.now() - 86400000) },
  ]);

  const [emails] = useState([
    { id: '1', to: 'team@company.com', subject: 'Weekly Report', status: 'sent' as const, sentAt: new Date() },
    { id: '2', to: 'client@example.com', subject: 'Analysis Results', status: 'draft' as const },
  ]);

  return (
    <div className="h-[600px]">
      <StudioPanel
        workflows={workflows}
        reports={reports}
        emails={emails}
        onSaveWorkflow={(wf) => setWorkflows([...workflows, wf])}
        onDeleteWorkflow={(id) => setWorkflows(workflows.filter(w => w.id !== id))}
        onRunWorkflow={(wf) => console.log('Running workflow:', wf.name)}
        onDeleteReport={(id) => console.log('Delete report:', id)}
        onDownloadReport={(id) => console.log('Download report:', id)}
        onSendEmail={(email) => console.log('Send email:', email)}
        onDeleteEmail={(id) => console.log('Delete email:', id)}
      />
    </div>
  );
}
