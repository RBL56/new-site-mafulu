'use client';

import React, { useState, useEffect } from 'react';
import { useBot } from '@/context/bot-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Zap, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useDerivApi } from '@/context/deriv-api-context';

export default function AutoBotCenter() {
    const { autoBotData, startSignalBot, signalBots } = useBot();
    const { isConnected } = useDerivApi();
    const [isAutoBotEnabled, setIsAutoBotEnabled] = useState(false);
    const [lastTradeTime, setLastTradeTime] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (!isAutoBotEnabled || !autoBotData) return;

        Object.keys(autoBotData).forEach(symbol => {
            const data = autoBotData[symbol];
            const now = Date.now();

            // Limit trade frequency per symbol (e.g., 30s cooldown)
            if (lastTradeTime[symbol] && now - lastTradeTime[symbol] < 30000) return;

            let trigger = false;
            let signalType = '';
            let strategy = '';
            let prediction = 0;
            let direction: 'over' | 'under' = 'over';

            if (data.over1Entry) {
                trigger = true;
                signalType = 'Over 1 Strategy';
                strategy = 'over_under';
                prediction = 1;
                direction = 'over';
            } else if (data.under8Entry) {
                trigger = true;
                signalType = 'Under 8 Strategy';
                strategy = 'over_under';
                prediction = 8;
                direction = 'under';
            } else if (data.recoveryUnder8) {
                trigger = true;
                signalType = 'Recovery Over 4';
                strategy = 'over_under';
                prediction = 4;
                direction = 'over';
            } else if (data.recoveryOver1) {
                trigger = true;
                signalType = 'Recovery Under 6';
                strategy = 'over_under';
                prediction = 6;
                direction = 'under';
            }

            if (trigger) {
                // Check if a bot for this market is already running
                const isRunning = signalBots.some(b => b.market === symbol && b.status === 'running');
                if (!isRunning) {
                    console.log(`🚀 Auto Bot Triggered: ${symbol} - ${signalType}`);
                    startSignalBot({
                        id: `auto-${symbol}-${now}`,
                        name: `Auto: ${data.name}`,
                        market: symbol,
                        signalType: signalType,
                        status: 'running',
                        profit: 0,
                        trades: [],
                        config: {
                            market: symbol,
                            tradeType: 'over_under',
                            predictionType: direction,
                            lastDigitPrediction: prediction,
                            ticks: 1,
                            initialStake: 1,
                            takeProfit: 10,
                            stopLossType: 'consecutive_losses',
                            stopLossConsecutive: 3,
                            useMartingale: true,
                            martingaleFactor: 2.1,
                            useBulkTrading: false,
                            bulkTradeCount: 1,
                            useEntryPoint: false,
                            entryPointType: 'single',
                            entryRangeStart: 0,
                            entryRangeEnd: 9,
                        }
                    });
                    setLastTradeTime(prev => ({ ...prev, [symbol]: now }));
                }
            }
        });
    }, [autoBotData, isAutoBotEnabled, startSignalBot, signalBots, lastTradeTime]);

    return (
        <div className="space-y-6">
            <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-headline flex items-center gap-2">
                            <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                            Auto Bot Control Center
                        </CardTitle>
                        <CardDescription>
                            Automatically executes the "Over 1 and Under 8" strategy across all Volatility and Jump indices.
                        </CardDescription>
                    </div>
                    <Button
                        size="lg"
                        variant={isAutoBotEnabled ? "destructive" : "default"}
                        onClick={() => setIsAutoBotEnabled(!isAutoBotEnabled)}
                        className="font-bold px-8"
                    >
                        {isAutoBotEnabled ? (
                            <><Pause className="mr-2 h-5 w-5" /> Stop Auto Bot</>
                        ) : (
                            <><Play className="mr-2 h-5 w-5" /> Start Auto Bot</>
                        )}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-background border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-3 w-3 rounded-full animate-pulse", isAutoBotEnabled ? "bg-green-500" : "bg-red-500")} />
                                <span className="text-lg font-bold">{isAutoBotEnabled ? "Active" : "Idle"}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-background border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Strategy</p>
                            <span className="text-lg font-bold">Over 1 / Under 8</span>
                        </div>
                        <div className="p-4 rounded-lg bg-background border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Markets Monitored</p>
                            <span className="text-lg font-bold">{Object.keys(autoBotData).length} Assets</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Live Market Analysis
                        </CardTitle>
                        <CardDescription>Real-time strategy readiness for all symbols (1000 Ticks)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-3">
                                {Object.values(autoBotData).map((data: any) => (
                                    <div key={data.symbol} className="flex items-center justify-between p-3 rounded-md bg-secondary/30 border border-border/50">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{data.name}</span>
                                            <span className="text-xs text-muted-foreground">{data.symbol}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={data.over1Ready ? "default" : "secondary"} className={cn(data.over1Ready && "bg-green-600")}>
                                                Over 1: {data.over1Ready ? "READY" : "WAIT"}
                                            </Badge>
                                            <Badge variant={data.under8Ready ? "default" : "secondary"} className={cn(data.under8Ready && "bg-green-600")}>
                                                Under 8: {data.under8Ready ? "READY" : "WAIT"}
                                            </Badge>
                                            {data.over1Entry && <Badge className="bg-yellow-500 text-black animate-bounce">OVER 1 ENTRY!</Badge>}
                                            {data.under8Entry && <Badge className="bg-yellow-500 text-black animate-bounce">UNDER 8 ENTRY!</Badge>}
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(autoBotData).length === 0 && (
                                    <div className="text-center py-20 text-muted-foreground">
                                        <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                        <p>Analyzing markets... Waiting for 1000 ticks data.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Strategy Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="space-y-2">
                            <p className="font-bold text-primary">Over 1 Conditions:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Digits 0-2 frequency &le; 10.5%</li>
                                <li>Digits 0-3 touched &gt; 2 times</li>
                                <li>Current digit is 5 or 6</li>
                                <li>Digit is not most/least appearing</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <p className="font-bold text-primary">Under 8 Conditions:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Digits 7-9 frequency &le; 10.5%</li>
                                <li>Digits 7-9 touched &gt; 2 times</li>
                                <li>Current digit is 7 or 4</li>
                                <li>Digit is not most/least appearing</li>
                            </ul>
                        </div>
                        <div className="space-y-2 p-3 bg-muted rounded-md border">
                            <p className="font-bold">Recovery Logic:</p>
                            <p className="text-xs text-muted-foreground">Under 8 -&gt; Over 4 if last 5 &le; 4</p>
                            <p className="text-xs text-muted-foreground">Over 1 -&gt; Under 6 if last 5 &ge; 6</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
