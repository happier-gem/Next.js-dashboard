'use client';

import { lusitana } from '@/app/ui/fonts';
import { AtSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from './button';
import Link from 'next/link';
import { useActionState } from 'react';
import { requestPasswordReset, ForgotPasswordState } from '@/app/lib/actions';

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

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
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8 dark:bg-gray-800">
        <h1 className={`${lusitana.className} mb-3 text-2xl dark:text-gray-100`}>
          Reset your password.
        </h1>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Enter the email address associated with your account and we&apos;ll
          send you a link to reset your password.
        </p>
        <div className="w-full">
          <label
            className="mb-3 mt-5 block text-xs font-medium text-gray-900 dark:text-gray-200"
            htmlFor="email"
          >
            Email
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              required
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900 dark:peer-focus:text-gray-100" />
          </div>
          {state.errors?.email && (
            <p className="mt-1 text-xs text-red-500">{state.errors.email[0]}</p>
          )}
        </div>
        <Button
          className="mt-4 w-full"
          aria-disabled={isPending}
          disabled={isPending}
        >
          {isPending ? 'Sending...' : 'Send reset link'}{' '}
          <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Remembered your password?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-500 hover:underline dark:text-blue-400"
          >
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
