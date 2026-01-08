
'use client';

import { useDerivApi } from '@/context/deriv-api-context';
import { Wallet } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export function BalanceDisplay() {
  const { activeAccount, isConnected } = useDerivApi();

  if (!isConnected || !activeAccount) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm font-medium border border-border rounded-md px-3 py-1.5 bg-background">
      <Wallet className="h-5 w-5 text-muted-foreground" />
      {activeAccount.balance === null ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <span className="font-semibold text-foreground">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: activeAccount.currency }).format(activeAccount.balance)}
        </span>
      )}
      <Badge 
        variant="outline"
        className={cn(
          "capitalize font-bold",
          activeAccount.is_virtual ? 'text-green-600 border-green-200 bg-green-50' : 'text-blue-600 border-blue-200 bg-blue-50'
        )}
      >
        {activeAccount.is_virtual ? 'Demo' : 'Real'}
      </Badge>
    </div>
  );
}
