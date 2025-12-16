import { useCallback, useMemo, memo } from 'react';
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
  highlight?: boolean;
}

interface MindmapViewProps {
  title?: string;
  data: MindmapNode | { nodes: Node[]; edges: Edge[] };
  sourceCount?: number;
}

const CustomNode = memo(({ data }: NodeProps) => {
  const isRoot = data.isRoot;
  const isHighlight = data.highlight;
  
  return (
    <div
      className={`
        px-4 py-2.5 rounded-md text-sm font-medium transition-all
        ${isRoot 
          ? 'bg-[#3a3f47] text-white border border-[#4a5058] min-w-[200px]' 
          : isHighlight
            ? 'bg-emerald-600/90 text-white border border-emerald-500 min-w-[150px]'
            : 'bg-[#3a3f47] text-white/90 border border-[#4a5058] min-w-[140px]'
        }
      `}
      style={{ 
        fontSize: isRoot ? '13px' : '12px',
        maxWidth: '280px',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-[#4a5058] !border-0 !w-1.5 !h-1.5"
      />
      <span className="block text-center whitespace-normal leading-tight">{String(data.label)}</span>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-[#4a5058] !border-0 !w-1.5 !h-1.5"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

function buildNodesAndEdges(root: MindmapNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const levelHeights: { [level: number]: number } = {};

  function calculateNodeHeight(node: MindmapNode): number {
    if (!node.children || node.children.length === 0) {
      return 60;
    }
    let totalHeight = 0;
    node.children.forEach(child => {
      totalHeight += calculateNodeHeight(child);
    });
    return Math.max(totalHeight, 60);
  }

  function traverse(node: MindmapNode, x: number, yStart: number, yEnd: number, level: number) {
    const yCenter = (yStart + yEnd) / 2;
    
    nodes.push({
      id: node.id,
      type: 'custom',
      position: { x, y: yCenter },
      data: { 
        label: node.label,
        isRoot: level === 0,
        highlight: node.highlight || false,
      },
    });

    if (node.children && node.children.length > 0) {
      const totalHeight = yEnd - yStart;
      const childHeights = node.children.map(child => calculateNodeHeight(child));
      const totalChildHeight = childHeights.reduce((a, b) => a + b, 0);
      const scale = totalHeight / totalChildHeight;
      
      let currentY = yStart;
      node.children.forEach((child, idx) => {
        const childHeight = childHeights[idx] * scale;
        const childYEnd = currentY + childHeight;
        
        edges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: 'smoothstep',
          style: { 
            stroke: '#5a6068',
            strokeWidth: 2,
          },
        });
        
        traverse(child, x + 220, currentY, childYEnd, level + 1);
        currentY = childYEnd;
      });
    }
  }

  const totalTreeHeight = calculateNodeHeight(root);
  const viewHeight = Math.max(totalTreeHeight * 1.2, 400);
  traverse(root, 50, 0, viewHeight, 0);
  
  return { nodes, edges };
}

export default function MindmapView({ title, data, sourceCount }: MindmapViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if ('nodes' in data && 'edges' in data) {
      return { nodes: data.nodes, edges: data.edges };
    }
    return buildNodesAndEdges(data as MindmapNode);
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#2a2d32] rounded-lg overflow-hidden"
      data-testid="mindmap-view"
    >
      {title && (
        <div className="px-5 py-4">
          <h3 className="text-white font-medium text-base">{title}</h3>
          {sourceCount !== undefined && (
            <p className="text-[#9ca3af] text-sm mt-0.5">
              Based on {sourceCount} source{sourceCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
      
      <div className="flex-1 relative min-h-[400px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
          proOptions={{ hideAttribution: true }}
          style={{ background: '#2a2d32' }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { stroke: '#5a6068', strokeWidth: 2 },
          }}
        >
          <Controls 
            position="bottom-right"
            className="!bg-[#3a3f47] !border-[#4a5058] !rounded-lg !shadow-lg [&>button]:!bg-[#3a3f47] [&>button]:!border-[#4a5058] [&>button]:!text-white [&>button:hover]:!bg-[#4a5058]"
          />
        </ReactFlow>
      </div>
      
      <div className="px-4 py-3 flex items-center gap-2 border-t border-[#3a3f47]">
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 px-3 bg-transparent border-[#4a5058] text-[#9ca3af] hover:text-white hover:bg-[#3a3f47] text-xs gap-1.5"
          data-testid="button-good-content"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Good content
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 px-3 bg-transparent border-[#4a5058] text-[#9ca3af] hover:text-white hover:bg-[#3a3f47] text-xs gap-1.5"
          data-testid="button-bad-content"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          Bad content
        </Button>
      </div>
    </div>
  );
}
