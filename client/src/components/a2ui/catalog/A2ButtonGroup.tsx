/**
 * A2ButtonGroup
 *
 * Renders a group of mutually exclusive buttons (like radio buttons).
 * Used by AI to present options for the user to select.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonOption {
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
}

interface A2ButtonGroupProps {
  options: ButtonOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  onAction?: (action: string, data?: { value: string; label: string }) => void;
  action?: string;
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function A2ButtonGroup({
  options = [],
  defaultValue,
  onChange,
  onAction,
  action,
  label,
  orientation = 'horizontal',
  size = 'default',
  className,
}: A2ButtonGroupProps) {
  const [selected, setSelected] = useState<string | undefined>(defaultValue);

  const handleSelect = (option: ButtonOption) => {
    setSelected(option.value);
    onChange?.(option.value);
    if (action && onAction) {
      onAction(action, { value: option.value, label: option.label });
    }
  };

  if (!options.length) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)} data-testid="a2ui-button-group">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        className={cn(
          'flex gap-2',
          orientation === 'vertical' && 'flex-col',
          orientation === 'horizontal' && 'flex-wrap'
        )}
      >
        {options.map((option) => (
          <Button
            key={option.value}
            variant={selected === option.value ? 'default' : 'outline'}
            size={size}
            onClick={() => handleSelect(option)}
            className={cn(
              'transition-all',
              selected === option.value && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
            )}
          >
            {option.icon && <span className="mr-2">{option.icon}</span>}
            <span>{option.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export default A2ButtonGroup;
