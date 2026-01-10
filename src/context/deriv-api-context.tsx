
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const marketConfig: { [key: string]: { decimals: number } } = {
  'R_10': { decimals: 3 },
  'R_25': { decimals: 3 },
  'R_50': { decimals: 4 },
  'R_75': { decimals: 4 },
  'R_100': { decimals: 2 },
  '1HZ10V': { decimals: 2 },
  '1HZ25V': { decimals: 2 },
  '1HZ30V': { decimals: 3 },
  '1HZ50V': { decimals: 2 },
  '1HZ75V': { decimals: 2 },
  '1HZ90V': { decimals: 3 },
  '1HZ100V': { decimals: 2 },
  '1HZ150V': { decimals: 2 },
  '1HZ250V': { decimals: 2 },
};

interface Account {
  loginid: string;
  is_virtual: boolean;
  currency: string;
  balance: number;
  token: string;
  is_disabled?: 0 | 1;
}

interface DerivApiContextType {
  isConnected: boolean;
  activeAccount: Account | null;
  accountList: Account[];
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  switchAccount: (loginid: string) => Promise<void>;
  api: WebSocket | null;
  subscribeToMessages: (handler: (data: any) => void) => () => void;
  marketConfig: { [key: string]: { decimals: number } };
}

const DerivApiContext = createContext<DerivApiContextType | undefined>(undefined);

const APP_ID = '106684';

// Simple obfuscation for the token in local storage
const encode = (data: object) => btoa(JSON.stringify(data));
const decode = (str: string): object | null => {
  try {
    return JSON.parse(atob(str));
  } catch (e) {
    return null;
  }
};


