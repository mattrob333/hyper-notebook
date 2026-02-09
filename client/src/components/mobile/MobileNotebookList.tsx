import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Plus, 
  Camera, 
  Play, 
  MoreVertical, 
  Trash2, 
  Edit2,
  Settings,
  Moon,
  Sun
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateNotebookModal from "@/components/notebooks/CreateNotebookModal";
import type { Notebook } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabFilter = 'recent' | 'shared' | 'title' | 'downloaded';

export default function MobileNotebookList() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabFilter>('recent');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { toast } = useToast();

  const { data: notebooks = [], isLoading } = useQuery<Notebook[]>({
    queryKey: ['/api/notebooks'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/notebooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notebooks'] });
      toast({
        title: 'Notebook deleted',
        description: 'The notebook has been permanently deleted.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete notebook.',
        variant: 'destructive',
      });
    },
  });

  const handleNotebookClick = (notebook: Notebook) => {
    navigate(`/notebook/${notebook.id}`);
  };

  const handleDeleteNotebook = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this notebook?')) {
      deleteMutation.mutate(id);
    }
  };

  // Sort notebooks based on active tab
  const sortedNotebooks = [...notebooks].sort((a, b) => {
    switch (activeTab) {
      case 'recent':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'title':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const tabs: { id: TabFilter; label: string }[] = [
    { id: 'recent', label: 'Recent' },
    { id: 'shared', label: 'Shared' },
    { id: 'title', label: 'Title' },
    { id: 'downloaded', label: 'Downloaded' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-background safe-area-top">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Logo" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-lg">NotebookLM</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
            PRO
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">U</span>
          </div>
        </div>
      </header>

      {/* Tab Pills */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notebook List */}
      <div className="flex-1 px-4 pb-24 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedNotebooks.map((notebook) => (
              <div
                key={notebook.id}
                onClick={() => handleNotebookClick(notebook)}
                className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
              >
                {/* Emoji/Icon */}
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: notebook.color || '#6366f1' }}
                >
                  {notebook.emoji || '📓'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {notebook.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {notebook.sourceCount || 0} sources • {notebook.createdAt 
                      ? formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: false })
                      : 'Just now'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Play button for audio (if available) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Play audio overview
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => handleDeleteNotebook(e, notebook.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {notebooks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No notebooks yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Tap "Create New" to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
        <div className="flex items-center justify-center gap-3 h-16 px-4">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl"
            onClick={() => {
              // TODO: Camera/scan functionality
            }}
          >
            <Camera className="w-5 h-5" />
          </Button>
          
          <Button
            variant="default"
            className="h-12 px-6 rounded-xl gap-2"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Create New
          </Button>
        </div>
      </div>

      {/* Create Notebook Modal */}
      <CreateNotebookModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
