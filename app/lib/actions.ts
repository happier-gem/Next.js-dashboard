'use server';

import { z } from 'zod';
import{ revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import {
  SignUpFormSchema,
  ForgotPasswordFormSchema,
  ResetPasswordFormSchema,
} from '@/app/lib/validation';
import { sendPasswordResetEmail } from '@/app/lib/email';


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce.number()
  .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string;
};
 
// ...
export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
 
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
 
  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string): Promise<void> {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    console.error(error);
    throw new Error('Database error occurred while deleting the invoice.');
  }
  revalidatePath('/dashboard/invoices');
}

export type SignUpState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
};

export async function registerUser(
  prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const validatedFields = SignUpFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the errors below.',
    };
  }

  const { name, email, password } = validatedFields.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing =
      await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;

    if (existing.length > 0) {
      return {
        errors: { email: ['An account with this email already exists.'] },
        message: 'Please fix the errors below.',
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${normalizedEmail}, ${hashedPassword})
    `;
  } catch (error) {
    console.error('Failed to create user:', error);
    return { message: 'Database error: failed to create your account.' };
  }

  try {
    await signIn('credentials', {
      email: normalizedEmail,
      password,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Account was created but auto sign-in failed; send them to log in manually.
      redirect('/login');
    }
    throw error;
  }

  return {};
}

export type ForgotPasswordState = {
  errors?: { email?: string[] };
  message?: string;
  success?: boolean;
};

const GENERIC_RESET_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';

export async function requestPasswordReset(
  prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const validatedFields = ForgotPasswordFormSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the errors below.',
    };
  }

  const email = validatedFields.data.email.toLowerCase();

  try {
    const users =
      await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`;
    const user = users[0];

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await sql`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()})
      `;

      const hdrs = await headers();
      const host = hdrs.get('host');
      const protocol =
        host?.startsWith('localhost') || host?.startsWith('127.0.0.1')
          ? 'http'
          : 'https';
      const resetUrl = `${protocol}://${host}/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail(email, resetUrl);
    }
  } catch (error) {
    // Don't leak account existence or internal errors to the client.
    console.error('Failed to process password reset request:', error);
  }

  return { message: GENERIC_RESET_MESSAGE, success: true };
}

export type ResetPasswordState = {
  errors?: { password?: string[]; confirmPassword?: string[] };
  message?: string;
  success?: boolean;
  email?: string;
};

export async function resetPassword(
  prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const validatedFields = ResetPasswordFormSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the errors below.',
    };
  }

  const { token, password } = validatedFields.data;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  let email: string;

  try {
    const rows = await sql<{ id: string; user_id: string; email: string }[]>`
      SELECT prt.id, prt.user_id, u.email
      FROM password_reset_tokens prt
      JOIN users u ON u.id = prt.user_id
      WHERE prt.token_hash = ${tokenHash}
        AND prt.used_at IS NULL
        AND prt.expires_at > now()
    `;
    const tokenRow = rows[0];

    if (!tokenRow) {
      return {
        message:
          'This password reset link is invalid or has expired. Please request a new one.',
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sql.begin(async (sqlClient) => {
      await sqlClient`UPDATE users SET password = ${hashedPassword} WHERE id = ${tokenRow.user_id}`;
      await sqlClient`UPDATE password_reset_tokens SET used_at = now() WHERE id = ${tokenRow.id}`;
    });

    email = tokenRow.email;
  } catch (error) {
    console.error('Failed to reset password:', error);
    return { message: 'Something went wrong. Please try again.' };
  }

  return {
    message: 'Your password has been reset successfully.',
    success: true,
    email,
  };
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}