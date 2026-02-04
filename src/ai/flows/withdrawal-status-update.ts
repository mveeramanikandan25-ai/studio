'use server';

/**
 * @fileOverview Sends an email notification when the status of a withdrawal request changes.
 *
 * - sendWithdrawalStatusUpdate - Sends an email notification about the withdrawal status update.
 * - WithdrawalStatusUpdateInput - The input type for the sendWithdrawalStatusUpdate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WithdrawalStatusUpdateInputSchema = z.object({
  email: z.string().email().describe('The email address of the user.'),
  withdrawalId: z.string().describe('The ID of the withdrawal request.'),
  status: z.enum(['Pending', 'Success']).describe('The new status of the withdrawal request.'),
});
export type WithdrawalStatusUpdateInput = z.infer<typeof WithdrawalStatusUpdateInputSchema>;

const WithdrawalStatusUpdateOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
});
export type WithdrawalStatusUpdateOutput = z.infer<typeof WithdrawalStatusUpdateOutputSchema>;

export async function sendWithdrawalStatusUpdate(input: WithdrawalStatusUpdateInput): Promise<WithdrawalStatusUpdateOutput> {
  return withdrawalStatusUpdateFlow(input);
}

const sendEmail = ai.defineTool(
  {
    name: 'sendEmail',
    description: 'Sends an email notification to the user about the withdrawal status update.',
    inputSchema: z.object({
      email: z.string().email().describe('The recipient email address.'),
      subject: z.string().describe('The subject of the email.'),
      body: z.string().describe('The body of the email.'),
    }),
    outputSchema: z.object({
      success: z.boolean().describe('Whether the email was sent successfully.'),
    }),
  },
  async input => {
    // TODO: Implement the email sending logic here using a service like SendGrid or Nodemailer.
    // This is a placeholder implementation.
    console.log(`Sending email to ${input.email} with subject ${input.subject} and body ${input.body}`);
    return {success: true};
  }
);

const withdrawalStatusUpdateFlow = ai.defineFlow(
  {
    name: 'withdrawalStatusUpdateFlow',
    inputSchema: WithdrawalStatusUpdateInputSchema,
    outputSchema: WithdrawalStatusUpdateOutputSchema,
  },
  async input => {
    const {
      email,
      withdrawalId,
      status,
    } = input;

    const subject = `Withdrawal Request ${withdrawalId} Status Update`;
    const body = `Your withdrawal request ${withdrawalId} has been updated to ${status}.`;

    const {success} = await sendEmail({
      email,
      subject,
      body,
    });

    return {success};
  }
);
