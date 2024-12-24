'use server';

import { z } from 'zod';
import { createUser, getUser, getPendingRegistration, createPendingRegistration } from '@/lib/db/queries';
import { signIn } from './auth';
import { generateOTP, sendOTPEmail } from '@/lib/auth/otp';
import { genSaltSync, hashSync } from 'bcrypt-ts';

const OTP_EXPIRATION_MINUTES = 15;
const OTP_EXPIRATION_MS = OTP_EXPIRATION_MINUTES * 60 * 1000;

const authFormSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .refine(
      (email) => email.endsWith('@princeton.com'),
      { message: 'Email must be a @princeton.com address' }
    ),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data' | 'invalid_email_domain';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!validatedData.success) {
      const emailError = validatedData.error.errors.find(err => err.path[0] === 'email');
      if (emailError?.message === 'Email must be a @princeton.com address') {
        return { status: 'invalid_email_domain' };
      }
      return { status: 'invalid_data' };
    }

    await signIn('credentials', {
      email: validatedData.data.email,
      password: validatedData.data.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    return { status: 'failed' };
  }
};

export type RegisterActionState = {
  status:
  | 'idle'
  | 'user_exists'
  | 'failed'
  | 'invalid_data'
  | 'invalid_email_domain'
  | 'success'
  | 'otp_sent'
  | 'invalid_otp';
};

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
        // Create the user with the hashed password from pending registration
        await createUser(email, pendingRegistration.password, true);
        return { status: 'success' };
      } catch (error) {
        console.error('Failed to create user:', error);
        return { status: 'failed' };
      }
    }

    // Initial registration attempt - validate email format and domain
    const validationResult = authFormSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const emailError = validationResult.error.errors.find(err => err.path[0] === 'email');
      if (emailError?.message === 'Email must be a @princeton.com address') {
        return { status: 'invalid_email_domain' };
      }
      return { status: 'invalid_data' };
    }

    // Check if user already exists
    const existingUser = await getUser(email);
    if (existingUser.length > 0) {
      return { status: 'user_exists' };
    }

    // All validations passed, now proceed with OTP
    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password, salt);
    const generatedOTP = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

    // Save the pending registration
    await createPendingRegistration({
      email,
      password: hashedPassword,
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
