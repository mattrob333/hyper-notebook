import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Settings, 
  User,
  Moon,
  Sun,
  Share2,
  BarChart3,
  Plus,
  ChevronLeft
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  notebookName?: string;
  onBackToDashboard?: () => void;
}

export default function Navbar({ isDarkMode, onToggleDarkMode, notebookName, onBackToDashboard }: NavbarProps) {
  return (
    <header className="h-12 border-b flex items-center justify-between gap-4 px-4 bg-background" data-testid="navbar">
      <div className="flex items-center gap-3">
        {notebookName ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onBackToDashboard}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-sm">{notebookName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-sm">NotebookLM</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {!notebookName && (
          <Button variant="ghost" size="sm" className="gap-2 text-xs rounded-lg" data-testid="button-create-notebook">
            <Plus className="w-4 h-4" />
            Create notebook
          </Button>
        )}
        
        <Button variant="ghost" size="sm" className="gap-2 text-xs rounded-lg" data-testid="button-analytics">
          <BarChart3 className="w-4 h-4" />
          Analytics
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
