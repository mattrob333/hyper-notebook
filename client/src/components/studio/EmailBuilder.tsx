import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Palette,
  Highlighter,
  Save,
  Download,
  Undo,
  Redo,
} from "lucide-react";

interface EmailBuilderProps {
  onBack?: () => void;
}

const textColors = [
  "#000000", "#374151", "#6B7280", "#9CA3AF",
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
];

const highlightColors = [
  "#FEF3C7", "#FEE2E2", "#DBEAFE", "#D1FAE5",
  "#E0E7FF", "#FCE7F3", "#CFFAFE", "#FEF9C3",
];

export default function EmailBuilder({ onBack }: EmailBuilderProps) {
  const [subject, setSubject] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start composing your email...",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-md",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleSave = () => {
    if (!editor) return;
    const html = editor.getHTML();
    console.log("Email saved:", { subject, html });
  };

  const handleExport = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body>
  ${html}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subject || "email"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-card" data-testid="email-builder">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-base">Email Builder</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              data-testid="button-save-email"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
              data-testid="button-export-email"
            >
              <Download className="w-4 h-4 mr-2" />
              Export HTML
            </Button>
          </div>
        </div>
        <Input
          placeholder="Email subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-md"
          data-testid="input-email-subject"
        />
      </div>

      <div className="p-2 border-b border-border/50 flex items-center gap-1 flex-wrap bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toggle-elevate ${editor.isActive("bold") ? "toggle-elevated" : ""}`}
          data-testid="button-bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toggle-elevate ${editor.isActive("italic") ? "toggle-elevated" : ""}`}
          data-testid="button-italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toggle-elevate ${editor.isActive("underline") ? "toggle-elevated" : ""}`}
          data-testid="button-underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`toggle-elevate ${editor.isActive("strike") ? "toggle-elevated" : ""}`}
          data-testid="button-strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`toggle-elevate ${editor.isActive({ textAlign: "left" }) ? "toggle-elevated" : ""}`}
          data-testid="button-align-left"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`toggle-elevate ${editor.isActive({ textAlign: "center" }) ? "toggle-elevated" : ""}`}
          data-testid="button-align-center"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`toggle-elevate ${editor.isActive({ textAlign: "right" }) ? "toggle-elevated" : ""}`}
          data-testid="button-align-right"
        >
          <AlignRight className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`toggle-elevate ${editor.isActive("heading", { level: 1 }) ? "toggle-elevated" : ""}`}
          data-testid="button-heading-1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`toggle-elevate ${editor.isActive("heading", { level: 2 }) ? "toggle-elevated" : ""}`}
          data-testid="button-heading-2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`toggle-elevate ${editor.isActive("heading", { level: 3 }) ? "toggle-elevated" : ""}`}
          data-testid="button-heading-3"
        >
          <Heading3 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`toggle-elevate ${editor.isActive("paragraph") ? "toggle-elevated" : ""}`}
          data-testid="button-paragraph"
        >
          <Pilcrow className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toggle-elevate ${editor.isActive("bulletList") ? "toggle-elevated" : ""}`}
          data-testid="button-bullet-list"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toggle-elevate ${editor.isActive("orderedList") ? "toggle-elevated" : ""}`}
          data-testid="button-ordered-list"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-text-color"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" data-testid="popover-text-color">
            <div className="grid grid-cols-4 gap-1">
              {textColors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-md border border-border/50 hover-elevate"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  data-testid={`button-color-${color.replace("#", "")}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-highlight-color"
            >
              <Highlighter className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" data-testid="popover-highlight-color">
            <div className="grid grid-cols-4 gap-1">
              {highlightColors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-md border border-border/50 hover-elevate"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  data-testid={`button-highlight-${color.replace("#", "")}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={setLink}
          className={`toggle-elevate ${editor.isActive("link") ? "toggle-elevated" : ""}`}
          data-testid="button-link"
        >
          <Link2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={addImage}
          data-testid="button-image"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          data-testid="button-undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          data-testid="button-redo"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="bg-background rounded-md m-4 border border-border/50">
          <EditorContent editor={editor} data-testid="editor-email-body" />
        </div>
      </ScrollArea>
    </div>
  );
}
