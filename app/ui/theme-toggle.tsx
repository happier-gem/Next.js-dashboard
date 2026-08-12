'use client';

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useTheme } from '@/app/ui/theme-provider';

export default function ThemeToggle({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={clsx(
        'flex h-[48px] items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium text-gray-900 transition-colors hover:bg-sky-100 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-blue-400',
        iconOnly ? 'w-[48px]' : 'md:justify-start md:p-2 md:px-3',
        className,
      )}
    >
      {isDark ? (
        <SunIcon className="w-6 shrink-0" />
      ) : (
        <MoonIcon className="w-6 shrink-0" />
      )}
      {!iconOnly && (
        <span className="hidden md:block">
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </button>
  );
}
