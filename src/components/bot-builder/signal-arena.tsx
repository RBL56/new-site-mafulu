

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
        lastUpdateTime
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
                    <div className="signal-status-bar">
                        <div className={cn("signal-status-dot", { 'connected': isConnected })}></div>
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <span>Last Update: {lastUpdateTime}</span>
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
        </div>
    );
};

export default SignalArena;


