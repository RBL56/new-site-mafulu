'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useBot } from '@/context/bot-context';
import { VOLATILITY_MARKETS } from '@/lib/constants';
import { Play, Pause, RotateCcw, Bot as BotIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  market: z.string().min(1, 'Market is required'),
  tradeType: z.enum(['matches_differs', 'even_odd', 'over_under']),
  predictionType: z.enum(['matches', 'differs', 'even', 'odd', 'over', 'under']),
  lastDigitPrediction: z.coerce.number().min(0, 'Digit must be between 0-9').max(9, 'Digit must be between 0-9').optional(),
  initialStake: z.coerce.number().positive('Stake must be positive'),
  ticks: z.coerce.number().int().min(1, 'Ticks must be at least 1').max(10, 'Ticks cannot exceed 10'),
  takeProfit: z.coerce.number().positive('Take profit must be positive').optional(),
  stopLossType: z.enum(['amount', 'consecutive_losses']).default('amount'),
  stopLossAmount: z.coerce.number().positive('Stop loss must be positive').optional(),
  stopLossConsecutive: z.coerce.number().int().min(1, 'Must be at least 1').max(10, 'Cannot exceed 10').optional(),
  useMartingale: z.boolean().default(false),
  martingaleFactor: z.coerce.number().min(1, 'Factor must be at least 1').optional(),
  useBulkTrading: z.boolean().default(false),
  bulkTradeCount: z.coerce.number().int().min(1, 'Count must be at least 1').optional(),
  useEntryPoint: z.boolean().default(false),
  entryPointType: z.enum(['single', 'consecutive']).optional(),
  entryRangeStart: z.coerce.number().min(0).max(9).optional(),
  entryRangeEnd: z.coerce.number().min(0).max(9).optional(),
});

export type BotConfigurationValues = z.infer<typeof formSchema>;
export type SignalBotConfigurationValues = Pick<BotConfigurationValues, 'initialStake' | 'takeProfit' | 'stopLossConsecutive' | 'useMartingale' | 'martingaleFactor'>;


