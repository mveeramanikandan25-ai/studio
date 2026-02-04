'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { sendWithdrawalConfirmationEmail } from '@/ai/flows/withdrawal-email-confirmation';


const formSchema = z.object({
  method: z.enum(['UPI', 'Google Play'], {
    required_error: 'You need to select a redemption method.',
  }),
  details: z.string().min(1, 'This field is required.'),
});

interface WithdrawalOption {
  coins: number;
  inr: number;
}

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: WithdrawalOption;
}

export function WithdrawalDialog({ open, onOpenChange, option }: WithdrawalDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      method: 'UPI',
      details: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setIsLoading(true);
    
    const { coins, inr } = option;
    const { method, details } = values;

    const userRef = doc(firestore, 'users', user.uid);
    const withdrawalsRef = collection(firestore, 'users', user.uid, 'withdrawals');

    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists() || userDoc.data().coins < coins) {
            throw new Error('Insufficient coins.');
        }

        // Decrement coins
        updateDocumentNonBlocking(userRef, {
            coins: increment(-coins),
        });

        // Create withdrawal record
        const withdrawalDoc = await addDocumentNonBlocking(withdrawalsRef, {
            userId: user.uid,
            amountCoins: coins,
            amountInr: inr,
            method,
            details,
            status: 'Pending',
            createdAt: serverTimestamp(),
        });
        
        // Send confirmation email via GenAI flow
        const userEmail = userDoc.data().email;
        if (userEmail && withdrawalDoc) {
          sendWithdrawalConfirmationEmail({
            userEmail,
            withdrawalAmount: coins,
            redemptionMethod: method,
            transactionId: withdrawalDoc.id,
          });
        }

        toast({
            title: 'Request Submitted!',
            description: 'Congratulations! Your reward will be received via your Gmail ID within 24-48 hours.',
            duration: 5000,
        });
        onOpenChange(false);
        form.reset();

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Withdrawal Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw ₹{option.inr}</DialogTitle>
          <DialogDescription>
            You are about to redeem {option.coins.toLocaleString()} coins. Please provide your details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Redemption Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="UPI" />
                        </FormControl>
                        <FormLabel className="font-normal">UPI Transfer</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Google Play" />
                        </FormControl>
                        <FormLabel className="font-normal">Google Play Gift Card</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch('method') === 'UPI' ? 'Your UPI ID' : 'Your Email for Gift Card'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        form.watch('method') === 'UPI' ? 'name@upi' : 'your.email@example.com'
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
