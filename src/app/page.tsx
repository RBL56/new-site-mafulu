
'use client';

import { useDerivApi } from '@/context/deriv-api-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Bot, Signal, CandlestickChart, Circle, Waypoints, Target, Zap, TrendingUp, TrendingDown } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BotProvider, useBot } from '@/context/bot-context';
import { DigitAnalysisTool } from '@/components/digit-analysis-tool';
import BotConfigurationForm from '@/components/bot-builder/bot-configuration-form';
import BotStatus from '@/components/bot-builder/bot-status';
import TradeLog from '@/components/bot-builder/trade-log';
import QuickTradePanel from '@/components/bot-builder/quick-trade-panel';
import { useDigitAnalysis } from '@/context/digit-analysis-context';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import SignalArena from '@/components/bot-builder/signal-arena';
import SignalBotDashboard from '@/components/bot-builder/signal-bot-dashboard';
import AutoBotCenter from '@/components/bot-builder/auto-bot-center';

function BotBuilderContent() {
  const { isConnected } = useDerivApi();
  const { connect: connectDigitAnalysis, disconnect: disconnectDigitAnalysis, status: digitAnalysisStatus } = useDigitAnalysis();
  const {
    activeTab,
    setActiveTab,
    activeBuilderTab,
    setActiveBuilderTab,
    tradeLogRef,
    signalAlert,
    setSignalAlert,
    tpSlNotification,
    setTpSlNotification,
    startSignalBot
  } = useBot();

  const handleStartBotFromAlert = () => {
    if (signalAlert) {
      const direction = signalAlert.strong_signal_type.includes('Over') ? 'over' : 'under';
      const prediction = signalAlert.strong_signal_type.includes('Over') ? 3 : 6;

      startSignalBot({
        id: `${signalAlert.symbol}-${Date.now()}`,
        name: signalAlert.name,
        market: signalAlert.symbol,
        signalType: signalAlert.strong_signal_type,
        status: 'running',
        profit: 0,
        trades: [],
        config: {
          market: signalAlert.symbol,
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
      setActiveTab('bot-builder');
      setActiveBuilderTab('signalbot');
    }
    setSignalAlert(null);
  };

  const handleTabChange = (value: string) => {
    // Disconnect from dcircle if we are leaving it
    if (activeTab === 'dcircle' && value !== 'dcircle') {
      if (digitAnalysisStatus === 'connected' || digitAnalysisStatus === 'connecting' || digitAnalysisStatus === 'collecting') {
        disconnectDigitAnalysis();
      }
    }

    // Connect to dcircle if we are entering it
    if (value === 'dcircle') {
      if (digitAnalysisStatus !== 'connected' && digitAnalysisStatus !== 'connecting' && digitAnalysisStatus !== 'collecting') {
        connectDigitAnalysis();
      }
    }

    setActiveTab(value);
  };

  return (
    <div className={cn("py-4 md:py-8")}>
      {isConnected ? (
        <Tabs value={activeTab} className="w-full md:grid md:grid-cols-[250px_1fr] gap-8" onValueChange={handleTabChange}>
          <div className="px-4 md:hidden">
            <ScrollArea className="w-full" orientation="horizontal">
              <TabsList className="inline-flex mb-4 gap-2">
                <TabsTrigger value="bot-builder" className="py-3 text-base shrink-0 justify-start" onClick={() => handleTabChange('bot-builder')}><Waypoints className="mr-2 h-5 w-5" />Bot Builder</TabsTrigger>
                <TabsTrigger value="dcircle" className="py-3 text-base shrink-0 justify-start" onClick={() => handleTabChange('dcircle')}><Circle className="mr-2 h-5 w-5" />DCircle</TabsTrigger>
                <TabsTrigger value="signal-arena" className="py-3 text-base shrink-0 justify-start" onClick={() => handleTabChange('signal-arena')}><Target className="mr-2 h-5 w-5" />Signal Arena</TabsTrigger>
                <TabsTrigger value="auto-bot" className="py-3 text-base shrink-0 justify-start" onClick={() => handleTabChange('auto-bot')}><Zap className="mr-2 h-5 w-5 text-yellow-500" />Auto Bot</TabsTrigger>
                <TabsTrigger value="trading-view" className="py-3 text-base shrink-0 justify-start" onClick={() => handleTabChange('trading-view')}><CandlestickChart className="mr-2 h-5 w-5" />TradingView</TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>

          <div className="px-4 md:px-0 hidden md:block">
            <ScrollArea className="w-full whitespace-nowrap pb-2 md:pb-0">
              <TabsList className="inline-flex w-full mb-4 md:flex-col md:h-auto md:w-auto">
                <TabsTrigger value="bot-builder" className="py-3 text-base w-full justify-start"><Waypoints className="mr-2 h-5 w-5" />Bot Builder</TabsTrigger>
                <TabsTrigger value="dcircle" className="py-3 text-base w-full justify-start"><Circle className="mr-2 h-5 w-5" />DCircle</TabsTrigger>
                <TabsTrigger value="signal-arena" className="py-3 text-base w-full justify-start"><Target className="mr-2 h-5 w-5" />Signal Arena</TabsTrigger>
                <TabsTrigger value="auto-bot" className="py-3 text-base w-full justify-start"><Zap className="mr-2 h-5 w-5 text-yellow-500" />Auto Bot</TabsTrigger>
                <TabsTrigger value="trading-view" className="py-3 text-base w-full justify-start"><CandlestickChart className="mr-2 h-4 w-5" />TradingView</TabsTrigger>             </TabsList>
            </ScrollArea>
          </div>

          <div>
            <TabsContent value="bot-builder" className="mt-0 px-4 md:px-0">
              <Tabs value={activeBuilderTab} className="w-full" onValueChange={setActiveBuilderTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="speedbot" className="py-3 text-base"><Bot className="mr-2 h-5 w-5" />SpeedBot</TabsTrigger>
                  <TabsTrigger value="signalbot" className="py-3 text-base"><Signal className="mr-2 h-5 w-5" />Signal Bot</TabsTrigger>
                </TabsList>
                <TabsContent value="speedbot">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                      <BotConfigurationForm />
                    </div>
                    <div className="lg:col-span-2 space-y-8">
                      <BotStatus />
                      <div ref={tradeLogRef}>
                        <TradeLog />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="signalbot">
                  <SignalBotDashboard />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="dcircle" className="mt-0 px-4 md:px-0">
              <ScrollArea className="h-[calc(100vh-160px)] md:h-[calc(100vh-200px)]">
                <div className="space-y-8 pr-4">
                  <QuickTradePanel />
                  <DigitAnalysisTool />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="signal-arena">
              <SignalArena />
            </TabsContent>

            <TabsContent value="auto-bot">
              <AutoBotCenter />
            </TabsContent>

            <TabsContent value="trading-view" className="mt-0 px-4 md:px-0">
              <div className="space-y-8">
                <QuickTradePanel />
                <div className="w-full rounded-md overflow-hidden border h-[calc(100vh-140px)]">
                  <iframe
                    src="https://charts.deriv.com"
                    className="w-full h-full"
                    title="Deriv TradingView Chart"
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        <Card className="h-full flex flex-col justify-center items-center text-center py-16 mx-4 md:mx-0">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit mb-4">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="font-headline text-2xl">Connect Your Account</CardTitle>
            <CardDescription>
              Please connect your Deriv account using your API token to start trading.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You can get your API token from your Deriv account settings. Click the "API Token" button in the header to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Global Signal Alert */}
      <AlertDialog open={!!signalAlert} onOpenChange={() => setSignalAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="text-yellow-400" />
              Strong Signal Detected!
            </AlertDialogTitle>
            <AlertDialogDescription>
              A strong signal has been found and a bot can be automatically started for you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <p className="font-bold text-lg">{signalAlert?.name}</p>
            <Badge>{signalAlert?.strong_signal_type}</Badge>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartBotFromAlert}>
              <Bot className="mr-2 h-4 w-4" /> Start Bot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* TP/SL Notification */}
      <AlertDialog open={!!tpSlNotification} onOpenChange={() => setTpSlNotification(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {tpSlNotification?.type === 'tp' ? (
                <>
                  <TrendingUp className="text-green-500" />
                  Take-Profit Hit! 🎉
                </>
              ) : (
                <>
                  <TrendingDown className="text-red-500" />
                  Stop-Loss Hit
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tpSlNotification?.type === 'tp'
                ? 'Congratulations! Your SpeedBot has reached the take-profit target.'
                : 'Your SpeedBot has hit the stop-loss limit and has been stopped.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <p className="text-sm text-muted-foreground">Final Profit/Loss:</p>
            <p className={cn(
              "text-3xl font-bold font-mono",
              tpSlNotification?.type === 'tp' ? 'text-green-500' : 'text-red-500'
            )}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                signDisplay: 'always',
              }).format(tpSlNotification?.profit || 0)}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTpSlNotification(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function BotBuilderPage() {
  return (
    <BotProvider>
      <BotBuilderContent />
    </BotProvider>
  )
}
