import type { ComponentType } from "react";
import { useState, useCallback, useRef } from "react";
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
} from "lucide-react";

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

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'professional',
    name: 'Professional',
    icon: Mail,
    letterhead: `<div style="text-align: center; padding: 20px; border-bottom: 2px solid #10b981;">
      <h1 style="margin: 0; color: #10b981; font-size: 24px;">Your Company</h1>
      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Professional Excellence</p>
    </div>`,
    signature: `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-weight: 600;">{{name}}</p>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">{{title}}</p>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">{{company}}</p>
      <p style="margin: 8px 0 0 0; color: #10b981; font-size: 14px;">{{email}}</p>
    </div>`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: Newspaper,
    letterhead: `<div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; color: white; font-size: 28px;">Newsletter</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Monthly Updates & Insights</p>
    </div>`,
    signature: `<div style="margin-top: 30px; padding: 20px; background: #f3f4f6; text-align: center; border-radius: 0 0 8px 8px;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">You're receiving this because you subscribed to our newsletter.</p>
      <p style="margin: 8px 0 0 0;"><a href="#" style="color: #10b981; text-decoration: underline;">Unsubscribe</a></p>
    </div>`,
  },
  {
    id: 'announcement',
    name: 'Announcement',
    icon: Megaphone,
    letterhead: `<div style="background: #1f2937; padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: #10b981; font-size: 32px; letter-spacing: 2px;">ANNOUNCEMENT</h1>
    </div>`,
    signature: `<div style="margin-top: 30px; padding: 20px; background: #1f2937; text-align: center;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">{{company}} | All Rights Reserved</p>
    </div>`,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    icon: FileText,
    letterhead: `<div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
      <p style="margin: 0; font-weight: 600; font-size: 18px;">{{company}}</p>
    </div>`,
    signature: `<div style="margin-top: 30px;">
      <p style="margin: 0;">Best regards,</p>
      <p style="margin: 8px 0 0 0; font-weight: 600;">{{name}}</p>
    </div>`,
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
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [logoUrl, setLogoUrl] = useState("");
  const [senderName, setSenderName] = useState("Your Name");
  const [senderTitle, setSenderTitle] = useState("Your Title");
  const [senderCompany, setSenderCompany] = useState("Your Company");
  const [senderEmail, setSenderEmail] = useState("you@company.com");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const replaceVariables = (text: string): string => {
    let result = text;
    if (currentContact) {
      Object.entries(currentContact).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
      });
    }
    result = result.replace(/{{name}}/g, senderName);
    result = result.replace(/{{title}}/g, senderTitle);
    result = result.replace(/{{company}}/g, senderCompany);
    result = result.replace(/{{email}}/g, senderEmail);
    return result;
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
  };

  const handleExport = () => {
    if (!editor) return;
    const bodyHtml = editor.getHTML();
    const letterhead = replaceVariables(selectedTemplate.letterhead);
    const signature = replaceVariables(selectedTemplate.signature);
    
    const fullHtml = `<!DOCTYPE html>
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
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subject || "email"}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
              variant="default"
              size="sm"
              onClick={handleExport}
              data-testid="button-export-email"
            >
              <Download className="w-4 h-4 mr-2" />
              Export HTML
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
            <div className="p-3 border-b border-border/50">
              <Input
                placeholder="Email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-md"
                data-testid="input-email-subject"
              />
            </div>

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
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-auto p-3">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Choose a template for your email</p>
              {EMAIL_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className={`p-3 cursor-pointer hover-elevate ${selectedTemplate.id === template.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedTemplate(template)}
                    data-testid={`template-${template.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{template.name}</span>
                    </div>
                  </Card>
                );
              })}
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
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Configure your signature details</p>
              
              <div className="space-y-2">
                <Label htmlFor="logo-url" className="text-xs">Logo URL</Label>
                <Input
                  id="logo-url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="text-sm"
                  data-testid="input-logo-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender-name" className="text-xs">Your Name</Label>
                <Input
                  id="sender-name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="text-sm"
                  data-testid="input-sender-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender-title" className="text-xs">Your Title</Label>
                <Input
                  id="sender-title"
                  value={senderTitle}
                  onChange={(e) => setSenderTitle(e.target.value)}
                  className="text-sm"
                  data-testid="input-sender-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender-company" className="text-xs">Company</Label>
                <Input
                  id="sender-company"
                  value={senderCompany}
                  onChange={(e) => setSenderCompany(e.target.value)}
                  className="text-sm"
                  data-testid="input-sender-company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender-email" className="text-xs">Email</Label>
                <Input
                  id="sender-email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="text-sm"
                  data-testid="input-sender-email"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
