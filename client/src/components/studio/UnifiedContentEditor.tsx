import { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TiptapHighlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Mail,
  Send,
  Newspaper,
  FileEdit,
  PenTool,
  Users,
  LayoutTemplate,
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Document types
type DocumentType = 'email' | 'newsletter' | 'report' | 'article';

interface DocumentTypeConfig {
  id: DocumentType;
  label: string;
  icon: React.ReactNode;
  description: string;
  showTo: boolean;
  showSubject: boolean;
  showSignature: boolean;
  showHeroImage: boolean;
  showTemplate: boolean;
  showPageBreaks: boolean;
  canSend: boolean;
  canExportPdf: boolean;
}

const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    id: 'email',
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
    description: 'Direct email to contacts',
    showTo: true,
    showSubject: true,
    showSignature: true,
    showHeroImage: false,
    showTemplate: true,
    showPageBreaks: false,
    canSend: true,
    canExportPdf: false,
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    icon: <Newspaper className="w-4 h-4" />,
    description: 'Styled newsletter with sections',
    showTo: false,
    showSubject: false,
    showSignature: true,
    showHeroImage: true,
    showTemplate: true,
    showPageBreaks: false,
    canSend: false,
    canExportPdf: true,
  },
  {
    id: 'report',
    label: 'Report',
    icon: <FileText className="w-4 h-4" />,
    description: 'Professional document',
    showTo: false,
    showSubject: false,
    showSignature: false,
    showHeroImage: false,
    showTemplate: true,
    showPageBreaks: true,
    canSend: false,
    canExportPdf: true,
  },
  {
    id: 'article',
    label: 'Article',
    icon: <PenTool className="w-4 h-4" />,
    description: 'Blog post or article',
    showTo: false,
    showSubject: false,
    showSignature: false,
    showHeroImage: true,
    showTemplate: false,
    showPageBreaks: false,
    canSend: false,
    canExportPdf: true,
  },
];

interface AIRewriteOption {
  label: string;
  prompt: string;
}

const AI_REWRITE_OPTIONS: AIRewriteOption[] = [
  { label: 'Polish', prompt: `Polish this text for professional presentation while PRESERVING all formatting. Keep all heading sizes, bold, italic, lists. Only clean up artifacts and spacing.` },
  { label: 'Make concise', prompt: 'Make this text more concise while keeping the key points and preserving formatting' },
  { label: 'Expand', prompt: 'Expand on this text with more details and examples, preserving formatting' },
  { label: 'More formal', prompt: 'Rewrite this in a more formal, professional tone, preserving formatting' },
  { label: 'More casual', prompt: 'Rewrite this in a more casual, conversational tone, preserving formatting' },
  { label: 'Fix grammar', prompt: 'Fix any grammar, spelling, or punctuation errors, preserving formatting' },
];

// Newsletter template
const NEWSLETTER_TEMPLATE = `
<div style="max-width: 600px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif;">
  <div style="text-align: center; padding: 24px 0; border-bottom: 2px solid #10b981;">
    <h1 style="margin: 0; color: #10b981; font-size: 24px;">Your Company</h1>
    <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">Professional Excellence</p>
  </div>
  
  <div style="padding: 24px 0;">
    <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 8px; padding: 48px; text-align: center; margin-bottom: 24px;">
      <p style="color: #9ca3af; font-size: 14px;">[Click here to add hero image]</p>
    </div>
    
    <h1 style="font-size: 28px; color: #f9fafb; margin: 0 0 16px;">Newsletter Title</h1>
    <p style="color: #9ca3af; font-size: 16px; line-height: 1.6;">
      Welcome to this edition. Write your introduction here...
    </p>
    
    <hr style="border: none; border-top: 1px solid #374151; margin: 24px 0;" />
    
    <h2 style="font-size: 20px; color: #f9fafb; margin: 0 0 12px;">Section 1</h2>
    <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">
      Your first section content goes here...
    </p>
    
    <hr style="border: none; border-top: 1px solid #374151; margin: 24px 0;" />
    
    <h2 style="font-size: 20px; color: #f9fafb; margin: 0 0 12px;">Section 2</h2>
    <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">
      Your second section content goes here...
    </p>
  </div>
  
  <div style="text-align: center; padding: 24px 0; border-top: 1px solid #374151; color: #6b7280; font-size: 12px;">
    <p style="margin: 0;">© 2024 Your Company. All rights reserved.</p>
  </div>
</div>
`;

interface UnifiedContentEditorProps {
  initialContent?: string;
  initialType?: DocumentType;
  title?: string;
  onClose: () => void;
  onSave?: (content: string, title: string, type: DocumentType) => void;
  notebookId?: string;
  emailTo?: string;
  emailSubject?: string;
}

