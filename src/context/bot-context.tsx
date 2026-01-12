


'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { BotConfigurationValues, SignalBotConfigurationValues } from '@/components/bot-builder/bot-configuration-form';
import type { Trade, SignalBot } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useDerivApi } from './deriv-api-context';
import { UseFormReturn } from 'react-hook-form';
import { useDigitAnalysis } from './digit-analysis-context';
import { useSignalAnalysis } from '@/hooks/use-signal-analysis';

export type BotStatus = 'idle' | 'running' | 'stopped' | 'waiting';

interface BotContextType {
  // SpeedBot
  trades: Trade[];
  botStatus: BotStatus;
  totalProfit: number;
  totalStake: number;
  totalRuns: number;
  totalWins: number;
  totalLosses: number;
  isBotRunning: boolean;
  startBot: (config: BotConfigurationValues) => void;
  stopBot: () => void;
  resetStats: () => void;
  form: UseFormReturn<BotConfigurationValues> | null;
  setForm: (form: UseFormReturn<BotConfigurationValues>) => void;
  tradeLogRef: React.RefObject<HTMLDivElement | null>;

  // SignalBot
  signalBots: SignalBot[];
  startSignalBot: (config: SignalBot, switchTab?: boolean) => void;
  stopSignalBot: (id: string) => void;
  signalBotConfig: SignalBotConfigurationValues;
  setSignalBotConfig: React.Dispatch<React.SetStateAction<SignalBotConfigurationValues>>;
  resetSignalBots: () => void;
  resetAutoBots: () => void;
  stopAllAutoBots: () => void;

  // Recovery States
  arenaRecoveryState: { [key: string]: 'over3_loss' | 'under6_loss' | null };
  setArenaRecoveryState: React.Dispatch<React.SetStateAction<{ [key: string]: 'over3_loss' | 'under6_loss' | null }>>;
  controlCenterRecoveryState: { [key: string]: 'over1' | 'under8' | 'over3_loss' | 'under6_loss' | null };
  setControlCenterRecoveryState: React.Dispatch<React.SetStateAction<{ [key: string]: 'over1' | 'under8' | 'over3_loss' | 'under6_loss' | null }>>;

  // Tabs
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeBuilderTab: string;
  setActiveBuilderTab: (tab: string) => void;

  // Global Signals
  analysisData: { [key: string]: any };
  autoBotData: { [key: string]: any };
  signalAlert: any | null;
  setSignalAlert: (alert: any | null) => void;
  lastUpdateTime: string;

  // Sound & Notifications
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  notificationEnabled: boolean;
  setNotificationEnabled: (enabled: boolean) => void;
  tpSlNotification: { type: 'tp' | 'sl', profit: number } | null;
  setTpSlNotification: (notification: { type: 'tp' | 'sl', profit: number } | null) => void;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

const playSound = (type: 'tp' | 'sl', soundEnabled: boolean) => {
  if (!soundEnabled) return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);

    if (type === 'tp') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
    } else { // 'sl'
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
    }

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
    oscillator.stop(audioContext.currentTime + 0.3);

  } catch (e) {
    console.error("Could not play sound", e);
  }
};

