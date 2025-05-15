'use client';

import { 
  NavigationMenu, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  navigationMenuTriggerStyle 
} from "@/components/ui/navigation-menu";

export function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto ">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">10xCard</span>
          </a>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <a href="/flashcards" className={navigationMenuTriggerStyle()}>
                  My Flashcards
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a href="/flashcards/generate" className={navigationMenuTriggerStyle()}>
                  Generate New
                </a>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-4">
          <a href="/auth/logout" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Logout
          </a>
        </div>
      </div>
      </div>
      
    </nav>
  );
}
