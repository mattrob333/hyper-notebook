import MindmapView from '../MindmapView';

export default function MindmapViewExample() {
  // todo: remove mock functionality
  const mindmapData = {
    id: 'root',
    label: 'AI Research Overview',
    children: [
      {
        id: 'llm',
        label: 'Large Language Models',
        children: [
          { id: 'gpt', label: 'GPT Series' },
          { id: 'claude', label: 'Claude' },
          { id: 'gemini', label: 'Gemini' },
        ],
      },
      {
        id: 'agents',
        label: 'AI Agents',
        children: [
          { id: 'workflow', label: 'Workflow Automation' },
          { id: 'web', label: 'Web Browsing' },
        ],
      },
      {
        id: 'multimodal',
        label: 'Multimodal AI',
        children: [
          { id: 'vision', label: 'Vision Models' },
          { id: 'audio', label: 'Audio Processing' },
        ],
      },
    ],
  };

  return <MindmapView title="Research Mindmap" data={mindmapData} />;
}
