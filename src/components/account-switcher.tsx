
'use client';

import { useDerivApi } from '@/context/deriv-api-context';
import { useBot } from '@/context/bot-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { ChevronsUpDown, LogOut, Check, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

export function AccountSwitcher() {
  const { activeAccount, accountList, switchAccount, disconnect, resetBalance } = useDerivApi();
  const { displayCurrency, setDisplayCurrency, formatCurrency } = useBot();

  if (!activeAccount) {
    return null;
  }


  const realAccounts = accountList.filter(acc => !acc.is_virtual);
  const demoAccounts = accountList.filter(acc => acc.is_virtual);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between md:w-[280px] h-14 border-primary/20 hover:border-primary/40 bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-start transition-all">
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{activeAccount.loginid}</span>
              <span className="font-bold text-lg tabular-nums">{formatCurrency(activeAccount.balance, activeAccount.currency)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "capitalize font-bold border-2 px-2 py-0.5 text-[10px]",
                  activeAccount.is_virtual ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-blue-500 border-blue-500/20 bg-blue-500/10'
                )}
              >
                {activeAccount.is_virtual ? 'Demo' : 'Real'}
              </Badge>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px] p-0 overflow-hidden border-primary/20 shadow-2xl" align="end">
          <div className="bg-muted/30 px-4 py-3 border-b flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">Switch Account</h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">{accountList.length} Accounts</span>
          </div>

          <ScrollArea className="h-[350px]">
            {realAccounts.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-widest">Real Accounts</div>
                {realAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.loginid}
                    onSelect={() => switchAccount(account.loginid)}
                    disabled={account.loginid === activeAccount.loginid}
                    className={cn(
                      "rounded-lg mb-1 cursor-pointer",
                      account.loginid === activeAccount.loginid ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-muted"
                    )}
                  >
                    <div className="flex-1 flex justify-between items-center py-1">
                      <div className="flex flex-col">
                        <p className="text-xs font-mono font-medium">{account.loginid}</p>
                        <p className="text-[10px] text-muted-foreground">{account.currency}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(account.balance, account.currency)}</span>
                        {account.loginid === activeAccount.loginid && <Check className="h-4 w-4 text-blue-500" strokeWidth={3} />}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}

            {realAccounts.length > 0 && demoAccounts.length > 0 && <DropdownMenuSeparator className="mx-2 bg-primary/10" />}

            {demoAccounts.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1.5 text-[10px] font-bold text-green-500 uppercase tracking-widest">Demo Accounts</div>
                {demoAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.loginid}
                    onSelect={() => switchAccount(account.loginid)}
                    disabled={account.loginid === activeAccount.loginid}
                    className={cn(
                      "rounded-lg mb-1 cursor-pointer",
                      account.loginid === activeAccount.loginid ? "bg-green-500/10 border border-green-500/20" : "hover:bg-muted"
                    )}
                  >
                    <div className="flex-1 flex justify-between items-center py-1">
                      <div className="flex flex-col">
                        <p className="text-xs font-mono font-medium">{account.loginid}</p>
                        <p className="text-[10px] text-muted-foreground">{account.currency}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(account.balance, account.currency)}</span>
                        {account.loginid === activeAccount.loginid && <Check className="h-4 w-4 text-green-500" strokeWidth={3} />}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-2 bg-muted/20 border-t">
            {activeAccount.is_virtual && (
              <DropdownMenuItem onSelect={() => resetBalance()} className="rounded-lg text-yellow-600 focus:text-yellow-600 focus:bg-yellow-500/10 cursor-pointer py-2.5">
                <RefreshCcw className="mr-3 h-4 w-4" />
                <span className="text-xs font-semibold">Reset Demo Balance</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="mx-2 bg-primary/10" />
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase">Display Currency</span>
              <div className="flex bg-muted/50 rounded-lg p-1">
                <Button
                  variant={displayCurrency === 'USD' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-[10px] px-3 font-bold"
                  onClick={(e) => { e.stopPropagation(); setDisplayCurrency('USD'); }}
                >
                  USD
                </Button>
                <Button
                  variant={displayCurrency === 'KSH' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-[10px] px-3 font-bold"
                  onClick={(e) => { e.stopPropagation(); setDisplayCurrency('KSH'); }}
                >
                  KSH
                </Button>
              </div>
            </div>

            <DropdownMenuItem onSelect={() => disconnect()} className="rounded-lg text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer py-2.5">
              <LogOut className="mr-3 h-4 w-4" />
              <span className="text-xs font-semibold">Logout Account</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
