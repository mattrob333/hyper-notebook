/**
 * PersonaChip
 *
 * Small chip displaying a persona's avatar and name.
 * Used in the chat header to show active debate participants.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PersonaAgent } from '@/lib/store';

interface PersonaChipProps {
  persona: PersonaAgent;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PersonaChip({ persona, isActive, onClick, className }: PersonaChipProps) {
  // Get initials for fallback
  const initials = persona.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Department colors
  const departmentColors: Record<string, string> = {
    executive: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    sales: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    marketing: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
    product: 'bg-green-500/20 text-green-300 border-green-500/50',
    engineering: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    research: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    operations: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    default: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
  };

  const colorClass = departmentColors[persona.department] || departmentColors.default;

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-all',
        colorClass,
        isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        className
      )}
      onClick={onClick}
    >
      <Avatar className="h-5 w-5">
        {persona.avatarUrl && <AvatarImage src={persona.avatarUrl} alt={persona.name} />}
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium">{persona.name.split(' ')[0]}</span>
    </Badge>
  );
}

export default PersonaChip;
