import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Settings, 
  MoreVertical, 
  Trash2, 
  Edit2,
  LayoutGrid,
  List,
  BookOpen,
  Clock,
  Moon,
  Sun
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateNotebookModal from "@/components/notebooks/CreateNotebookModal";
import type { Notebook } from "@/lib/types";

// Notebook color presets
const NOTEBOOK_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

export default function NotebooksDashboard() {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'featured'>('my');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { toast } = useToast();

  // Apply dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  const handleCreateNotebook = () => {
    setCreateModalOpen(true);
  };

  const handleDeleteNotebook = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this notebook? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 sm:px-6 bg-background">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/favicon.png" alt="Smart Notebook" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          <span className="font-semibold text-base sm:text-lg hidden xs:inline">Smart Notebook</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Tabs and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="bg-muted/50 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="my" className="text-xs sm:text-sm">My notebooks</TabsTrigger>
              <TabsTrigger value="featured" className="text-xs sm:text-sm hidden sm:inline-flex">Featured</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleCreateNotebook}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create new</span>
            </Button>
          </div>
        </div>

        {/* Section Title */}
        <h2 className="text-lg sm:text-xl font-semibold mb-4">My notebooks</h2>

        {/* Notebooks Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
            : "flex flex-col gap-2"
          }>
            {/* Create New Notebook Card */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-md border-dashed border-2 ${
                viewMode === 'grid' 
                  ? 'p-6 flex flex-col items-center justify-center min-h-[180px]' 
                  : 'p-4 flex items-center gap-4'
              }`}
              onClick={handleCreateNotebook}
            >
              <div className={`rounded-full bg-muted flex items-center justify-center ${
                viewMode === 'grid' ? 'w-12 h-12 mb-3' : 'w-10 h-10'
              }`}>
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Create new notebook</span>
            </Card>

            {/* Notebook Cards */}
            {notebooks.map((notebook) => (
              <Card
                key={notebook.id}
                className={`cursor-pointer transition-all hover:shadow-md group relative overflow-hidden ${
                  viewMode === 'grid' ? 'min-h-[180px]' : ''
                }`}
                style={{ 
                  backgroundColor: notebook.color || NOTEBOOK_COLORS[0],
                }}
                onClick={() => handleNotebookClick(notebook)}
              >
                {viewMode === 'grid' ? (
                  <div className="p-4 flex flex-col h-full">
                    {/* Emoji/Icon */}
                    <div className="text-3xl mb-3">{notebook.emoji || '📓'}</div>
                    
                    {/* Title */}
                    <h3 className="font-semibold text-white text-base mb-1 line-clamp-2">
                      {notebook.name}
                    </h3>
                    
                    {/* Metadata */}
                    <div className="mt-auto flex items-center gap-2 text-white/70 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>
                        {notebook.createdAt 
                          ? formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: true })
                          : 'Just now'}
                      </span>
                      <span>•</span>
                      <span>{notebook.sourceCount || 0} sources</span>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
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
                ) : (
                  <div className="p-4 flex items-center gap-4">
                    <div className="text-2xl">{notebook.emoji || '📓'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{notebook.name}</h3>
                      <p className="text-white/70 text-sm">
                        {notebook.sourceCount || 0} sources • {notebook.createdAt 
                          ? formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: true })
                          : 'Just now'}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white hover:bg-white/20"
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
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Empty State - just show message, card already provides create option */}
        {!isLoading && notebooks.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No notebooks yet</h3>
            <p className="text-muted-foreground">
              Click the card above or "Create new" to get started
            </p>
          </div>
        )}
      </main>

      {/* Create Notebook Modal */}
      <CreateNotebookModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
