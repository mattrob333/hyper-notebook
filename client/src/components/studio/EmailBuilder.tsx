import type { ComponentType } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Pilcrow,
  Palette,
  Highlighter,
  Save,
  Download,
  Undo,
  Redo,
  ArrowLeft,
  Upload,
  Users,
  ChevronLeft,
  ChevronRight,
  FileText,
  Newspaper,
  Mail,
  Megaphone,
  Send,
  Eye,
  Code,
  Briefcase,
  Heart,
  Gift,
  Calendar,
  Trash2,
  Plus,
  Image as ImageIconLucide,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailBuilderProps {
  onBack?: () => void;
}

interface Contact {
  name: string;
  email: string;
  company?: string;
  title?: string;
  [key: string]: string | undefined;
}

interface EmailTemplate {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  letterhead: string;
  signature: string;
}

interface EmailTemplateWithContent extends EmailTemplate {
  defaultContent?: string;
  category: 'business' | 'marketing' | 'personal';
}

const EMAIL_TEMPLATES: EmailTemplateWithContent[] = [
  {
    id: 'professional',
    name: 'Professional',
    icon: Mail,
    category: 'business',
    letterhead: `<div style="text-align: center; padding: 20px; border-bottom: 2px solid #10b981;">
      {{logo}}
      <h1 style="margin: 0; color: #10b981; font-size: 24px;">{{company}}</h1>
      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Professional Excellence</p>
    </div>`,
    signature: `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-weight: 600;">{{name}}</p>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">{{title}}</p>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">{{company}}</p>
      <p style="margin: 8px 0 0 0; color: #10b981; font-size: 14px;">{{email}}</p>
    </div>`,
    defaultContent: '<p>Dear {{recipient_name}},</p><p>I hope this email finds you well.</p><p></p><p>Best regards</p>',
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: Newspaper,
    category: 'marketing',
    letterhead: `<div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      {{logo}}
      <h1 style="margin: 0; color: white; font-size: 28px;">{{newsletter_title}}</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">{{newsletter_subtitle}}</p>
    </div>`,
    signature: `<div style="margin-top: 30px; padding: 20px; background: #f3f4f6; text-align: center; border-radius: 0 0 8px 8px;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">You're receiving this because you subscribed to our newsletter.</p>
      <p style="margin: 8px 0 0 0;"><a href="#" style="color: #10b981; text-decoration: underline;">Unsubscribe</a> | <a href="#" style="color: #10b981; text-decoration: underline;">View in browser</a></p>
    </div>`,
    defaultContent: `<h2 style="color: #059669;">📰 This Week's Highlights</h2>
<p>Welcome to this week's newsletter! Here's what we've been up to:</p>
<h3>🎯 Featured Article</h3>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>
<h3>📊 By the Numbers</h3>
<ul>
<li><strong>50%</strong> increase in engagement</li>
<li><strong>1,000+</strong> new subscribers</li>
<li><strong>25</strong> articles published</li>
</ul>
<h3>🔗 Quick Links</h3>
<p>• <a href="#">Read our latest blog post</a><br>• <a href="#">Check out new features</a><br>• <a href="#">Join our community</a></p>`,
  },
  {
    id: 'proposal',
    name: 'Business Proposal',
    icon: Briefcase,
    category: 'business',
    letterhead: `<div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; text-align: center;">
      {{logo}}
      <h1 style="margin: 0; color: white; font-size: 28px;">Business Proposal</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">{{company}}</p>
    </div>`,
    signature: `<div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
      <p style="margin: 0; font-weight: 600; color: #1e3a5f;">{{name}}</p>
      <p style="margin: 4px 0; color: #64748b; font-size: 14px;">{{title}} | {{company}}</p>
      <p style="margin: 8px 0 0 0; color: #2563eb; font-size: 14px;">{{email}} | {{phone}}</p>
    </div>`,
    defaultContent: `<h2>Executive Summary</h2>
<p>Thank you for considering {{company}} for your upcoming project. We are excited to present this proposal outlining our approach, timeline, and investment.</p>
<h2>Project Scope</h2>
<p>Based on our discussion, we understand you need:</p>
<ul>
<li>Requirement 1</li>
<li>Requirement 2</li>
<li>Requirement 3</li>
</ul>
<h2>Our Approach</h2>
<p>We will deliver this project in three phases:</p>
<ol>
<li><strong>Discovery Phase</strong> (Week 1-2)</li>
<li><strong>Development Phase</strong> (Week 3-6)</li>
<li><strong>Launch Phase</strong> (Week 7-8)</li>
</ol>
<h2>Investment</h2>
<table style="width: 100%; border-collapse: collapse;">
<tr style="background: #f1f5f9;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Service</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Price</strong></td></tr>
<tr><td style="padding: 10px; border: 1px solid #e2e8f0;">Service Package</td><td style="padding: 10px; border: 1px solid #e2e8f0;">$X,XXX</td></tr>
</table>
<h2>Next Steps</h2>
<p>Please reply to this email or schedule a call to discuss this proposal further.</p>`,
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    icon: Heart,
    category: 'marketing',
    letterhead: `<div style="background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 40px; text-align: center;">
      {{logo}}
      <h1 style="margin: 0; color: white; font-size: 32px;">Welcome! 🎉</h1>
    </div>`,
    signature: `<div style="margin-top: 30px; padding: 20px; text-align: center; background: #fdf2f8; border-radius: 8px;">
      <p style="margin: 0; color: #be185d;">Need help? Reply to this email or visit our <a href="#" style="color: #ec4899;">Help Center</a></p>
    </div>`,
    defaultContent: `<h2 style="text-align: center; color: #be185d;">You're officially part of the family!</h2>
<p>Hi {{recipient_name}},</p>
<p>We're thrilled to have you join us. Here's what you can do next:</p>
<div style="background: #fdf2f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
<p style="margin: 0;"><strong>🚀 Get Started</strong></p>
<p>Complete your profile to personalize your experience.</p>
</div>
<div style="background: #fdf2f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
<p style="margin: 0;"><strong>📚 Learn More</strong></p>
<p>Check out our getting started guide.</p>
</div>
<div style="background: #fdf2f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
<p style="margin: 0;"><strong>💬 Connect</strong></p>
<p>Join our community and meet other members.</p>
</div>`,
  },
  {
    id: 'event',
    name: 'Event Invitation',
    icon: Calendar,
    category: 'marketing',
    letterhead: `<div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 40px; text-align: center;">
      {{logo}}
      <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">You're Invited</p>
      <h1 style="margin: 0; color: white; font-size: 28px;">{{event_name}}</h1>
      <p style="margin: 10px 0 0 0; color: white; font-size: 18px;">📅 {{event_date}} | 📍 {{event_location}}</p>
    </div>`,
    signature: `<div style="margin-top: 30px; padding: 20px; text-align: center; background: #f5f3ff; border-radius: 8px;">
      <a href="#" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">RSVP Now</a>
      <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 12px;">Can't make it? <a href="#" style="color: #8b5cf6;">Let us know</a></p>
    </div>`,
    defaultContent: `<p>Dear {{recipient_name}},</p>
<p>We're excited to invite you to our upcoming event!</p>
<h3>Event Details</h3>
<ul>
<li><strong>What:</strong> {{event_name}}</li>
<li><strong>When:</strong> {{event_date}}</li>
<li><strong>Where:</strong> {{event_location}}</li>
</ul>
<h3>What to Expect</h3>
<p>Join us for an evening of networking, insights, and inspiration. You'll have the opportunity to:</p>
<ul>
<li>Connect with industry leaders</li>
<li>Learn about the latest trends</li>
<li>Enjoy refreshments and networking</li>
</ul>
<p>Space is limited, so please RSVP as soon as possible.</p>`,
  },
  {
    id: 'announcement',
    name: 'Announcement',
    icon: Megaphone,
    category: 'marketing',
    letterhead: `<div style="background: #1f2937; padding: 24px; text-align: center;">
      {{logo}}
      <h1 style="margin: 0; color: #10b981; font-size: 32px; letter-spacing: 2px;">ANNOUNCEMENT</h1>
    </div>`,
    signature: `<div style="margin-top: 30px; padding: 20px; background: #1f2937; text-align: center;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">{{company}} | All Rights Reserved</p>
    </div>`,
    defaultContent: '<h2 style="text-align: center;">Big News!</h2><p>We have some exciting news to share with you...</p>',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    icon: FileText,
    category: 'business',
    letterhead: `<div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
      {{logo}}
      <p style="margin: 0; font-weight: 600; font-size: 18px;">{{company}}</p>
    </div>`,
    signature: `<div style="margin-top: 30px;">
      <p style="margin: 0;">Best regards,</p>
      <p style="margin: 8px 0 0 0; font-weight: 600;">{{name}}</p>
    </div>`,
    defaultContent: '<p>Dear {{recipient_name}},</p><p></p><p>Best regards</p>',
  },
];

