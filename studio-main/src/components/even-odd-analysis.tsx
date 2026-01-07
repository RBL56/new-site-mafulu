
'use client';

import React from 'react';
import { useDigitAnalysis } from '@/context/digit-analysis-context';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function EvenOddAnalysis() {
    const { lastDigits, evenOdd } = useDigitAnalysis();
    const evenPercentage = parseFloat(evenOdd.even);
    const oddPercentage = parseFloat(evenOdd.odd);

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Odd/Even Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <h3 className="text-lg font-semibold mb-2">Recent E/O (Last 50)</h3>
                <div className="grid grid-cols-10 gap-2 mb-4">
                    {lastDigits.slice(-50).map((digit, index) => {
                        const isEven = digit % 2 === 0;
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-center justify-center w-full h-8 rounded text-white font-bold",
                                    isEven ? 'bg-green-500' : 'bg-red-500'
                                )}
                            >
                                {isEven ? 'E' : 'O'}
                            </div>
                        );
                    })}
                    {Array.from({ length: 50 - lastDigits.slice(-50).length }).map((_, index) => (
                        <div key={`placeholder-${index}`} className="flex items-center justify-center w-full h-8 rounded bg-muted"></div>
                    ))}
                </div>

                <div>
                    <div className="mb-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-green-500">Even</span>
                            <span className="text-sm font-medium text-green-500">{evenOdd.even}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4">
                            <div className="bg-green-500 h-4 rounded-full" style={{ width: `${evenPercentage}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-red-500">Odd</span>
                            <span className="text-sm font-medium text-red-500">{evenOdd.odd}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4">
                            <div className="bg-red-500 h-4 rounded-full" style={{ width: `${oddPercentage}%` }}></div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
