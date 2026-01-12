

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDerivApi } from '@/context/deriv-api-context';
import { cn } from '@/lib/utils';
import { Bot, Zap } from 'lucide-react';
import { useBot } from '@/context/bot-context';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Volume2, VolumeX, Bell, BellOff, Info } from 'lucide-react';
import type { SignalBot } from '@/lib/types';
import SignalBotConfigPanel from './signal-bot-config-panel';
import AutoTradePanel from './auto-trade-panel';
import SignalCard from './signal-card';
import { SYMBOL_CONFIG } from '@/hooks/use-signal-analysis';




const SignalArena = () => {
    const { isConnected } = useDerivApi();
    const {
        startSignalBot,
        setActiveTab,
        setActiveBuilderTab,
        signalBots,
        analysisData,
        signalAlert,
        setSignalAlert,
        lastUpdateTime,
        soundEnabled,
        setSoundEnabled,
        notificationEnabled,
        setNotificationEnabled
    } = useBot();

    const [displayedCards, setDisplayedCards] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState('all'); // Set default to 'all' to show signals by default

    const FILTERS = React.useMemo(() => {
        const symbols = Object.keys(SYMBOL_CONFIG);
        return {
            'all': symbols,
            'strong': [],
            'over3': [],
            'under6': [],
            'volatility': symbols.filter(s => SYMBOL_CONFIG[s].type === 'volatility'),
            'jump': symbols.filter(s => SYMBOL_CONFIG[s].type === 'jump'),
        }
    }, []);

    const filterAndSortData = useCallback(() => {
        let filteredData = Object.values(analysisData).filter(d => d !== null);

        const filterSymbols = FILTERS[activeFilter as keyof typeof FILTERS];
        if (filterSymbols && filterSymbols.length > 0) {
            filteredData = filteredData.filter(d => filterSymbols.includes(d.symbol));
        }

        if (activeFilter === 'strong') {
            filteredData = filteredData.filter(d => d.strong_signal);
        }

        if (activeFilter === 'over3') {
            filteredData.sort((a, b) => (b?.percentages.over_3 ?? 0) - (a?.percentages.over_3 ?? 0));
        } else if (activeFilter === 'under6') {
            filteredData.sort((a, b) => (b?.percentages.under_6 ?? 0) - (a?.percentages.under_6 ?? 0));
        } else {
            filteredData.sort((a, b) => (b?.confidence ?? 0) - (a?.confidence ?? 0));
        }

        setDisplayedCards(filteredData);
    }, [activeFilter, FILTERS, analysisData]);

    useEffect(() => {
        filterAndSortData();
    }, [filterAndSortData]);

    // --- Extension Check Logic (Same as before) ---
    const checkExtensionCondition = async (signal: any): Promise<boolean> => {
        console.log("🔍 Checking extension conditions for:", signal.name);

        // This is where we integrate with the extension.
        // We'll look for a specific global function or object.
        // TODO: Replace with actual extension communication protocol.

        try {
            // Mechanism 1: Check for a global 'SignalExtension' object
            if ((window as any).SignalExtension && typeof (window as any).SignalExtension.checkTrade === 'function') {
                const result = await (window as any).SignalExtension.checkTrade(signal);
                console.log("Extension response:", result);
                return result === true;
            }

            // Mechanism 2: Dispatch a custom event and wait for response (common for content scripts)
            // Implementation placeholder...

            console.log("⚠️ No extension detected, proceeding with default allowance.");
            return true; // Default to true if no extension to block it, or change to false to be strict.
        } catch (error) {
            console.error("Extension check failed:", error);
            return false; // Fail safe
        }
    };

    const runBotFromSignal = async (signal: any, manualStart: boolean = false) => {
        // Perform Extension Check
        const isAllowed = await checkExtensionCondition(signal);

        if (!isAllowed) {
            if (manualStart) {
                // simple alert for manual clicks
                alert("Extension verification failed. Trade blocked.");
            }
            console.log("🚫 Trade blocked by extension check.");
            return;
        }

        const direction = signal.strong_signal_type.includes('Over') ? 'over' : 'under';
        const prediction = signal.strong_signal_type.includes('Over') ? 3 : 6;

        const botConfig: SignalBot = {
            id: `${signal.symbol}-${Date.now()}`,
            name: signal.name,
            market: signal.symbol,
            signalType: signal.strong_signal_type,
            status: 'running',
            profit: 0,
            trades: [],
            config: {
                market: signal.symbol,
                tradeType: 'over_under',
                predictionType: direction,
                lastDigitPrediction: prediction,
                ticks: 1,
                // These will be overridden by global signal bot config from context
                initialStake: 1,
                takeProfit: 10,
                stopLossType: 'consecutive_losses',
                stopLossConsecutive: 3,
                useMartingale: true,
                martingaleFactor: 2.1,
                useBulkTrading: false,
                useEntryPoint: false,
                stopLossAmount: 50,
                bulkTradeCount: 1,
            }
        }

        startSignalBot(botConfig);
        if (manualStart) {
            setActiveTab('bot-builder');
            setActiveBuilderTab('signalbot');
        }
    };

    const renderContent = () => {
        if (!isConnected) return <div className="signal-loading"><div className="signal-loading-spinner"></div><p>Connecting to Deriv API...</p></div>;

        // If connected but no analysis data yet, show collecting message
        if (Object.keys(analysisData).length === 0) {
            return <div className="signal-loading"><div className="signal-loading-spinner" style={{ borderTopColor: '#f59e0b' }}></div><p>Collecting tick data (need 100 ticks)...</p></div>;
        }

        if (displayedCards.length === 0) {
            return <div className="signal-no-data"><p>No signals match the current filter.</p></div>
        }

        return displayedCards.map(card => (
            <SignalCard
                key={card.symbol}
                card={card}
                signalBots={signalBots}
                onStartBot={runBotFromSignal}
            />
        ));
    };

    const handleStartBotFromAlert = () => {
        if (signalAlert) runBotFromSignal(signalAlert, true);
        setSignalAlert(null);
    }

    return (
        <div className="signal-center-body">
            <div className="signal-center-container">
                <div className="signal-center-header">
                    <h1><span>🎯</span> LOCO SIGNAL CENTER</h1>
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                                <div className={cn("signal-status-dot", { 'connected': isConnected })}></div>
                                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Last Update: {lastUpdateTime}</span>
                        </div>

                        <div className="flex items-center gap-4 bg-muted/20 px-4 py-1.5 rounded-full border border-primary/20 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-green-500" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sound AI</span>
                                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} className="scale-75 origin-right" />
                            </div>
                            <div className="flex items-center gap-2 border-l border-primary/10 pl-4">
                                {notificationEnabled ? <Bell className="h-3.5 w-3.5 text-primary" /> : <BellOff className="h-3.5 w-3.5 text-muted-foreground" />}
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Popups</span>
                                <Switch checked={notificationEnabled} onCheckedChange={setNotificationEnabled} className="scale-75 origin-right" />
                            </div>
                        </div>
                    </div>
                </div>
                <SignalBotConfigPanel />
                <div className="signal-filters">
                    {Object.keys(FILTERS).map(filter => (
                        <button key={filter} className={cn("signal-filter-btn", { 'active': activeFilter === filter })} onClick={() => setActiveFilter(filter)}>
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="signal-cards-grid">{renderContent()}</div>
                <div className="mt-8">
                    <AutoTradePanel type="arena" />
                </div>
            </div>

            <AlertDialog open={!!signalAlert} onOpenChange={(open) => !open && setSignalAlert(null)}>
                <AlertDialogContent className="border-primary/50 bg-background/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-2xl font-headline text-primary">
                            <Zap className="h-6 w-6 fill-primary" />
                            STRONG SIGNAL DETECTED
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <div className="bg-muted/50 p-4 rounded-xl border border-primary/20 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Market:</span>
                                    <span className="font-bold text-foreground">{signalAlert?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Signal:</span>
                                    <Badge variant="default" className="bg-blue-500">{signalAlert?.strong_signal_type}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Confidence:</span>
                                    <span className="font-bold text-green-500">{signalAlert?.confidence}%</span>
                                </div>
                            </div>
                            <p className="text-center text-sm text-muted-foreground italic">
                                Would you like to launch the Signal Bot for this target?
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-full">Ignore</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStartBotFromAlert}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold px-8"
                        >
                            Launch Signal Bot 🚀
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SignalArena;


