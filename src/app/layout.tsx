
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import { DerivApiProvider } from '@/context/deriv-api-context';
import { ThemeProvider } from '@/components/theme-provider';
import { DigitAnalysisProvider } from '@/context/digit-analysis-context';
import DraggableDisclaimer from '@/components/draggable-disclaimer';


export const metadata: Metadata = {
  title: 'Build a trading bot without coding | LOCO TRADING HUB',
  description: 'Import your current bot or learn how to create a trading bot from scratch with our detailed guides, FAQs, and tutorials. Start with a quick strategy!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LOCO TRADING HUB',
  },
  other: {
    'msapplication-TileColor': '#ff444f',
    'msapplication-tap-highlight': 'no'
  },
  icons: {
    icon: '/deriv-logo.svg',
    apple: [
        { url: '/assets/icons/pwa/icon-152x152.png', sizes: '152x152' },
        { url: '/assets/icons/pwa/icon-192x192.png', sizes: '180x180' }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: '#ff444f',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            defaultTheme="system"
            storageKey="vite-ui-theme"
        >
          <DerivApiProvider>
            <DigitAnalysisProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <DraggableDisclaimer />
              </div>
              <Toaster />
            </DigitAnalysisProvider>
          </DerivApiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
