'use client';

import { Button } from '@/components/ui/button';
import { useBot } from '@/context/bot-context';
import { Play, Pause, RotateCcw, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

export default function QuickTradePanel() {
  const { startBot, stopBot, resetStats, isBotRunning, form } = useBot();
  const { toast } = useToast();

  const config = form?.getValues();

  const handleStart = () => {
    if (config) {
      startBot(config);
    } else {
        toast({
            variant: "destructive",
            title: "No Configuration",
            description: "Please configure the bot in the 'Bot Builder' tab first.",
        })
    }
  };

  const renderEntryPointInfo = () => {
    if (!config || !config.useEntryPoint) {
      return <Badge variant="secondary">Not Set</Badge>;
    }
    
    if (config.entryPointType === 'single') {
      return <Badge variant="outline">Single Digit: {config.entryRangeStart}</Badge>;
    }

    if (config.entryPointType === 'consecutive') {
      return <Badge variant="outline">Consecutive Range: {config.entryRangeStart} - {config.entryRangeEnd}</Badge>
    }

    return null;
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Bot className="h-6 w-6" />
                Quick Trade Panel
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-sm text-muted-foreground mb-4 space-y-2">
                <p>
                    Use the bot configuration from the &apos;Bot Builder&apos; tab to quickly start or stop trading.
                </p>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">Entry Spot:</span>
                    {renderEntryPointInfo()}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <Button onClick={handleStart} disabled={isBotRunning} className="w-full">
                    <Play className="mr-2 h-4 w-4" /> Start
                </Button>
                <Button variant="destructive" onClick={stopBot} disabled={!isBotRunning} className="w-full">
                    <Pause className="mr-2 h-4 w-4" /> Stop
                </Button>
                <Button variant="outline" onClick={resetStats} disabled={isBotRunning} className="w-full">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
