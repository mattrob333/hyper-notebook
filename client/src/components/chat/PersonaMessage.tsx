/**
 * PersonaMessage
 *
 * Renders a chat message from a persona agent with their avatar,
 * name, role, and department-styled appearance.
 */

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Copy, Pin, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DebateMessage } from '@/lib/store';

interface PersonaMessageProps {
  message: DebateMessage;
  onCopy?: (content: string) => void;
  onSendToEditor?: (content: string) => void;
  className?: string;
}

// Department color schemes
const departmentColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  executive: {
    bg: 'bg-purple-500/5',
    border: 'border-l-purple-500',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  sales: {
    bg: 'bg-blue-500/5',
    border: 'border-l-blue-500',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  marketing: {
    bg: 'bg-pink-500/5',
    border: 'border-l-pink-500',
    text: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-300',
  },
  product: {
    bg: 'bg-green-500/5',
    border: 'border-l-green-500',
    text: 'text-green-400',
    badge: 'bg-green-500/20 text-green-300',
  },
  engineering: {
    bg: 'bg-orange-500/5',
    border: 'border-l-orange-500',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300',
  },
  research: {
    bg: 'bg-cyan-500/5',
    border: 'border-l-cyan-500',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  operations: {
    bg: 'bg-yellow-500/5',
    border: 'border-l-yellow-500',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300',
  },
  default: {
    bg: 'bg-gray-500/5',
    border: 'border-l-gray-500',
    text: 'text-gray-400',
    badge: 'bg-gray-500/20 text-gray-300',
  },
};

function PersonaMessageComponent({
  message,
  onCopy,
  onSendToEditor,
  className,
}: PersonaMessageProps) {
  // Extract persona info from extended message type
  const personaName = message.personaName || 'Agent';
  const personaAvatar = message.personaAvatar;
  const personaDepartment = (message as any).personaDepartment || 'default';
  const personaRole = (message as any).personaRole || '';

  // Get initials for fallback
  const initials = personaName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colors = departmentColors[personaDepartment] || departmentColors.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('group', className)}
    >
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border-l-4',
          colors.bg,
          colors.border
        )}
      >
        <Avatar className="w-10 h-10 shrink-0 mt-0.5">
          {personaAvatar && <AvatarImage src={personaAvatar} alt={personaName} />}
          <AvatarFallback className={cn('font-medium', colors.badge)}>
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header with name, role, department */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('font-semibold text-sm', colors.text)}>{personaName}</span>
            {personaRole && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {personaRole}
              </span>
            )}
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', colors.badge)}>
              {personaDepartment}
            </Badge>
          </div>

          {/* Message content */}
          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ThumbsUp className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ThumbsDown className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onCopy?.(message.content)}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Pin className="w-3.5 h-3.5" />
            </Button>
            {onSendToEditor && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                onClick={() => onSendToEditor(message.content)}
              >
                <Mail className="w-3.5 h-3.5" />
                Send to Editor
              </Button>
            )}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export const PersonaMessage = memo(PersonaMessageComponent);
export default PersonaMessage;
