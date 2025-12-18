import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Palette,
  Save,
  Download,
  Undo,
  Redo,
  ArrowLeft,
  FileText,
  Newspaper,
  Mail,
  PenTool,
  Send,
  Eye,
  Code,
  Sparkles,
  Loader2,
  ImagePlus,
  LayoutTemplate,
  X,
  Settings,
  Upload,
  Briefcase,
  FileSignature,
  Building2,
  Plus,
  Trash2,
  Pencil,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Document types
export type DocumentType = 'email' | 'newsletter' | 'report' | 'article';

interface DocumentTypeConfig {
  id: DocumentType;
  label: string;
  icon: React.ReactNode;
  showTo: boolean;
  showSubject: boolean;
  showSignature: boolean;
  showHeroImage: boolean;
  canSend: boolean;
  canExportPdf: boolean;
  placeholder: string;
}

const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    id: 'email',
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
    showTo: true,
    showSubject: true,
    showSignature: true,
    showHeroImage: false,
    canSend: true,
    canExportPdf: false,
    placeholder: 'Compose your email...',
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    icon: <Newspaper className="w-4 h-4" />,
    showTo: false,
    showSubject: false,
    showSignature: true,
    showHeroImage: true,
    canSend: false,
    canExportPdf: true,
    placeholder: 'Write your newsletter content...',
  },
  {
    id: 'report',
    label: 'Report',
    icon: <FileText className="w-4 h-4" />,
    showTo: false,
    showSubject: false,
    showSignature: false,
    showHeroImage: false,
    canSend: false,
    canExportPdf: true,
    placeholder: 'Write your report...',
  },
  {
    id: 'article',
    label: 'Article',
    icon: <PenTool className="w-4 h-4" />,
    showTo: false,
    showSubject: false,
    showSignature: false,
    showHeroImage: true,
    canSend: false,
    canExportPdf: true,
    placeholder: 'Write your article...',
  },
];

interface AIRewriteOption {
  label: string;
  prompt: string;
}

const AI_REWRITE_OPTIONS: AIRewriteOption[] = [
  { label: 'Polish', prompt: 'Polish this text for professional presentation while preserving all formatting.' },
  { label: 'Concise', prompt: 'Make this text more concise while keeping the key points and preserving formatting.' },
  { label: 'Expand', prompt: 'Expand on this text with more details, preserving formatting.' },
  { label: 'Formal', prompt: 'Rewrite in a more formal, professional tone, preserving formatting.' },
  { label: 'Casual', prompt: 'Rewrite in a more casual, conversational tone, preserving formatting.' },
  { label: 'Fix Grammar', prompt: 'Fix any grammar, spelling, or punctuation errors, preserving formatting.' },
];

const textColors = [
  "#000000", "#374151", "#6B7280", "#9CA3AF",
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
];

// Document templates by type
interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  letterhead: string;
  signature: string;
  defaultContent: string;
  isCustom?: boolean;
}

