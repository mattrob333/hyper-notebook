import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  FileText
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface EmailBuilderProps {
  onBack: () => void;
}

const emailTemplates = [
  { id: 'blank', name: 'Blank Email' },
  { id: 'professional', name: 'Professional Template' },
  { id: 'newsletter', name: 'Newsletter Template' },
  { id: 'followup', name: 'Follow-up Template' },
  { id: 'proposal', name: 'Proposal Template' },
];

export default function EmailBuilder({ onBack }: EmailBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    const body = editorRef.current?.innerHTML || '';
    console.log('Sending email:', { to: toEmail, subject, body });
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="flex flex-col h-full bg-sidebar" data-testid="email-builder">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-8 w-8"
            data-testid="button-back-to-studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-semibold text-base">Email Builder</h2>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="rounded-xl" data-testid="select-template">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {emailTemplates.map((template) => (
                <SelectItem 
                  key={template.id} 
                  value={template.id}
                  className="rounded-lg"
                >
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="To: recipient@email.com"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          className="rounded-xl"
          data-testid="input-email-to"
        />

        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-xl"
          data-testid="input-email-subject"
        />
      </div>

      <ScrollArea className="flex-1 px-4">
        <Card className="rounded-2xl overflow-hidden">
          <div className="bg-primary/10 p-4 border-b border-border/50">
            <div className="text-center">
              <h3 className="font-bold text-lg text-foreground">Your Company</h3>
              <p className="text-xs text-muted-foreground">Innovative Solutions for Your Business</p>
            </div>
          </div>

          <div className="p-3 border-b border-border/50 flex items-center gap-1 flex-wrap bg-muted/30">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => execCommand('bold')}
              data-testid="button-bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => execCommand('italic')}
              data-testid="button-italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => execCommand('underline')}
              data-testid="button-underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => execCommand('justifyLeft')}
              data-testid="button-align-left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => execCommand('justifyCenter')}
              data-testid="button-align-center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => execCommand('justifyRight')}
              data-testid="button-align-right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => execCommand('insertUnorderedList')}
              data-testid="button-list"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) execCommand('createLink', url);
              }}
              data-testid="button-link"
            >
              <Link2 className="w-3.5 h-3.5" />
            </Button>
            <div className="flex-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => execCommand('undo')}
              data-testid="button-undo"
            >
              <Undo className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => execCommand('redo')}
              data-testid="button-redo"
            >
              <Redo className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div
            ref={editorRef}
            contentEditable
            onPaste={handlePaste}
            className="min-h-[200px] p-4 text-sm focus:outline-none"
            data-placeholder="Compose your email here... Paste content from the AI chat to build your message."
            data-testid="editor-email-body"
          />

          <div className="bg-muted/30 p-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Best regards,</p>
              <p className="mt-2">John Smith</p>
              <p>Senior Account Manager</p>
              <p className="text-xs mt-2">Your Company Inc.</p>
              <p className="text-xs">123 Business Ave, Suite 100</p>
              <p className="text-xs">contact@yourcompany.com | (555) 123-4567</p>
            </div>
          </div>
        </Card>
      </ScrollArea>

      <div className="p-4 border-t flex items-center gap-2">
        <Button variant="outline" size="icon" className="shrink-0 rounded-xl">
          <Paperclip className="w-4 h-4" />
        </Button>
        <Button 
          className="flex-1 rounded-xl gap-2"
          onClick={handleSend}
          disabled={!toEmail || !subject}
          data-testid="button-send-email"
        >
          <Send className="w-4 h-4" />
          Send Email
        </Button>
      </div>
    </div>
  );
}
