

'use client';

import { useBot } from '@/context/bot-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Signal, BarChart, BadgeDollarSign, Bot, ChevronDown, List, Trash2 } from 'lucide-react';
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
    const { signalBots, stopSignalBot, resetSignalBots } = useBot();

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

    if (signalBots.length === 0) {
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
                    {signalBots.length > 0 && (
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
                                        This action cannot be undone. This will stop all running signal bots and clear the list.
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
                            <p className="text-2xl font-bold font-mono">{signalBots.filter(b => b.status === 'running').length}</p>
                        </div>
                        <div className="flex flex-col gap-1 rounded-lg bg-background p-4">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><BadgeDollarSign className="h-4 w-4" />Total Profit</p>
                            <p className={cn("text-2xl font-bold font-mono", getProfitColor(signalBots.reduce((acc, b) => acc + b.profit, 0)))}>
                                {formatCurrency(signalBots.reduce((acc, b) => acc + b.profit, 0))}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ScrollArea className="h-[calc(100vh-450px)]">
                <div className="space-y-4 pr-4">
                    {signalBots.map((bot) => (
                        <Collapsible key={bot.id} asChild>
                            <Card className={cn(bot.status === 'stopped' && 'opacity-60 bg-muted/50')}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span className="flex items-center gap-2 text-lg">
                                            <Signal className="h-5 w-5" />
                                            {bot.name}
                                        </span>
                                        <span className={cn(
                                            "text-sm font-bold uppercase px-2 py-1 rounded-md",
                                            bot.status === 'running' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                        )}>
                                            {bot.status}
                                        </span>
                                    </CardTitle>
                                    <CardDescription>{bot.signalType}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm text-muted-foreground">P/L:</span>
                                        <span className={cn("text-xl font-bold font-mono", getProfitColor(bot.profit))}>
                                            {formatCurrency(bot.profit)}
                                        </span>
                                    </div>
                                    <div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => stopSignalBot(bot.id)}
                                            disabled={bot.status === 'stopped'}
                                            className="mr-2"
                                        >
                                            Stop Bot
                                        </Button>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <List className="h-4 w-4 mr-2" />
                                                View Trades
                                                <ChevronDown className="h-4 w-4 ml-2" />
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                </CardContent>
                                <CollapsibleContent>
                                    <CardFooter className="flex-col items-start">
                                        <SignalBotTradeLog trades={bot.trades} />
                                    </CardFooter>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
