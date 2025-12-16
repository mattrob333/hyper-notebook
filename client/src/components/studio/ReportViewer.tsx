import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  FileText, 
  Copy, 
  Check,
  Printer,
  X,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReportViewerProps {
  content: string;
  title?: string;
  sourceCount?: number;
  generatedAt?: Date | string;
  onClose?: () => void;
}

export default function ReportViewer({ 
  content, 
  title = 'Report',
  sourceCount,
  generatedAt,
  onClose 
}: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Extract headings for table of contents
  const headings = content.match(/^#{1,3}\s+.+$/gm) || [];
  const tocItems = headings.map((heading) => {
    const level = heading.match(/^#+/)?.[0].length || 1;
    const text = heading.replace(/^#+\s+/, '');
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return { level, text, id };
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Report content copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ 
        title: 'Copy failed', 
        description: 'Could not copy to clipboard.',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Downloaded!', description: 'Report saved as Markdown file.' });
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500" />
          <div>
            <h2 className="font-semibold text-lg">{title}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {sourceCount !== undefined && (
                <span>Based on {sourceCount} source{sourceCount !== 1 ? 's' : ''}</span>
              )}
              {generatedAt && (
                <>
                  <span>•</span>
                  <span>{new Date(generatedAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table of Contents Sidebar */}
        {tocItems.length > 2 && (
          <div className="w-56 border-r p-4 hidden lg:block">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Contents</h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <nav className="space-y-1">
                {tocItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToHeading(item.id)}
                    className={`flex items-center gap-1 text-sm text-left w-full py-1 px-2 rounded hover:bg-muted transition-colors ${
                      item.level === 1 ? 'font-medium' : 'text-muted-foreground'
                    }`}
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                  >
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.text}</span>
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </div>
        )}

        {/* Main Content */}
        <ScrollArea className="flex-1">
          <article className="max-w-3xl mx-auto p-6 md:p-8 prose prose-slate dark:prose-invert prose-headings:scroll-mt-20">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children, ...props }) => {
                  const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                  return <h1 id={id} className="text-3xl font-bold mt-8 mb-4 first:mt-0" {...props}>{children}</h1>;
                },
                h2: ({ children, ...props }) => {
                  const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                  return <h2 id={id} className="text-2xl font-semibold mt-6 mb-3 border-b pb-2" {...props}>{children}</h2>;
                },
                h3: ({ children, ...props }) => {
                  const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                  return <h3 id={id} className="text-xl font-medium mt-4 mb-2" {...props}>{children}</h3>;
                },
                p: ({ children, ...props }) => (
                  <p className="text-base leading-relaxed mb-4" {...props}>{children}</p>
                ),
                ul: ({ children, ...props }) => (
                  <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>{children}</ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>{children}</ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="text-base" {...props}>{children}</li>
                ),
                blockquote: ({ children, ...props }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" {...props}>
                    {children}
                  </blockquote>
                ),
                code: ({ children, className, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={`block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono ${className}`} {...props}>
                      {children}
                    </code>
                  );
                },
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-border" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children, ...props }) => (
                  <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => (
                  <td className="border border-border px-4 py-2" {...props}>
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </ScrollArea>
      </div>
    </div>
  );
}
