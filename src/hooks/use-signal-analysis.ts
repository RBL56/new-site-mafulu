
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDerivApi } from '@/context/deriv-api-context';

export const SYMBOL_CONFIG: { [key: string]: { name: string, type: string } } = {
    'R_10': { name: 'Volatility 10', type: 'volatility' },
    'R_25': { name: 'Volatility 25', type: 'volatility' },
    'R_50': { name: 'Volatility 50', type: 'volatility' },
    'R_75': { name: 'Volatility 75', type: 'volatility' },
    'R_100': { name: 'Volatility 100', type: 'volatility' },
    '1HZ10V': { name: 'Volatility 10 (1s)', type: 'volatility' },
    '1HZ25V': { name: 'Volatility 25 (1s)', type: 'volatility' },
    '1HZ30V': { name: 'Volatility 30 (1s)', type: 'volatility' },
    '1HZ50V': { name: 'Volatility 50 (1s)', type: 'volatility' },
    '1HZ75V': { name: 'Volatility 75 (1s)', type: 'volatility' },
    '1HZ90V': { name: 'Volatility 90 (1s)', type: 'volatility' },
    '1HZ100V': { name: 'Volatility 100 (1s)', type: 'volatility' },
    'JD10': { name: 'Jump 10', type: 'jump' },
    'JD25': { name: 'Jump 25', type: 'jump' },
    'JD50': { name: 'Jump 50', type: 'jump' },
    'JD75': { name: 'Jump 75', type: 'jump' },
    'JD100': { name: 'Jump 100', type: 'jump' },
};

const playSound = (text: string) => {
    try {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.2;
            window.speechSynthesis.speak(utterance);
        }
    } catch (e) {
        console.error("Could not play sound", e);
    }
};

const chiSquareTest = (observed: number[]) => {
    const total = observed.reduce((a, b) => a + b, 0);
    if (total === 0) return { chi2: 0, pValue: 1, interpretation: 'No Data' };

    const expected = total / 10;
    if (expected === 0) return { chi2: 0, pValue: 1, interpretation: 'No Data' };

    const chi2 = observed.reduce((acc, obs) => acc + Math.pow(obs - expected, 2) / expected, 0);
    const p_value_table: { [key: number]: number } = {
        21.67: 0.01, 19.02: 0.025, 16.92: 0.05, 14.68: 0.1, 12.24: 0.2, 4.17: 0.9, 2.7: 0.98
    };

    let pValue = 1.0;
    for (const threshold in p_value_table) {
        if (chi2 >= parseFloat(threshold)) {
            pValue = p_value_table[threshold as any];
            break;
        }
    }

    let interpretation = "Uniform (fair)";
    if (pValue < 0.01) interpretation = "STRONG BIAS DETECTED";
    else if (pValue < 0.05) interpretation = "Bias detected";

    return { chi2, pValue, interpretation };
};

const analyzeDigits = (digits: number[], symbol: string, name: string) => {
    const total = digits.length;
    if (total < 500) return null;

    const counts = Array(10).fill(0);
    digits.forEach(digit => {
        if (digit >= 0 && digit <= 9) counts[digit]++;
    });

    const percentages: { [key: string]: number } = {};
    for (let i = 0; i < 10; i++) {
        percentages[`digit_${i}`] = (counts[i] / total) * 100;
    }
    percentages.over_3 = (counts.slice(4).reduce((a, b) => a + b, 0) / total) * 100;
    percentages.under_6 = (counts.slice(0, 6).reduce((a, b) => a + b, 0) / total) * 100;
    const evenCount = counts.reduce((acc, count, i) => i % 2 === 0 ? acc + count : acc, 0);
    percentages.even = (evenCount / total) * 100;
    percentages.odd = 100 - percentages.even;

    const chiSquare = chiSquareTest(counts);
    let confidence = 0;
    const reasons: string[] = [];
    let strongSignalType = '';

    // Dynamic Threshold: User requested to set back to 66% for all markets
    // and ensure refreshing after every tick.
    const strongThreshold = 66.0;

    if (percentages.over_3 >= strongThreshold) {
        confidence += 35;
        reasons.push(`Strong Over 3 (> ${strongThreshold}%)`);
        strongSignalType = 'Strong Over 3';
    }
    else if (percentages.over_3 >= 61) { confidence += 15; reasons.push("Moderate Over 3"); }

    if (percentages.under_6 >= strongThreshold) {
        confidence += 35;
        reasons.push(`Strong Under 6 (> ${strongThreshold}%)`);
        strongSignalType = 'Strong Under 6';
    }
    else if (percentages.under_6 >= 61) { confidence += 15; reasons.push("Moderate Under 6"); }

    if (percentages.even >= 56 || percentages.even <= 44) { confidence += 15; reasons.push("Strong Even/Odd Bias"); }
    if (chiSquare.pValue < 0.01) { confidence += 20; reasons.push("Strong Statistical Bias"); }
    else if (chiSquare.pValue < 0.05) { confidence += 10; reasons.push("Statistical Bias"); }
    const hotDigits = counts.map((c, i) => ({ c, i })).filter(d => (d.c / total) * 100 >= 14).map(d => d.i);
    if (hotDigits.length > 0) { confidence += 15; reasons.push("Hot Digit(s)"); }

    return {
        symbol,
        name,
        percentages,
        chi_square: chiSquare,
        confidence: Math.min(100, confidence),
        hot_digits: hotDigits,
        counts, // Pass raw counts for further analysis
        ticks_analyzed: total,
        update_time: new Date().toISOString(),
        strong_signal: strongSignalType !== '',
        strong_signal_type: strongSignalType,
        reasons,
    };
};

