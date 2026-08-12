'use client';

import { lusitana } from '@/app/ui/fonts';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from './button';
import PasswordInput from './password-input';
import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { resetPassword, ResetPasswordState } from '@/app/lib/actions';

const initialState: ResetPasswordState = {};

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    initialState,
  );

  if (!token) {
    return (
      <div className="flex-1 rounded-lg bg-gray-50 px-6 py-8 dark:bg-gray-800">
        <div className="flex items-start gap-2">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-gray-700 dark:text-gray-200">
            This password reset link is missing or invalid. Please request a
            new one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-500 hover:underline dark:text-blue-400"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="flex-1 rounded-lg bg-gray-50 px-6 py-8 dark:bg-gray-800">
        <div className="flex items-start gap-2">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <p className="text-sm text-gray-700 dark:text-gray-200">{state.message}</p>
        </div>
        <Link
          href="/login"
          className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-500 hover:underline dark:text-blue-400"
        >
          Continue to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8 dark:bg-gray-800">
        <h1 className={`${lusitana.className} mb-3 text-2xl dark:text-gray-100`}>
          Choose a new password.
        </h1>
        <input type="hidden" name="token" value={token} />
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900 dark:text-gray-200"
              htmlFor="password"
            >
              New password
            </label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
            {state.errors?.password ? (
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-red-500">
                {state.errors.password.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be 8+ characters with an uppercase letter, a lowercase
                letter, and a number.
              </p>
            )}
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900 dark:text-gray-200"
              htmlFor="confirmPassword"
            >
              Confirm new password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter your new password"
              required
              minLength={8}
            />
            {state.errors?.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.confirmPassword[0]}
              </p>
            )}
          </div>
        </div>
        <Button
          className="mt-4 w-full"
          aria-disabled={isPending}
          disabled={isPending}
        >
          {isPending ? 'Resetting...' : 'Reset password'}{' '}
          <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>
        <div
          className="flex min-h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {state.message && !state.errors && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-500">{state.message}</p>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
