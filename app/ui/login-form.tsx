'use client';

import { lusitana } from '@/app/ui/fonts';
import { AtSymbolIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from './button';
import PasswordInput from './password-input';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { authenticate } from '@/app/lib/actions';
import { useSearchParams } from 'next/navigation';
import { consumeLoginPrefill } from '@/app/lib/login-prefill';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prefill = consumeLoginPrefill();
    if (prefill && emailRef.current && passwordRef.current) {
      emailRef.current.value = prefill.email;
      passwordRef.current.value = prefill.password;
    }
  }, []);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8 dark:bg-gray-800">
        <h1 className={`${lusitana.className} mb-3 text-2xl dark:text-gray-100`}>
          Please log in to continue.
        </h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900 dark:text-gray-200"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                id="email"
                type="email"
                name="email"
                required
                ref={emailRef}
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900 dark:peer-focus:text-gray-100" />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900 dark:text-gray-200"
              htmlFor="password"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={6}
              ref={passwordRef}
            />
          </div>
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-blue-500 hover:underline dark:text-blue-400"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
          <input type="hidden" name="redirectTo" value={callbackUrl} />
        <Button
          className="mt-4 w-full"
          aria-disabled={isPending}
          disabled={isPending}
        >
          {isPending ? 'Logging in...' : 'Log in'}{' '}
          <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-blue-500 hover:underline dark:text-blue-400"
          >
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
