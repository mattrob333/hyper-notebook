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
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';

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

// Custom node styling to match NotebookLM
const CustomNode = memo(({ data }: NodeProps) => {
  const isRoot = data.isRoot as boolean;
  const level = (data.level as number) || 0;
  const hasChildren = data.hasChildren as boolean;
  
  // Color scheme based on level (NotebookLM-like teal/cyan theme)
  const getNodeStyle = () => {
    if (isRoot) {
      return 'bg-[#2d4a4a] text-white border-2 border-[#3d6a6a]';
    }
    if (level === 1) {
      return 'bg-[#1e3a3a] text-[#5fd4d4] border border-[#3d5a5a]';
    }
    return 'bg-[#1a2f2f] text-[#4dbdbd] border border-[#2d4545]';
  };
  
  return (
    <div
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg
        ${getNodeStyle()}
      `}
      style={{ 
        fontSize: isRoot ? '14px' : '12px',
        maxWidth: isRoot ? '300px' : '220px',
        minWidth: isRoot ? '180px' : '120px',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <div className="flex items-center gap-2">
        <span className="block whitespace-normal leading-tight flex-1">{String(data.label)}</span>
        {hasChildren && (
          <ChevronRight className="w-3 h-3 text-current opacity-60 shrink-0" />
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

// Custom bezier edge with NotebookLM-like styling
const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      style={{
        stroke: '#3d6a6a',
        strokeWidth: 2,
        fill: 'none',
        ...style,
      }}
    />
  );
});

CustomEdge.displayName = 'CustomEdge';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
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
    const hasChildren = node.children && node.children.length > 0;
    
    nodes.push({
      id: node.id,
      type: 'custom',
      position: { x, y: yCenter },
      data: { 
        label: node.label,
        isRoot: level === 0,
        level,
        hasChildren,
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
          type: 'custom',
          style: { 
            stroke: '#3d6a6a',
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
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          attributionPosition="bottom-right"
          proOptions={{ hideAttribution: true }}
          style={{ background: '#1a1f1f' }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          defaultEdgeOptions={{
            type: 'custom',
            style: { stroke: '#3d6a6a', strokeWidth: 2 },
          }}
        >
          <Controls 
            position="bottom-right"
            className="!bg-[#2d4a4a] !border-[#3d6a6a] !rounded-lg !shadow-lg [&>button]:!bg-[#2d4a4a] [&>button]:!border-[#3d6a6a] [&>button]:!text-[#5fd4d4] [&>button:hover]:!bg-[#3d5a5a]"
          />
        </ReactFlow>
      </div>
      
      <div className="px-4 py-3 flex items-center gap-2 border-t border-[#3a3f47]">
        <Button 
          variant="outline" 
          size="sm"
          className="bg-transparent border-[#4a5058] text-[#9ca3af]"
          data-testid="button-good-content"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Good content
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-transparent border-[#4a5058] text-[#9ca3af]"
          data-testid="button-bad-content"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          Bad content
        </Button>
      </div>
    </div>
  );
}
