'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useDerivApi } from '@/context/deriv-api-context';

export function ApiTokenDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { connect } = useDerivApi();

  const handleConnect = async () => {
    if (tokenInput) {
      setIsConnecting(true);
      try {
        await connect(tokenInput);
        setIsOpen(false);
        toast({
          title: "Successfully Connected",
          description: "Your Deriv API token has been authenticated.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "The API token is invalid. Please check and try again.",
        });
      } finally {
        setIsConnecting(false);
        setTokenInput('');
      }
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please enter a valid API token.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <KeyRound className="mr-2 h-4 w-4" /> API Token
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Deriv API Token</DialogTitle>
          <DialogDescription>
            Enter your Deriv API token to connect your account. You can create a token in your Deriv account settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="token" className="text-right">
              Token
            </Label>
            <Input
              id="token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Your Deriv API Token"
              className="col-span-3"
              disabled={isConnecting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
