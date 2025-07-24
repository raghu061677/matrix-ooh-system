
'use client';

import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from '@/components/admin/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('rose')}>
           <div className="mr-2 h-4 w-4 rounded-full bg-[#e11d48]" />
           <span>Rose</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('green')}>
           <div className="mr-2 h-4 w-4 rounded-full bg-[#16a34a]" />
           <span>Green</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('orange')}>
           <div className="mr-2 h-4 w-4 rounded-full bg-[#f97316]" />
           <span>Orange</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