export default function UnifiedContentEditor({
  initialContent = '',
  initialType = 'report',
  title: initialTitle = 'Untitled',
  onClose,
  onSave,
  notebookId,
  emailTo: initialEmailTo = '',
  emailSubject: initialEmailSubject = '',
}: UnifiedContentEditorProps) {
  const [documentType, setDocumentType] = useState<DocumentType>(initialType);
  const [title, setTitle] = useState(initialTitle);
  const [emailTo, setEmailTo] = useState(initialEmailTo);
  const [emailSubject, setEmailSubject] = useState(initialEmailSubject);
  const [isPreview, setIsPreview] = useState(false);
  const [showAIRewrite, setShowAIRewrite] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [customRewritePrompt, setCustomRewritePrompt] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const { toast } = useToast();

  const config = DOCUMENT_TYPES.find(t => t.id === documentType)!;

  // Convert markdown to HTML for initial content
  const convertMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return '<p></p>';
    
    const lines = markdown.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let inCodeBlock = false;
    
    for (let line of lines) {
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
      
      if (line.startsWith('> ')) {
        if (inList) { processedLines.push('</ul>'); inList = false; }
        processedLines.push(`<blockquote>${line.slice(2)}</blockquote>`);
        continue;
      }
      
      if (line.match(/^[\-\*] /)) {
        if (!inList) { processedLines.push('<ul>'); inList = true; }
        processedLines.push(`<li>${line.slice(2)}</li>`);
        continue;
      }
      
      if (line.match(/^\d+\. /)) {
        if (!inList) { processedLines.push('<ol>'); inList = true; }
        processedLines.push(`<li>${line.replace(/^\d+\. /, '')}</li>`);
        continue;
      }
      
      if (inList && line.trim() !== '') {
        processedLines.push('</ul>');
        inList = false;
      }
      
      if (line.trim() === '') {
        processedLines.push('</p><p>');
        continue;
      }
      
      processedLines.push(line);
    }
    
    if (inList) processedLines.push('</ul>');
    
    let html = processedLines.join('\n');
    
    html = html
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<blockquote') && !html.startsWith('<pre')) {
      html = `<p>${html}</p>`;
    }
    
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
      TiptapHighlight,
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: convertMarkdownToHtml(initialContent),
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to);
        setSelectedText(text);
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

  // Image generation mutation
  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest('POST', '/api/images/generate', {
        prompt,
        size: '1024x1024',
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.image) {
        if (showImageDialog) {
          editor?.chain().focus().setImage({ src: data.image }).run();
          setShowImageDialog(false);
        } else {
          setHeroImage(data.image);
        }
        toast({ title: 'Image generated', description: 'AI image has been added' });
      }
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

  const handleSave = async () => {
    if (!editor) return;
    const content = editor.getHTML();
    
    try {
      await apiRequest('POST', '/api/generated/save', {
        type: documentType,
        title,
        content: {
          html: content,
          heroImage,
          metadata: {
            documentType,
            emailTo: config.showTo ? emailTo : undefined,
            emailSubject: config.showSubject ? emailSubject : undefined,
            savedAt: new Date().toISOString(),
          }
        },
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/generated'] });
      toast({ title: 'Saved', description: `${config.label} saved successfully` });
      onSave?.(content, title, documentType);
    } catch (error) {
      toast({ title: 'Save failed', description: 'Could not save document', variant: 'destructive' });
    }
  };

  const handleSend = async () => {
    if (!editor || !emailTo) {
      toast({ title: 'Missing recipient', description: 'Please enter an email address', variant: 'destructive' });
      return;
    }
    
    toast({ title: 'Sending...', description: 'Email functionality coming soon' });
  };

  const handleExportPdf = () => {
    window.print();
  };

  const applyTemplate = () => {
    if (editor && documentType === 'newsletter') {
      editor.commands.setContent(NEWSLETTER_TEMPLATE);
      setShowTemplateDialog(false);
      toast({ title: 'Template applied', description: 'Newsletter template loaded' });
    }
  };

  const handleDocumentTypeChange = (type: DocumentType) => {
    setDocumentType(type);
    if (type === 'newsletter' && editor && !editor.getHTML().includes('Newsletter Title')) {
      setShowTemplateDialog(true);
    }
  };

  if (!editor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-64 bg-transparent border-none text-lg font-medium focus-visible:ring-0"
            placeholder="Document title..."
          />
          
          <Badge variant="outline" className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? <Edit3 className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          
          {config.showTemplate && (
            <Button variant="ghost" size="sm" onClick={() => setShowTemplateDialog(true)}>
              <LayoutTemplate className="w-4 h-4 mr-1" />
              Templates
            </Button>
          )}
          
          {config.canExportPdf && (
            <Button variant="ghost" size="sm" onClick={handleExportPdf}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          
          {config.canSend && (
            <Button size="sm" onClick={handleSend} className="bg-primary">
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
          )}
        </div>
      </div>

      {/* Document Type Tabs */}
      <div className="border-b bg-card/50 px-4 py-2">
        <Tabs value={documentType} onValueChange={(v) => handleDocumentTypeChange(v as DocumentType)}>
          <TabsList className="bg-transparent">
            {DOCUMENT_TYPES.map((type) => (
              <TabsTrigger
                key={type.id}
                value={type.id}
                className="gap-2 data-[state=active]:bg-primary/20"
              >
                {type.icon}
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Email Fields (conditional) */}
      {(config.showTo || config.showSubject) && (
        <div className="border-b bg-card/30 px-4 py-3 space-y-2">
          {config.showTo && (
            <div className="flex items-center gap-2">
              <Label className="w-16 text-muted-foreground">To:</Label>
              <Input
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="recipient@email.com"
                className="flex-1 bg-transparent"
              />
            </div>
          )}
          {config.showSubject && (
            <div className="flex items-center gap-2">
              <Label className="w-16 text-muted-foreground">Subject:</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
                className="flex-1 bg-transparent"
              />
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      {!isPreview && (
        <div className="border-b bg-card/30 px-4 py-2 flex items-center gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Select
            value={editor.isActive('heading', { level: 1 }) ? 'h1' : 
                   editor.isActive('heading', { level: 2 }) ? 'h2' : 
                   editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'}
            onValueChange={(value) => {
              if (value === 'p') {
                editor.chain().focus().setParagraph().run();
              } else {
                const level = parseInt(value.slice(1)) as 1 | 2 | 3;
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
          >
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Paragraph</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
            </SelectContent>
          </Select>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button
            variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowImageDialog(true)}
          >
            <ImagePlus className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Popover open={showAIRewrite} onOpenChange={setShowAIRewrite}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Sparkles className="w-4 h-4" />
                AI Rewrite
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <h4 className="font-medium">Rewrite with AI</h4>
                <div className="grid grid-cols-2 gap-2">
                  {AI_REWRITE_OPTIONS.map((option) => (
                    <Button
                      key={option.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleRewrite(option)}
                      disabled={!selectedText || rewriteMutation.isPending}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Custom instruction</Label>
                  <Textarea
                    placeholder="E.g., Translate to Spanish..."
                    value={customRewritePrompt}
                    onChange={(e) => setCustomRewritePrompt(e.target.value)}
                    className="h-20"
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleCustomRewrite}
                    disabled={!selectedText || !customRewritePrompt || rewriteMutation.isPending}
                  >
                    {rewriteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    Apply
                  </Button>
                </div>
                {!selectedText && (
                  <p className="text-xs text-muted-foreground">Select text to rewrite</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Hero Image Section (conditional) */}
      {config.showHeroImage && !isPreview && (
        <div className="border-b bg-card/20 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            {heroImage ? (
              <div className="relative group">
                <img
                  src={heroImage}
                  alt="Hero"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setHeroImage(null)}>
                    Remove
                  </Button>
                  <Button size="sm" onClick={() => {
                    setImagePrompt('');
                    setIsGeneratingImage(false);
                  }}>
                    Replace
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">Add a hero image</p>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    placeholder="Describe the image..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsGeneratingImage(true);
                      generateImageMutation.mutate(imagePrompt);
                    }}
                    disabled={!imagePrompt || isGeneratingImage}
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {isPreview ? (
            <div 
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
      </ScrollArea>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button onClick={handleInsertImage} disabled={!imageUrl} className="w-full">
                Insert from URL
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or generate with AI</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Describe the image</Label>
              <Textarea
                placeholder="A professional business illustration..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
              />
              <Button
                onClick={handleGenerateImage}
                disabled={!imagePrompt || isGeneratingImage}
                className="w-full"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Would you like to start with a pre-designed template for your {config.label.toLowerCase()}?
            </p>
            <div className="grid gap-3">
              <Button onClick={applyTemplate} className="justify-start h-auto py-3">
                <div className="flex items-center gap-3">
                  <LayoutTemplate className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Professional Newsletter</div>
                    <div className="text-xs text-muted-foreground">Header, hero image, sections, footer</div>
                  </div>
                </div>
              </Button>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)} className="justify-start h-auto py-3">
                <div className="flex items-center gap-3">
                  <FileEdit className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Start from scratch</div>
                    <div className="text-xs text-muted-foreground">Begin with a blank document</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