const analyzeAutoBotStrategy = (digits: number[], symbol: string, name: string) => {
    const total = digits.length;
    if (total < 1000) return null;

    const counts = Array(10).fill(0);
    digits.forEach(digit => {
        if (digit >= 0 && digit <= 9) counts[digit]++;
    });

    const percentages: { [key: number]: number } = {};
    for (let i = 0; i < 10; i++) {
        percentages[i] = (counts[i] / total) * 100;
    }

    // Over 1 (Digit 0-2 frequency <= 10.5%)
    const over1Ready = (percentages[0] + percentages[1] + percentages[2]) / 3 <= 10.5;

    // Under 8 (Digit 7-9 frequency <= 10.5%)
    const under8Ready = (percentages[7] + percentages[8] + percentages[9]) / 3 <= 10.5;

    // Entry Point Logic
    // Touching digits in last N ticks
    const last10 = digits.slice(-10);
    const last5 = digits.slice(-5);

    // Most/Least appearing for Entry exclusion
    const sortedIndices = [...Array(10).keys()].sort((a, b) => counts[b] - counts[a]);
    const mostAppearing = sortedIndices[0];
    const leastAppearing = sortedIndices[9];

    let over1Entry = false;
    if (over1Ready) {
        const count03 = last10.filter(d => d >= 0 && d <= 3).length;
        const currentDigit = last10[last10.length - 1];
        if (count03 > 2 && (currentDigit === 5 || currentDigit === 6)) {
            if (currentDigit !== mostAppearing && currentDigit !== leastAppearing) {
                over1Entry = true;
            }
        }
    }

    let under8Entry = false;
    if (under8Ready) {
        const count79 = last10.filter(d => d >= 7 && d <= 9).length;
        const currentDigit = last10[last10.length - 1];
        if (count79 > 2 && (currentDigit === 7 || currentDigit === 4)) { // Strategy says 7 or 4
            if (currentDigit !== mostAppearing && currentDigit !== leastAppearing) {
                under8Entry = true;
            }
        }
    }

    // Recovery Logic
    // Recovery on under 8 -> trade over 4 when last 5 <= 4
    const recoveryUnder8 = last5.every(d => d <= 4);

    // Recovery on over 1 -> trade under 6 when last 5 >= 6
    const recoveryOver1 = last5.every(d => d >= 6);

    return {
        symbol,
        name,
        over1Ready,
        under8Ready,
        over1Entry,
        under8Entry,
        recoveryUnder8,
        recoveryOver1,
        lastDigit: last10[last10.length - 1],
        percentages,
        ticks_analyzed: total
    };
};

