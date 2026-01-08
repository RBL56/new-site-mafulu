
'use client';

import { useDerivApi } from '@/context/deriv-api-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { ChevronsUpDown, LogOut, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

export function AccountSwitcher() {
  const { activeAccount, accountList, switchAccount, disconnect } = useDerivApi();

  if (!activeAccount) {
    return null;
  }
  
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between md:w-[280px]">
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">{activeAccount.loginid}</span>
              <span className="font-bold">{formatCurrency(activeAccount.balance, activeAccount.currency)}</span>
            </div>
            <div className="flex items-center gap-2">
                <Badge 
                    variant="outline"
                    className={cn(
                        "capitalize font-bold",
                        activeAccount.is_virtual ? 'text-green-600 border-green-200 bg-green-50' : 'text-blue-600 border-blue-200 bg-blue-50'
                    )}
                >
                    {activeAccount.is_virtual ? 'Demo' : 'Real'}
                </Badge>
                <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[280px]" align="end">
          <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {accountList.map((account) => (
            <DropdownMenuItem key={account.loginid} onSelect={() => switchAccount(account.loginid)} disabled={account.loginid === activeAccount.loginid}>
              <div className={cn("flex-1 flex justify-between items-center", account.loginid === activeAccount.loginid && "font-bold")}>
                  <div>
                      <p>{account.loginid}</p>
                      <p className={cn("text-xs", account.is_virtual ? "text-green-600" : "text-blue-600")}>{account.is_virtual ? 'Demo' : 'Real'}</p>
                  </div>
                  {account.loginid === activeAccount.loginid && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => disconnect()} className="text-red-500 focus:text-red-500 focus:bg-red-50">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
