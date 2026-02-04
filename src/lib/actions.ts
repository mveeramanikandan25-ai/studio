'use server';

import { db } from '@/lib/firebase';
import { sendWithdrawalConfirmationEmail } from '@/ai/flows/withdrawal-email-confirmation';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// This is a simplified, non-secure way to generate a referral code.
// In a real app, ensure uniqueness and handle potential collisions.
function generateReferralCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createUserInDb(
  userId: string,
  email: string,
  displayName: string | null,
  photoURL: string | null
) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    try {
      await setDoc(userRef, {
        uid: userId,
        email,
        displayName: displayName || 'User',
        photoURL: photoURL || `https://i.pravatar.cc/150?u=${userId}`,
        coins: 100, // Signup bonus
        referralCode: generateReferralCode(5),
        createdAt: serverTimestamp(),
      });
      return { isNewUser: true };
    } catch (error) {
      console.error('Error creating user document:', error);
      throw new Error('Failed to create user in database.');
    }
  }
  return { isNewUser: false };
}

export async function submitCaptcha(userId: string) {
  if (!userId) {
    throw new Error('User not authenticated.');
  }

  // In a real app, you would have CAPTCHA validation logic here.
  // For this example, we'll assume the CAPTCHA is always correct.

  const userRef = doc(db, 'users', userId);

  try {
    await updateDoc(userRef, {
      coins: increment(25),
    });
    revalidatePath('/earn');
    revalidatePath('/profile');
    return { success: true, newCoins: 25 };
  } catch (error) {
    console.error('Error updating coin balance:', error);
    throw new Error('Failed to update coin balance.');
  }
}

interface WithdrawalRequest {
  userId: string;
  amountCoins: number;
  amountInr: number;
  method: 'UPI' | 'Google Play';
  details: string;
}

export async function requestWithdrawal(request: WithdrawalRequest) {
  const { userId, amountCoins, amountInr, method, details } = request;

  if (!userId) {
    throw new Error('User not authenticated.');
  }

  const userRef = doc(db, 'users', userId);
  const withdrawalsRef = collection(db, 'withdrawals');

  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists() || userDoc.data().coins < amountCoins) {
      throw new Error('Insufficient coins.');
    }
    
    // Decrement coins
    await updateDoc(userRef, {
      coins: increment(-amountCoins),
    });

    // Create withdrawal record
    const withdrawalDoc = await addDoc(withdrawalsRef, {
      userId,
      amountCoins,
      amountInr,
      method,
      details,
      status: 'Pending',
      createdAt: serverTimestamp(),
    });

    // Send confirmation email via GenAI flow
    const userEmail = userDoc.data().email;
    if (userEmail) {
      await sendWithdrawalConfirmationEmail({
        userEmail,
        withdrawalAmount: amountCoins,
        redemptionMethod: method,
        transactionId: withdrawalDoc.id,
      });
    }

    revalidatePath('/withdrawal');
    revalidatePath('/history');
    revalidatePath('/profile');

    return { success: true, message: 'Congratulations! Your reward will be received via your Gmail ID within 24-48 hours.' };
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    // If an error occurs, you might want to roll back the coin deduction.
    // This is a simplified example.
    throw new Error(error instanceof Error ? error.message : 'Failed to process withdrawal.');
  }
}
