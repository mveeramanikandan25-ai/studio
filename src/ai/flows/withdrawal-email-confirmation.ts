'use server';

/**
 * @fileOverview Sends an email confirmation to the user after submitting a withdrawal request.
 *
 * - sendWithdrawalConfirmationEmail - A function that sends the email confirmation.
 * - SendWithdrawalConfirmationEmailInput - The input type for the sendWithdrawalConfirmationEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendWithdrawalConfirmationEmailInputSchema = z.object({
  userEmail: z.string().email().describe('The email address of the user.'),
  withdrawalAmount: z.number().describe('The amount withdrawn by the user.'),
  transactionId: z.string().describe('The unique ID of the withdrawal transaction.'),
  redemptionMethod: z.string().describe('The method of redemption (e.g., UPI, Google Play gift card).'),
});

export type SendWithdrawalConfirmationEmailInput = z.infer<typeof SendWithdrawalConfirmationEmailInputSchema>;

export async function sendWithdrawalConfirmationEmail(input: SendWithdrawalConfirmationEmailInput): Promise<void> {
  await sendWithdrawalConfirmationEmailFlow(input);
}

const sendWithdrawalConfirmationEmailPrompt = ai.definePrompt({
  name: 'sendWithdrawalConfirmationEmailPrompt',
  input: {schema: SendWithdrawalConfirmationEmailInputSchema},
  prompt: `Subject: CASHCHA - Withdrawal Request Confirmation

Dear User,

This email confirms that we have received your withdrawal request.

Withdrawal Details:
- Amount: {{{withdrawalAmount}}} coins
- Redemption Method: {{{redemptionMethod}}}
- Transaction ID: {{{transactionId}}}

Your request is being processed and you will receive your reward via your registered Gmail ID within 24-48 hours.

Thank you for using CASHCHA!
`,
});

const sendWithdrawalConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'sendWithdrawalConfirmationEmailFlow',
    inputSchema: SendWithdrawalConfirmationEmailInputSchema,
    outputSchema: z.void(),
  },
  async input => {
    await sendWithdrawalConfirmationEmailPrompt(input);
  }
);
