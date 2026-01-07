
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { BookOpen, Bot, LogIn } from 'lucide-react';
import { ApiTokenDialog } from './api-token-dialog';
import { useDerivApi } from '@/context/deriv-api-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import { ThemeToggle } from './theme-toggle';
import { AccountSwitcher } from './account-switcher';

// This is your application's unique ID from Deriv.
const DERIV_APP_ID = '106684';

export default function Header() {
  const { isConnected } = useDerivApi();

  const handleLoginRedirect = () => {
    const redirectUri = "https://mafurumbanya.netlify.app/";
    if (!DERIV_APP_ID) {
      alert('Deriv App ID is not configured.');
      return;
    }
    const derivAuthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_APP_ID}&redirect_uri=${redirectUri}&lang=EN&l=en&scopes=read,trade,payments,trading_information`;
    window.location.href = derivAuthUrl;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/deriv-logo.svg" alt="Deriv Logo" width={32} height={32} />
            <span className="font-bold font-headline hidden sm:inline-block">
              LOCO TRADING HUB
            </span>
            <span className="font-bold font-headline sm:hidden">
              LOCO HUB
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground flex items-center gap-1"
            >
              <Bot className="h-4 w-4" />
              Bot Builder
            </Link>
            <Link
              href="/tutorials"
              className="transition-colors hover:text-foreground/80 text-muted-foreground flex items-center gap-1"
            >
              <BookOpen className="h-4 w-4" />
              Tutorials
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          {isConnected ? (
            <AccountSwitcher />
          ) : (
            <>
              <ApiTokenDialog />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-headline">Log in with Deriv</DialogTitle>
                    <DialogDescription>
                      You will be redirected to the official Deriv website to log in securely.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button onClick={handleLoginRedirect} className="w-full">
                      Continue to Deriv
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button>Sign Up</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
