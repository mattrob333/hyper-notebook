/**
 * AgentCheckbox
 *
 * A checkbox component for selecting a persona agent.
 * Displays avatar, name, role, and department with a checkbox.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PersonaAgent } from '@/lib/store';

interface AgentCheckboxProps {
  persona: PersonaAgent;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function AgentCheckbox({
  persona,
  checked,
  onCheckedChange,
  disabled,
  className,
}: AgentCheckboxProps) {
  // Get initials for fallback
  const initials = persona.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Department badge colors
  const departmentColors: Record<string, string> = {
    executive: 'bg-purple-500/20 text-purple-300',
    sales: 'bg-blue-500/20 text-blue-300',
    marketing: 'bg-pink-500/20 text-pink-300',
    product: 'bg-green-500/20 text-green-300',
    engineering: 'bg-orange-500/20 text-orange-300',
    research: 'bg-cyan-500/20 text-cyan-300',
    operations: 'bg-yellow-500/20 text-yellow-300',
    default: 'bg-gray-500/20 text-gray-300',
  };

  const deptColor = departmentColors[persona.department] || departmentColors.default;

  return (
    <Label
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border border-border/50',
        'hover:bg-accent/50 cursor-pointer transition-colors',
        checked && 'bg-accent/30 border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
      />

      <Avatar className="h-10 w-10">
        {persona.avatarUrl && <AvatarImage src={persona.avatarUrl} alt={persona.name} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{persona.name}</span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded uppercase', deptColor)}>
            {persona.department}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{persona.role}</p>
      </div>
    </Label>
  );
}

export default AgentCheckbox;
