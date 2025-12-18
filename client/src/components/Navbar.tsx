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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
    <header className="h-12 border-b flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 bg-background" data-testid="navbar">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Logo - click to go back to dashboard */}
        <button 
          onClick={onBackToDashboard}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg overflow-hidden hover:opacity-80 transition-opacity flex-shrink-0"
          title="Back to notebooks"
        >
          <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain" />
        </button>

        {notebookName ? (
          <div className="flex items-center gap-2 min-w-0">
            {/* Notebook dropdown selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm font-medium max-w-[120px] sm:max-w-[200px] truncate">
                  <span className="truncate">{notebookName}</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
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
          <span className="font-medium text-xs sm:text-sm">Hyper-Notebook</span>
        )}
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Create notebook button - icon only on mobile */}
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 sm:h-auto sm:w-auto sm:gap-2 sm:text-xs sm:px-3 rounded-lg" 
          data-testid="button-create-notebook"
          onClick={onCreateNotebook}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New</span>
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-auto sm:w-auto sm:gap-2 sm:text-xs sm:px-3 rounded-lg" data-testid="button-share">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-auto sm:w-auto sm:gap-2 sm:text-xs sm:px-3 rounded-lg hidden sm:flex" data-testid="button-settings">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleDarkMode}
          className="h-8 w-8"
          data-testid="button-theme-toggle"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* User menu - Clerk integration */}
        {isClerkAvailable ? (
          <>
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-7 h-7 sm:w-8 sm:h-8"
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <User className="w-4 h-4" />
                </Button>
              </SignInButton>
            </SignedOut>
          </>
        ) : (
          <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
            <AvatarFallback className="text-xs">U</AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}