export const BotProvider = ({ children }: { children: ReactNode }) => {
  const { api, subscribeToMessages, isConnected, marketConfig } = useDerivApi();
  const { toast } = useToast();
  const { lastDigits, connect: connectDigit, disconnect: disconnectDigit, status: digitStatus } = useDigitAnalysis();

  // SpeedBot state
  const [trades, setTrades] = useState<Trade[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus>('idle');
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalStake, setTotalStake] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [form, setForm] = useState<UseFormReturn<BotConfigurationValues> | null>(null);

  // SignalBot state
  const [signalBots, setSignalBots] = useState<SignalBot[]>([]);
  const [signalBotConfig, setSignalBotConfig] = useState<SignalBotConfigurationValues>({
    initialStake: 1,
    takeProfit: 10,
    stopLossConsecutive: 3,
    useMartingale: true,
    martingaleFactor: 2.1,
    autoTrade: false,
  });
  const [arenaRecoveryState, setArenaRecoveryState] = useState<{ [key: string]: 'over3_loss' | 'under6_loss' | null }>({});
  const [controlCenterRecoveryState, setControlCenterRecoveryState] = useState<{ [key: string]: 'over1' | 'under8' | 'over3_loss' | 'under6_loss' | null }>({});
  const signalBotsRef = useRef<SignalBot[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState('bot-builder');
  const [activeBuilderTab, setActiveBuilderTab] = useState('speedbot');

  // Sound & Notifications
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const { analysisData, autoBotData, signalAlert, setSignalAlert, lastUpdateTime } = useSignalAnalysis(soundEnabled, notificationEnabled);
  const [tpSlNotification, setTpSlNotification] = useState<{ type: 'tp' | 'sl', profit: number } | null>(null);

  const configRef = useRef<BotConfigurationValues | null>(null);
  const currentStakeRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const totalProfitRef = useRef(0);
  const bulkTradesCompletedRef = useRef(0);
  const openContractsRef = useRef(new Map<number, { stake: number, botType: 'speed' | 'signal', signalBotId?: string }>());
  const tradeLogRef = useRef<HTMLDivElement>(null);
  const consecutiveLossesRef = useRef(0);
  const waitingForEntryRef = useRef(false);

  useEffect(() => {
    totalProfitRef.current = totalProfit;
  }, [totalProfit]);

  useEffect(() => {
    signalBotsRef.current = signalBots;
  }, [signalBots]);

  const stopBot = useCallback((showToast = true) => {
    if (!isRunningRef.current && botStatus === 'idle') return;

    isRunningRef.current = false;
    waitingForEntryRef.current = false;
    setBotStatus('stopped');

    if (digitStatus !== 'disconnected') {
      disconnectDigit(true);
    }

    if (showToast) {
      toast({
        title: "Bot Stopped",
        description: "The SpeedBot has been stopped.",
      });
    }
  }, [toast, botStatus, digitStatus, disconnectDigit]);

  const resetStats = useCallback(() => {
    if (isRunningRef.current) {
      toast({
        variant: 'destructive',
        title: 'Bot is running',
        description: 'Please stop the bot before resetting stats.',
      });
      return;
    }
    setTrades([]);
    setTotalProfit(0);
    setTotalStake(0);
    setTotalRuns(0);
    setTotalWins(0);
    setTotalLosses(0);
    bulkTradesCompletedRef.current = 0;
    consecutiveLossesRef.current = 0;
    // We only clear contracts related to the speedbot
    openContractsRef.current.forEach((val, key) => {
      if (val.botType === 'speed') openContractsRef.current.delete(key)
    });
    toast({
      title: 'Stats Reset',
      description: 'The SpeedBot trade log and statistics have been cleared.',
    });
  }, [toast]);

  const getContractType = (predictionType: BotConfigurationValues['predictionType']) => {
    switch (predictionType) {
      case 'matches': return 'DIGITMATCH';
      case 'differs': return 'DIGITDIFF';
      case 'even': return 'DIGITEVEN';
      case 'odd': return 'DIGITODD';
      case 'over': return 'DIGITOVER';
      case 'under': return 'DIGITUNDER';
      default: throw new Error(`Invalid prediction type: ${predictionType}`);
    }
  }

  const purchaseContract = useCallback((
    botType: 'speed' | 'signal',
    config: BotConfigurationValues,
    stake: number,
    signalBotId?: string,
  ) => {
    if (!api) return;

    if (botType === 'speed' && !isRunningRef.current) return;
    if (botType === 'signal' && !signalBotsRef.current.find(b => b.id === signalBotId && b.status === 'running')) return;

    if (botType === 'speed') {
      waitingForEntryRef.current = false;
      setBotStatus('running');
    }

    const contractType = getContractType(config.predictionType);

    const parameters: any = {
      amount: stake,
      basis: "stake",
      contract_type: contractType,
      currency: "USD",
      duration: config.ticks,
      duration_unit: "t",
      symbol: config.market,
    };

    if (config.tradeType !== 'even_odd') {
      parameters.barrier = config.lastDigitPrediction;
    }

    api.send(JSON.stringify({
      buy: "1",
      price: stake,
      parameters,
      passthrough: {
        botType,
        signalBotId,
        stake,
      }
    }));
  }, [api]);

  const extractLastDigit = useCallback((price: number, market: string) => {
    const config = marketConfig[market];
    const decimals = config?.decimals || 2;
    const formattedPrice = price.toFixed(decimals);

    if (decimals === 0) {
      return Math.abs(Math.floor(price)) % 10;
    } else {
      const priceStr = formattedPrice.replace(/[^0-9]/g, '');
      const lastChar = priceStr.slice(-1);
      return parseInt(lastChar);
    }
  }, [marketConfig]);

  const handleMessage = useCallback((data: any) => {
    if (data.error) {
      if (data.error.code !== 'AlreadySubscribed' && data.error.code !== 'AuthorizationRequired') {
        if (openContractsRef.current.size > 0) {
          const firstContract = openContractsRef.current.keys().next().value;
          if (firstContract) openContractsRef.current.delete(firstContract);
        }
        if (isRunningRef.current) stopBot(false);
      }
      return;
    }

    if (data.msg_type === 'buy') {
      if (data.buy.contract_id) {
        const { botType, signalBotId, stake } = data.passthrough;
        openContractsRef.current.set(data.buy.contract_id, { stake, botType, signalBotId });

        if (botType === 'speed') {
          const newTrade: Trade = {
            id: data.buy.contract_id,
            description: data.buy.longcode,
            marketId: configRef.current?.market || '',
            stake: data.buy.buy_price,
            payout: 0,
            isWin: false,
          };
          setTrades(prev => [newTrade, ...prev]);
          setTotalStake(prev => prev + newTrade.stake);
          setTotalRuns(prev => prev + 1);
        }
      }
    }

    if (data.msg_type === 'proposal_open_contract' && data.proposal_open_contract?.contract_id) {
      const contract = data.proposal_open_contract;
      const contractId = contract.contract_id;

      const contractInfo = openContractsRef.current.get(contractId);
      if (!contractInfo) return;
      if (!contract.is_sold) return;

      openContractsRef.current.delete(contractId);

      const { botType, signalBotId } = contractInfo;
      const isWin = contract.status === 'won';
      const profit = contract.profit;
      const entryTick = contract.entry_tick;
      const entryDigit = entryTick ? extractLastDigit(entryTick, contract.underlying) : undefined;
      const exitTick = contract.exit_tick;
      const exitDigit = exitTick ? extractLastDigit(exitTick, contract.underlying) : undefined;

      if (botType === 'speed') {
        const config = configRef.current;
        const currentStake = contractInfo.stake;
        let nextStake = config ? config.initialStake : 1;

        if (isWin) {
          consecutiveLossesRef.current = 0;
          setTotalWins(prev => prev + 1);
        } else {
          consecutiveLossesRef.current += 1;
          if (config?.useMartingale && config.martingaleFactor) {
            nextStake = currentStake * config.martingaleFactor;
          }
          setTotalLosses(prev => prev + 1);
        }
        currentStakeRef.current = nextStake;

        totalProfitRef.current += profit;
        setTotalProfit(totalProfitRef.current);

        setTrades(prevTrades => {
          const newTrades = [...prevTrades];
          const tradeIndex = newTrades.findIndex(t => t.id === contractId);
          if (tradeIndex !== -1) {
            newTrades[tradeIndex] = {
              ...newTrades[tradeIndex],
              payout: contract.payout,
              isWin,
              entryDigit,
              exitTick,
              exitDigit
            };
          }
          return newTrades;
        });

        // --- Stop/Continue Logic ---
        if (config?.useBulkTrading) {
          bulkTradesCompletedRef.current += 1;
        }

        let shouldStop = false;
        let stopReason: 'tp' | 'sl' | null = null;

        if (config?.takeProfit && totalProfitRef.current >= config.takeProfit) {
          toast({ title: "Take-Profit Hit", description: "SpeedBot stopped due to take-profit limit." });
          shouldStop = true;
          stopReason = 'tp';
          setTpSlNotification({ type: 'tp', profit: totalProfitRef.current });
        } else if (config?.stopLossType === 'amount' && config.stopLossAmount && totalProfitRef.current <= -config.stopLossAmount) {
          toast({ title: "Stop-Loss Hit", description: "SpeedBot stopped due to stop-loss amount limit." });
          shouldStop = true;
          stopReason = 'sl';
          setTpSlNotification({ type: 'sl', profit: totalProfitRef.current });
        } else if (config?.stopLossType === 'consecutive_losses' && config.stopLossConsecutive && consecutiveLossesRef.current >= config.stopLossConsecutive) {
          toast({ title: "Stop-Loss Hit", description: `SpeedBot stopped after ${config.stopLossConsecutive} consecutive losses.` });
          shouldStop = true;
          stopReason = 'sl';
          setTpSlNotification({ type: 'sl', profit: totalProfitRef.current });
        } else if (config?.useBulkTrading && bulkTradesCompletedRef.current >= (config.bulkTradeCount || 1)) {
          if ([...openContractsRef.current.values()].filter(c => c.botType === 'speed').length === 0) {
            toast({ title: 'Bulk Trades Complete', description: `Finished ${config.bulkTradeCount} trades.` });
            shouldStop = true;
          }
        }

        if (shouldStop) {
          if (stopReason) playSound(stopReason, soundEnabled);
          stopBot(false);
          return;
        }

        if (isRunningRef.current && configRef.current) {
          purchaseContract('speed', configRef.current, currentStakeRef.current);
        }
      } else if (botType === 'signal' && signalBotId) {
        const currentBots = signalBotsRef.current;
        const botIndex = currentBots.findIndex(b => b.id === signalBotId);

        if (botIndex === -1) return;

        const bot = currentBots[botIndex];

        // Check if this contract has already been processed for this bot
        if (bot.trades.some(t => t.id === contractId)) {
          return;
        }

        const newProfit = bot.profit + profit;
        let consecutiveLosses = bot.consecutiveLosses || 0;
        let nextStake = bot.config.initialStake;

        if (isWin) {
          consecutiveLosses = 0;
        } else {
          consecutiveLosses++;
          if (bot.config.useMartingale && bot.config.martingaleFactor) {
            nextStake = contractInfo.stake * bot.config.martingaleFactor;
          }
        }

        const newTrade: Trade = {
          id: contractId,
          description: contract.longcode,
          marketId: contract.underlying,
          stake: contractInfo.stake,
          payout: contract.payout,
          isWin,
          entryDigit,
          exitDigit,
        };

        const updatedBot: SignalBot = {
          ...bot,
          profit: newProfit,
          consecutiveLosses,
          trades: [newTrade, ...bot.trades]
        };

        // Check stop conditions
        const maxTrades = updatedBot.config.maxTrades;
        const isAutoArena = updatedBot.id.startsWith('auto-arena-');

        if (updatedBot.config.takeProfit && updatedBot.profit >= updatedBot.config.takeProfit) {
          toast({ title: "Take-Profit Hit", description: `Signal Bot for ${updatedBot.name} stopped.` });
          updatedBot.status = 'stopped';
        } else if (updatedBot.config.stopLossType === 'consecutive_losses' && updatedBot.config.stopLossConsecutive && consecutiveLosses >= updatedBot.config.stopLossConsecutive) {
          toast({ title: "Stop-Loss Hit", description: `Signal Bot for ${updatedBot.name} stopped.` });
          updatedBot.status = 'stopped';
        }

        // Update state
        setSignalBots(prev => prev.map(b => b.id === updatedBot.id ? updatedBot : b));

        // Recovery Logic for Arena Auto-Bots
        if (isAutoArena && !isWin && !updatedBot.id.includes('recovery')) {
          const symbol = updatedBot.config.market;
          console.log(`⚠️ Arena Bot Loss detected for ${symbol}. Entering Recovery Wait Mode.`);

          updatedBot.status = 'stopped'; // Stop the loser
          setSignalBots(prev => prev.map(b => b.id === updatedBot.id ? updatedBot : b));

          if (updatedBot.config.predictionType === 'over' && updatedBot.config.lastDigitPrediction === 3) {
            setArenaRecoveryState(prev => ({ ...prev, [symbol]: 'over3_loss' }));
            toast({ title: "Recovery Mode: Over 3 Loss", description: "Waiting for 5 low digits to recover..." });
          } else if (updatedBot.config.predictionType === 'under' && updatedBot.config.lastDigitPrediction === 6) {
            setArenaRecoveryState(prev => ({ ...prev, [symbol]: 'under6_loss' }));
            toast({ title: "Recovery Mode: Under 6 Loss", description: "Waiting for 5 high digits to recover..." });
          }
          return;
        }

        // Handle recovery trade completion
        if (updatedBot.id.includes('recovery') && updatedBot.parentBotId) {
          if (isWin) {
            // Recovery succeeded - resume parent bot
            console.log(`✅ Recovery successful! Resuming parent bot: ${updatedBot.parentBotId}`);
            setSignalBots(prev => prev.map(b => {
              if (b.id === updatedBot.parentBotId) {
                return { ...b, status: 'running' };
              }
              return b;
            }));
            toast({
              title: "Recovery Successful!",
              description: "Original bot has been resumed and will continue trading.",
              duration: 5000
            });
          } else {
            // Recovery failed - keep parent bot stopped
            console.log(`❌ Recovery failed. Parent bot remains stopped: ${updatedBot.parentBotId}`);
            toast({
              title: "Recovery Failed",
              description: "Original bot remains stopped. Manual intervention may be required.",
              duration: 5000,
              variant: "destructive"
            });
          }
        }

        // Attempt next trade if still running
        if (updatedBot.status === 'running') {
          purchaseContract('signal', updatedBot.config, nextStake, updatedBot.id);
        }
      }
    }
  }, [stopBot, toast, extractLastDigit, purchaseContract]);

  useEffect(() => {
    if (!isConnected) {
      stopBot(false);
      setSignalBots(prev => prev.map(b => ({ ...b, status: 'stopped' })));
      return;
    }
    const unsubscribe = subscribeToMessages(handleMessage);
    return () => unsubscribe();
  }, [isConnected, subscribeToMessages, handleMessage, stopBot]);


  const startBot = useCallback((config: BotConfigurationValues) => {
    if (isRunningRef.current || !api || !isConnected) {
      if (!isConnected) {
        toast({
          variant: 'destructive',
          title: 'Not Connected',
          description: 'Please connect to the Deriv API first.',
        });
      }
      return;
    };

    configRef.current = config;
    currentStakeRef.current = config.initialStake;
    bulkTradesCompletedRef.current = 0;
    consecutiveLossesRef.current = 0;

    isRunningRef.current = true;

    setActiveTab('bot-builder');
    setActiveBuilderTab('speedbot');

    setTimeout(() => {
      tradeLogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    if (config.useEntryPoint) {
      waitingForEntryRef.current = true;
      setBotStatus('waiting');
      if (digitStatus === 'disconnected' || digitStatus === 'stopped') {
        connectDigit(config.market);
      }
    } else {
      setBotStatus('running');
      if (config.useBulkTrading) {
        const tradeCount = config.bulkTradeCount || 1;
        const concurrentTrades = Math.min(tradeCount, 10);
        for (let i = 0; i < concurrentTrades; i++) {
          purchaseContract('speed', config, currentStakeRef.current);
        }
      } else {
        purchaseContract('speed', config, currentStakeRef.current);
      }
    }
  }, [api, isConnected, toast, connectDigit, digitStatus, purchaseContract]);

  const startSignalBot = useCallback((newBot: SignalBot, switchTab: boolean = true) => {
    // Apply global signal bot config
    const finalConfig: BotConfigurationValues = {
      ...newBot.config,
      initialStake: signalBotConfig.initialStake,
      takeProfit: signalBotConfig.takeProfit,
      stopLossType: 'consecutive_losses',
      stopLossConsecutive: signalBotConfig.stopLossConsecutive,
      useMartingale: signalBotConfig.useMartingale,
      martingaleFactor: signalBotConfig.martingaleFactor,
      useBulkTrading: false, // Ensure bulky trading is disabled
    };

    // CRITICAL for Auto Bots:
    // Entry bots (Over 1, Under 8, Strong Over 3 etc) must STOP on first loss to trigger Recovery Logic.
    // They should NOT use Martingale immediately.
    // Recovery bots (containing 'recovery' in ID) SHOULD use Global Config (Martingale allowed).
    if (newBot.id.startsWith('auto-') && !newBot.id.includes('recovery')) {
      finalConfig.useMartingale = false;
      finalConfig.stopLossConsecutive = 1;
    }

    const botToStart: SignalBot = { ...newBot, config: finalConfig, trades: [] };

    // Update state
    setSignalBots(prev => [...prev, botToStart]);

    // CRITICAL FIX: Manually update the ref immediately so purchaseContract sees the new bot
    // The useEffect hook that normally updates this ref runs AFTER render, which is too late for the immediate purchase call.
    signalBotsRef.current = [...signalBotsRef.current, botToStart];

    purchaseContract('signal', botToStart.config, botToStart.config.initialStake, botToStart.id);

    if (switchTab) {
      setActiveTab('bot-builder');
      setActiveBuilderTab('signalbot');
    }
  }, [purchaseContract, setActiveTab, setActiveBuilderTab, signalBotConfig]);

  // =========================================================================================
  // AUTO-TRADE ARENA LOGIC
  // =========================================================================================
  useEffect(() => {
    // We run this effect on every analysis update to check for:
    // 1. Recovery Opportunities (Priority, runs even if Auto Trade is OFF)
    // 2. New Entry Opportunities (Only if Auto Trade is ON)

    Object.values(analysisData).forEach((data: any) => {
      if (!data || !data.symbol) return;
      const symbol = data.symbol;

      const lastDigit = data.lastDigit;
      // Get last 5 digits for recovery check
      const last5Digits = data.last5Digits || [];
      const isLast5Low = last5Digits.length === 5 && last5Digits.every((d: number) => d <= 4);
      const isLast5High = last5Digits.length === 5 && last5Digits.every((d: number) => d >= 5);

      // --- 1. RECOVERY CHECK (Priority) ---
      if (arenaRecoveryState[symbol]) {
        const mode = arenaRecoveryState[symbol];
        let recoveryTrigger = false;
        let recoveryPrediction = 0;
        let recoveryType: 'over' | 'under' = 'over';
        let recoveryName = '';

        // Over 3 Loss -> Wait for 5 Low -> Trade Over 4
        if (mode === 'over3_loss' && isLast5Low) {
          recoveryTrigger = true;
          recoveryPrediction = 4;
          recoveryType = 'over';
          recoveryName = 'Recovery Over 4 (Arena)';
        }
        // Under 6 Loss -> Wait for 5 High -> Trade Under 5
        else if (mode === 'under6_loss' && isLast5High) {
          recoveryTrigger = true;
          recoveryPrediction = 5;
          recoveryType = 'under';
          recoveryName = 'Recovery Under 5 (Arena)';
        }

        if (recoveryTrigger) {
          console.log(`🚑 Executing Recovery: ${symbol} - ${recoveryName}`);
          setArenaRecoveryState(prev => ({ ...prev, [symbol]: null })); // Clear state

          const recoveryBot: SignalBot = {
            id: `auto-arena-recovery-${symbol}-${Date.now()}`,
            name: recoveryName,
            market: symbol,
            signalType: recoveryName,
            status: 'running',
            profit: 0,
            trades: [],
            config: {
              market: symbol,
              tradeType: 'over_under',
              predictionType: recoveryType,
              lastDigitPrediction: recoveryPrediction,
              ticks: 1,
              initialStake: signalBotConfig.initialStake,
              takeProfit: signalBotConfig.takeProfit,
              stopLossType: 'consecutive_losses',
              stopLossConsecutive: signalBotConfig.stopLossConsecutive,
              useMartingale: signalBotConfig.useMartingale,
              martingaleFactor: signalBotConfig.martingaleFactor,
              maxTrades: signalBotConfig.maxTrades,
              useBulkTrading: false,
              bulkTradeCount: 1,
              useEntryPoint: false,
              entryPointType: 'single',
              entryRangeStart: 0,
              entryRangeEnd: 9,
            }
          };
          startSignalBot(recoveryBot, false);
          return; // Recovery takes precedence
        }
      }

      // --- 2. NEW ENTRY CHECK (Only if Auto Trade is ON) ---
      if (!signalBotConfig.autoTrade) return;

      // GLOBAL SERIAL EXECUTION CHECK
      const isAnyAutoBotRunning = signalBotsRef.current.some(b =>
        b.status === 'running' && (b.id.startsWith('auto-') || b.id.startsWith('auto-arena-'))
      );
      if (isAnyAutoBotRunning) return;

      let shouldTrade = false;
      let predictionType: 'over' | 'under' = 'over';
      let prediction = 0;
      let signalName = '';

      // STRATEGY 1: STRONG OVER 3 + ENTRY POINT
      if (data.strong_signal && data.strong_signal_type.includes('Over 3')) {
        if (data.entry_points_over3 && data.entry_points_over3.includes(lastDigit)) {
          shouldTrade = true;
          predictionType = 'over';
          prediction = 3;
          signalName = 'Strong Over 3 (Auto)';
        }
      }

      // STRATEGY 2: STRONG UNDER 6 + ENTRY POINT
      if (data.strong_signal && data.strong_signal_type.includes('Under 6')) {
        if (data.entry_points_under6 && data.entry_points_under6.includes(lastDigit)) {
          shouldTrade = true;
          predictionType = 'under';
          prediction = 6;
          signalName = 'Strong Under 6 (Auto)';
        }
      }

      if (shouldTrade) {
        console.log(`🤖 Auto-Trade Triggered: ${symbol} - ${signalName} @ Digit ${lastDigit}`);

        const newBot: SignalBot = {
          id: `auto-arena-${symbol}-${Date.now()}`,
          name: signalName,
          market: symbol,
          signalType: signalName,
          status: 'running',
          profit: 0,
          trades: [],
          config: {
            market: symbol,
            tradeType: 'over_under',
            predictionType: predictionType,
            lastDigitPrediction: prediction,
            ticks: 1, // Default to 1 tick
            initialStake: signalBotConfig.initialStake,
            takeProfit: signalBotConfig.takeProfit,
            stopLossType: 'consecutive_losses',
            stopLossConsecutive: signalBotConfig.stopLossConsecutive,
            useMartingale: signalBotConfig.useMartingale,
            martingaleFactor: signalBotConfig.martingaleFactor,
            maxTrades: signalBotConfig.maxTrades,
            useBulkTrading: false,
            useEntryPoint: false,
          }
        };

        startSignalBot(newBot, false);
      }
    });

  }, [signalBotConfig.autoTrade, analysisData, startSignalBot, arenaRecoveryState, setArenaRecoveryState]);

  const stopSignalBot = useCallback((id: string) => {
    setSignalBots(prev => prev.map(bot => bot.id === id ? { ...bot, status: 'stopped' } : bot));
    toast({ title: 'Signal Bot Stopped', description: `The bot with ID ${id} has been manually stopped.` })
  }, [toast]);

  const resetSignalBots = useCallback(() => {
    setSignalBots([]);
    signalBotsRef.current = [];
    // Clear signal bot contracts from tracking
    openContractsRef.current.forEach((val, key) => {
      if (val.botType === 'signal') openContractsRef.current.delete(key);
    });
    toast({
      title: 'Signal Bots Reset',
      description: 'All signal bots have been stopped and cleared.',
    });
  }, [toast]);

  const resetAutoBots = useCallback(() => {
    const runningAuto = signalBotsRef.current.some(b => b.id.startsWith('auto-') && b.status === 'running');
    if (runningAuto) {
      toast({
        variant: "destructive",
        title: "Cannot Reset",
        description: "Please stop all Auto Bots before resetting history."
      });
      return;
    }
    setSignalBots(prev => prev.filter(b => !b.id.startsWith('auto-')));
    signalBotsRef.current = signalBotsRef.current.filter(b => !b.id.startsWith('auto-'));
    toast({ title: "Auto Bot History Cleared", description: "All auto-bot records have been removed." });
  }, [toast]);

  const stopAllAutoBots = useCallback(() => {
    setSignalBots(prev => prev.map(b => {
      if (b.id.startsWith('auto-') && b.status === 'running') {
        return { ...b, status: 'stopped' };
      }
      return b;
    }));
    toast({ title: "Auto Bots Stopped", description: "All active auto-trading bots have been stopped." });
  }, [toast]);


  useEffect(() => {
    if (!waitingForEntryRef.current || !isRunningRef.current || !configRef.current?.useEntryPoint) return;

    const config = configRef.current;
    if (!config) return;

    if (lastDigits.length === 0) return;
    const lastDigit = lastDigits[lastDigits.length - 1];

    let conditionMet = false;
    if (config.entryPointType === 'single') {
      const entryDigit = config.entryRangeStart ?? 0;
      if (lastDigit === entryDigit) {
        conditionMet = true;
      }
    } else if (config.entryPointType === 'consecutive' && lastDigits.length >= 2) {
      const start = config.entryRangeStart ?? 0;
      const end = config.entryRangeEnd ?? 9;
      const lastTwo = lastDigits.slice(-2);
      if (lastTwo.every(digit => digit >= start && digit <= end)) {
        conditionMet = true;
      }
    }

    if (conditionMet) {
      if (digitStatus !== 'disconnected') {
        disconnectDigit(true);
      }

      waitingForEntryRef.current = false;

      if (config.useBulkTrading) {
        const tradeCount = config.bulkTradeCount || 1;
        const concurrentTrades = Math.min(tradeCount, 10);
        for (let i = 0; i < concurrentTrades; i++) {
          purchaseContract('speed', config, currentStakeRef.current);
        }
      } else {
        purchaseContract('speed', config, currentStakeRef.current);
      }
    }
  }, [lastDigits, purchaseContract, digitStatus, disconnectDigit]);

  // Suppress signal alert popup when auto-trade is enabled
  useEffect(() => {
    if (signalBotConfig.autoTrade && signalAlert) {
      setSignalAlert(null);
    }
  }, [signalBotConfig.autoTrade, signalAlert, setSignalAlert]);

  // --- Auto Trade for Signal Arena ---
  const autoTradedSymbolsRef = useRef<Set<string>>(new Set());
  const pendingArenaEntriesRef = useRef<Map<string, { signalType: string, prediction: number, direction: 'over' | 'under', botId: string }>>(new Map());

  useEffect(() => {
    if (!signalBotConfig.autoTrade || !isConnected) {
      pendingArenaEntriesRef.current.clear();
      return;
    }

    Object.keys(analysisData).forEach(symbol => {
      const data = analysisData[symbol];
      if (data && data.strong_signal) {
        const isRunning = signalBotsRef.current.some(b => b.market === symbol && b.status === 'running');
        const isPending = pendingArenaEntriesRef.current.has(symbol);

        if (!isRunning && !isPending && !autoTradedSymbolsRef.current.has(symbol)) {
          console.log(`📡 Signal detected for ${symbol}: ${data.strong_signal_type}. Waiting for Entry Point...`);

          const direction = data.strong_signal_type.includes('Over') ? 'over' : 'under';
          const prediction = data.strong_signal_type.includes('Over') ? 3 : 6;

          pendingArenaEntriesRef.current.set(symbol, {
            signalType: data.strong_signal_type,
            prediction,
            direction,
            botId: `auto-arena-${symbol}-${Date.now()}`
          });
        }
      }
    });
  }, [analysisData, signalBotConfig.autoTrade, isConnected]);

  // Handle Target Entry Points for Arena Bots
  useEffect(() => {
    if (!signalBotConfig.autoTrade || !isConnected || lastDigits.length === 0) return;

    const currentDigit = lastDigits[lastDigits.length - 1];

    pendingArenaEntriesRef.current.forEach((pending, symbol) => {
      const data = analysisData[symbol];
      if (!data) return;

      const entryPoints = pending.direction === 'over' ? (data.entry_points_over3 || []) : (data.entry_points_under6 || []);

      if (entryPoints.includes(currentDigit)) {
        console.log(`🔥 Entry Point ${currentDigit} touched for ${symbol}. Starting Arena Bot.`);

        const botConfig: SignalBot = {
          id: pending.botId,
          name: `${data.name}`,
          market: symbol,
          signalType: `${pending.signalType} (Entry: ${currentDigit})`,
          status: 'running',
          profit: 0,
          trades: [],
          config: {
            market: symbol,
            tradeType: 'over_under',
            predictionType: pending.direction,
            lastDigitPrediction: pending.prediction,
            ticks: 1,
            initialStake: signalBotConfig.initialStake,
            takeProfit: signalBotConfig.takeProfit,
            stopLossType: 'consecutive_losses',
            stopLossConsecutive: signalBotConfig.stopLossConsecutive,
            useMartingale: signalBotConfig.useMartingale,
            martingaleFactor: signalBotConfig.martingaleFactor,
            useBulkTrading: false,
            useEntryPoint: false,
            stopLossAmount: 50,
            bulkTradeCount: 1,
            entryPointType: 'single',
            entryRangeStart: 0,
            entryRangeEnd: 9,
          }
        };

        startSignalBot(botConfig, false);
        pendingArenaEntriesRef.current.delete(symbol);
        autoTradedSymbolsRef.current.add(symbol);

        // Cooldown for this specific bot instance/trigger
        setTimeout(() => {
          autoTradedSymbolsRef.current.delete(symbol);
        }, 120000);
      }
    });
  }, [lastDigits, analysisData, signalBotConfig.autoTrade, isConnected, startSignalBot, signalBotConfig]);

  const isBotRunning = (botStatus === 'running' || botStatus === 'waiting') && isRunningRef.current;

  return (
    <BotContext.Provider value={{
      trades,
      botStatus,
      totalProfit,
      totalStake,
      totalRuns,
      totalWins,
      totalLosses,
      isBotRunning,
      startBot,
      stopBot,
      resetStats,
      form,
      setForm,
      tradeLogRef,
      signalBots,
      startSignalBot,
      stopSignalBot,
      signalBotConfig,
      setSignalBotConfig,
      resetSignalBots,
      resetAutoBots,
      stopAllAutoBots,
      arenaRecoveryState,
      setArenaRecoveryState,
      controlCenterRecoveryState,
      setControlCenterRecoveryState,
      activeTab,
      setActiveTab,
      activeBuilderTab,
      setActiveBuilderTab,
      analysisData,
      autoBotData,
      signalAlert,
      setSignalAlert,
      lastUpdateTime,
      soundEnabled,
      setSoundEnabled,
      notificationEnabled,
      setNotificationEnabled,
      tpSlNotification,
      setTpSlNotification,
    }}>
      {children}
    </BotContext.Provider>
  );
};

export const useBot = () => {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBot must be used within a BotProvider');
  }
  return context;
};
