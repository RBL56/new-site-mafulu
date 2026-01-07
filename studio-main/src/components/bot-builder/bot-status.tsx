'use client';

import { useBot } from '@/context/bot-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, BadgeDollarSign, TrendingUp, TrendingDown, Target, HelpCircle, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

export default function BotStatus() {
  const { totalProfit, totalStake, totalRuns, totalWins, totalLosses, isBotRunning, botStatus } = useBot();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always',
    }).format(value);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-500';
    if (profit < 0) return 'text-red-500';
    return 'text-foreground';
  };

  const StatusItem = ({ icon: Icon, label, value, color, isCurrency = false }: any) => (
    <div className="flex flex-col gap-1 rounded-lg bg-background p-4">
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" />{label}</p>
      {value === null ? <Skeleton className="h-7 w-24 mt-1" /> : <p className={cn("text-2xl font-bold font-mono", color)}>{isCurrency ? formatCurrency(value) : value}</p>}
    </div>
  );

  const getStatusText = () => {
    if (botStatus === 'waiting') return 'Waiting...';
    if (isBotRunning) return 'Running';
    return 'Stopped';
  }

  const getStatusColor = () => {
    if (botStatus === 'waiting') return 'text-yellow-500 animate-pulse';
    if (isBotRunning) return 'text-green-500 animate-pulse';
    return 'text-red-500';
  }

  const getStatusIcon = () => {
    if (botStatus === 'waiting') return <Hourglass className="h-4 w-4" />;
    return <HelpCircle className="h-4 w-4" />;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BarChart className="h-6 w-6" />
          Bot Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatusItem 
            icon={BadgeDollarSign} 
            label="Total Profit" 
            value={totalProfit}
            color={getProfitColor(totalProfit)}
            isCurrency
          />
          <StatusItem 
            icon={Target} 
            label="Total Stake" 
            value={totalStake}
            color="text-foreground"
            isCurrency
          />
          <StatusItem 
            icon={HelpCircle} 
            label="Total Runs" 
            value={totalRuns}
            color="text-foreground"
          />
          <StatusItem 
            icon={TrendingUp} 
            label="Wins" 
            value={totalWins}
            color="text-green-500"
          />
          <StatusItem 
            icon={TrendingDown} 
            label="Losses" 
            value={totalLosses}
            color="text-red-500"
          />
           <div className="flex flex-col gap-1 rounded-lg bg-background p-4">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {getStatusIcon()}
                    Status
                </p>
                <p className={cn(
                    "text-2xl font-bold font-mono",
                    getStatusColor()
                )}>
                    {getStatusText()}
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