const textColors = [
  "#000000", "#374151", "#6B7280", "#9CA3AF",
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
];

const highlightColors = [
  "#FEF3C7", "#FEE2E2", "#DBEAFE", "#D1FAE5",
  "#E0E7FF", "#FCE7F3", "#CFFAFE", "#FEF9C3",
];

export default function EmailBuilder({ onBack }: EmailBuilderProps) {
  const [subject, setSubject] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateWithContent>(EMAIL_TEMPLATES[0]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [senderName, setSenderName] = useState("Your Name");
  const [senderTitle, setSenderTitle] = useState("Your Title");
  const [senderCompany, setSenderCompany] = useState("Your Company");
  const [senderEmail, setSenderEmail] = useState("you@company.com");
  const [senderPhone, setSenderPhone] = useState("");
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'html'>('edit');
  const [isSending, setIsSending] = useState(false);
  const [newsletterTitle, setNewsletterTitle] = useState("Monthly Newsletter");
  const [newsletterSubtitle, setNewsletterSubtitle] = useState("Updates & Insights");
  const [eventName, setEventName] = useState("Annual Conference 2025");
  const [eventDate, setEventDate] = useState("January 15, 2025");
  const [eventLocation, setEventLocation] = useState("Virtual Event");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start composing your email...",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-md",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  const currentContact = contacts[currentContactIndex] || null;

  // Get the effective logo (file upload takes priority over URL)
  const effectiveLogo = logoFile || logoUrl;
  const logoHtml = effectiveLogo 
    ? `<img src="${effectiveLogo}" alt="Logo" style="max-height: 60px; max-width: 200px; margin-bottom: 10px;" />`
    : '';

  const replaceVariables = (text: string): string => {
    let result = text;
    if (currentContact) {
      Object.entries(currentContact).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
      });
    }
    // Replace logo placeholder
    result = result.replace(/{{logo}}/g, logoHtml);
    // Sender info
    result = result.replace(/{{name}}/g, senderName);
    result = result.replace(/{{title}}/g, senderTitle);
    result = result.replace(/{{company}}/g, senderCompany);
    result = result.replace(/{{email}}/g, senderEmail);
    result = result.replace(/{{phone}}/g, senderPhone);
    // Newsletter variables
    result = result.replace(/{{newsletter_title}}/g, newsletterTitle);
    result = result.replace(/{{newsletter_subtitle}}/g, newsletterSubtitle);
    // Event variables
    result = result.replace(/{{event_name}}/g, eventName);
    result = result.replace(/{{event_date}}/g, eventDate);
    result = result.replace(/{{event_location}}/g, eventLocation);
    // Recipient placeholder
    result = result.replace(/{{recipient_name}}/g, currentContact?.name || '[Recipient Name]');
    return result;
  };

  // Handle logo file upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoFile(dataUrl);
      setLogoUrl(''); // Clear URL when file is uploaded
      toast({
        title: 'Logo uploaded',
        description: 'Your logo has been added to the email',
      });
    };
    reader.readAsDataURL(file);
  };

  // Load template content when template changes
  useEffect(() => {
    if (editor && selectedTemplate.defaultContent) {
      editor.commands.setContent(selectedTemplate.defaultContent);
    }
  }, [selectedTemplate.id]);

  // Handle sending email
  const handleSendEmail = async () => {
    if (!subject.trim()) {
      toast({
        title: 'Subject required',
        description: 'Please enter an email subject',
        variant: 'destructive',
      });
      return;
    }

    if (contacts.length === 0) {
      toast({
        title: 'No recipients',
        description: 'Please upload a CSV with contacts or add recipients',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    
    // Simulate sending (in production, this would call an email API)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Emails sent!',
      description: `Successfully sent to ${contacts.length} recipient${contacts.length > 1 ? 's' : ''}`,
    });
    
    setIsSending(false);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const parsedContacts: Contact[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const contact: Contact = { name: '', email: '' };
        headers.forEach((header, idx) => {
          contact[header] = values[idx] || '';
        });
        if (contact.name && contact.email) {
          parsedContacts.push(contact);
        }
      }

      setContacts(parsedContacts);
      setCurrentContactIndex(0);
    };
    reader.readAsText(file);
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

  const handleSave = () => {
    if (!editor) return;
    const html = editor.getHTML();
    console.log("Email saved:", { subject, html });
    toast({ title: 'Saved!', description: 'Email draft saved' });
  };

  const generateFullHtml = useCallback(() => {
    if (!editor) return '';
    const bodyHtml = replaceVariables(editor.getHTML());
    const letterhead = replaceVariables(selectedTemplate.letterhead);
    const signature = replaceVariables(selectedTemplate.signature);
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f9fafb; }
    .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .email-body { padding: 24px; }
  </style>
</head>
<body>
  <div class="email-container">
    ${letterhead}
    <div class="email-body">
      ${bodyHtml}
    </div>
    ${signature}
  </div>
</body>
</html>`;
  }, [editor, selectedTemplate, subject, replaceVariables]);

  const handleExport = () => {
    const fullHtml = generateFullHtml();
    if (!fullHtml) return;
    
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subject || "email"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: 'HTML file downloaded' });
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-card" data-testid="email-builder">
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-semibold text-base">Email Builder</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Preview Mode Toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={previewMode === 'edit' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setPreviewMode('edit')}
              >
                Edit
              </Button>
              <Button
                variant={previewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setPreviewMode('preview')}
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
              <Button
                variant={previewMode === 'html' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setPreviewMode('html')}
              >
                <Code className="w-3 h-3 mr-1" />
                HTML
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              data-testid="button-save-email"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              data-testid="button-export-email"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSendEmail}
              disabled={isSending || contacts.length === 0}
              data-testid="button-send-email"
            >
              {isSending ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="compose" className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-2 rounded-lg bg-muted/50">
            <TabsTrigger value="compose" className="flex-1 text-xs rounded-md" data-testid="tab-compose">
              Compose
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 text-xs rounded-md" data-testid="tab-templates">
              Templates
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex-1 text-xs rounded-md" data-testid="tab-contacts">
              Contacts
            </TabsTrigger>
            <TabsTrigger value="signature" className="flex-1 text-xs rounded-md" data-testid="tab-signature">
              Signature
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="flex-1 flex flex-col mt-0 overflow-hidden">
            {/* Subject line - always visible */}
            <div className="p-3 border-b border-border/50">
              <Input
                placeholder="Email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-md"
                data-testid="input-email-subject"
              />
            </div>

            {/* Edit mode - show toolbar and editor */}
            {previewMode === 'edit' && (
            <>
            <div className="p-2 border-b border-border/50 flex items-center gap-1 flex-wrap bg-muted/30">
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()}
                className={`toggle-elevate ${editor.isActive("bold") ? "toggle-elevated" : ""}`} data-testid="button-bold">
                <Bold className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`toggle-elevate ${editor.isActive("italic") ? "toggle-elevated" : ""}`} data-testid="button-italic">
                <Italic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`toggle-elevate ${editor.isActive("underline") ? "toggle-elevated" : ""}`} data-testid="button-underline">
                <UnderlineIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`toggle-elevate ${editor.isActive("strike") ? "toggle-elevated" : ""}`} data-testid="button-strikethrough">
                <Strikethrough className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign("left").run()}
                className={`toggle-elevate ${editor.isActive({ textAlign: "left" }) ? "toggle-elevated" : ""}`} data-testid="button-align-left">
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign("center").run()}
                className={`toggle-elevate ${editor.isActive({ textAlign: "center" }) ? "toggle-elevated" : ""}`} data-testid="button-align-center">
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign("right").run()}
                className={`toggle-elevate ${editor.isActive({ textAlign: "right" }) ? "toggle-elevated" : ""}`} data-testid="button-align-right">
                <AlignRight className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`toggle-elevate ${editor.isActive("heading", { level: 1 }) ? "toggle-elevated" : ""}`} data-testid="button-heading-1">
                <Heading1 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`toggle-elevate ${editor.isActive("heading", { level: 2 }) ? "toggle-elevated" : ""}`} data-testid="button-heading-2">
                <Heading2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`toggle-elevate ${editor.isActive("bulletList") ? "toggle-elevated" : ""}`} data-testid="button-bullet-list">
                <List className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`toggle-elevate ${editor.isActive("orderedList") ? "toggle-elevated" : ""}`} data-testid="button-ordered-list">
                <ListOrdered className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-text-color">
                    <Palette className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-4 gap-1">
                    {textColors.map((color) => (
                      <button key={color} className="w-6 h-6 rounded-md border border-border/50 hover-elevate"
                        style={{ backgroundColor: color }}
                        onClick={() => editor.chain().focus().setColor(color).run()} />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" onClick={setLink}
                className={`toggle-elevate ${editor.isActive("link") ? "toggle-elevated" : ""}`} data-testid="button-link">
                <Link2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={addImage} data-testid="button-image">
                <ImageIcon className="w-4 h-4" />
              </Button>

              <div className="flex-1" />

              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()} data-testid="button-undo">
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()} data-testid="button-redo">
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="bg-background rounded-lg border border-border/50 overflow-hidden">
                  <div 
                    className="border-b border-border/30"
                    dangerouslySetInnerHTML={{ __html: replaceVariables(selectedTemplate.letterhead) }}
                  />
                  <EditorContent editor={editor} data-testid="editor-email-body" />
                  <div 
                    className="border-t border-border/30"
                    dangerouslySetInnerHTML={{ __html: replaceVariables(selectedTemplate.signature) }}
                  />
                </div>
              </div>
            </ScrollArea>
            </>
            )}

            {/* Preview mode - show rendered email */}
            {previewMode === 'preview' && (
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <div className="bg-white text-black rounded-lg border shadow-lg overflow-hidden max-w-[600px] mx-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: replaceVariables(selectedTemplate.letterhead) }}
                    />
                    <div className="p-6">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: replaceVariables(editor?.getHTML() || '') }}
                      />
                    </div>
                    <div 
                      dangerouslySetInnerHTML={{ __html: replaceVariables(selectedTemplate.signature) }}
                    />
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* HTML mode - show raw HTML code */}
            {previewMode === 'html' && (
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <div className="bg-zinc-900 rounded-lg border border-border/50 overflow-hidden">
                    <div className="p-2 bg-zinc-800 border-b border-border/50 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-mono">HTML Source</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const html = generateFullHtml();
                          navigator.clipboard.writeText(html);
                          toast({ title: 'Copied!', description: 'HTML copied to clipboard' });
                        }}
                      >
                        Copy HTML
                      </Button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                      {generateFullHtml()}
                    </pre>
                  </div>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Template List - Left Side */}
              <div className="w-1/3 border-r border-border/50 overflow-auto p-3">
                <p className="text-xs text-muted-foreground mb-3">Choose a template</p>
                
                {/* Business Templates */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    💼 Business
                  </h4>
                  <div className="space-y-1">
                    {EMAIL_TEMPLATES.filter(t => t.category === 'business').map((template) => {
                      const Icon = template.icon;
                      return (
                        <div
                          key={template.id}
                          className={`p-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
                            selectedTemplate.id === template.id 
                              ? 'bg-primary/10 ring-1 ring-primary' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                          data-testid={`template-${template.id}`}
                        >
                          <div className={`p-1.5 rounded ${selectedTemplate.id === template.id ? 'bg-primary/20' : 'bg-blue-500/10'}`}>
                            <Icon className={`w-3.5 h-3.5 ${selectedTemplate.id === template.id ? 'text-primary' : 'text-blue-500'}`} />
                          </div>
                          <span className="text-sm">{template.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Marketing Templates */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    📣 Marketing
                  </h4>
                  <div className="space-y-1">
                    {EMAIL_TEMPLATES.filter(t => t.category === 'marketing').map((template) => {
                      const Icon = template.icon;
                      return (
                        <div
                          key={template.id}
                          className={`p-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
                            selectedTemplate.id === template.id 
                              ? 'bg-primary/10 ring-1 ring-primary' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                          data-testid={`template-${template.id}`}
                        >
                          <div className={`p-1.5 rounded ${selectedTemplate.id === template.id ? 'bg-primary/20' : 'bg-emerald-500/10'}`}>
                            <Icon className={`w-3.5 h-3.5 ${selectedTemplate.id === template.id ? 'text-primary' : 'text-emerald-500'}`} />
                          </div>
                          <span className="text-sm">{template.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Template Preview - Right Side */}
              <div className="flex-1 overflow-auto p-4 bg-muted/30">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{selectedTemplate.name} Preview</h3>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      if (editor && selectedTemplate.defaultContent) {
                        editor.commands.setContent(selectedTemplate.defaultContent);
                      }
                      setPreviewMode('edit');
                      toast({ title: 'Template applied!', description: 'Switch to Compose tab to edit' });
                    }}
                  >
                    Use This Template
                  </Button>
                </div>
                <div className="bg-white text-black rounded-lg border shadow-md overflow-hidden transform scale-[0.85] origin-top">
                  <div 
                    dangerouslySetInnerHTML={{ __html: replaceVariables(selectedTemplate.letterhead) }}
                  />
                  <div className="p-4">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: replaceVariables(selectedTemplate.defaultContent || '<p>Start writing your email content here...</p>') }}
                    />
                  </div>
                  <div 
                    dangerouslySetInnerHTML={{ __html: replaceVariables(selectedTemplate.signature) }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="flex-1 overflow-auto p-3">
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Upload Contacts CSV</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  CSV should have headers: name, email, company, title
                </p>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-csv"
                >
                  <Upload className="w-4 h-4" />
                  Upload CSV
                </Button>
              </div>

              {contacts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      {contacts.length} contacts loaded
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setCurrentContactIndex(Math.max(0, currentContactIndex - 1))}
                        disabled={currentContactIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs">{currentContactIndex + 1} / {contacts.length}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setCurrentContactIndex(Math.min(contacts.length - 1, currentContactIndex + 1))}
                        disabled={currentContactIndex === contacts.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {currentContact && (
                    <Card className="p-3">
                      <p className="text-sm font-medium">{currentContact.name}</p>
                      <p className="text-xs text-muted-foreground">{currentContact.email}</p>
                      {currentContact.company && (
                        <p className="text-xs text-muted-foreground">{currentContact.company}</p>
                      )}
                      {currentContact.title && (
                        <p className="text-xs text-muted-foreground">{currentContact.title}</p>
                      )}
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="signature" className="flex-1 overflow-auto p-3">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">Configure your branding and signature</p>
                
                {/* Logo Upload Section */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Company Logo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {effectiveLogo ? (
                      <div className="space-y-3">
                        <img 
                          src={effectiveLogo} 
                          alt="Logo preview" 
                          className="max-h-16 max-w-[200px] mx-auto object-contain"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => logoInputRef.current?.click()}
                          >
                            Change
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setLogoFile(null);
                              setLogoUrl('');
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer py-4"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <ImageIconLucide className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Upload your logo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Or enter a URL:</p>
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      setLogoFile(null);
                    }}
                    className="text-sm"
                    data-testid="input-logo-url"
                  />
                </div>

                <Separator />

                {/* Sender Info */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">Sender Information</Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="sender-name" className="text-xs text-muted-foreground">Name</Label>
                      <Input
                        id="sender-name"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="text-sm"
                        data-testid="input-sender-name"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="sender-title" className="text-xs text-muted-foreground">Title</Label>
                      <Input
                        id="sender-title"
                        value={senderTitle}
                        onChange={(e) => setSenderTitle(e.target.value)}
                        className="text-sm"
                        data-testid="input-sender-title"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="sender-company" className="text-xs text-muted-foreground">Company</Label>
                    <Input
                      id="sender-company"
                      value={senderCompany}
                      onChange={(e) => setSenderCompany(e.target.value)}
                      className="text-sm"
                      data-testid="input-sender-company"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="sender-email" className="text-xs text-muted-foreground">Email</Label>
                      <Input
                        id="sender-email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="text-sm"
                        data-testid="input-sender-email"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="sender-phone" className="text-xs text-muted-foreground">Phone</Label>
                      <Input
                        id="sender-phone"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="text-sm"
                        data-testid="input-sender-phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Template-specific variables */}
                {(selectedTemplate.id === 'newsletter') && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold">Newsletter Settings</Label>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Newsletter Title</Label>
                        <Input
                          value={newsletterTitle}
                          onChange={(e) => setNewsletterTitle(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Subtitle</Label>
                        <Input
                          value={newsletterSubtitle}
                          onChange={(e) => setNewsletterSubtitle(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                {(selectedTemplate.id === 'event') && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold">Event Details</Label>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Event Name</Label>
                        <Input
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Date & Time</Label>
                        <Input
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Location</Label>
                        <Input
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
