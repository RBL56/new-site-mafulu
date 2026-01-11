'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, Zap } from 'lucide-react';
import { Badge } from '../ui/badge';

interface SignalCardProps {
    card: any;
    signalBots: any[];
    onStartBot: (signal: any, manual: boolean) => void;
    autoBotData?: any;
    recoveryMode?: 'over1' | 'under8' | null;
}

const SignalCard: React.FC<SignalCardProps> = ({
    card,
    signalBots,
    onStartBot,
    autoBotData,
    recoveryMode
}) => {
    if (!card) return null;

    const confidenceClass = card.confidence >= 70 ? 'confidence-high' : card.confidence >= 40 ? 'confidence-medium' : 'confidence-low';
    const biasClass = card.chi_square.interpretation.includes('STRONG') ? 'bias-strong' : card.chi_square.interpretation.includes('Bias') ? 'bias-detected' : 'bias-fair';

    const getSignalClass = (value: number, type: 'over_under' | 'even_odd') => {
        if (type === 'over_under') {
            if (value >= 66) return 'signal-strong';
            if (value >= 61) return 'signal-moderate';
        } else {
            if (value >= 56 || value <= 44) return 'signal-strong';
            if ((value >= 53 && value < 56) || (value > 44 && value <= 47)) return 'signal-moderate';
        }
        return 'signal-weak';
    };

    const getDigitClass = (pct: number) => {
        if (pct >= 14) return 'signal-digit-hot';
        if (pct >= 11) return 'signal-digit-warm';
        return '';
    };

    const isRunning = signalBots.some(b => b.market === card.symbol && b.status === 'running');

    // Use 1000-tick Auto Bot data if available, otherwise use 500-tick card data
    const activeData = autoBotData || card;
    const activePercentages = activeData.percentages || {};
    const activeTicks = activeData.ticks_analyzed || card.ticks_analyzed;

    // Helper to get digit percentage regardless of key format ('digit_0' or '0')
    const getDigitPct = (digit: number) => {
        return activePercentages[`digit_${digit}`] ?? activePercentages[digit] ?? 0;
    };

    const overPercentage = activePercentages.over_3 || 0;
    const underPercentage = activePercentages.under_6 || 0;

    // Strategy-specific calculations
    const sum02 = getDigitPct(0) + getDigitPct(1) + getDigitPct(2);
    const sum79 = getDigitPct(7) + getDigitPct(8) + getDigitPct(9);

    return (
        <div className={cn("signal-card", isRunning && "border-primary/50 shadow-md shadow-primary/10")}>
            <div className="signal-card-header">
                <div className="signal-symbol-info">
                    <h3 className="flex items-center gap-2">
                        {card.name}
                        {isRunning && <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500 animate-pulse" />}
                    </h3>
                    <div className="symbol">{card.symbol}</div>
                </div>
                <div className={cn("signal-confidence-badge", confidenceClass)}>{card.confidence}%</div>
            </div>

            {/* Auto Bot Indicators (If provided) */}
            {autoBotData && (
                <div className="flex gap-1 mb-3">
                    <Badge variant={autoBotData.over1Ready ? "default" : "secondary"} className={cn("text-[10px] px-1 h-5", autoBotData.over1Ready && "bg-green-600")}>
                        O1: {autoBotData.over1Ready ? "READY" : "WAIT"}
                    </Badge>
                    <Badge variant={autoBotData.under8Ready ? "default" : "secondary"} className={cn("text-[10px] px-1 h-5", autoBotData.under8Ready && "bg-green-600")}>
                        U8: {autoBotData.under8Ready ? "READY" : "WAIT"}
                    </Badge>
                    {recoveryMode === 'over1' && <Badge variant="destructive" className="text-[10px] px-1 h-5 animate-pulse">REC: O4</Badge>}
                    {recoveryMode === 'under8' && <Badge variant="destructive" className="text-[10px] px-1 h-5 animate-pulse">REC: U6</Badge>}
                </div>
            )}

            <div className="signal-signals-grid">
                {autoBotData ? (
                    <>
                        <div className="signal-signal-item">
                            <div className="signal-signal-label">0-2 Sum</div>
                            <div className={cn("signal-signal-value", sum02 <= 10.5 ? "text-green-500 font-bold" : "text-muted-foreground")}>
                                {sum02.toFixed(1)}%
                            </div>
                        </div>
                        <div className="signal-signal-item">
                            <div className="signal-signal-label">7-9 Sum</div>
                            <div className={cn("signal-signal-value", sum79 <= 10.5 ? "text-green-500 font-bold" : "text-muted-foreground")}>
                                {sum79.toFixed(1)}%
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="signal-signal-item">
                            <div className="signal-signal-label">Over 3</div>
                            <div className={cn("signal-signal-value", getSignalClass(overPercentage, 'over_under'))}>
                                {overPercentage.toFixed(1)}%
                            </div>
                        </div>
                        <div className="signal-signal-item">
                            <div className="signal-signal-label">Under 6</div>
                            <div className={cn("signal-signal-value", getSignalClass(underPercentage, 'over_under'))}>
                                {underPercentage.toFixed(1)}%
                            </div>
                        </div>
                    </>
                )}
                <div className="signal-signal-item">
                    <div className="signal-signal-label">Even</div>
                    <div className={cn("signal-signal-value", getSignalClass(activePercentages.even || 0, 'even_odd'))}>
                        {(activePercentages.even || 0).toFixed(1)}%
                    </div>
                </div>
                <div className="signal-signal-item">
                    <div className="signal-signal-label">Odd</div>
                    <div className={cn("signal-signal-value", getSignalClass(activePercentages.odd || 0, 'even_odd'))}>
                        {(activePercentages.odd || 0).toFixed(1)}%
                    </div>
                </div>
            </div>

            <div className="signal-stats-row">
                <div className="signal-chi-square">χ²: {card.chi_square.chi2.toFixed(2)}, p: {card.chi_square.pValue.toFixed(3)}</div>
                <div className={cn("signal-bias-indicator", biasClass)}>{card.chi_square.interpretation}</div>
            </div>

            {(card.entry_points_over3?.length > 0 || card.entry_points_under6?.length > 0) && (
                <div className="signal-entry-points-section">
                    <div className="flex flex-col gap-2 mb-4">
                        {card.entry_points_over3?.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Entry O3:</span>
                                <div className="flex flex-wrap gap-1">
                                    {card.entry_points_over3.map((digit: number) => (
                                        <Badge key={digit} variant="outline" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px] justify-center border-blue-400/30 text-blue-300 bg-blue-400/5">
                                            {digit}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {card.entry_points_under6?.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Entry U6:</span>
                                <div className="flex flex-wrap gap-1">
                                    {card.entry_points_under6.map((digit: number) => (
                                        <Badge key={digit} variant="outline" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px] justify-center border-teal-400/30 text-teal-300 bg-teal-400/5">
                                            {digit}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="signal-digits-table">
                {Array.from({ length: 10 }).map((_, i) => {
                    const pct = getDigitPct(i);
                    return (
                        <div key={i} className={cn("signal-digit-cell", getDigitClass(pct), i === 0 ? 'digit-zero' : '')}>
                            <div className="signal-digit-label">{i}</div>
                            <div className="signal-digit-value">{pct.toFixed(1)}%</div>
                        </div>
                    );
                })}
            </div>

            <div className="signal-card-footer">
                <div className="signal-hot-digits">
                    <span>🔥 Hot:</span>
                    <span>{card.hot_digits.length > 0 ? card.hot_digits.join(', ') : 'None'}</span>
                </div>
                <div className="signal-bot-buttons">
                    {card.strong_signal && (
                        <button
                            className={cn('signal-bot-btn', overPercentage >= underPercentage ? 'signal-bot-over' : 'signal-bot-under')}
                            onClick={() => onStartBot(card, true)}
                            disabled={isRunning}
                        >
                            <Bot className="h-4 w-4" /> {overPercentage >= underPercentage ? 'OVER' : 'UNDER'}
                        </button>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center px-3 pb-2 text-[10px] text-muted-foreground">
                <div className="signal-update-time">Updated: {new Date(card.update_time).toLocaleTimeString()}</div>
                <div>Ticks: {activeTicks}</div>
            </div>
        </div>
    );
};

export default SignalCard;
