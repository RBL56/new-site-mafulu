

'use client';

import { useBot } from '@/context/bot-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Signal, BarChart, BadgeDollarSign, Bot, ChevronDown, List, Trash2, Zap } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import SignalBotTradeLog from './signal-bot-trade-log';

export default function SignalBotDashboard() {
    const { signalBots: allSignalBots, stopSignalBot, resetSignalBots } = useBot();

    // Manual bots (don't start with auto-)
    const manualBots = allSignalBots.filter(bot => !bot.id.startsWith('auto-'));

    // Arena Auto trades (start with auto-arena-)
    const arenaAutoBots = allSignalBots.filter(bot => bot.id.startsWith('auto-arena-'));

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            signDisplay: 'auto',
        }).format(value);
    };

    const getProfitColor = (profit: number) => {
        if (profit > 0) return 'text-green-500';
        if (profit < 0) return 'text-red-500';
        return 'text-foreground';
    };

    if (manualBots.length === 0 && arenaAutoBots.length === 0) {
        return (
            <Card className="text-center py-16">
                <CardHeader>
                    <div className="mx-auto bg-secondary rounded-full p-3 w-fit mb-4">
                        <Bot className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="font-headline text-2xl">No Active Signal Bots</CardTitle>
                    <CardDescription>
                        Signal-driven bots will appear here once they are started from the Signal Arena.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Go to the <span className="font-bold text-primary">Signal Arena</span> tab to find strong signals. When a signal is detected, you can choose to start a bot, and it will be managed on this dashboard.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="font-headline flex items-center gap-2">
                        <BarChart className="h-6 w-6" />
                        Signal Bot Overview
                    </CardTitle>
                    {allSignalBots.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Reset All
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will stop all running signal bots and clear the history.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={resetSignalBots}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1 rounded-lg bg-background p-4">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Bot className="h-4 w-4" />Active Bots</p>
                            <p className="text-2xl font-bold font-mono">{allSignalBots.filter(b => b.status === 'running').length}</p>
                        </div>
                        <div className="flex flex-col gap-1 rounded-lg bg-background p-4">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><BadgeDollarSign className="h-4 w-4" />Total Profit</p>
                            <p className={cn("text-2xl font-bold font-mono", getProfitColor(allSignalBots.reduce((acc, b) => acc + b.profit, 0)))}>
                                {formatCurrency(allSignalBots.reduce((acc, b) => acc + b.profit, 0))}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ScrollArea className="h-[calc(100vh-450px)]">
                <div className="space-y-8 pr-4">
                    {/* Manual Bots Section */}
                    {manualBots.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <List className="h-4 w-4" />
                                Active & Recent Bots
                            </h3>
                            {manualBots.map((bot) => (
                                <BotItem key={bot.id} bot={bot} stopSignalBot={stopSignalBot} formatCurrency={formatCurrency} getProfitColor={getProfitColor} />
                            ))}
                        </div>
                    )}

                    {/* Arena Auto History Section */}
                    {arenaAutoBots.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2">
                                <Zap className="h-4 w-4 fill-blue-500/20" />
                                Arena Auto Trade History
                            </h3>
                            {arenaAutoBots.map((bot) => (
                                <BotItem key={bot.id} bot={bot} stopSignalBot={stopSignalBot} formatCurrency={formatCurrency} getProfitColor={getProfitColor} isAuto={true} />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function BotItem({ bot, stopSignalBot, formatCurrency, getProfitColor, isAuto = false }: any) {
    return (
        <Collapsible key={bot.id} asChild>
            <Card className={cn(
                bot.status === 'stopped' && 'opacity-60 bg-muted/50',
                isAuto && 'border-blue-500/20 bg-blue-500/[0.02]'
            )}>
                <CardHeader className="py-4">
                    <CardTitle className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-base">
                            <Bot className={cn("h-4 w-4", isAuto ? "text-blue-500" : "text-primary")} />
                            {bot.name}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                bot.status === 'running' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            )}>
                                {bot.status}
                            </span>
                        </div>
                    </CardTitle>
                    <CardDescription className="text-xs font-mono">{bot.signalType}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center py-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">P/L:</span>
                        <span className={cn("text-lg font-bold font-mono", getProfitColor(bot.profit))}>
                            {formatCurrency(bot.profit)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {!isAuto && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => stopSignalBot(bot.id)}
                                disabled={bot.status === 'stopped'}
                                className="h-8 text-xs px-3"
                            >
                                Stop
                            </Button>
                        )}
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs px-3">
                                <List className="h-3 w-3 mr-1" />
                                Logs
                                <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardContent>
                <CollapsibleContent>
                    <CardFooter className="flex-col items-start pt-2">
                        <SignalBotTradeLog trades={bot.trades} />
                    </CardFooter>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
