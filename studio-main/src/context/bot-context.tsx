


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
  tradeLogRef: React.RefObject<HTMLDivElement>;

  // SignalBot
  signalBots: SignalBot[];
  startSignalBot: (config: SignalBot) => void;
  stopSignalBot: (id: string) => void;
  signalBotConfig: SignalBotConfigurationValues;
  setSignalBotConfig: React.Dispatch<React.SetStateAction<SignalBotConfigurationValues>>;
  resetSignalBots: () => void;

  // Tabs
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeBuilderTab: string;
  setActiveBuilderTab: (tab: string) => void;

  // Global Signals
  analysisData: { [key: string]: any };
  signalAlert: any | null;
  setSignalAlert: (alert: any | null) => void;
  lastUpdateTime: string;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

const playSound = (type: 'tp' | 'sl') => {
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
  const { analysisData, signalAlert, setSignalAlert, lastUpdateTime } = useSignalAnalysis();

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
  });
  const signalBotsRef = useRef<SignalBot[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState('bot-builder');
  const [activeBuilderTab, setActiveBuilderTab] = useState('speedbot');

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
        } else if (config?.stopLossType === 'amount' && config.stopLossAmount && totalProfitRef.current <= -config.stopLossAmount) {
          toast({ title: "Stop-Loss Hit", description: "SpeedBot stopped due to stop-loss amount limit." });
          shouldStop = true;
          stopReason = 'sl';
        } else if (config?.stopLossType === 'consecutive_losses' && config.stopLossConsecutive && consecutiveLossesRef.current >= config.stopLossConsecutive) {
          toast({ title: "Stop-Loss Hit", description: `SpeedBot stopped after ${config.stopLossConsecutive} consecutive losses.` });
          shouldStop = true;
          stopReason = 'sl';
        } else if (config?.useBulkTrading && bulkTradesCompletedRef.current >= (config.bulkTradeCount || 1)) {
          if ([...openContractsRef.current.values()].filter(c => c.botType === 'speed').length === 0) {
            toast({ title: 'Bulk Trades Complete', description: `Finished ${config.bulkTradeCount} trades.` });
            shouldStop = true;
          }
        }

        if (shouldStop) {
          if (stopReason) playSound(stopReason);
          stopBot(false);
          return;
        }

        if (isRunningRef.current && configRef.current) {
          purchaseContract('speed', configRef.current, currentStakeRef.current);
        }
      } else if (botType === 'signal' && signalBotId) {
        setSignalBots(currentBots => {
          const newBots = [...currentBots];
          const botIndex = newBots.findIndex(b => b.id === signalBotId);

          if (botIndex === -1) return currentBots;

          const bot = newBots[botIndex];

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
          // NEW: Limit to 1 trade max
          if (updatedBot.trades.length >= 1) {
            toast({ title: "Trade Limit Reached", description: `Signal Bot for ${updatedBot.name} stopped after 1 trade.` });
            updatedBot.status = 'stopped';
          } else if (updatedBot.config.takeProfit && updatedBot.profit >= updatedBot.config.takeProfit) {
            toast({ title: "Take-Profit Hit", description: `Signal Bot for ${updatedBot.name} stopped.` });
            updatedBot.status = 'stopped';
          } else if (updatedBot.config.stopLossType === 'consecutive_losses' && updatedBot.config.stopLossConsecutive && consecutiveLosses >= updatedBot.config.stopLossConsecutive) {
            toast({ title: "Stop-Loss Hit", description: `Signal Bot for ${updatedBot.name} stopped.` });
            updatedBot.status = 'stopped';
          }

          newBots[botIndex] = updatedBot;

          // If not stopped, purchase next contract
          if (updatedBot.status === 'running') {
            purchaseContract('signal', updatedBot.config, nextStake, updatedBot.id);
          }

          return newBots;
        });
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

  const startSignalBot = useCallback((newBot: SignalBot) => {
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

    const botToStart: SignalBot = { ...newBot, config: finalConfig, trades: [] };

    // Update state
    setSignalBots(prev => [...prev, botToStart]);

    // CRITICAL FIX: Manually update the ref immediately so purchaseContract sees the new bot
    // The useEffect hook that normally updates this ref runs AFTER render, which is too late for the immediate purchase call.
    signalBotsRef.current = [...signalBotsRef.current, botToStart];

    purchaseContract('signal', botToStart.config, botToStart.config.initialStake, botToStart.id);
    setActiveTab('bot-builder');
    setActiveBuilderTab('signalbot');
  }, [purchaseContract, setActiveTab, setActiveBuilderTab, signalBotConfig]);

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
      activeTab,
      setActiveTab,
      activeBuilderTab,
      setActiveBuilderTab,
      analysisData,
      signalAlert,
      setSignalAlert,
      lastUpdateTime,
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
