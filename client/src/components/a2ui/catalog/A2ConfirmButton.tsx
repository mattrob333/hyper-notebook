/**
 * A2ConfirmButton
 *
 * A button that requires confirmation before executing an action.
 * Used for destructive or important operations.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface A2ConfirmButtonProps {
  label: string;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onAction?: (action: string, data?: { confirmed: boolean }) => void;
  action?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function A2ConfirmButton({
  label,
  confirmTitle = 'Are you sure?',
  confirmDescription = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  onAction,
  action,
  variant = 'destructive',
  size = 'default',
  icon,
  disabled,
  className,
}: A2ConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm?.();
    if (action && onAction) {
      onAction(action, { confirmed: true });
    }
  };

  const handleCancel = () => {
    setOpen(false);
    onCancel?.();
    if (action && onAction) {
      onAction(action, { confirmed: false });
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn('gap-2', className)}
        data-testid="a2ui-confirm-button"
      >
        {icon || (variant === 'destructive' && <AlertTriangle className="h-4 w-4" />)}
        {label}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent data-testid="a2ui-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" />
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                'gap-2',
                variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              <Check className="h-4 w-4" />
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default A2ConfirmButton;
