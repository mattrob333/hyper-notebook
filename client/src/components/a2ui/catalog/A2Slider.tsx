/**
 * A2Slider
 *
 * A slider component for selecting numeric values within a range.
 * Used by AI to get user input for parameters.
 */

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface A2SliderProps {
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  onChange?: (value: number) => void;
  onAction?: (action: string, data?: { value: number }) => void;
  action?: string;
  marks?: Array<{ value: number; label: string }>;
  disabled?: boolean;
  className?: string;
}

export function A2Slider({
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  valuePrefix = '',
  valueSuffix = '',
  onChange,
  onAction,
  action,
  marks,
  disabled,
  className,
}: A2SliderProps) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (newValue: number[]) => {
    const val = newValue[0];
    setValue(val);
    onChange?.(val);
  };

  const handleCommit = (newValue: number[]) => {
    const val = newValue[0];
    if (action && onAction) {
      onAction(action, { value: val });
    }
  };

  const formatValue = (val: number) => {
    return `${valuePrefix}${val}${valueSuffix}`;
  };

  return (
    <div className={cn('space-y-3', className)} data-testid="a2ui-slider">
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showValue && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatValue(value)}
            </span>
          )}
        </div>
      )}

      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={handleChange}
        onValueCommit={handleCommit}
      />

      {marks && marks.length > 0 && (
        <div className="relative flex justify-between text-xs text-muted-foreground">
          {marks.map((mark) => {
            const position = ((mark.value - min) / (max - min)) * 100;
            return (
              <span
                key={mark.value}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                {mark.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default A2Slider;
