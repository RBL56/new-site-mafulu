'use client';

import { useBot } from '@/context/bot-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
                <TableHead>Profit/Loss</TableHead>
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
                  <TableCell className="font-mono text-xs">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="h-8 p-0 text-blue-500 hover:text-blue-700 underline font-mono text-xs">
                          {trade.id}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Trade Details</DialogTitle>
                          <DialogDescription>
                            Contract ID: {trade.id}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-semibold">Market:</span>
                            <span>{trade.marketId}</span>
                          </div>
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-semibold">Description:</span>
                            <span className="text-right text-xs max-w-[200px]">{trade.description}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-muted-foreground text-xs">Stake</span>
                              <span className="font-bold">{formatCurrency(trade.stake)}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                              <span className="text-muted-foreground text-xs">Payout</span>
                              <span className={cn("font-bold", trade.isWin ? "text-green-500" : "text-red-500")}>
                                {formatCurrency(trade.payout)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-semibold">Profit/Loss:</span>
                            <Badge variant={trade.isWin ? "default" : "destructive"} className={cn(trade.isWin ? "bg-green-500" : "bg-red-500")}>
                              {formatCurrency(trade.payout - trade.stake)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex flex-col items-center border rounded p-2 bg-muted/20">
                              <span className="text-xs text-muted-foreground mb-1">Entry Digit</span>
                              <span className="text-lg font-bold">{trade.entryDigit ?? '-'}</span>
                            </div>
                            <div className="flex flex-col items-center border rounded p-2 bg-muted/20">
                              <span className="text-xs text-muted-foreground mb-1">Exit Digit</span>
                              <span className="text-lg font-bold">{trade.exitDigit ?? '-'}</span>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>{trade.marketId}</TableCell>
                  <TableCell>{formatCurrency(trade.stake)}</TableCell>
                  <TableCell className={cn(trade.isWin ? 'text-green-500' : 'text-red-500')}>
                    {trade.payout > 0 ? formatCurrency(trade.payout) : '-'}
                  </TableCell>
                  <TableCell className={cn((trade.payout - trade.stake) >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold')}>
                    {formatCurrency(trade.payout - trade.stake)}
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
