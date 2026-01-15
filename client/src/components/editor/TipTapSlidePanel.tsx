/**
 * TipTapSlidePanel
 *
 * A slide-in panel from the right that contains a TipTap rich text editor.
 * Used for document drafting, email composition, and report editing.
 */

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Link2,
  Heading1,
  Heading2,
  Save,
  Send,
  FileText,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useNextMethodStore } from '@/lib/store';

interface TipTapSlidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent?: string;
  initialTitle?: string;
  onSave?: (content: string, title: string) => void;
  onSend?: (content: string, title: string) => void;
  mode?: 'document' | 'email';
  className?: string;
}

export function TipTapSlidePanel({
  open,
  onOpenChange,
  initialContent = '',
  initialTitle = '',
  onSave,
  onSend,
  mode = 'document',
  className,
}: TipTapSlidePanelProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isGenerating, setIsGenerating] = useState(false);

  const tiptapState = useNextMethodStore((state) => state.tiptap);
  const setTipTapContent = useNextMethodStore((state) => state.setTipTapContent);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: mode === 'email' ? 'Write your email...' : 'Start writing...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent || tiptapState.content,
    onUpdate: ({ editor }) => {
      setTipTapContent(editor.getHTML());
    },
  });

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editor && initialContent && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Update title when initialTitle changes
  useEffect(() => {
    if (initialTitle !== title) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  const handleSave = useCallback(() => {
    if (editor && onSave) {
      onSave(editor.getHTML(), title);
    }
  }, [editor, title, onSave]);

  const handleSend = useCallback(() => {
    if (editor && onSend) {
      onSend(editor.getHTML(), title);
    }
  }, [editor, title, onSend]);

  const handleAIGenerate = useCallback(async () => {
    setIsGenerating(true);
    // Simulate AI generation - in production, this would call an API
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn('w-full sm:max-w-xl flex flex-col p-0', className)}
        data-testid="tiptap-slide-panel"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'email' ? 'Compose Email' : 'Document Editor'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'email'
              ? 'Draft and send your email'
              : 'Create and edit your document'}
          </SheetDescription>
        </SheetHeader>

        {/* Title input */}
        <div className="px-6 py-3 border-b">
          <Input
            placeholder={mode === 'email' ? 'Subject...' : 'Document title...'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 text-lg font-medium px-0 focus-visible:ring-0"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b overflow-x-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={editor.isActive('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={editor.isActive('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            data-active={editor.isActive('underline')}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            data-active={editor.isActive('heading', { level: 1 })}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            data-active={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={editor.isActive('bulletList')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={editor.isActive('orderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            data-active={editor.isActive({ textAlign: 'left' })}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            data-active={editor.isActive({ textAlign: 'center' })}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            data-active={editor.isActive({ textAlign: 'right' })}
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs shrink-0"
            onClick={handleAIGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            AI Assist
          </Button>
        </div>

        {/* Editor content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            <EditorContent
              editor={editor}
              className="prose prose-sm dark:prose-invert max-w-none min-h-[300px] focus:outline-none"
            />
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-muted/50">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {onSave && (
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
            )}
            {onSend && mode === 'email' && (
              <Button size="sm" onClick={handleSend}>
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            )}
            {!onSend && (
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default TipTapSlidePanel;
