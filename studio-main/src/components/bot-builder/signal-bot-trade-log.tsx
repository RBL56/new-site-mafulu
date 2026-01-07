
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Trade } from '@/lib/types';

interface SignalBotTradeLogProps {
    trades: Trade[];
}

export default function SignalBotTradeLog({ trades }: SignalBotTradeLogProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    return (
        <div className="w-full mt-4">
            <h4 className="text-md font-semibold mb-2">Trade Log</h4>
            <ScrollArea className="h-64 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contract ID</TableHead>
                            <TableHead>Stake</TableHead>
                            <TableHead>Payout</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead>Entry</TableHead>
                            <TableHead>Exit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trades.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                    No trades yet for this bot.
                                </TableCell>
                            </TableRow>
                        )}
                        {trades.map((trade) => (
                            <TableRow key={trade.id}>
                                <TableCell className="font-mono text-xs">{trade.id}</TableCell>
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
                                <TableCell>
                                    <div className="flex items-center justify-center w-8 h-8 border rounded font-bold bg-muted/30 mx-auto">
                                        {trade.entryDigit !== undefined ? trade.entryDigit : '-'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center w-8 h-8 border rounded font-bold bg-muted/30 mx-auto">
                                        {trade.exitDigit !== undefined ? trade.exitDigit : '-'}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
}
