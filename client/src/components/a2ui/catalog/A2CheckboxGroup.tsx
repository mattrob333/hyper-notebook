/**
 * A2CheckboxGroup
 *
 * Renders a group of checkboxes for multi-select options.
 * Used by AI to present multiple options for the user to select.
 */

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CheckboxOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface A2CheckboxGroupProps {
  options: CheckboxOption[];
  defaultValues?: string[];
  onChange?: (values: string[]) => void;
  onAction?: (action: string, data?: { values: string[] }) => void;
  action?: string;
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  min?: number;
  max?: number;
  className?: string;
}

export function A2CheckboxGroup({
  options = [],
  defaultValues = [],
  onChange,
  onAction,
  action,
  label,
  orientation = 'vertical',
  min,
  max,
  className,
}: A2CheckboxGroupProps) {
  const [selected, setSelected] = useState<string[]>(defaultValues);

  const handleToggle = (value: string, checked: boolean) => {
    let newSelected: string[];

    if (checked) {
      if (max && selected.length >= max) {
        return; // Don't allow more than max
      }
      newSelected = [...selected, value];
    } else {
      if (min && selected.length <= min) {
        return; // Don't allow less than min
      }
      newSelected = selected.filter((v) => v !== value);
    }

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
    <div className={cn('space-y-3', className)} data-testid="a2ui-checkbox-group">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        className={cn(
          'flex gap-3',
          orientation === 'vertical' && 'flex-col',
          orientation === 'horizontal' && 'flex-wrap'
        )}
      >
        {options.map((option) => (
          <Label
            key={option.value}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border border-border/50',
              'hover:bg-accent/50 cursor-pointer transition-colors',
              selected.includes(option.value) && 'bg-accent/30 border-primary/50',
              option.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Checkbox
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) => handleToggle(option.value, !!checked)}
              disabled={option.disabled}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{option.label}</span>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
              )}
            </div>
          </Label>
        ))}
      </div>
      {(min || max) && (
        <p className="text-xs text-muted-foreground">
          {min && max
            ? `Select ${min}-${max} options`
            : min
            ? `Select at least ${min}`
            : `Select up to ${max}`}
        </p>
      )}
    </div>
  );
}

export default A2CheckboxGroup;
