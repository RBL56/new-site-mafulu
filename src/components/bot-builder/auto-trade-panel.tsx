'use client';

import React from 'react';
import { useBot } from '@/context/bot-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import SignalBotTradeLog from './signal-bot-trade-log';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-react';

interface AutoTradePanelProps {
    type: 'strategy' | 'arena';
}

export default function AutoTradePanel({ type }: AutoTradePanelProps) {
    const { signalBots } = useBot();

    // Filter bots based on their origin (ID prefix)
    const filteredBots = signalBots.filter(bot => {
        if (type === 'strategy') return bot.id.startsWith('auto-') && !bot.id.startsWith('auto-arena-');
        if (type === 'arena') return bot.id.startsWith('auto-arena-');
        return false;
    });

    const totalProfit = filteredBots.reduce((acc, bot) => acc + bot.profit, 0);
    const totalTrades = filteredBots.reduce((acc, bot) => acc + bot.trades.length, 0);
    const winRate = totalTrades > 0
        ? (filteredBots.reduce((acc, bot) => acc + bot.trades.filter(t => t.isWin).length, 0) / totalTrades) * 100
        : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    {type === 'strategy' ? 'Over 1 / Under 8 History' : 'Arena Auto Trade History'}
                </CardTitle>
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Total P/L</span>
                        <span className={cn("text-sm font-mono font-bold", totalProfit >= 0 ? "text-green-500" : "text-red-500")}>
                            {formatCurrency(totalProfit)}
                        </span>
                    </div>
                    <div className="flex flex-col items-end border-l pl-4">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Win Rate</span>
                        <span className="text-sm font-mono font-bold text-primary">
                            {winRate.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                        {filteredBots.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <Clock className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p>No automated trades recorded yet.</p>
                            </div>
                        ) : (
                            filteredBots.map((bot) => (
                                <Collapsible key={bot.id} className="group">
                                    <div className={cn(
                                        "flex items-center justify-between p-3 rounded-md border text-sm transition-colors",
                                        bot.status === 'running' ? "bg-primary/5 border-primary/20" : "bg-secondary/20 border-border/50"
                                    )}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{bot.market}</span>
                                                <Badge variant="outline" className="text-[10px] py-0 h-4">
                                                    {bot.status}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{bot.signalType}</span>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-muted-foreground uppercase">Profit</span>
                                                <span className={cn("font-mono font-bold", bot.profit >= 0 ? "text-green-500" : "text-red-500")}>
                                                    {bot.profit > 0 ? "+" : ""}{bot.profit.toFixed(2)}
                                                </span>
                                            </div>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                                                </Button>
                                            </CollapsibleTrigger>
                                        </div>
                                    </div>
                                    <CollapsibleContent className="pt-2">
                                        <div className="pl-4 border-l-2 border-primary/20 ml-2">
                                            <SignalBotTradeLog trades={bot.trades} />
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
