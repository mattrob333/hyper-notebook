import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Settings, 
  User,
  Moon,
  Sun,
  Bell,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface NavbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({ isDarkMode, onToggleDarkMode }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-14 border-b flex items-center justify-between gap-4 px-4 bg-background" data-testid="navbar">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg tracking-tight">Hyper Notebook</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {searchOpen ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sources, workflows..."
              className="w-64 pl-9"
              autoFocus
              onBlur={() => setSearchOpen(false)}
              data-testid="input-search"
            />
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSearchOpen(true)}
            data-testid="button-search"
          >
            <Search className="w-5 h-5" />
          </Button>
        )}

        <Button variant="ghost" size="icon" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleDarkMode}
          data-testid="button-theme-toggle"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-user-menu">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid="menu-item-profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-item-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-item-logout">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
