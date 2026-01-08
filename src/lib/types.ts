

import { BotConfigurationValues, SignalBotConfigurationValues } from "@/components/bot-builder/bot-configuration-form";

export type Strategy = {
    name: string;
    description: string;
    details: string;
};

export type Trade = {
    id: number;
    description: string;
    marketId: string;
    stake: number;
    payout: number;
    isWin: boolean;
    entryDigit?: number;
    exitTick?: number;
    exitDigit?: number;
};

export interface SignalBot {
    id: string;
    name: string;
    market: string;
    signalType: string;
    status: 'running' | 'stopped';
    profit: number;
    config: BotConfigurationValues;
    consecutiveLosses?: number;
    trades: Trade[];
}

