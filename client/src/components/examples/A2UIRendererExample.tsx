import A2UIRenderer from "../a2ui/A2UIRenderer";
import type { A2UIComponent } from "@/lib/types";

export default function A2UIRendererExample() {
  // todo: remove mock functionality
  const mockComponents: A2UIComponent[] = [
    {
      id: '1',
      type: 'card',
      properties: {
        title: 'Competitor Analysis Results',
        description: 'Based on scraping 3 competitor websites',
        content: 'Found 15 key differentiators across pricing, features, and positioning.',
        actions: [
          { label: 'View Details', variant: 'default' },
          { label: 'Export', variant: 'outline' },
        ],
      },
    },
    {
      id: '2',
      type: 'datatable',
      properties: {
        title: 'Feature Comparison',
        columns: [
          { key: 'feature', label: 'Feature' },
          { key: 'us', label: 'Us' },
          { key: 'compA', label: 'Competitor A' },
          { key: 'compB', label: 'Competitor B' },
        ],
        rows: [
          { feature: 'AI Chat', us: 'Yes', compA: 'Yes', compB: 'No' },
          { feature: 'Workflow Automation', us: 'Yes', compA: 'Limited', compB: 'Yes' },
          { feature: 'Real-time Sync', us: 'Yes', compA: 'No', compB: 'Yes' },
        ],
      },
    },
  ];

  return <A2UIRenderer uiStream={mockComponents} />;
}
