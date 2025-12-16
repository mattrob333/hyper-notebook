import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
}

interface MindmapViewProps {
  title?: string;
  data: MindmapNode;
}

function buildNodesAndEdges(root: MindmapNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function traverse(node: MindmapNode, x: number, y: number, level: number) {
    nodes.push({
      id: node.id,
      position: { x, y },
      data: { label: node.label },
      style: {
        background: level === 0 ? 'hsl(217, 91%, 60%)' : 'hsl(var(--card))',
        color: level === 0 ? 'white' : 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: level === 0 ? '14px' : '12px',
        fontWeight: level === 0 ? '600' : '500',
        minWidth: '120px',
        textAlign: 'center',
      },
    });

    if (node.children) {
      const childCount = node.children.length;
      const spacing = 180;
      const startY = y - ((childCount - 1) * spacing) / 2;

      node.children.forEach((child, idx) => {
        edges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: 'hsl(var(--border))' },
        });
        traverse(child, x + 280, startY + idx * spacing, level + 1);
      });
    }
  }

  traverse(root, 50, 250, 0);
  return { nodes, edges };
}

export default function MindmapView({ title, data }: MindmapViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildNodesAndEdges(data),
    [data]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <Card className="w-full" data-testid="mindmap-view">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="h-[500px] w-full rounded-b-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            attributionPosition="bottom-right"
          >
            <Background gap={16} size={1} />
            <Controls position="bottom-right" />
            <MiniMap 
              style={{ 
                background: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '4px',
              }}
              nodeColor="hsl(var(--primary))"
            />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}