export const useSignalAnalysis = () => {
    const { api, isConnected, subscribeToMessages, marketConfig } = useDerivApi();
    const [analysisData, setAnalysisData] = useState<{ [key: string]: any }>({});
    const [autoBotData, setAutoBotData] = useState<{ [key: string]: any }>({});
    const [signalAlert, setSignalAlert] = useState<any | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

    const tickDataRef = useRef<{ [key: string]: number[] }>({});
    const analysisDataRef = useRef<{ [key: string]: any }>({});
    const subscribedSymbols = useRef(new Set<string>());
    const historyFetchedSymbols = useRef(new Set<string>());
    const strongSignalNotified = useRef(new Set<string>());

    const extractLastDigit = useCallback((price: number, marketSymbol: string) => {
        const config = marketConfig[marketSymbol];
        const decimals = config?.decimals || 2;
        const priceStr = price.toFixed(decimals);
        return parseInt(priceStr[priceStr.length - 1]);
    }, [marketConfig]);

    const runAnalysis = useCallback(() => {
        let hasNewStrongSignal = false;
        const newAutoBotData: { [key: string]: any } = {};

        // Skip analysis if no data
        if (Object.keys(tickDataRef.current).length === 0) return;

        Object.keys(tickDataRef.current).forEach(symbol => {
            const digits = tickDataRef.current[symbol];

            // Standard Signal Analysis (500 ticks)
            if (digits && digits.length >= 500) {
                const arenaDigits = digits.slice(-500);
                const result = analyzeDigits(arenaDigits, symbol, SYMBOL_CONFIG[symbol]?.name || symbol);
                if (result) {
                    const previousResult = analysisDataRef.current[symbol];
                    if (result.strong_signal && (!previousResult || !previousResult.strong_signal)) {
                        if (!strongSignalNotified.current.has(symbol)) {
                            playSound(`${result.name}, ${result.strong_signal_type}`);
                            strongSignalNotified.current.add(symbol);
                            setSignalAlert(result);
                            hasNewStrongSignal = true;
                        }
                    } else if (!result.strong_signal && previousResult && previousResult.strong_signal) {
                        strongSignalNotified.current.delete(symbol);
                    }
                    analysisDataRef.current[symbol] = result;
                }
            }

            // Auto Bot Strategy Analysis (1000 ticks)
            if (digits && digits.length >= 1000) {
                const autoResult = analyzeAutoBotStrategy(digits, symbol, SYMBOL_CONFIG[symbol]?.name || symbol);
                if (autoResult) {
                    newAutoBotData[symbol] = autoResult;
                }
            }
        });

        // Only log if something changed or meaningfully processed, to avoid console spam
        // console.log(`📊 Analysis run at ${new Date().toLocaleTimeString()}`);

        setAnalysisData({ ...analysisDataRef.current });
        setAutoBotData(newAutoBotData); // This might be expensive if many keys, but 1s interval is fine.
        setLastUpdateTime(new Date().toLocaleTimeString());
    }, []);

    const handleMessage = useCallback((data: any) => {
        if (data.error) {
            console.error("API Error in useSignalAnalysis:", data.error);
            return;
        }

        if (data.msg_type === 'history') {
            const symbol = data.echo_req.ticks_history;
            if (!subscribedSymbols.current.has(symbol)) {
                const newDigits = data.history.prices.map((p: string) => extractLastDigit(parseFloat(p), symbol));
                tickDataRef.current[symbol] = (tickDataRef.current[symbol] || []).concat(newDigits);

                if (api && api.readyState === WebSocket.OPEN) {
                    api.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
                    subscribedSymbols.current.add(symbol);
                    console.log(`✅ Subscribed to ticks for ${symbol}, history length: ${newDigits.length}`);
                }
                // We don't run analysis here immediately anymore, the interval will pick it up
            }
        }

        if (data.msg_type === 'tick') {
            const tick = data.tick;
            const symbol = tick.symbol;
            const newDigit = extractLastDigit(parseFloat(tick.quote), symbol);
            const existingTicks = tickDataRef.current[symbol] || [];
            const updatedTicks = [...existingTicks, newDigit];
            if (updatedTicks.length > 1000) updatedTicks.shift();
            tickDataRef.current[symbol] = updatedTicks;
            // Removed direct runAnalysis() call
        }
    }, [extractLastDigit, api]);

    const manageSubscriptions = useCallback(() => {
        if (!api || !isConnected || api.readyState !== WebSocket.OPEN) return;

        const symbols = Object.keys(SYMBOL_CONFIG);
        const subscribeWithDelay = (index: number) => {
            if (index >= symbols.length) return;
            const symbol = symbols[index];
            if (!historyFetchedSymbols.current.has(symbol) && api.readyState === WebSocket.OPEN) {
                api.send(JSON.stringify({ ticks_history: symbol, end: 'latest', count: 1000, style: 'ticks' }));
                historyFetchedSymbols.current.add(symbol);
                console.log(`📡 Requested history for ${symbol}`);
            }
            setTimeout(() => subscribeWithDelay(index + 1), 200);
        };
        subscribeWithDelay(0);
    }, [api, isConnected]);

    useEffect(() => {
        if (isConnected) {
            console.log("🔌 Connected to Deriv API, initializing subscriptions...");
            manageSubscriptions();
            const unsubscribe = subscribeToMessages(handleMessage);
            return () => unsubscribe();
        } else {
            console.log("🔌 Disconnected from Deriv API. Resetting subscription state.");
            subscribedSymbols.current.clear();
            historyFetchedSymbols.current.clear();
            tickDataRef.current = {};
        }
    }, [isConnected, manageSubscriptions, handleMessage, subscribeToMessages]);

    // Interval for running analysis and updating UI
    useEffect(() => {
        if (!isConnected) return;

        const intervalId = setInterval(() => {
            runAnalysis();
        }, 1000); // Run analysis every 1 second

        return () => clearInterval(intervalId);
    }, [isConnected, runAnalysis]);

    return {
        analysisData,
        autoBotData,
        signalAlert,
        setSignalAlert,
        lastUpdateTime
    };
};