export const DerivApiProvider = ({ children }: { children: ReactNode }) => {
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [accountList, setAccountList] = useState<Account[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Set<(data: any) => void>>(new Set());
  const { toast } = useToast();
  const accountsRef = useRef<Map<string, Account>>(new Map());
  const activeAccountRef = useRef<Account | null>(null);

  useEffect(() => {
    activeAccountRef.current = activeAccount;
  }, [activeAccount]);

  const handleGlobalMessage = (data: any) => {
    if (data.error) {
      if (data.error.code !== 'AlreadySubscribed' && data.error.code !== 'AuthorizationRequired') {
        toast({
          variant: "destructive",
          title: "API Error",
          description: data.error.message,
        });
      }
      return;
    }

    if (data.msg_type === 'balance') {
      const balanceData = data.balance;
      const loginid = balanceData.loginid;
      const updatedBalance = balanceData.balance;

      if (loginid === activeAccountRef.current?.loginid && updatedBalance !== undefined) {
        setActiveAccount(prev => prev ? { ...prev, balance: updatedBalance } : null);
      }
    }

    messageHandlers.current.forEach(handler => handler(data));
  };

  const subscribeToMessages = (handler: (data: any) => void) => {
    messageHandlers.current.add(handler);
    return () => {
      messageHandlers.current.delete(handler);
    };
  };

  const disconnect = useCallback((clearSession = true) => {
    if (ws.current) {
      ws.current.close();
    }
    if (clearSession) {
      localStorage.removeItem('deriv_session');
      setActiveAccount(null);
      setAccountList([]);
      accountsRef.current.clear();
    }
    setIsConnected(false);
    ws.current = null;
  }, []);

  const connectAndAuthorize = useCallback(async (token: string, isInitialConnect = false): Promise<Account> => {
    if (!APP_ID) {
      throw new Error('Deriv App ID not set.');
    }

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      ws.current = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    }
    const socket = ws.current;

    return new Promise<Account>((resolve, reject) => {

      const onOpen = () => {
        socket.send(JSON.stringify({ authorize: token }));
      }

      const onMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);

        if (data.msg_type === 'authorize') {
          if (data.authorize) {
            const authorizedAccount: Account = {
              loginid: data.authorize.loginid,
              is_virtual: !!data.authorize.is_virtual,
              currency: data.authorize.currency,
              balance: data.authorize.balance,
              token: token,
            };

            if (isInitialConnect) {
              const allAccounts = data.authorize.account_list
                .filter((acc: any) => !acc.is_disabled)
                .map((acc: any) => {
                  const loginid = acc.loginid;
                  const correspondingToken = accountsRef.current.get(loginid)?.token;
                  return {
                    ...acc,
                    token: correspondingToken || (loginid === authorizedAccount.loginid ? token : ''),
                  };
                });

              allAccounts.forEach((acc: Account) => accountsRef.current.set(acc.loginid, acc));
              setAccountList(allAccounts);
            }

            setActiveAccount(authorizedAccount);
            setIsConnected(true);

            // Set active session for persistence
            const session = { activeLoginid: authorizedAccount.loginid, accounts: Array.from(accountsRef.current.values()) };
            localStorage.setItem('deriv_session', encode(session));

            socket.send(JSON.stringify({ balance: 1, subscribe: 1 }));
            socket.send(JSON.stringify({ proposal_open_contract: 1, subscribe: 1 }));

            // Clean up these specific listeners after authorization
            socket.removeEventListener('open', onOpen);
            socket.removeEventListener('message', onMessage);

            // Attach global message handler
            socket.addEventListener('message', (e) => handleGlobalMessage(JSON.parse(e.data)));
            resolve(authorizedAccount);
          } else {
            reject(new Error(data.error?.message || 'Authorization failed.'));
          }
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Persistence Fix: Do not clear activeAccount on disconnect.
        // This prevents the user from being "logged out" if the connection drops.
        // setActiveAccount(null); 
      };

      socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
        reject(new Error('WebSocket connection error.'));
        setIsConnected(false);
      };

      if (socket.readyState === WebSocket.OPEN) {
        onOpen();
      } else {
        socket.addEventListener('open', onOpen, { once: true });
      }
      socket.addEventListener('message', onMessage);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(async (token: string) => {
    try {
      await connectAndAuthorize(token, true);
    } catch (e) {
      disconnect();
      throw e;
    }
  }, [connectAndAuthorize, disconnect]);

  const switchAccount = useCallback(async (loginid: string) => {
    const targetAccount = accountsRef.current.get(loginid);
    if (!targetAccount || !targetAccount.token) {
      toast({
        variant: "destructive",
        title: "Switch Failed",
        description: "Token for the selected account is not available.",
      });
      return;
    }
    try {
      await connectAndAuthorize(targetAccount.token);
      toast({
        title: "Account Switched",
        description: `You are now using your ${targetAccount.is_virtual ? 'Demo' : 'Real'} account.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Switch Failed",
        description: error.message || "Could not switch to the selected account.",
      });
    }
  }, [connectAndAuthorize, toast]);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokensFromUrl: { loginid: string, token: string }[] = [];
    urlParams.forEach((value, key) => {
      if (key.startsWith('acct')) {
        const index = key.substring(4);
        const loginid = value;
        const token = urlParams.get(`token${index}`);
        if (loginid && token) {
          tokensFromUrl.push({ loginid, token });
        }
      }
    });

    if (tokensFromUrl.length > 0) {
      tokensFromUrl.forEach(({ loginid, token }) => {
        accountsRef.current.set(loginid, { loginid, token } as Account);
      });
      const primaryToken = tokensFromUrl[0].token;

      connect(primaryToken)
        .then(() => {
          toast({
            title: "Login Successful",
            description: "You have been securely logged in.",
          });
          // Clean up URL after successful connection from OAuth redirect
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        })
        .catch((error) => {
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message || 'Authentication with the token from the URL failed.',
          });
        });
    } else {
      const storedSession = localStorage.getItem('deriv_session');
      if (storedSession) {
        const sessionData = decode(storedSession) as { activeLoginid: string, accounts: Account[] };
        if (sessionData && sessionData.activeLoginid && sessionData.accounts) {
          sessionData.accounts.forEach(acc => accountsRef.current.set(acc.loginid, acc));
          const activeAcc = accountsRef.current.get(sessionData.activeLoginid);
          if (activeAcc?.token) {
            connectAndAuthorize(activeAcc.token, true).catch((e) => {
              // Only disconnect and clear session if it's an auth error
              if (e.message === 'Authorization failed.' || e.error?.code === 'AuthorizationRequired' || e.error?.code === 'InvalidToken') {
                disconnect(true);
              } else {
                // For network errors, just set disconnected state but keep session data
                disconnect(false);
              }
            });
          }
        }
      }
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DerivApiContext.Provider value={{
      isConnected,
      activeAccount,
      accountList,
      connect,
      disconnect,
      switchAccount,
      api: ws.current,
      subscribeToMessages,
      marketConfig
    }}>
      {children}
    </DerivApiContext.Provider>
  );
};

export const useDerivApi = () => {
  const context = useContext(DerivApiContext);
  if (context === undefined) {
    throw new Error('useDerivApi must be used within a DerivApiProvider');
  }
  return context;
};
