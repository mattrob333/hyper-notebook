import { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TiptapHighlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  Download,
  Printer,
  FileText,
  Save,
  Loader2,
  MoreHorizontal,
  X,
  Check,
  Wand2,
  FileDown,
  Undo,
  Redo,
  Eye,
  Edit3,
  Settings,
  ChevronDown,
  ImagePlus,
  Type,
  Highlighter,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReportEditorProps {
  initialContent?: string;
  title?: string;
  onClose: () => void;
  onSave?: (content: string, title: string) => void;
  notebookId?: string;
  letterhead?: {
    enabled: boolean;
    position: 'left' | 'center' | 'right';
    logoUrl?: string;
    companyName?: string;
    tagline?: string;
  };
}

interface AIRewriteOption {
  label: string;
  prompt: string;
  icon?: React.ReactNode;
}

const AI_REWRITE_OPTIONS: AIRewriteOption[] = [
  { label: 'Make concise', prompt: 'Make this text more concise while keeping the key points' },
  { label: 'Expand', prompt: 'Expand on this text with more details and examples' },
  { label: 'More formal', prompt: 'Rewrite this in a more formal, professional tone' },
  { label: 'More casual', prompt: 'Rewrite this in a more casual, conversational tone' },
  { label: 'Simplify', prompt: 'Simplify this text to make it easier to understand' },
  { label: 'Fix grammar', prompt: 'Fix any grammar, spelling, or punctuation errors' },
];

export default function ReportEditor({
  initialContent = '',
  title: initialTitle = 'Untitled Report',
  onClose,
  onSave,
  notebookId,
  letterhead,
}: ReportEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isPageView, setIsPageView] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showAIRewrite, setShowAIRewrite] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [customRewritePrompt, setCustomRewritePrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();

  // Convert markdown to HTML for initial content
  const convertMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return '<p></p>';
    
    // Process line by line for better control
    const lines = markdown.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let inCodeBlock = false;
    
    for (let line of lines) {
      // Handle code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (inCodeBlock) {
          processedLines.push('<pre><code>');
        } else {
          processedLines.push('</code></pre>');
        }
        continue;
      }
      
      if (inCodeBlock) {
        processedLines.push(line);
        continue;
      }
      
      // Headers
      if (line.startsWith('### ')) {
        if (inList) { processedLines.push('</ul>'); inList = false; }
        processedLines.push(`<h3>${line.slice(4)}</h3>`);
        continue;
      }
      if (line.startsWith('## ')) {
        if (inList) { processedLines.push('</ul>'); inList = false; }
        processedLines.push(`<h2>${line.slice(3)}</h2>`);
        continue;
      }
      if (line.startsWith('# ')) {
        if (inList) { processedLines.push('</ul>'); inList = false; }
        processedLines.push(`<h1>${line.slice(2)}</h1>`);
        continue;
      }
      
      // Blockquotes
      if (line.startsWith('> ')) {
        if (inList) { processedLines.push('</ul>'); inList = false; }
        processedLines.push(`<blockquote>${line.slice(2)}</blockquote>`);
        continue;
      }
      
      // Unordered list items
      if (line.match(/^[\-\*] /)) {
        if (!inList) { processedLines.push('<ul>'); inList = true; }
        processedLines.push(`<li>${line.slice(2)}</li>`);
        continue;
      }
      
      // Ordered list items
      if (line.match(/^\d+\. /)) {
        if (!inList) { processedLines.push('<ol>'); inList = true; }
        processedLines.push(`<li>${line.replace(/^\d+\. /, '')}</li>`);
        continue;
      }
      
      // Close list if we hit a non-list item
      if (inList && line.trim() !== '') {
        processedLines.push('</ul>');
        inList = false;
      }
      
      // Empty lines become paragraph breaks
      if (line.trim() === '') {
        processedLines.push('</p><p>');
        continue;
      }
      
      // Regular paragraph content
      processedLines.push(line);
    }
    
    if (inList) processedLines.push('</ul>');
    
    let html = processedLines.join('\n');
    
    // Inline formatting (apply after structure)
    html = html
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Wrap in paragraph if needed
    if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<blockquote') && !html.startsWith('<pre')) {
      html = `<p>${html}</p>`;
    }
    
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '').replace(/<p><\/p>/g, '');
    
    return html;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapHighlight.configure({
        multicolor: true,
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your report...',
      }),
    ],
    content: convertMarkdownToHtml(initialContent),
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-6',
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        setSelectedText(editor.state.doc.textBetween(from, to, ' '));
      } else {
        setSelectedText('');
      }
    },
  });

  // AI Rewrite mutation
  const rewriteMutation = useMutation({
    mutationFn: async ({ text, prompt }: { text: string; prompt: string }) => {
      const res = await apiRequest('POST', '/api/ai/rewrite', {
        text,
        prompt,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (editor && data.rewritten) {
        editor.chain().focus().deleteSelection().insertContent(data.rewritten).run();
        toast({ title: 'Text rewritten', description: 'AI has updated your selection' });
      }
      setShowAIRewrite(false);
      setCustomRewritePrompt('');
    },
    onError: (error: Error) => {
      toast({ title: 'Rewrite failed', description: error.message, variant: 'destructive' });
    },
  });

  // Image generation mutation (using Gemini Imagen 3)
  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest('POST', '/api/images/generate', {
        prompt,
        size: '1024x1024',
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (editor && data.image) {
        editor.chain().focus().setImage({ src: data.image }).run();
        toast({ title: 'Image generated', description: 'AI image has been added to your report' });
      }
      setShowImageDialog(false);
      setImagePrompt('');
      setIsGeneratingImage(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Image generation failed', description: error.message, variant: 'destructive' });
      setIsGeneratingImage(false);
    },
  });

  const handleRewrite = (option: AIRewriteOption) => {
    if (!selectedText) return;
    rewriteMutation.mutate({ text: selectedText, prompt: option.prompt });
  };

  const handleCustomRewrite = () => {
    if (!selectedText || !customRewritePrompt) return;
    rewriteMutation.mutate({ text: selectedText, prompt: customRewritePrompt });
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setShowImageDialog(false);
      setImageUrl('');
    }
  };

  const handleGenerateImage = () => {
    if (imagePrompt) {
      setIsGeneratingImage(true);
      generateImageMutation.mutate(imagePrompt);
    }
  };

  const handleExportPDF = async () => {
    // For now, use print dialog with PDF option
    // In production, we'd use a proper PDF library
    window.print();
  };

  const handleExportMarkdown = () => {
    if (!editor) return;
    
    const html = editor.getHTML();
    // Simple HTML to Markdown conversion
    let markdown = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '_$1_')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Exported', description: 'Report saved as Markdown file' });
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ content, title }: { content: string; title: string }) => {
      const res = await apiRequest('POST', '/api/generated/save', {
        type: 'report',
        title,
        content: { html: content },
        sourceIds: [],
        metadata: { 
          createdAt: new Date().toISOString(),
          notebookId: notebookId 
        }
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Report has been saved to Studio' });
      // Navigate back after save
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: (error: Error) => {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    }
  });

  const handleSave = () => {
    if (editor) {
      const content = editor.getHTML();
      saveMutation.mutate({ content, title });
      if (onSave) {
        onSave(content, title);
      }
    }
  };

  if (!editor) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 w-[300px] border-none bg-transparent font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Report title..."
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPageView(!isPageView)}
              className="gap-2"
            >
              {isPageView ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPageView ? 'Edit' : 'Page View'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportMarkdown}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 px-4 py-1.5 border-t overflow-x-auto">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 h-8">
                <Type className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                <span className="text-sm">Normal text</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 className="w-4 h-4 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="w-4 h-4 mr-2" />
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="w-4 h-4 mr-2" />
                Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('bold') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('italic') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('underline') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('strike') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive({ textAlign: 'left' }) && 'bg-muted')}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive({ textAlign: 'center' }) && 'bg-muted')}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive({ textAlign: 'right' }) && 'bg-muted')}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('bulletList') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('orderedList') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Quote & Code */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('blockquote') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('codeBlock') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Link */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', editor.isActive('link') && 'bg-muted')}
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  placeholder="https://example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value;
                      if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                      }
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Press Enter to apply</p>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowImageDialog(true)}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* AI Rewrite */}
          <Popover open={showAIRewrite && selectedText.length > 0} onOpenChange={setShowAIRewrite}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8"
                disabled={!selectedText}
              >
                <Sparkles className="w-4 h-4" />
                AI Rewrite
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <div className="text-sm font-medium">Rewrite with AI</div>
                <div className="grid grid-cols-2 gap-2">
                  {AI_REWRITE_OPTIONS.map((option) => (
                    <Button
                      key={option.label}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleRewrite(option)}
                      disabled={rewriteMutation.isPending}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs">Custom instruction</Label>
                  <Textarea
                    placeholder="E.g., Translate to Spanish..."
                    value={customRewritePrompt}
                    onChange={(e) => setCustomRewritePrompt(e.target.value)}
                    className="h-20"
                  />
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleCustomRewrite}
                    disabled={!customRewritePrompt || rewriteMutation.isPending}
                  >
                    {rewriteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <div className={cn(
          'mx-auto bg-background shadow-sm',
          isPageView 
            ? 'w-[8.5in] min-h-[11in] my-8 p-[1in] print:shadow-none print:my-0' 
            : 'max-w-4xl my-4 rounded-lg'
        )}>
          {/* Letterhead */}
          {letterhead?.enabled && (
            <div className={cn(
              'mb-6 pb-4 border-b',
              letterhead.position === 'center' && 'text-center',
              letterhead.position === 'right' && 'text-right'
            )}>
              {letterhead.logoUrl && (
                <img 
                  src={letterhead.logoUrl} 
                  alt="Logo" 
                  className={cn(
                    'h-12 mb-2',
                    letterhead.position === 'center' && 'mx-auto',
                    letterhead.position === 'right' && 'ml-auto'
                  )}
                />
              )}
              {letterhead.companyName && (
                <div className="font-semibold text-lg">{letterhead.companyName}</div>
              )}
              {letterhead.tagline && (
                <div className="text-sm text-muted-foreground">{letterhead.tagline}</div>
              )}
            </div>
          )}

          <EditorContent editor={editor} />
        </div>
      </div>


      {/* Image Insert Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="w-5 h-5" />
              Insert Image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* URL Option */}
            <div className="space-y-2">
              <Label>From URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button onClick={handleInsertImage} disabled={!imageUrl}>
                  Insert
                </Button>
              </div>
            </div>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>

            {/* AI Generate Option */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </Label>
              <Textarea
                placeholder="Describe the image you want to generate..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="h-24"
              />
              <Button 
                onClick={handleGenerateImage} 
                disabled={!imagePrompt || isGeneratingImage}
                className="w-full gap-2"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .prose, .prose * {
            visibility: visible;
          }
          .prose {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 1in;
          }
        }
      `}</style>
    </div>
  );
}
