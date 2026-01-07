'use client';

import { useBot } from '@/context/bot-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TradeLog() {
  const { trades } = useBot();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <List className="h-6 w-6" />
            Trade Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Contract ID</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Entry Digit</TableHead>
                    <TableHead>Exit Digit</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {trades.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No trades yet. Start the bot to see the log.
                        </TableCell>
                    </TableRow>
                )}
                {trades.map((trade) => (
                    <TableRow key={trade.id}>
                    <TableCell className="font-mono text-xs">{trade.id}</TableCell>
                    <TableCell>{trade.marketId}</TableCell>
                    <TableCell>{formatCurrency(trade.stake)}</TableCell>
                    <TableCell className={cn(trade.isWin ? 'text-green-500' : 'text-red-500')}>
                      {trade.payout > 0 ? formatCurrency(trade.payout) : '-'}
                    </TableCell>
                    <TableCell>
                        <Badge variant={trade.isWin ? 'default' : 'destructive'} 
                            className={cn(trade.isWin ? 'bg-green-500' : 'bg-red-500')}>
                        {trade.isWin ? 'Win' : 'Loss'}
                        </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-lg">
                        {trade.entryDigit !== undefined ? trade.entryDigit : '-'}
                    </TableCell>
                    <TableCell className="font-bold text-lg">
                        {trade.exitDigit !== undefined ? trade.exitDigit : '-'}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
