import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Settings, 
  User,
  Moon,
  Sun,
  Share2,
  Plus,
  ChevronDown,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Notebook {
  id: string;
  name: string;
}

interface NavbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  notebookName?: string;
  notebookId?: string;
  notebooks?: Notebook[];
  onBackToDashboard?: () => void;
  onSelectNotebook?: (id: string) => void;
  onCreateNotebook?: () => void;
}

export default function Navbar({ 
  isDarkMode, 
  onToggleDarkMode, 
  notebookName, 
  notebookId,
  notebooks = [],
  onBackToDashboard,
  onSelectNotebook,
  onCreateNotebook
}: NavbarProps) {
  return (
    <header className="h-12 border-b flex items-center justify-between gap-4 px-4 bg-background" data-testid="navbar">
      <div className="flex items-center gap-3">
        {/* Logo - click to go back to dashboard */}
        <button 
          onClick={onBackToDashboard}
          className="h-8 w-8 rounded-lg overflow-hidden hover:opacity-80 transition-opacity flex-shrink-0"
          title="Back to notebooks"
        >
          <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain" />
        </button>

        {notebookName ? (
          <div className="flex items-center gap-2">
            {/* Notebook dropdown selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-sm font-medium">
                  {notebookName}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl min-w-[200px]">
                {notebooks.map((notebook) => (
                  <DropdownMenuItem 
                    key={notebook.id}
                    className="rounded-lg"
                    onClick={() => onSelectNotebook?.(notebook.id)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {notebook.name}
                    {notebook.id === notebookId && (
                      <Check className="w-4 h-4 ml-auto text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                {notebooks.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem 
                  className="rounded-lg"
                  onClick={onCreateNotebook}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create new notebook
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <span className="font-medium text-sm">Hyper-Notebook</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Create notebook button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-xs rounded-lg" 
          data-testid="button-create-notebook"
          onClick={onCreateNotebook}
        >
          <Plus className="w-4 h-4" />
          New Notebook
        </Button>

        <Button variant="ghost" size="sm" className="gap-2 text-xs rounded-lg" data-testid="button-share">
          <Share2 className="w-4 h-4" />
          Share
        </Button>

        <Button variant="ghost" size="sm" className="gap-2 text-xs rounded-lg" data-testid="button-settings">
          <Settings className="w-4 h-4" />
          Settings
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleDarkMode}
          className="ml-2"
          data-testid="button-theme-toggle"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs">U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem className="rounded-lg" data-testid="menu-item-profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg" data-testid="menu-item-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg" data-testid="menu-item-logout">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
