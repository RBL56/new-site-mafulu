
'use client';

import { useBot } from '@/context/bot-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bot } from 'lucide-react';

const SignalBotConfigPanel = () => {
    const { signalBotConfig, setSignalBotConfig } = useBot();

    const handleInputChange = (field: keyof typeof signalBotConfig, value: string | number) => {
        setSignalBotConfig(prev => ({ ...prev, [field]: Number(value) }));
    };

    const handleSwitchChange = (field: keyof typeof signalBotConfig, checked: boolean) => {
        setSignalBotConfig(prev => ({ ...prev, [field]: checked }));
    };

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Global Signal Bot Configuration
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div className="space-y-2">
                        <Label htmlFor="signal-stake">Initial Stake ($)</Label>
                        <Input
                            id="signal-stake"
                            type="number"
                            value={signalBotConfig.initialStake}
                            onChange={(e) => handleInputChange('initialStake', e.target.value)}
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signal-tp">Take Profit ($)</Label>
                        <Input
                            id="signal-tp"
                            type="number"
                            value={signalBotConfig.takeProfit}
                            onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                            className="bg-background"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="signal-sl">Stop Loss (losses)</Label>
                        <Input
                            id="signal-sl"
                            type="number"
                            value={signalBotConfig.stopLossConsecutive}
                            onChange={(e) => handleInputChange('stopLossConsecutive', e.target.value)}
                             className="bg-background"
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                        <Switch
                            id="signal-martingale"
                            checked={signalBotConfig.useMartingale}
                            onCheckedChange={(checked) => handleSwitchChange('useMartingale', checked)}
                        />
                        <Label htmlFor="signal-martingale">Use Martingale</Label>
                    </div>
                    {signalBotConfig.useMartingale && (
                        <div className="space-y-2">
                            <Label htmlFor="signal-martingale-factor">Martingale Factor</Label>
                            <Input
                                id="signal-martingale-factor"
                                type="number"
                                value={signalBotConfig.martingaleFactor}
                                onChange={(e) => handleInputChange('martingaleFactor', e.target.value)}
                                className="bg-background"
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default SignalBotConfigPanel;
