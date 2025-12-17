import { motion } from "framer-motion";
import { useState, useCallback, useMemo } from "react";
import type { A2UIComponent } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
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
import { ExternalLink, Circle, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface A2UIRendererProps {
  components: A2UIComponent[];
  onAction?: (action: string, data?: any) => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.15 },
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function A2Card({ 
  title, 
  description, 
  content, 
  actions, 
  children,
  onAction
}: { 
  title?: string; 
  description?: string; 
  content?: string; 
  actions?: Array<{ label: string; variant?: 'default' | 'secondary' | 'outline'; action?: string; onClick?: () => void }>;
  children?: React.ReactNode;
  onAction?: (action: string, data?: any) => void;
}) {
  return (
    <Card className="w-full" data-testid="a2ui-card">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {content && <p className="text-sm">{content}</p>}
        {children}
      </CardContent>
      {actions && actions.length > 0 && (
        <CardFooter className="gap-2 flex-wrap">
          {actions.map((actionItem, idx) => (
            <Button
              key={idx}
              variant={actionItem.variant || 'default'}
              size="sm"
              onClick={() => {
                if (actionItem.onClick) {
                  actionItem.onClick();
                } else if (actionItem.action && onAction) {
                  onAction(actionItem.action, { label: actionItem.label });
                }
              }}
              data-testid={`a2ui-card-action-${idx}`}
            >
              {actionItem.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}

function A2Chart({ 
  chartType = 'line', 
  data = [], 
  xKey = 'name', 
  yKey = 'value',
  title,
  dataKeys = []
}: { 
  chartType?: 'line' | 'bar' | 'pie'; 
  data?: any[]; 
  xKey?: string; 
  yKey?: string;
  title?: string;
  dataKeys?: string[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-muted-foreground" data-testid="a2ui-chart-empty">
        No chart data available
      </div>
    );
  }

  const keys = dataKeys.length > 0 ? dataKeys : [yKey];

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {keys.map((key, idx) => (
                <Bar key={key} dataKey={key} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {keys.map((key, idx) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="w-full" data-testid="a2ui-chart">
      {title && <h4 className="text-sm font-medium mb-4">{title}</h4>}
      {renderChart()}
    </div>
  );
}

function A2Table({ 
  headers = [], 
  rows = [],
  title
}: { 
  headers?: string[]; 
  rows?: (string | number)[][];
  title?: string;
}) {
  if (!headers.length || !rows.length) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground" data-testid="a2ui-table-empty">
        No table data available
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="a2ui-table">
      {title && <h4 className="text-sm font-medium mb-3">{title}</h4>}
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, idx) => (
              <TableHead key={idx}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIdx) => (
            <TableRow key={rowIdx} data-testid={`a2ui-table-row-${rowIdx}`}>
              {row.map((cell, cellIdx) => (
                <TableCell key={cellIdx}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function A2List({ 
  items = [], 
  ordered = false,
  title
}: { 
  items?: string[]; 
  ordered?: boolean;
  title?: string;
}) {
  if (!items.length) {
    return null;
  }

  const ListTag = ordered ? 'ol' : 'ul';
  const listClass = ordered 
    ? "list-decimal list-inside space-y-2 text-sm" 
    : "list-disc list-inside space-y-2 text-sm";

  return (
    <div className="w-full" data-testid="a2ui-list">
      {title && <h4 className="text-sm font-medium mb-3">{title}</h4>}
      <ListTag className={listClass}>
        {items.map((item, idx) => (
          <li key={idx} data-testid={`a2ui-list-item-${idx}`}>{item}</li>
        ))}
      </ListTag>
    </div>
  );
}

function A2Code({ 
  code = '', 
  language = 'text',
  title
}: { 
  code?: string; 
  language?: string;
  title?: string;
}) {
  return (
    <div className="w-full" data-testid="a2ui-code">
      {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}
      <div className="relative">
        {language && (
          <span className="absolute top-2 right-2 text-xs text-muted-foreground">
            {language}
          </span>
        )}
        <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm font-mono">
          <code>{code || 'No code provided'}</code>
        </pre>
      </div>
    </div>
  );
}

function A2Quote({ 
  text = '', 
  author,
  source
}: { 
  text?: string; 
  author?: string;
  source?: string;
}) {
  return (
    <blockquote 
      className="border-l-4 border-primary pl-4 py-2 italic text-muted-foreground"
      data-testid="a2ui-quote"
    >
      <p className="text-sm">{text || 'No quote provided'}</p>
      {(author || source) && (
        <footer className="mt-2 text-xs not-italic">
          {author && <span className="font-medium">{author}</span>}
          {author && source && <span> - </span>}
          {source && <span>{source}</span>}
        </footer>
      )}
    </blockquote>
  );
}

function A2Image({ 
  src = '', 
  alt = 'Image',
  caption
}: { 
  src?: string; 
  alt?: string;
  caption?: string;
}) {
  if (!src) {
    return (
      <div 
        className="w-full h-48 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground"
        data-testid="a2ui-image-placeholder"
      >
        No image source provided
      </div>
    );
  }

  return (
    <figure className="w-full" data-testid="a2ui-image">
      <img 
        src={src} 
        alt={alt} 
        className="w-full rounded-lg object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-center text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function A2Accordion({ 
  items = [],
  title
}: { 
  items?: Array<{ title: string; content: string }>;
  title?: string;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="w-full" data-testid="a2ui-accordion">
      {title && <h4 className="text-sm font-medium mb-3">{title}</h4>}
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, idx) => (
          <AccordionItem key={idx} value={`item-${idx}`}>
            <AccordionTrigger data-testid={`a2ui-accordion-trigger-${idx}`}>
              {item.title}
            </AccordionTrigger>
            <AccordionContent data-testid={`a2ui-accordion-content-${idx}`}>
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function A2Tabs({ 
  tabs = [],
  defaultTab
}: { 
  tabs?: Array<{ label: string; content: string; value?: string }>;
  defaultTab?: string;
}) {
  if (!tabs.length) {
    return null;
  }

  const defaultValue = defaultTab || tabs[0]?.value || 'tab-0';

  return (
    <Tabs defaultValue={defaultValue} className="w-full" data-testid="a2ui-tabs">
      <TabsList className="flex-wrap">
        {tabs.map((tab, idx) => (
          <TabsTrigger 
            key={idx} 
            value={tab.value || `tab-${idx}`}
            data-testid={`a2ui-tab-trigger-${idx}`}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, idx) => (
        <TabsContent 
          key={idx} 
          value={tab.value || `tab-${idx}`}
          data-testid={`a2ui-tab-content-${idx}`}
        >
          <div className="p-4 text-sm">{tab.content}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function A2Progress({ 
  value = 0, 
  label,
  showValue = true
}: { 
  value?: number; 
  label?: string;
  showValue?: boolean;
}) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full space-y-2" data-testid="a2ui-progress">
      {(label || showValue) && (
        <div className="flex justify-between items-center gap-2">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showValue && <span className="text-sm text-muted-foreground">{clampedValue}%</span>}
        </div>
      )}
      <Progress value={clampedValue} />
    </div>
  );
}

function A2Badge({ 
  text = '', 
  variant = 'default'
}: { 
  text?: string; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}) {
  return (
    <Badge variant={variant} data-testid="a2ui-badge">
      {text || 'Badge'}
    </Badge>
  );
}

function A2Button({ 
  label = 'Button', 
  variant = 'default',
  size = 'default',
  onClick
}: { 
  label?: string; 
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  onClick?: () => void;
}) {
  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={onClick}
      data-testid="a2ui-button"
    >
      {label}
    </Button>
  );
}

function A2Link({ 
  text = '', 
  href = '#',
  external = false
}: { 
  text?: string; 
  href?: string;
  external?: boolean;
}) {
  return (
    <a 
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="inline-flex items-center gap-1 text-primary hover:underline"
      data-testid="a2ui-link"
    >
      {text || href}
      {external && <ExternalLink className="w-3 h-3" />}
    </a>
  );
}

interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
}

function buildMindmapNodesAndEdges(root: MindmapNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function traverse(node: MindmapNode, x: number, y: number, level: number, nodeIndex: number) {
    const isRootNode = level === 0;
    nodes.push({
      id: node.id,
      position: { x, y },
      data: { label: node.label },
      style: {
        background: isRootNode ? '#059669' : '#3a3f47',
        color: '#ffffff',
        border: isRootNode ? '1px solid #10b981' : '1px solid #4a5058',
        borderRadius: '6px',
        padding: '10px 16px',
        fontSize: isRootNode ? '13px' : '12px',
        fontWeight: isRootNode ? '600' : '500',
        minWidth: isRootNode ? '180px' : '140px',
        textAlign: 'center',
      },
    });

    if (node.children && node.children.length > 0) {
      const childCount = node.children.length;
      const spacing = 100;
      const startY = y - ((childCount - 1) * spacing) / 2;

      node.children.forEach((child, idx) => {
        edges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: 'smoothstep',
          style: { stroke: '#5a6068', strokeWidth: 2 },
        });
        traverse(child, x + 220, startY + idx * spacing, level + 1, idx);
      });
    }
  }

  if (root) {
    traverse(root, 50, 200, 0, 0);
  }
  return { nodes, edges };
}

interface ReactFlowMindmapData {
  nodes: Array<{ id: string; label?: string; type?: string; [key: string]: any }>;
  edges: Array<{ source: string; target: string; id?: string; [key: string]: any }>;
  format: 'reactflow';
}

function A2Mindmap({ 
  data,
  title
}: { 
  data?: MindmapNode | ReactFlowMindmapData;
  title?: string;
}) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    
    // Check if it's React Flow format (has nodes and edges arrays with format marker)
    if ('format' in data && data.format === 'reactflow' && 'nodes' in data && 'edges' in data) {
      // Transform React Flow format nodes to proper Node objects with dark theme
      const nodes: Node[] = (data.nodes || []).map((node, idx) => {
        const isRootNode = node.isRoot || idx === 0;
        return {
          id: node.id || `node-${idx}`,
          type: 'default',
          position: node.position || { x: (idx % 4) * 220 + 50, y: Math.floor(idx / 4) * 100 + 50 },
          data: { 
            label: node.label || node.data?.label || node.id || 'Node' 
          },
          style: {
            background: isRootNode ? '#059669' : '#3a3f47',
            color: '#ffffff',
            border: isRootNode ? '1px solid #10b981' : '1px solid #4a5058',
            borderRadius: '6px',
            padding: '10px 16px',
            fontSize: isRootNode ? '13px' : '12px',
            fontWeight: isRootNode ? '600' : '500',
            minWidth: isRootNode ? '180px' : '140px',
            textAlign: 'center',
          },
        };
      });
      
      const edges: Edge[] = (data.edges || []).map((edge, idx) => ({
        id: edge.id || `edge-${idx}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        style: { stroke: '#5a6068', strokeWidth: 2 },
      }));
      
      return { nodes, edges };
    }
    
    // Otherwise treat as hierarchical MindmapNode format
    return buildMindmapNodesAndEdges(data as MindmapNode);
  }, [data]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!data || initialNodes.length === 0) {
    return (
      <div 
        className="w-full h-64 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg"
        data-testid="a2ui-mindmap-empty"
      >
        No mindmap data available
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="a2ui-mindmap">
      {title && (
        <div className="mb-3">
          <h4 className="text-white font-medium text-base">{title}</h4>
        </div>
      )}
      <div className="h-[500px] w-full rounded-lg overflow-hidden bg-[#2a2d32]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
    </div>
  );
}

interface TimelineEvent {
  title: string;
  description?: string;
  date?: string;
  status?: 'completed' | 'current' | 'pending' | 'error';
}

function A2Timeline({ 
  events = [],
  title
}: { 
  events?: TimelineEvent[];
  title?: string;
}) {
  if (!events.length) {
    return null;
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'current':
        return <Clock className="w-5 h-5 text-primary" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-full" data-testid="a2ui-timeline">
      {title && <h4 className="text-sm font-medium mb-4">{title}</h4>}
      <div className="relative space-y-4 pl-6 border-l-2 border-border">
        {events.map((event, idx) => (
          <div 
            key={idx} 
            className="relative pb-4"
            data-testid={`a2ui-timeline-event-${idx}`}
          >
            <div className="absolute -left-[25px] bg-background">
              {getStatusIcon(event.status)}
            </div>
            <div className="ml-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="font-medium text-sm">{event.title}</h5>
                {event.date && (
                  <span className="text-xs text-muted-foreground">{event.date}</span>
                )}
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Slide {
  title?: string;
  content: string;
  image?: string;
}

interface TranscriptSegment {
  text: string;
  timing?: string;
  speaker?: string;
}

function A2AudioTranscript({ 
  segments = [],
  title,
  audioUrl: initialAudioUrl
}: { 
  segments?: TranscriptSegment[];
  title?: string;
  audioUrl?: string;
}) {
  const [audioUrl, setAudioUrl] = useState<string | undefined>(initialAudioUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAudio = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Combine all segments into a script
      const script = segments
        .map(seg => `${seg.speaker || 'Speaker'}: ${seg.text}`)
        .join('\n\n');
      
      const response = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to generate audio');
      }
      
      const data = await response.json();
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!segments.length) {
    return null;
  }

  return (
    <div className="w-full space-y-4" data-testid="a2ui-audio-transcript">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      
      {/* Audio Player */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        {audioUrl ? (
          <audio controls className="w-full" src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={generateAudio}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Generating Audio...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Generate Audio
                </>
              )}
            </button>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {segments.map((segment, idx) => (
          <div 
            key={idx} 
            className="p-3 rounded-lg bg-muted/50 border border-border/50"
            data-testid={`a2ui-transcript-segment-${idx}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {segment.speaker && (
                <span className="font-medium text-sm text-primary">{segment.speaker}</span>
              )}
              {segment.timing && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {segment.timing}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed">{segment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function A2Slides({ 
  slides = [],
  title
}: { 
  slides?: Slide[];
  title?: string;
}) {
  if (!slides.length) {
    return null;
  }

  return (
    <div className="w-full" data-testid="a2ui-slides">
      {title && <h4 className="text-sm font-medium mb-4">{title}</h4>}
      <Carousel className="w-full">
        <CarouselContent>
          {slides.map((slide, idx) => (
            <CarouselItem key={idx}>
              <Card className="border">
                {slide.image && (
                  <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={slide.image} 
                      alt={slide.title || `Slide ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  {slide.title && (
                    <h5 className="font-semibold mb-2">{slide.title}</h5>
                  )}
                  <p className="text-sm text-muted-foreground">{slide.content}</p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center gap-2 mt-4">
          <CarouselPrevious className="relative left-0 translate-y-0" />
          <CarouselNext className="relative right-0 translate-y-0" />
        </div>
      </Carousel>
    </div>
  );
}

function renderA2UIComponent(
  component: A2UIComponent,
  allComponents: A2UIComponent[],
  renderChildren: (parentId: string) => React.ReactNode,
  onAction?: (action: string, data?: any) => void
): React.ReactNode {
  const { type, properties = {}, data, children: componentChildren } = component;
  const childNodes = renderChildren(component.id);

  try {
    switch (type) {
      case 'card':
        return (
          <A2Card {...properties} onAction={onAction}>
            {childNodes}
          </A2Card>
        );

      case 'chart':
        return <A2Chart {...properties} data={data} />;

      case 'table':
        return <A2Table {...properties} {...(data || {})} />;

      case 'list':
        return <A2List {...properties} items={data?.items || properties.items} />;

      case 'code':
        return <A2Code {...properties} code={data?.code || properties.code} />;

      case 'quote':
        return <A2Quote {...properties} text={data?.text || properties.text} />;

      case 'image':
        return <A2Image {...properties} />;

      case 'accordion':
        return <A2Accordion {...properties} items={data?.items || properties.items} />;

      case 'tabs':
        return <A2Tabs {...properties} tabs={data?.tabs || properties.tabs} />;

      case 'progress':
        return <A2Progress {...properties} value={data?.value ?? properties.value} />;

      case 'badge':
        return <A2Badge {...properties} />;

      case 'button':
        return <A2Button {...properties} />;

      case 'link':
        return <A2Link {...properties} />;

      case 'mindmap':
        return <A2Mindmap {...properties} data={data} />;

      case 'timeline':
        return <A2Timeline {...properties} events={data?.events || properties.events} />;

      case 'slides':
        return <A2Slides {...properties} slides={data?.slides || properties.slides} />;

      case 'audio_transcript':
        return <A2AudioTranscript {...properties} segments={data?.segments || properties.segments} />;

      default:
        console.warn(`Unknown A2UI component type: ${type}`);
        return (
          <div 
            className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground"
            data-testid={`a2ui-unknown-${type}`}
          >
            Unknown component type: {type}
          </div>
        );
    }
  } catch (error) {
    console.error(`Error rendering A2UI component ${type}:`, error);
    return (
      <div 
        className="p-4 bg-destructive/10 rounded-lg text-sm text-destructive"
        data-testid={`a2ui-error-${component.id}`}
      >
        Error rendering component
      </div>
    );
  }
}

export default function A2UIRenderer({ components, onAction }: A2UIRendererProps) {
  const rootComponents = components.filter(c => !c.parentId);

  const renderChildren = (parentId: string): React.ReactNode => {
    const children = components.filter(c => c.parentId === parentId);
    if (children.length === 0) return null;
    
    return (
      <div className="space-y-3 mt-3">
        {children.map(child => (
          <motion.div
            key={child.id}
            {...fadeInUp}
            data-testid={`a2ui-component-${child.id}`}
          >
            {renderA2UIComponent(child, components, renderChildren, onAction)}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderComponent = (component: A2UIComponent): React.ReactNode => {
    return (
      <motion.div
        key={component.id}
        {...fadeInUp}
        data-testid={`a2ui-component-${component.id}`}
      >
        {renderA2UIComponent(component, components, renderChildren, onAction)}
      </motion.div>
    );
  };

  if (!components || components.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="a2ui-renderer">
      {rootComponents.map(component => renderComponent(component))}
    </div>
  );
}

export { 
  A2Card, 
  A2Chart, 
  A2Table, 
  A2List, 
  A2Code, 
  A2Quote, 
  A2Image, 
  A2Accordion, 
  A2Tabs, 
  A2Progress, 
  A2Badge, 
  A2Button, 
  A2Link, 
  A2Mindmap, 
  A2Timeline, 
  A2Slides 
};
