import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Plus,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface Email {
  id: string;
  to: string;
  subject: string;
  status: 'draft' | 'sent' | 'failed';
  sentAt?: Date;
}

interface EmailStudioProps {
  emails: Email[];
  onSendEmail: (email: Omit<Email, 'id' | 'status'>) => void;
  onDeleteEmail: (id: string) => void;
}

const statusIcons = {
  draft: <Clock className="w-4 h-4" />,
  sent: <CheckCircle2 className="w-4 h-4 text-chart-2" />,
  failed: <XCircle className="w-4 h-4 text-destructive" />,
};

export default function EmailStudio({ emails, onSendEmail, onDeleteEmail }: EmailStudioProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState({ to: '', subject: '', body: '' });

  const handleSend = () => {
    if (newEmail.to && newEmail.subject) {
      onSendEmail({ to: newEmail.to, subject: newEmail.subject });
      setNewEmail({ to: '', subject: '', body: '' });
      setDialogOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="email-studio">
      <div className="p-4 border-b">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" data-testid="button-compose-email">
              <Plus className="w-4 h-4 mr-2" />
              Compose Email
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Compose Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-to">To</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={newEmail.to}
                  onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                  data-testid="input-email-to"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  placeholder="Email subject"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                  data-testid="input-email-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-body">Body</Label>
                <Textarea
                  id="email-body"
                  placeholder="Write your email content..."
                  className="min-h-32"
                  value={newEmail.body}
                  onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                  data-testid="input-email-body"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSend}
                disabled={!newEmail.to || !newEmail.subject}
                data-testid="button-send-email"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {emails.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No emails yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Send reports and analyses via email
              </p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                className="group flex items-start gap-3 p-3 rounded-md hover-elevate"
                data-testid={`email-item-${email.id}`}
              >
                <Mail className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{email.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">To: {email.to}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {statusIcons[email.status]}
                      {email.status}
                    </Badge>
                    {email.sentAt && (
                      <span className="text-xs text-muted-foreground">
                        {email.sentAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => onDeleteEmail(email.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