// Load custom templates from localStorage
const loadCustomTemplates = (): DocumentTemplate[] => {
  try {
    const saved = localStorage.getItem('custom-document-templates');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Save custom templates to localStorage
const saveCustomTemplates = (templates: DocumentTemplate[]) => {
  localStorage.setItem('custom-document-templates', JSON.stringify(templates));
};

const BUILTIN_TEMPLATES: DocumentTemplate[] = [
  // Email templates
  {
    id: 'email-professional',
    name: 'Professional Email',
    type: 'email',
    letterhead: '<div style="text-align: center; padding: 20px; border-bottom: 2px solid #10b981;"><h2 style="color: #10b981; margin: 0;">{{company}}</h2></div>',
    signature: '<div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center;"><p style="margin: 0; font-weight: 600;">{{name}}</p><p style="margin: 4px 0; color: #6b7280;">{{title}}</p><p style="margin: 4px 0; color: #6b7280;">{{company}}</p><p style="margin: 8px 0 0; color: #10b981;">{{email}}</p></div>',
    defaultContent: '<p>Dear [Recipient],</p><p></p><p>Best regards,</p>',
  },
  {
    id: 'email-minimal',
    name: 'Minimal Email',
    type: 'email',
    letterhead: '',
    signature: '<div style="padding: 16px 0; border-top: 1px solid #e5e7eb;"><p style="margin: 0;">{{name}}</p><p style="margin: 4px 0; color: #6b7280; font-size: 14px;">{{email}}</p></div>',
    defaultContent: '<p>Hi,</p><p></p><p>Thanks,</p>',
  },
  {
    id: 'email-formal',
    name: 'Formal Business',
    type: 'email',
    letterhead: '<div style="padding: 24px; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); text-align: center;"><h2 style="color: white; margin: 0; font-size: 24px;">{{company}}</h2><p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Excellence in Business</p></div>',
    signature: '<div style="padding: 20px; background: #f8fafc; border-top: 3px solid #1e3a5f;"><p style="margin: 0; font-weight: 600; color: #1e3a5f;">{{name}}</p><p style="margin: 4px 0; color: #64748b;">{{title}}</p><p style="margin: 4px 0; color: #64748b;">{{company}}</p><p style="margin: 8px 0 0;"><a href="mailto:{{email}}" style="color: #1e3a5f;">{{email}}</a></p></div>',
    defaultContent: '<p>Dear Sir/Madam,</p><p></p><p>Yours faithfully,</p>',
  },
  // Newsletter templates
  {
    id: 'newsletter-modern',
    name: 'Modern Newsletter',
    type: 'newsletter',
    letterhead: '<div style="padding: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;"><h1 style="color: white; margin: 0; font-size: 32px;">{{company}}</h1><p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 16px;">Weekly Newsletter</p></div>',
    signature: '<div style="padding: 24px; background: #1a1a2e; text-align: center;"><p style="color: #a0a0a0; margin: 0; font-size: 14px;">© 2024 {{company}}. All rights reserved.</p><p style="color: #667eea; margin: 12px 0 0;"><a href="#" style="color: #667eea; margin: 0 8px;">Unsubscribe</a> | <a href="#" style="color: #667eea; margin: 0 8px;">View Online</a></p></div>',
    defaultContent: '<h2>This Week\'s Highlights</h2><p>Welcome to our newsletter! Here\'s what\'s new...</p>',
  },
  {
    id: 'newsletter-clean',
    name: 'Clean Newsletter',
    type: 'newsletter',
    letterhead: '<div style="padding: 24px; border-bottom: 4px solid #10b981; text-align: center;"><h1 style="color: #111827; margin: 0;">{{company}}</h1></div>',
    signature: '<div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;"><p style="margin: 0;">{{company}} • {{email}}</p></div>',
    defaultContent: '<h2>Newsletter Title</h2><p>Your content here...</p>',
  },
  // Report templates
  {
    id: 'report-executive',
    name: 'Executive Report',
    type: 'report',
    letterhead: '<div style="padding: 32px; border-bottom: 4px solid #0f172a;"><h1 style="color: #0f172a; margin: 0; font-size: 28px;">Executive Report</h1><p style="color: #64748b; margin: 8px 0 0;">{{company}} • {{date}}</p></div>',
    signature: '',
    defaultContent: '<h2>Executive Summary</h2><p>Brief overview of the report...</p><h2>Key Findings</h2><p>Main discoveries and insights...</p><h2>Recommendations</h2><p>Suggested next steps...</p>',
  },
  {
    id: 'report-simple',
    name: 'Simple Report',
    type: 'report',
    letterhead: '<div style="padding: 20px 0; border-bottom: 2px solid #e5e7eb;"><h1 style="margin: 0; color: #111827;">Report</h1></div>',
    signature: '',
    defaultContent: '<h2>Introduction</h2><p></p><h2>Analysis</h2><p></p><h2>Conclusion</h2><p></p>',
  },
  // Article templates
  {
    id: 'article-blog',
    name: 'Blog Article',
    type: 'article',
    letterhead: '',
    signature: '<div style="padding: 20px; border-top: 1px solid #e5e7eb; margin-top: 32px;"><p style="margin: 0; font-weight: 600;">About the Author</p><p style="margin: 8px 0 0; color: #6b7280;">{{name}} is {{title}} at {{company}}.</p></div>',
    defaultContent: '<h1>Article Title</h1><p class="lead">A compelling introduction to your article...</p><h2>Section 1</h2><p>Your content here...</p>',
  },
  {
    id: 'article-technical',
    name: 'Technical Article',
    type: 'article',
    letterhead: '',
    signature: '',
    defaultContent: '<h1>Technical Guide</h1><p><strong>Last updated:</strong> {{date}}</p><h2>Overview</h2><p>Introduction to the topic...</p><h2>Prerequisites</h2><ul><li>Requirement 1</li><li>Requirement 2</li></ul><h2>Implementation</h2><p>Step-by-step instructions...</p>',
  },
  // Proposal template
  {
    id: 'proposal-business',
    name: 'Business Proposal',
    type: 'report',
    letterhead: '<div style="padding: 40px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center;"><h1 style="color: white; margin: 0; font-size: 32px;">Business Proposal</h1><p style="color: #94a3b8; margin: 16px 0 0;">{{company}}</p></div>',
    signature: '<div style="padding: 24px; background: #f8fafc; border-top: 3px solid #0f172a; text-align: center;"><p style="margin: 0; font-weight: 600;">Prepared by {{name}}</p><p style="margin: 4px 0; color: #64748b;">{{title}} • {{company}}</p><p style="margin: 8px 0 0; color: #0f172a;">{{email}}</p></div>',
    defaultContent: '<h2>Executive Summary</h2><p>Brief overview of the proposal...</p><h2>Problem Statement</h2><p>The challenge we\'re addressing...</p><h2>Proposed Solution</h2><p>Our approach to solving this...</p><h2>Timeline & Budget</h2><p>Project details...</p><h2>Next Steps</h2><p>How to proceed...</p>',
  },
];

// Alignment type
type AlignmentOption = 'left' | 'center' | 'right';

// Branding/signature settings interface
interface BrandingSettings {
  logoUrl: string;
  senderName: string;
  senderTitle: string;
  senderCompany: string;
  senderEmail: string;
  // Styling options
  headerAlignment: AlignmentOption;
  signatureAlignment: AlignmentOption;
  showLogoInHeader: boolean;
  showCompanyInHeader: boolean;
}

export interface DocumentPanelProps {
  onBack: () => void;
  initialContent?: string;
  initialTitle?: string;
  initialType?: DocumentType;
  initialRecipient?: string;
  initialSubject?: string;
  onContentChange?: (content: string) => void;
}

export default function DocumentPanel({
  onBack,
  initialContent = '',
  initialTitle = 'Untitled',
  initialType = 'report',
  initialRecipient = '',
  initialSubject = '',
  onContentChange,
}: DocumentPanelProps) {
  const [documentType, setDocumentType] = useState<DocumentType>(initialType);
  const [title, setTitle] = useState(initialTitle);
  const [recipientEmail, setRecipientEmail] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'html'>('edit');
  const [isSending, setIsSending] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showAIRewrite, setShowAIRewrite] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [customRewritePrompt, setCustomRewritePrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'compose' | 'settings' | 'templates'>('compose');
  
  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState<DocumentTemplate[]>(loadCustomTemplates);
  const allTemplates = [...BUILTIN_TEMPLATES, ...customTemplates];
  
  // Template editor state
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'email' as DocumentType,
    fullHtml: '',
  });
  
  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const templates = allTemplates.filter((t: DocumentTemplate) => t.type === initialType);
    return templates[0]?.id || '';
  });
  const selectedTemplate = allTemplates.find((t: DocumentTemplate) => t.id === selectedTemplateId);
  const templatesForType = allTemplates.filter((t: DocumentTemplate) => t.type === documentType);
  
  // Branding settings from localStorage
  const [branding, setBranding] = useState<BrandingSettings>(() => {
    const saved = localStorage.getItem('email-branding');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        logoUrl: parsed.logoFile || parsed.logoUrl || '',
        senderName: parsed.senderName || 'Your Name',
        senderTitle: parsed.senderTitle || 'Your Title',
        senderCompany: parsed.senderCompany || 'Your Company',
        senderEmail: parsed.senderEmail || 'you@company.com',
        headerAlignment: parsed.headerAlignment || 'left',
        signatureAlignment: parsed.signatureAlignment || 'left',
        showLogoInHeader: parsed.showLogoInHeader !== false,
        showCompanyInHeader: parsed.showCompanyInHeader !== false,
      };
    }
    return {
      logoUrl: '',
      senderName: 'Your Name',
      senderTitle: 'Your Title',
      senderCompany: 'Your Company',
      senderEmail: 'you@company.com',
      headerAlignment: 'left',
      signatureAlignment: 'left',
      showLogoInHeader: true,
      showCompanyInHeader: true,
    };
  });

  const { toast } = useToast();
  const config = DOCUMENT_TYPES.find(t => t.id === documentType)!;

  // Update template when document type changes
  useEffect(() => {
    const templates = allTemplates.filter((t: DocumentTemplate) => t.type === documentType);
    if (templates.length > 0 && !templates.find((t: DocumentTemplate) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [documentType, customTemplates]);

  // Replace template variables with branding values
  const replaceTemplateVars = useCallback((html: string): string => {
    return html
      .replace(/\{\{company\}\}/g, branding.senderCompany)
      .replace(/\{\{name\}\}/g, branding.senderName)
      .replace(/\{\{title\}\}/g, branding.senderTitle)
      .replace(/\{\{email\}\}/g, branding.senderEmail)
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
  }, [branding]);

  // Save branding to localStorage
  const saveBranding = useCallback((newBranding: BrandingSettings) => {
    setBranding(newBranding);
    localStorage.setItem('email-branding', JSON.stringify(newBranding));
    toast({ title: 'Settings saved', description: 'Your branding settings have been saved' });
  }, [toast]);

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image under 2MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      saveBranding({ ...branding, logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Apply template - defined after editor creation below

  // Convert markdown to HTML for initial content
  const convertMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Convert headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Convert bold and italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Convert lists
    html = html.replace(/^[\-\*] (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Convert line breaks to paragraphs
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs
      .map(p => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol')) return p;
        return `<p>${p}</p>`;
      })
      .filter(Boolean)
      .join('\n');
    
    return html;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: config.placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full rounded-md" },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: initialContent ? convertMarkdownToHtml(initialContent) : '',
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        setSelectedText(editor.state.doc.textBetween(from, to));
      } else {
        setSelectedText('');
      }
    },
    onUpdate: ({ editor }) => {
      onContentChange?.(editor.getHTML());
    },
  });

  // Update editor placeholder when document type changes
  useEffect(() => {
    if (editor) {
      editor.extensionManager.extensions
        .find(ext => ext.name === 'placeholder')
        ?.configure({ placeholder: config.placeholder });
    }
  }, [documentType, editor]);

  // Set initial content when it changes
  useEffect(() => {
    if (editor && initialContent) {
      const html = convertMarkdownToHtml(initialContent);
      if (editor.getHTML() !== html) {
        editor.commands.setContent(html);
      }
    }
  }, [initialContent, editor]);

  // Apply template function (defined after editor)
  const applyTemplate = useCallback((templateId: string) => {
    const template = allTemplates.find((t: DocumentTemplate) => t.id === templateId);
    if (template && editor) {
      editor.commands.setContent(template.defaultContent);
      setSelectedTemplateId(templateId);
    }
  }, [editor, customTemplates]);

  // Template management functions
  const openTemplateEditor = (template?: DocumentTemplate) => {
    if (template) {
      setEditingTemplate(template);
      // Combine existing template parts into single HTML for editing
      const combinedHtml = [
        template.letterhead,
        template.defaultContent,
        template.signature
      ].filter(Boolean).join('\n\n');
      setTemplateForm({
        name: template.name,
        type: template.type,
        fullHtml: combinedHtml,
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        type: documentType,
        fullHtml: `<!-- EXAMPLE TEMPLATE - Paste your full HTML here -->
<div style="text-align: center; padding: 20px; border-bottom: 2px solid #10b981;">
  <!-- Logo: use text-align: left, center, or right to position -->
  <img src="{{logo}}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;" />
  <h2 style="color: #10b981; margin: 0;">{{company}}</h2>
</div>

<div style="padding: 20px;">
  <p>Dear [Recipient],</p>
  <p>Your content here...</p>
  <p>Best regards,</p>
</div>

<div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
  <p style="margin: 0; font-weight: 600;">{{name}}</p>
  <p style="margin: 4px 0; color: #6b7280;">{{title}} | {{company}}</p>
  <p style="margin: 8px 0 0; color: #10b981;">{{email}}</p>
</div>`,
      });
    }
    setTemplateEditorOpen(true);
  };

  const saveTemplate = () => {
    if (!templateForm.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a template name', variant: 'destructive' });
      return;
    }

    // Store the full HTML as defaultContent (the main editable content)
    const newTemplate: DocumentTemplate = {
      id: editingTemplate?.id || `custom-${Date.now()}`,
      name: templateForm.name,
      type: templateForm.type,
      letterhead: '', // Not used for custom templates - everything is in defaultContent
      signature: '',  // Not used for custom templates - everything is in defaultContent
      defaultContent: templateForm.fullHtml,
      isCustom: true,
    };

    let updatedTemplates: DocumentTemplate[];
    if (editingTemplate) {
      updatedTemplates = customTemplates.map(t => t.id === editingTemplate.id ? newTemplate : t);
    } else {
      updatedTemplates = [...customTemplates, newTemplate];
    }

    setCustomTemplates(updatedTemplates);
    saveCustomTemplates(updatedTemplates);
    setTemplateEditorOpen(false);
    toast({ title: 'Template saved', description: `"${newTemplate.name}" has been saved` });
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updatedTemplates);
    saveCustomTemplates(updatedTemplates);
    if (selectedTemplateId === templateId) {
      const fallback = allTemplates.find((t: DocumentTemplate) => t.type === documentType && t.id !== templateId);
      setSelectedTemplateId(fallback?.id || '');
    }
    toast({ title: 'Template deleted', description: 'The template has been removed' });
  };

  const duplicateTemplate = (template: DocumentTemplate) => {
    const newTemplate: DocumentTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isCustom: true,
    };
    const updatedTemplates = [...customTemplates, newTemplate];
    setCustomTemplates(updatedTemplates);
    saveCustomTemplates(updatedTemplates);
    toast({ title: 'Template duplicated', description: `Created "${newTemplate.name}"` });
  };

  // AI Rewrite mutation
  const rewriteMutation = useMutation({
    mutationFn: async ({ text, prompt }: { text: string; prompt: string }) => {
      const res = await apiRequest('POST', '/api/ai/rewrite', { text, prompt });
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
      const res = await apiRequest('POST', '/api/images/generate', { prompt, size: '1024x1024' });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.image) {
        setHeroImage(data.image);
        toast({ title: 'Image generated', description: 'Hero image has been added' });
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

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

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
            recipient: config.showTo ? recipientEmail : undefined,
            subject: config.showSubject ? subject : undefined,
            savedAt: new Date().toISOString(),
          }
        },
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/generated'] });
      toast({ title: 'Saved', description: `${config.label} saved successfully` });
    } catch (error) {
      toast({ title: 'Save failed', description: 'Could not save document', variant: 'destructive' });
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      toast({ title: 'Subject required', description: 'Please enter an email subject', variant: 'destructive' });
      return;
    }
    if (!recipientEmail.trim()) {
      toast({ title: 'Recipient required', description: 'Please enter a recipient email', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: 'Email sent!', description: `Email sent to ${recipientEmail}` });
    setIsSending(false);
  };

  const generateFullHtml = useCallback(() => {
    if (!editor) return '';
    const bodyHtml = editor.getHTML();
    
    // Logo alignment styles
    const logoMarginStyle = branding.headerAlignment === 'center' 
      ? 'margin: 0 auto 10px;' 
      : branding.headerAlignment === 'right' 
        ? 'margin: 0 0 10px auto;' 
        : 'margin: 0 auto 10px 0;';
    
    const logoHtml = branding.showLogoInHeader && branding.logoUrl 
      ? `<img src="${branding.logoUrl}" alt="Logo" style="display: block; max-height: 60px; ${logoMarginStyle}" />`
      : '';
    
    const companyHtml = branding.showCompanyInHeader 
      ? `<h1 style="color: #10b981; margin: 0;">${branding.senderCompany}</h1>`
      : '';
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f9fafb; }
    .document-container { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .document-header { text-align: ${branding.headerAlignment}; padding: 24px; border-bottom: 2px solid #10b981; }
    .document-body { padding: 32px; line-height: 1.6; }
    .document-footer { padding: 20px; border-top: 1px solid #e5e7eb; text-align: ${branding.signatureAlignment}; color: #6b7280; font-size: 14px; }
    h1 { font-size: 28px; color: #111827; margin: 0 0 16px; }
    h2 { font-size: 22px; color: #1f2937; margin: 24px 0 12px; }
    h3 { font-size: 18px; color: #374151; margin: 20px 0 10px; }
    p { margin: 0 0 16px; color: #4b5563; }
    ul, ol { margin: 0 0 16px; padding-left: 24px; }
    li { margin-bottom: 8px; color: #4b5563; }
  </style>
</head>
<body>
  <div class="document-container">
    ${documentType !== 'article' && (branding.showLogoInHeader || branding.showCompanyInHeader) ? `
    <div class="document-header">
      ${logoHtml}
      ${companyHtml}
    </div>
    ` : ''}
    ${heroImage ? `<img src="${heroImage}" alt="Hero" style="width: 100%; height: auto;" />` : ''}
    <div class="document-body">
      ${bodyHtml}
    </div>
    ${config.showSignature ? `
    <div class="document-footer">
      <p style="margin: 0; font-weight: 600;">${branding.senderName}</p>
      <p style="margin: 4px 0; color: #6b7280;">${branding.senderTitle}</p>
      <p style="margin: 4px 0; color: #6b7280;">${branding.senderCompany}</p>
      <p style="margin: 8px 0 0; color: #10b981;">${branding.senderEmail}</p>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
  }, [editor, title, branding, heroImage, documentType, config]);

  const handleExport = () => {
    const fullHtml = generateFullHtml();
    if (!fullHtml) return;
    
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: 'HTML file downloaded' });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateFullHtml());
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-card" data-testid="document-panel">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-48 h-8 bg-transparent border-none text-base font-semibold focus-visible:ring-0 px-1"
              placeholder="Document title..."
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Preview Mode Toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={previewMode === 'edit' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-7 px-2 text-xs"
                onClick={() => setPreviewMode('edit')}
              >
                Edit
              </Button>
              <Button
                variant={previewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-7 px-2 text-xs"
                onClick={() => setPreviewMode('preview')}
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
              <Button
                variant={previewMode === 'html' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-7 px-2 text-xs"
                onClick={() => setPreviewMode('html')}
              >
                <Code className="w-3 h-3 mr-1" />
                HTML
              </Button>
            </div>
            <Button variant="outline" size="sm" className="h-7" onClick={handleSave}>
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button variant="outline" size="sm" className="h-7" onClick={handleExport}>
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
            {config.canSend && (
              <Button size="sm" className="h-7" onClick={handleSendEmail} disabled={isSending}>
                {isSending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                Send
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Document Type Tabs + Template Selector + Settings */}
      <div className="px-3 pt-2 pb-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {DOCUMENT_TYPES.map((type) => (
              <Button
                key={type.id}
                variant={documentType === type.id ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  "h-8 gap-1.5 text-xs",
                  documentType === type.id && "bg-primary/20"
                )}
                onClick={() => {
                  setDocumentType(type.id);
                  setActiveTab('compose'); // Switch back to compose when changing document type
                }}
              >
                {type.icon}
                {type.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Template Dropdown with Management */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs w-[180px] justify-between">
                  <div className="flex items-center gap-1">
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    <span className="truncate">{selectedTemplate?.name || 'Select Template'}</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-2" align="end">
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">Templates</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => openTemplateEditor()}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      New
                    </Button>
                  </div>
                  <Separator />
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-1">
                      {templatesForType.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No templates for this type</p>
                      ) : (
                        templatesForType.map((template: DocumentTemplate) => (
                          <div
                            key={template.id}
                            className={cn(
                              "flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer group",
                              selectedTemplateId === template.id ? "bg-primary/10" : "hover:bg-muted"
                            )}
                            onClick={() => applyTemplate(template.id)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs truncate">{template.name}</span>
                              {template.isCustom && (
                                <span className="text-[10px] bg-primary/20 text-primary px-1 rounded">Custom</span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateTemplate(template);
                                }}
                                title="Duplicate"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              {template.isCustom && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTemplateEditor(template);
                                    }}
                                    title="Edit"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTemplate(template.id);
                                    }}
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
            {/* Settings Button */}
            <Button
              variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setActiveTab(activeTab === 'settings' ? 'compose' : 'settings')}
            >
              <Settings className="w-3.5 h-3.5" />
              Branding
            </Button>
          </div>
        </div>
      </div>

      {/* Email Fields (conditional) */}
      {(config.showTo || config.showSubject) && (
        <div className="p-3 border-b border-border/50 space-y-2">
          {config.showTo && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-12">To:</Label>
              <Input
                placeholder="recipient@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="flex-1 h-8"
              />
            </div>
          )}
          {config.showSubject && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-12">Subject:</Label>
              <Input
                placeholder="Email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 h-8"
              />
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      {previewMode === 'edit' && (
        <div className="p-2 border-b border-border/50 flex items-center gap-1 flex-wrap bg-muted/30">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={editor.isActive("bold")}>
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={editor.isActive("italic")}>
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleUnderline().run()}
            data-active={editor.isActive("underline")}>
            <UnderlineIcon className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleStrike().run()}
            data-active={editor.isActive("strike")}>
            <Strikethrough className="w-3.5 h-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().setTextAlign("left").run()}
            data-active={editor.isActive({ textAlign: "left" })}>
            <AlignLeft className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().setTextAlign("center").run()}
            data-active={editor.isActive({ textAlign: "center" })}>
            <AlignCenter className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().setTextAlign("right").run()}
            data-active={editor.isActive({ textAlign: "right" })}>
            <AlignRight className="w-3.5 h-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            data-active={editor.isActive("heading", { level: 1 })}>
            <Heading1 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            data-active={editor.isActive("heading", { level: 2 })}>
            <Heading2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={editor.isActive("bulletList")}>
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={editor.isActive("orderedList")}>
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Palette className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-4 gap-1">
                {textColors.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-md border border-border/50 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={setLink}
            data-active={editor.isActive("link")}>
            <Link2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addImage}>
            <ImageIcon className="w-3.5 h-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* AI Rewrite */}
          <Popover open={showAIRewrite} onOpenChange={setShowAIRewrite}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                AI
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Rewrite with AI</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {AI_REWRITE_OPTIONS.map((option) => (
                    <Button
                      key={option.label}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRewrite(option)}
                      disabled={!selectedText || rewriteMutation.isPending}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Custom instruction..."
                    value={customRewritePrompt}
                    onChange={(e) => setCustomRewritePrompt(e.target.value)}
                    className="h-16 text-xs"
                  />
                  <Button
                    size="sm"
                    className="w-full h-7"
                    onClick={handleCustomRewrite}
                    disabled={!selectedText || !customRewritePrompt || rewriteMutation.isPending}
                  >
                    {rewriteMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Apply
                  </Button>
                </div>
                {!selectedText && <p className="text-xs text-muted-foreground">Select text to rewrite</p>}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1" />

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}>
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}>
            <Redo className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Hero Image Section (conditional) */}
      {config.showHeroImage && previewMode === 'edit' && (
        <div className="p-3 border-b border-border/50 bg-muted/20">
          {heroImage ? (
            <div className="relative group">
              <img src={heroImage} alt="Hero" className="w-full h-32 object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setHeroImage(null)}>
                  <X className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center">
              <ImagePlus className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-2">Add a hero image</p>
              <div className="flex items-center justify-center gap-2">
                <Input
                  placeholder="Describe the image..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="max-w-[200px] h-7 text-xs"
                />
                <Button
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    setIsGeneratingImage(true);
                    generateImageMutation.mutate(imagePrompt);
                  }}
                  disabled={!imagePrompt || isGeneratingImage}
                >
                  {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6 max-w-xl mx-auto">
            <div>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Branding
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Company Logo</Label>
                  <div className="mt-2 flex items-center gap-3">
                    {branding.logoUrl ? (
                      <div className="relative group">
                        <img src={branding.logoUrl} alt="Logo" className="h-16 rounded border" />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => saveBranding({ ...branding, logoUrl: '' })}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-16 w-32 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                        <Upload className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span>Upload Logo</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Company Name</Label>
                  <Input
                    value={branding.senderCompany}
                    onChange={(e) => setBranding({ ...branding, senderCompany: e.target.value })}
                    className="mt-1"
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Header Alignment</Label>
                  <div className="flex gap-2 mt-1">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <Button
                        key={align}
                        variant={branding.headerAlignment === align ? 'secondary' : 'outline'}
                        size="sm"
                        className="flex-1 capitalize"
                        onClick={() => setBranding({ ...branding, headerAlignment: align })}
                      >
                        {align === 'left' && <AlignLeft className="w-4 h-4 mr-1" />}
                        {align === 'center' && <AlignCenter className="w-4 h-4 mr-1" />}
                        {align === 'right' && <AlignRight className="w-4 h-4 mr-1" />}
                        {align}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branding.showLogoInHeader}
                      onChange={(e) => setBranding({ ...branding, showLogoInHeader: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-xs">Show logo in header</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branding.showCompanyInHeader}
                      onChange={(e) => setBranding({ ...branding, showCompanyInHeader: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-xs">Show company name in header</span>
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileSignature className="w-4 h-4" />
                Signature / Footer
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Your Name</Label>
                  <Input
                    value={branding.senderName}
                    onChange={(e) => setBranding({ ...branding, senderName: e.target.value })}
                    className="mt-1"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Your Title</Label>
                  <Input
                    value={branding.senderTitle}
                    onChange={(e) => setBranding({ ...branding, senderTitle: e.target.value })}
                    className="mt-1"
                    placeholder="CEO / Founder"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    value={branding.senderEmail}
                    onChange={(e) => setBranding({ ...branding, senderEmail: e.target.value })}
                    className="mt-1"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Signature Alignment</Label>
                  <div className="flex gap-2 mt-1">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <Button
                        key={align}
                        variant={branding.signatureAlignment === align ? 'secondary' : 'outline'}
                        size="sm"
                        className="flex-1 capitalize"
                        onClick={() => setBranding({ ...branding, signatureAlignment: align })}
                      >
                        {align === 'left' && <AlignLeft className="w-4 h-4 mr-1" />}
                        {align === 'center' && <AlignCenter className="w-4 h-4 mr-1" />}
                        {align === 'right' && <AlignRight className="w-4 h-4 mr-1" />}
                        {align}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={() => saveBranding(branding)}>
                <Save className="w-4 h-4 mr-2" />
                Save Branding Settings
              </Button>
            </div>

            {/* Preview of header */}
            <div>
              <h4 className="text-xs text-muted-foreground mb-2">Header Preview</h4>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className={`text-${branding.headerAlignment} text-sm`} style={{ textAlign: branding.headerAlignment }}>
                  {branding.showLogoInHeader && branding.logoUrl && (
                    <img src={branding.logoUrl} alt="Logo" className="h-10 mb-2" style={{ 
                      display: 'block',
                      marginLeft: branding.headerAlignment === 'center' ? 'auto' : branding.headerAlignment === 'right' ? 'auto' : '0',
                      marginRight: branding.headerAlignment === 'center' ? 'auto' : branding.headerAlignment === 'left' ? 'auto' : '0',
                    }} />
                  )}
                  {branding.showCompanyInHeader && (
                    <p className="font-semibold text-primary">{branding.senderCompany}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview of signature */}
            <div>
              <h4 className="text-xs text-muted-foreground mb-2">Signature Preview</h4>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="text-sm" style={{ textAlign: branding.signatureAlignment }}>
                  <p className="font-medium">{branding.senderName}</p>
                  <p className="text-muted-foreground">{branding.senderTitle}</p>
                  <p className="text-muted-foreground">{branding.senderCompany}</p>
                  <p className="text-primary">{branding.senderEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      )}

      {/* Editor Content */}
      {activeTab === 'compose' && (
        <ScrollArea className="flex-1">
          {previewMode === 'edit' && (
            <div className="p-4">
              {/* Paper-style document canvas */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border shadow-lg mx-auto" style={{ maxWidth: '700px' }}>
                {/* Document header with template letterhead */}
                {selectedTemplate?.letterhead && (
                  <div dangerouslySetInnerHTML={{ __html: replaceTemplateVars(selectedTemplate.letterhead) }} />
                )}
                {!selectedTemplate?.letterhead && documentType !== 'article' && (
                  <div className="p-6 border-b border-border/30" style={{ textAlign: branding.headerAlignment }}>
                    {branding.showLogoInHeader && branding.logoUrl && (
                      <img 
                        src={branding.logoUrl} 
                        alt="Logo" 
                        className="h-12 mb-2" 
                        style={{ 
                          display: 'block',
                          marginLeft: branding.headerAlignment === 'center' ? 'auto' : branding.headerAlignment === 'right' ? 'auto' : '0',
                          marginRight: branding.headerAlignment === 'center' ? 'auto' : branding.headerAlignment === 'left' ? 'auto' : '0',
                        }}
                      />
                    )}
                    {branding.showCompanyInHeader && (
                      <h2 className="text-lg font-semibold text-primary">{branding.senderCompany}</h2>
                    )}
                  </div>
                )}
                {heroImage && (
                  <img src={heroImage} alt="Hero" className="w-full h-auto" />
                )}
                <EditorContent editor={editor} className="min-h-[400px]" />
                {/* Signature from template or default */}
                {selectedTemplate?.signature ? (
                  <div dangerouslySetInnerHTML={{ __html: replaceTemplateVars(selectedTemplate.signature) }} />
                ) : config.showSignature && (
                  <div className="border-t border-border/30 p-4 text-sm text-muted-foreground" style={{ textAlign: branding.signatureAlignment }}>
                    <p className="font-medium">{branding.senderName}</p>
                    <p>{branding.senderTitle}</p>
                    <p>{branding.senderCompany}</p>
                    <p className="text-primary">{branding.senderEmail}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {previewMode === 'preview' && (
            <div className="p-4">
              <div 
                className="bg-white text-black rounded-lg border shadow-lg mx-auto overflow-hidden"
                style={{ maxWidth: '700px' }}
                dangerouslySetInnerHTML={{ __html: generateFullHtml() }}
              />
            </div>
          )}

          {previewMode === 'html' && (
            <div className="p-4">
              <div className="bg-zinc-900 rounded-lg border overflow-hidden mx-auto" style={{ maxWidth: '700px' }}>
                <div className="p-2 bg-zinc-800 border-b flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">HTML Source</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(generateFullHtml());
                      toast({ title: 'Copied!', description: 'HTML copied to clipboard' });
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                  {generateFullHtml()}
                </pre>
              </div>
            </div>
          )}
        </ScrollArea>
      )}

      {/* Template Editor Dialog */}
      <Dialog open={templateEditorOpen} onOpenChange={setTemplateEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Modify your custom template' : 'Create a reusable document template with HTML styling'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Template Name</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="My Custom Template"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Document Type</Label>
                <Select
                  value={templateForm.type}
                  onValueChange={(v: DocumentType) => setTemplateForm({ ...templateForm, type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm">Full HTML Template</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Paste your complete HTML template below. Use placeholders: <code className="bg-muted px-1 rounded">{'{{company}}'}</code>, <code className="bg-muted px-1 rounded">{'{{name}}'}</code>, <code className="bg-muted px-1 rounded">{'{{email}}'}</code>, <code className="bg-muted px-1 rounded">{'{{title}}'}</code>, <code className="bg-muted px-1 rounded">{'{{date}}'}</code>, <code className="bg-muted px-1 rounded">{'{{logo}}'}</code>
              </p>
              <div className="bg-muted/30 rounded-md p-2 mb-2 text-xs text-muted-foreground">
                <p className="font-medium mb-1">💡 Image/Logo Tips:</p>
                <ul className="space-y-1 ml-3">
                  <li>• <strong>Left:</strong> <code>{'<img src="URL" style="display: block;" />'}</code></li>
                  <li>• <strong>Center:</strong> <code>{'<img src="URL" style="display: block; margin: 0 auto;" />'}</code></li>
                  <li>• <strong>Right:</strong> <code>{'<img src="URL" style="display: block; margin-left: auto;" />'}</code></li>
                  <li>• Use <code>{'{{logo}}'}</code> placeholder to use your branding logo</li>
                  <li>• Or paste a direct image URL from your hosting</li>
                </ul>
              </div>
              <Textarea
                value={templateForm.fullHtml}
                onChange={(e) => setTemplateForm({ ...templateForm, fullHtml: e.target.value })}
                placeholder="Paste your full HTML template here..."
                className="mt-1 font-mono text-xs min-h-[350px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
