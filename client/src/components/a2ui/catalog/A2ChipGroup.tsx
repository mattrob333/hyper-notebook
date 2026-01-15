/**
 * A2ChipGroup
 *
 * Renders a group of chip/tag-style buttons for selection.
 * Supports single or multi-select modes.
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipOption {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}

interface A2ChipGroupProps {
  options: ChipOption[];
  defaultValues?: string[];
  onChange?: (values: string[]) => void;
  onAction?: (action: string, data?: { values: string[] }) => void;
  action?: string;
  label?: string;
  multiSelect?: boolean;
  dismissible?: boolean;
  className?: string;
}

// Predefined chip colors
const CHIP_COLORS: Record<string, string> = {
  default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  primary: 'bg-primary/20 text-primary border-primary/50 hover:bg-primary/30',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30',
  green: 'bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500/30',
  pink: 'bg-pink-500/20 text-pink-300 border-pink-500/50 hover:bg-pink-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30',
};

export function A2ChipGroup({
  options = [],
  defaultValues = [],
  onChange,
  onAction,
  action,
  label,
  multiSelect = true,
  dismissible = false,
  className,
}: A2ChipGroupProps) {
  const [selected, setSelected] = useState<string[]>(defaultValues);

  const handleToggle = (value: string) => {
    let newSelected: string[];

    if (multiSelect) {
      if (selected.includes(value)) {
        newSelected = selected.filter((v) => v !== value);
      } else {
        newSelected = [...selected, value];
      }
    } else {
      newSelected = selected.includes(value) ? [] : [value];
    }

    setSelected(newSelected);
    onChange?.(newSelected);
    if (action && onAction) {
      onAction(action, { values: newSelected });
    }
  };

  const handleDismiss = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = selected.filter((v) => v !== value);
    setSelected(newSelected);
    onChange?.(newSelected);
    if (action && onAction) {
      onAction(action, { values: newSelected });
    }
  };

  if (!options.length) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)} data-testid="a2ui-chip-group">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          const colorClass = option.color
            ? CHIP_COLORS[option.color] || CHIP_COLORS.default
            : CHIP_COLORS.default;

          return (
            <Badge
              key={option.value}
              variant="outline"
              onClick={() => handleToggle(option.value)}
              className={cn(
                'cursor-pointer transition-all px-3 py-1.5 text-sm',
                isSelected
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-background ' + colorClass
                  : 'bg-muted/50 hover:bg-muted',
                isSelected && colorClass
              )}
            >
              {option.icon && <span className="mr-1.5">{option.icon}</span>}
              {option.label}
              {dismissible && isSelected && (
                <X
                  className="ml-1.5 h-3 w-3 hover:text-destructive"
                  onClick={(e) => handleDismiss(option.value, e)}
                />
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export default A2ChipGroup;
