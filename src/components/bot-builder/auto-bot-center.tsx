'use client';

import React, { useState, useEffect } from 'react';
import { useBot } from '@/context/bot-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Zap, Shield, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useDerivApi } from '@/context/deriv-api-context';
import AutoTradePanel from './auto-trade-panel';
import SignalCard from './signal-card';

export default function AutoBotCenter() {
    const {
        autoBotData, startSignalBot, signalBots, analysisData, resetAutoBots,
        controlCenterRecoveryState, setControlCenterRecoveryState, arenaRecoveryState, setArenaRecoveryState, stopAllAutoBots,
        resumeSignalBot
    } = useBot();
    const { isConnected } = useDerivApi();
    const [isAutoBotEnabled, setIsAutoBotEnabled] = useState(false);
    const [lastTradeTime, setLastTradeTime] = useState<{ [key: string]: number }>({});

    // Watch signal bots to detect losses and enter recovery mode
    useEffect(() => {
        signalBots.forEach(bot => {
            if (bot.status === 'stopped' && bot.trades.length > 0) {
                const lastTrade = bot.trades[0]; // Most recent trade is at index 0
                if (!lastTrade.isWin) {
                    const symbol = bot.market;
                    // Check if already handled? simple check to avoid loops
                    if (controlCenterRecoveryState[symbol]) return;

                    if (bot.signalType === 'Over 1 Strategy') {
                        setControlCenterRecoveryState(prev => ({ ...prev, [symbol]: { mode: 'over1', botId: bot.id } }));
                    } else if (bot.signalType === 'Under 8 Strategy') {
                        setControlCenterRecoveryState(prev => ({ ...prev, [symbol]: { mode: 'under8', botId: bot.id } }));
                    }
                    // Capture losses from Signal Arena bots (if running in this context, though they are usually handled by BotContext directly)
                    // We remove the Arena handlers here because BotContext handles them globally now.
                }
            }
        });
    }, [signalBots, controlCenterRecoveryState, setControlCenterRecoveryState]);

    useEffect(() => {
        if (!autoBotData) return;

        const runningAutoBots = signalBots.filter(b => b.status === 'running' && b.id.startsWith('auto-'));
        const isAnyAutoBotRunning = runningAutoBots.length > 0;

        // GLOBAL RECOVERY CHECK: If ANY bot is waiting for recovery, block new entries.
        const isAnyArenaRecovery = Object.values(arenaRecoveryState).some(v => v !== null);
        const isAnyControlRecovery = Object.values(controlCenterRecoveryState).some(v => v !== null);
        const isGlobalRecoveryActive = isAnyArenaRecovery || isAnyControlRecovery;

        Object.keys(autoBotData).forEach(symbol => {
            // SERIAL EXECUTION RULE: If ANY auto-bot is running OR recovering, do not start ANOTHER.
            if (isAnyAutoBotRunning) return;

            const data = autoBotData[symbol];
            const now = Date.now();

            // Limit trade frequency per symbol
            if (lastTradeTime[symbol] && now - lastTradeTime[symbol] < 30000) return;

            // 1. SYMBOL RECOVERY CHECK: If THIS symbol is in recovery, block EVERYTHING except the recovery trade.
            const symbolRecoveryActive = !!controlCenterRecoveryState[symbol];

            let trigger = false;
            let signalType = '';
            let strategy = '';
            let prediction = 0;
            let direction: 'over' | 'under' = 'over';

            const recoveryInfo = controlCenterRecoveryState[symbol];
            // 2. RECOVERY LOGIC (Highest Priority)
            if (recoveryInfo?.mode === 'under8' && data.recoveryUnder8) {
                console.log(`🚑 Control Center Recovery: Under 8 Loss -> Resuming ${recoveryInfo.botId} with Over 4`);
                resumeSignalBot(recoveryInfo.botId, {
                    predictionType: 'over',
                    lastDigitPrediction: 4
                }, 'Recovery Over 4');
                setControlCenterRecoveryState(prev => ({ ...prev, [symbol]: null }));
                return; // Purchase handled by resumeSignalBot
            } else if (recoveryInfo?.mode === 'over1' && data.recoveryOver1) {
                console.log(`🚑 Control Center Recovery: Over 1 Loss -> Resuming ${recoveryInfo.botId} with Under 6`);
                resumeSignalBot(recoveryInfo.botId, {
                    predictionType: 'under',
                    lastDigitPrediction: 6
                }, 'Recovery Under 6');
                setControlCenterRecoveryState(prev => ({ ...prev, [symbol]: null }));
                return; // Purchase handled by resumeSignalBot
            }
            // 3. ENTRY LOGIC (Blocked if ANY recovery is active globally OR ANY bot is already running)
            else if (isAutoBotEnabled && !isGlobalRecoveryActive && !isAnyAutoBotRunning && !symbolRecoveryActive) {
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
                }
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
                    }, false);
                    setLastTradeTime(prev => ({ ...prev, [symbol]: now }));
                }
            }
        });
    }, [autoBotData, isAutoBotEnabled, startSignalBot, signalBots, lastTradeTime]);

    const toggleAutoBot = () => {
        if (isAutoBotEnabled) {
            // HARD STOP:
            stopAllAutoBots();
            setControlCenterRecoveryState({});
            setArenaRecoveryState({});
            setIsAutoBotEnabled(false);
            setLastTradeTime({});
            console.log("🛑 Auto Bot HARD STOP triggered. All trades and states cleared.");
        } else {
            setIsAutoBotEnabled(true);
        }
    };

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
                        onClick={toggleAutoBot}
                        className="font-bold px-8"
                    >
                        {isAutoBotEnabled ? (
                            <><Pause className="mr-2 h-5 w-5" /> Stop Auto Bot</>
                        ) : (
                            <><Play className="mr-2 h-5 w-5" /> Start Auto Bot</>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetAutoBots}
                        className="ml-2 text-muted-foreground hover:text-destructive"
                        title="Clear Auto Bot History"
                    >
                        <Trash2 className="h-5 w-5" />
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
                <Card className="lg:col-span-2 shadow-xl border-border/50">
                    <CardHeader className="border-b bg-muted/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Dynamic Market Analysis
                                </CardTitle>
                                <CardDescription>Real-time strategy readiness and signal power</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-background/50">
                                    {Object.keys(analysisData).length} Markets Online
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ScrollArea className="h-[600px] pr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.values(analysisData).map((card: any) => (
                                    <SignalCard
                                        key={card.symbol}
                                        card={card}
                                        signalBots={signalBots}
                                        onStartBot={startSignalBot}
                                        autoBotData={autoBotData[card.symbol]}
                                        recoveryMode={controlCenterRecoveryState[card.symbol]}
                                    />
                                ))}
                                {Object.keys(analysisData).length === 0 && (
                                    <div className="col-span-full text-center py-20 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                        <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                        <p>Connecting to Deriv for market data...</p>
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

            <AutoTradePanel type="strategy" />
        </div>
    );
}