export default function BotConfigurationForm() {
  const { startBot, stopBot, resetStats, isBotRunning, form, setForm } = useBot();

  const localForm = useForm<BotConfigurationValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      market: 'R_100',
      tradeType: 'over_under',
      predictionType: 'over',
      lastDigitPrediction: 4,
      initialStake: 1,
      ticks: 1,
      useMartingale: true,
      martingaleFactor: 2.1,
      useBulkTrading: false,
      bulkTradeCount: 10,
      takeProfit: 10,
      stopLossType: 'amount',
      stopLossAmount: 50,
      stopLossConsecutive: 5,
      useEntryPoint: false,
      entryPointType: 'single',
      entryRangeStart: 0,
      entryRangeEnd: 9,
    },
  });

  useEffect(() => {
    if (!form) {
      setForm(localForm);
    }
  }, [form, localForm, setForm]);

  const currentForm = form || localForm;

  const onSubmit = (values: BotConfigurationValues) => {
    startBot(values);
  };

  const tradeType = currentForm.watch('tradeType');
  const useMartingale = currentForm.watch('useMartingale');
  const useBulkTrading = currentForm.watch('useBulkTrading');
  const useEntryPoint = currentForm.watch('useEntryPoint');
  const entryPointType = currentForm.watch('entryPointType');
  const stopLossType = currentForm.watch('stopLossType');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BotIcon className="h-6 w-6" />
          Bot Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...currentForm}>
          <form onSubmit={currentForm.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={currentForm.control}
              name="market"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isBotRunning}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a market" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VOLATILITY_MARKETS.map((market) => (
                        <SelectItem key={market.symbol} value={market.symbol}>
                          {market.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={currentForm.control}
              name="tradeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade Type</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      if (value === 'matches_differs') {
                        currentForm.setValue('predictionType', 'differs');
                        currentForm.setValue('lastDigitPrediction', 1);
                      }
                      if (value === 'even_odd') {
                        currentForm.setValue('predictionType', 'odd');
                      }
                      if (value === 'over_under') {
                        currentForm.setValue('predictionType', 'over');
                        currentForm.setValue('lastDigitPrediction', 4);
                      }
                  }} defaultValue={field.value} disabled={isBotRunning}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a trade type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="matches_differs">Matches/Differs</SelectItem>
                      <SelectItem value="even_odd">Even/Odd</SelectItem>
                      <SelectItem value="over_under">Over/Under</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={currentForm.control}
              name="predictionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prediction Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isBotRunning}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a prediction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tradeType === 'matches_differs' && (
                        <>
                          <SelectItem value="matches">Digit Matches</SelectItem>
                          <SelectItem value="differs">Digit Differs</SelectItem>
                        </>
                      )}
                      {tradeType === 'even_odd' && (
                        <>
                          <SelectItem value="even">Digit Even</SelectItem>
                          <SelectItem value="odd">Digit Odd</SelectItem>
                        </>
                      )}
                      {tradeType === 'over_under' && (
                        <>
                          <SelectItem value="over">Digit Over</SelectItem>
                          <SelectItem value="under">Digit Under</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tradeType !== 'even_odd' && (
                <FormField
                    control={currentForm.control}
                    name="lastDigitPrediction"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Digit Prediction</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g. 1" {...field} value={field.value ?? ''} disabled={isBotRunning} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={currentForm.control}
                name="initialStake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Stake</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 1" {...field} disabled={isBotRunning} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={currentForm.control}
                name="ticks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticks</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1-10" {...field} disabled={isBotRunning} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={currentForm.control}
                    name="takeProfit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Take Profit ($)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g. 10" {...field} value={field.value ?? ''} disabled={isBotRunning}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={currentForm.control}
                    name="stopLossType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Stop Loss Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isBotRunning}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select stop loss type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="amount">Amount ($)</SelectItem>
                                    <SelectItem value="consecutive_losses">Consecutive Losses</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {stopLossType === 'amount' ? (
                <FormField
                    control={currentForm.control}
                    name="stopLossAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Stop Loss Amount ($)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 50" {...field} value={field.value ?? ''} disabled={isBotRunning} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            ) : (
                <FormField
                    control={currentForm.control}
                    name="stopLossConsecutive"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Consecutive Losses</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="1-10" {...field} value={field.value ?? ''} disabled={isBotRunning} />
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
            <FormField
              control={currentForm.control}
              name="useMartingale"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Use Martingale</FormLabel>
                    <FormDescription>
                      Increase stake after a loss.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isBotRunning}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {useMartingale && (
                <FormField
                    control={currentForm.control}
                    name="martingaleFactor"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Martingale Factor</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g. 2.1" {...field} value={field.value ?? ''} disabled={isBotRunning}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}

            <FormField
              control={currentForm.control}
              name="useBulkTrading"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Bulk Trading</FormLabel>
                    <FormDescription>
                      Run a set number of trades.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isBotRunning}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {useBulkTrading && (
                <FormField
                    control={currentForm.control}
                    name="bulkTradeCount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Number of Trades</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g. 10" {...field} value={field.value ?? ''} disabled={isBotRunning}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}

            <Separator />
            
            <FormField
              control={currentForm.control}
              name="useEntryPoint"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Use Entry Spot</FormLabel>
                    <FormDescription>
                      Wait for a digit condition before starting.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isBotRunning}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {useEntryPoint && (
              <div className="space-y-4 rounded-lg border p-4">
                <FormField
                  control={currentForm.control}
                  name="entryPointType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Spot Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isBotRunning}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an entry type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="single">Single Digit</SelectItem>
                            <SelectItem value="consecutive">Two Consecutive Digits</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {entryPointType === 'single' ? (
                  <FormField
                    control={currentForm.control}
                    name="entryRangeStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Digit</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? ''} disabled={isBotRunning}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={currentForm.control}
                      name="entryRangeStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Range</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} value={field.value ?? ''} disabled={isBotRunning}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={currentForm.control}
                      name="entryRangeEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To Range</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="9" {...field} value={field.value ?? ''} disabled={isBotRunning}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}


            <div className="grid grid-cols-3 gap-2 pt-4">
              <Button type="submit" disabled={isBotRunning} className="w-full">
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
              <Button type="button" variant="destructive" onClick={stopBot} disabled={!isBotRunning} className="w-full">
                <Pause className="mr-2 h-4 w-4" /> Stop
              </Button>
              <Button type="button" variant="outline" onClick={resetStats} disabled={isBotRunning} className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
