/**
 * SynergizeButton
 *
 * A button that triggers debate/thread synthesis.
 * Shows when a debate is active or when there are enough messages to synthesize.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNextMethodStore } from '@/lib/store';

interface SynergizeButtonProps {
  messageCount: number;
  onSynergize: () => Promise<void>;
  className?: string;
}

export function SynergizeButton({ messageCount, onSynergize, className }: SynergizeButtonProps) {
  const [isSynergizing, setIsSynergizing] = useState(false);
  const isDebateActive = useNextMethodStore((state) => state.isDebateActive);

  // Show synergize button if debate is active or there are 3+ messages
  const shouldShow = isDebateActive || messageCount >= 3;

  const handleSynergize = async () => {
    setIsSynergizing(true);
    try {
      await onSynergize();
    } finally {
      setIsSynergizing(false);
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn('flex justify-center', className)}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleSynergize}
          disabled={isSynergizing}
          className={cn(
            'gap-2 rounded-full px-4',
            'bg-gradient-to-r from-purple-500/10 to-blue-500/10',
            'border-purple-500/30 hover:border-purple-500/50',
            'text-purple-400 hover:text-purple-300',
            'transition-all hover:scale-105'
          )}
          data-testid="button-synergize"
        >
          {isSynergizing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Synthesizing...</span>
            </>
          ) : isDebateActive ? (
            <>
              <Zap className="h-4 w-4" />
              <span>Synergize Debate</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Synergize Thread</span>
            </>
          )}
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * SynergizeResult
 *
 * Displays the synthesis result in a card format.
 */
interface SynergizeResultProps {
  synthesis: {
    executiveSummary: string;
    keyDecisions?: Array<{ decision: string; reasoning: string }>;
    actionItems?: Array<{ item: string; owner: string; priority: 'high' | 'medium' | 'low' }>;
    openQuestions?: string[];
  };
  onClose?: () => void;
  onSendToEditor?: () => void;
  className?: string;
}

export function SynergizeResult({
  synthesis,
  onClose,
  onSendToEditor,
  className,
}: SynergizeResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'p-4 rounded-xl border border-purple-500/30 bg-purple-500/5',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20 shrink-0">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-purple-300 mb-2">Synthesis</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {synthesis.executiveSummary}
          </p>

          {synthesis.keyDecisions && synthesis.keyDecisions.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Key Decisions</h5>
              <ul className="space-y-1">
                {synthesis.keyDecisions.map((kd, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-medium">{kd.decision}</span>
                    <span className="text-muted-foreground"> - {kd.reasoning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {synthesis.actionItems && synthesis.actionItems.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Action Items</h5>
              <ul className="space-y-1">
                {synthesis.actionItems.map((ai, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded uppercase',
                        ai.priority === 'high' && 'bg-red-500/20 text-red-300',
                        ai.priority === 'medium' && 'bg-yellow-500/20 text-yellow-300',
                        ai.priority === 'low' && 'bg-green-500/20 text-green-300'
                      )}
                    >
                      {ai.priority}
                    </span>
                    <span>{ai.item}</span>
                    <span className="text-muted-foreground">({ai.owner})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {synthesis.openQuestions && synthesis.openQuestions.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Open Questions</h5>
              <ul className="list-disc list-inside space-y-1">
                {synthesis.openQuestions.map((q, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            {onSendToEditor && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSendToEditor}
                className="gap-1 text-xs"
              >
                <FileText className="h-3 w-3" />
                Send to Editor
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SynergizeButton;
