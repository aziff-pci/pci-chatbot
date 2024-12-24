'use server';

import { z } from 'zod';
import { createUser, getUser, getPendingRegistration, createPendingRegistration } from '@/lib/db/queries';
import { signIn } from './auth';
import dns from 'dns/promises';
import { generateOTP, sendOTPEmail } from '@/lib/auth/otp';
import { genSaltSync, hashSync } from 'bcrypt-ts';

const OTP_EXPIRATION_MINUTES = 15;
const OTP_EXPIRATION_MS = OTP_EXPIRATION_MINUTES * 60 * 1000;

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export type RegisterActionState = {
  status:
  | 'idle'
  | 'user_exists'
  | 'failed'
  | 'invalid_data'
  | 'success'
  | 'otp_sent'
  | 'invalid_otp';
};

async function isDomainValid(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

export async function register(
  prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const otp = formData.get('otp') as string;

    // If OTP is provided, we're in verification phase
    if (otp) {
      const pendingRegistration = await getPendingRegistration(email);

      if (!pendingRegistration ||
        pendingRegistration.otp !== otp ||
        pendingRegistration.expiresAt < new Date()) {
        return { status: 'invalid_otp' };
      }

      try {
        // First create the user
        await createUser(email, pendingRegistration.password, true);

        // Redirect to login page instead of trying to auto-sign-in
        return { status: 'success' };
      } catch (error) {
        console.error('Failed to create user:', error);
        return { status: 'failed' };
      }
    }

    // Initial registration attempt
    const validationResult = authFormSchema.safeParse({ email, password });
    if (!validationResult.success) {
      return { status: 'invalid_data' };
    }

    const existingUser = await getUser(email);
    if (existingUser.length > 0) {
      return { status: 'user_exists' };
    }

    // Hash password before saving to pending registrations
    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password, salt);

    // Generate and send OTP
    const generatedOTP = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

    // Save the pending registration with hashed password
    await createPendingRegistration({
      email,
      password: hashedPassword,  // Save the hashed password
      otp: generatedOTP,
      expiresAt,
    });

    await sendOTPEmail(email, generatedOTP);
    return { status: 'otp_sent' };
  } catch (error) {
    console.error('Registration error:', error);
    return { status: 'failed' };
  }
}
