import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Link2,
  Globe,
  Youtube,
  FileText,
  Clipboard,
  Search,
  X,
  Loader2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notebook } from "@/lib/types";

interface CreateNotebookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCE_OPTIONS = [
  { id: 'upload', icon: Upload, label: 'Upload sources', description: 'PDF, TXT, MD files' },
  { id: 'link', icon: Link2, label: 'Link', description: 'Add a URL' },
  { id: 'website', icon: Globe, label: 'Website', description: 'Scrape a website' },
  { id: 'youtube', icon: Youtube, label: 'YouTube', description: 'Add video transcript' },
  { id: 'paste', icon: FileText, label: 'Paste text', description: 'Paste content directly' },
  { id: 'clipboard', icon: Clipboard, label: 'Copied text', description: 'From clipboard' },
];

const MAX_SOURCES = 300;

export default function CreateNotebookModal({ open, onOpenChange }: CreateNotebookModalProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'create' | 'sources'>('create');
  const [notebookName, setNotebookName] = useState('');
  const [notebookDescription, setNotebookDescription] = useState('');
  const [sourceCount, setSourceCount] = useState(0);
  const [activeSourceType, setActiveSourceType] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [pasteInput, setPasteInput] = useState('');
  const [createdNotebook, setCreatedNotebook] = useState<Notebook | null>(null);

  const createNotebookMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest('POST', '/api/notebooks', data);
      return res.json();
    },
    onSuccess: (notebook: Notebook) => {
      setCreatedNotebook(notebook);
      queryClient.invalidateQueries({ queryKey: ['/api/notebooks'] });
      setStep('sources');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create notebook.',
        variant: 'destructive',
      });
    },
  });

  const addSourceMutation = useMutation({
    mutationFn: async (data: { notebookId: string; type: string; name: string; content: string }) => {
      const res = await apiRequest('POST', '/api/sources', data);
      return res.json();
    },
    onSuccess: () => {
      setSourceCount(prev => prev + 1);
      setUrlInput('');
      setPasteInput('');
      setActiveSourceType(null);
      toast({
        title: 'Source added',
        description: 'The source has been added to your notebook.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add source.',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    if (!notebookName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your notebook.',
        variant: 'destructive',
      });
      return;
    }
    createNotebookMutation.mutate({
      name: notebookName,
      description: notebookDescription || undefined,
    });
  };

  const handleAddUrl = () => {
    if (!urlInput.trim() || !createdNotebook) return;
    addSourceMutation.mutate({
      notebookId: createdNotebook.id,
      type: 'url',
      name: urlInput,
      content: `URL: ${urlInput}`,
    });
  };

  const handleAddPastedText = () => {
    if (!pasteInput.trim() || !createdNotebook) return;
    addSourceMutation.mutate({
      notebookId: createdNotebook.id,
      type: 'text',
      name: `Pasted text ${new Date().toLocaleString()}`,
      content: pasteInput,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !createdNotebook) return;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('notebookId', createdNotebook.id);

      try {
        const res = await fetch('/api/sources/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          setSourceCount(prev => prev + 1);
          toast({
            title: 'File uploaded',
            description: `${file.name} has been added.`,
          });
        }
      } catch {
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}.`,
          variant: 'destructive',
        });
      }
    }
    e.target.value = '';
  };

  const handleFinish = () => {
    if (createdNotebook) {
      onOpenChange(false);
      navigate(`/notebook/${createdNotebook.id}`);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep('create');
    setNotebookName('');
    setNotebookDescription('');
    setSourceCount(0);
    setActiveSourceType(null);
    setUrlInput('');
    setPasteInput('');
    setCreatedNotebook(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {step === 'create' ? 'Create new notebook' : 'Add sources'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {step === 'create' 
                  ? 'Give your notebook a name to get started'
                  : 'Sources let NotebookLM base its responses on the information that matters most to you.'
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          {step === 'create' ? (
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notebook-name">Notebook name</Label>
                <Input
                  id="notebook-name"
                  placeholder="e.g., Marketing Research, Q4 Planning..."
                  value={notebookName}
                  onChange={(e) => setNotebookName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notebook-description">Description (optional)</Label>
                <Textarea
                  id="notebook-description"
                  placeholder="What is this notebook about?"
                  value={notebookDescription}
                  onChange={(e) => setNotebookDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.txt,.md,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="font-medium">Upload sources</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag & drop or <span className="text-primary">choose file</span> to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported file types: PDF, txt, Markdown, Audio (mp3, wav), docx, xlsx, pptx, csv
                  </p>
                </label>
              </div>

              {/* Source Options Grid */}
              <div className="grid grid-cols-3 gap-3">
                {SOURCE_OPTIONS.filter(o => o.id !== 'upload').map((option) => {
                  const Icon = option.icon;
                  const isActive = activeSourceType === option.id;
                  return (
                    <button
                      key={option.id}
                      className={`p-4 rounded-lg border text-left transition-all hover:border-primary/50 ${
                        isActive ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setActiveSourceType(isActive ? null : option.id)}
                    >
                      <Icon className="w-5 h-5 mb-2 text-muted-foreground" />
                      <p className="font-medium text-sm">{option.label}</p>
                    </button>
                  );
                })}
              </div>

              {/* Active Source Input */}
              {activeSourceType === 'link' && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label>Add URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/article"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <Button 
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim() || addSourceMutation.isPending}
                    >
                      {addSourceMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {activeSourceType === 'paste' && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label>Paste text</Label>
                  <Textarea
                    placeholder="Paste your content here..."
                    value={pasteInput}
                    onChange={(e) => setPasteInput(e.target.value)}
                    rows={5}
                  />
                  <Button 
                    onClick={handleAddPastedText}
                    disabled={!pasteInput.trim() || addSourceMutation.isPending}
                    className="w-full"
                  >
                    {addSourceMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Add text
                  </Button>
                </div>
              )}

              {activeSourceType === 'website' && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label>Website URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <Button 
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim() || addSourceMutation.isPending}
                    >
                      {addSourceMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Scrape'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {activeSourceType === 'youtube' && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label>YouTube URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <Button 
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim() || addSourceMutation.isPending}
                    >
                      {addSourceMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Source Limit Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Source limit
                  </span>
                  <span className="text-muted-foreground">{sourceCount} / {MAX_SOURCES}</span>
                </div>
                <Progress value={(sourceCount / MAX_SOURCES) * 100} className="h-2" />
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between">
          {step === 'create' ? (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!notebookName.trim() || createNotebookMutation.isPending}
              >
                {createNotebookMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep('create')}>
                Back
              </Button>
              <Button onClick={handleFinish}>
                {sourceCount > 0 ? `Open notebook (${sourceCount} sources)` : 'Skip for now'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
