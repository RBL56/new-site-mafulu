

'use client';

import React from 'react';
import { useDigitAnalysis } from '@/context/digit-analysis-context';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export function OverUnderAnalysis() {
    const { getOverUnder, lastDigits, overUnderBarrier, setOverUnderBarrier, showAllOverUnder, setShowAllOverUnder } = useDigitAnalysis();

    const { over, under, equal } = getOverUnder(overUnderBarrier);
    
    const barriers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const displayedDigits = showAllOverUnder ? lastDigits : lastDigits.slice(-50);

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Over/Under Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <label className="text-sm font-medium">OVER/UNDER:</label>
                    <Select value={overUnderBarrier.toString()} onValueChange={(val) => setOverUnderBarrier(Number(val))}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {barriers.map(b => <SelectItem key={b} value={b.toString()}>{b}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-green-500">Under</span>
                            <span className="text-sm font-medium text-green-500">{under}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4">
                            <div className="bg-green-500 h-4 rounded-full" style={{ width: under }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-muted-foreground">Equal</span>
                            <span className="text-sm font-medium text-muted-foreground">{equal}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4">
                            <div className="bg-gray-400 h-4 rounded-full" style={{ width: equal }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-red-500">Over</span>
                            <span className="text-sm font-medium text-red-500">{over}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4">
                            <div className="bg-red-500 h-4 rounded-full" style={{ width: over }}></div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Recent Digits</h3>
                    {lastDigits.length > 50 && (
                        <Button variant="link" onClick={() => setShowAllOverUnder(!showAllOverUnder)}>
                            {showAllOverUnder ? 'Less' : `More (${lastDigits.length - 50})`}
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-10 gap-2 mb-4">
                    {displayedDigits.map((digit, index) => {
                        let status;
                        if (digit < overUnderBarrier) status = 'under';
                        else if (digit > overUnderBarrier) status = 'over';
                        else status = 'equal';
                        
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-center justify-center w-full h-8 rounded text-white font-bold",
                                    {
                                        'bg-green-500': status === 'under',
                                        'bg-red-500': status === 'over',
                                        'bg-gray-500': status === 'equal',
                                    }
                                )}
                            >
                                {digit}
                            </div>
                        );
                    })}
                    {Array.from({ length: Math.max(0, 50 - displayedDigits.length) }).map((_, index) => (
                        <div key={`placeholder-${index}`} className="flex items-center justify-center w-full h-8 rounded bg-muted"></div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
