import AcmeLogo from '@/app/ui/acme-logo';
import ResetPasswordForm from '@/app/ui/reset-password-form';
import ThemeToggle from '@/app/ui/theme-toggle';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
};

export default function ResetPasswordPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end justify-between rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
          <ThemeToggle
            iconOnly
            className="bg-blue-400/30 text-white hover:bg-blue-400/50 dark:bg-blue-900/40 dark:text-white dark:hover:bg-blue-900/60"
          />
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
