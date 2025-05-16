'use client';

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { useSession } from '@/hooks/useSession';

export function Navigation() {
  const { user } = useSession();
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto ">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/flashcards" className="flex items-center space-x-2">
              <span className="font-bold text-xl">10xCard</span>
            </a>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <a href="/flashcards" className={navigationMenuTriggerStyle()}>
                    Moje fiszki
                  </a>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <a href="/flashcards/generate" className={navigationMenuTriggerStyle()}>
                    Generuj nowe
                  </a>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });

                  if (!response.ok) {
                    throw new Error('Błąd wylogowania');
                  }

                  // Przekierowanie na stronę logowania
                  window.location.href = '/auth/login';
                } catch (error) {
                  console.error('Błąd wylogowania:', error);
                }
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
