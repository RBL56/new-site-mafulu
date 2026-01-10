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

    const overPercentage = card.percentages.over_3 || 0;
    const underPercentage = card.percentages.under_6 || 0;
    const isRunning = signalBots.some(b => b.market === card.symbol && b.status === 'running');

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
                <div className="signal-signal-item">
                    <div className="signal-signal-label">Over 3</div>
                    <div className={cn("signal-signal-value", getSignalClass(card.percentages.over_3, 'over_under'))}>
                        {card.percentages.over_3.toFixed(1)}%
                    </div>
                </div>
                <div className="signal-signal-item">
                    <div className="signal-signal-label">Under 6</div>
                    <div className={cn("signal-signal-value", getSignalClass(card.percentages.under_6, 'over_under'))}>
                        {card.percentages.under_6.toFixed(1)}%
                    </div>
                </div>
                <div className="signal-signal-item">
                    <div className="signal-signal-label">Even</div>
                    <div className={cn("signal-signal-value", getSignalClass(card.percentages.even, 'even_odd'))}>
                        {card.percentages.even.toFixed(1)}%
                    </div>
                </div>
                <div className="signal-signal-item">
                    <div className="signal-signal-label">Odd</div>
                    <div className={cn("signal-signal-value", getSignalClass(card.percentages.odd, 'even_odd'))}>
                        {card.percentages.odd.toFixed(1)}%
                    </div>
                </div>
            </div>

            <div className="signal-stats-row">
                <div className="signal-chi-square">χ²: {card.chi_square.chi2.toFixed(2)}, p: {card.chi_square.pValue.toFixed(3)}</div>
                <div className={cn("signal-bias-indicator", biasClass)}>{card.chi_square.interpretation}</div>
            </div>

            {card.reasons && card.reasons.length > 0 && (
                <div className="signal-reasons">
                    {card.reasons.map((reason: string) => (
                        <span key={reason} className="signal-reason-tag">{reason}</span>
                    ))}
                </div>
            )}

            <div className="signal-digits-table">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={cn("signal-digit-cell", getDigitClass(card.percentages[`digit_${i}`]), i === 0 ? 'digit-zero' : '')}>
                        <div className="signal-digit-label">{i}</div>
                        <div className="signal-digit-value">{card.percentages[`digit_${i}`].toFixed(1)}%</div>
                    </div>
                ))}
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
            <div className="signal-update-time">Updated: {new Date(card.update_time).toLocaleTimeString()}</div>
        </div>
    );
};

export default SignalCard;
