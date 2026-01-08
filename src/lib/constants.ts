// Mock historical data for backtesting demonstration
export const MOCK_HISTORICAL_DATA = [
    { open: 1.08, high: 1.09, low: 1.07, close: 1.085 },
    { open: 1.085, high: 1.092, low: 1.083, close: 1.091 },
    { open: 1.091, high: 1.10, low: 1.09, close: 1.098 },
    { open: 1.098, high: 1.099, low: 1.089, close: 1.092 },
    { open: 1.092, high: 1.095, low: 1.085, close: 1.086 },
    { open: 1.086, high: 1.088, low: 1.08, close: 1.082 },
    { open: 1.082, high: 1.085, low: 1.078, close: 1.084 },
    { open: 1.084, high: 1.09, low: 1.083, close: 1.089 },
    { open: 1.089, high: 1.093, low: 1.088, close: 1.092 },
    { open: 1.092, high: 1.096, low: 1.09, close: 1.095 },
];

export const VOLATILITY_MARKETS = [
    { name: "Volatility 10 (1s) Index", symbol: "1HZ10V" },
    { name: "Volatility 25 (1s) Index", symbol: "1HZ25V" },
    { name: "Volatility 50 (1s) Index", symbol: "1HZ50V" },
    { name: "Volatility 75 (1s) Index", symbol: "1HZ75V" },
    { name: "Volatility 100 (1s) Index", symbol: "1HZ100V" },
    { name: "Volatility 90 (1s) Index", symbol: "1HZ90V" },
    { name: "Volatility 30 (1s) Index", symbol: "1HZ30V" },
    { name: "Volatility 15 (1s) Index", symbol: "1HZ15V" },
    { name: "Volatility 10 Index", symbol: "R_10" },
    { name: "Volatility 25 Index", symbol: "R_25" },
    { name: "Volatility 50 Index", symbol: "R_50" },
    { name: "Volatility 75 Index", symbol: "R_75" },
    { name: "Volatility 100 Index", symbol: "R_100" },
];

export const QUICK_STRATEGIES = [
    {
        name: 'Momentum Following',
        description: 'A basic strategy that buys on upward trends and sells on downward trends.',
        details: 'Buy when the 5-period moving average crosses above the 20-period moving average. Sell when the 5-period moving average crosses below the 20-period moving average.'
    },
    {
        name: 'RSI Reversal',
        description: 'Trades on market reversals indicated by the Relative Strength Index.',
        details: 'Buy when the 14-period RSI drops below 30 (oversold). Sell when the 14-period RSI rises above 70 (overbought).'
    },
    {
        name: 'Bollinger Bands Breakout',
        description: 'Captures volatility breakouts using Bollinger Bands.',
        details: 'Buy when the price closes above the upper Bollinger Band. Sell when the price closes below the lower Bollinger Band.'
    }
];
