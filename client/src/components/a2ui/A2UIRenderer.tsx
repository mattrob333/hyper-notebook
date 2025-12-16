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
  children 
}: { 
  title?: string; 
  description?: string; 
  content?: string; 
  actions?: Array<{ label: string; variant?: 'default' | 'secondary' | 'outline'; onClick?: () => void }>;
  children?: React.ReactNode;
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
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
              data-testid={`a2ui-card-action-${idx}`}
            >
              {action.label}
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

  function traverse(node: MindmapNode, x: number, y: number, level: number) {
    nodes.push({
      id: node.id,
      position: { x, y },
      data: { label: node.label },
      style: {
        background: level === 0 ? 'hsl(var(--primary))' : 'hsl(var(--card))',
        color: level === 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: level === 0 ? '14px' : '12px',
        fontWeight: level === 0 ? '600' : '500',
        minWidth: '120px',
        textAlign: 'center',
      },
    });

    if (node.children && node.children.length > 0) {
      const childCount = node.children.length;
      const spacing = 150;
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
        traverse(child, x + 250, startY + idx * spacing, level + 1);
      });
    }
  }

  if (root) {
    traverse(root, 50, 200, 0);
  }
  return { nodes, edges };
}

function A2Mindmap({ 
  data,
  title
}: { 
  data?: MindmapNode;
  title?: string;
}) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => data ? buildMindmapNodesAndEdges(data) : { nodes: [], edges: [] },
    [data]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!data) {
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
      {title && <h4 className="text-sm font-medium mb-3">{title}</h4>}
      <div className="h-[400px] w-full rounded-lg border overflow-hidden">
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
  renderChildren: (parentId: string) => React.ReactNode
): React.ReactNode {
  const { type, properties = {}, data, children: componentChildren } = component;
  const childNodes = renderChildren(component.id);

  try {
    switch (type) {
      case 'card':
        return (
          <A2Card {...properties}>
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

export default function A2UIRenderer({ components }: A2UIRendererProps) {
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
            {renderA2UIComponent(child, components, renderChildren)}
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
        {renderA2UIComponent(component, components, renderChildren)}
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
