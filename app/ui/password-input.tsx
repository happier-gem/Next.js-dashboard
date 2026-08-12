'use client';

import { forwardRef, useState, type ChangeEvent } from 'react';
import { EyeIcon, EyeSlashIcon, KeyIcon } from '@heroicons/react/24/outline';

const PasswordInput = forwardRef<
  HTMLInputElement,
  {
    id: string;
    name: string;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  }
>(function PasswordInput(
  { id, name, placeholder, required, minLength, onChange },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 pr-10 text-sm outline-2 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        onChange={onChange}
        ref={ref}
      />
      <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900 dark:peer-focus:text-gray-100" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {visible ? (
          <EyeSlashIcon className="h-[18px] w-[18px]" />
        ) : (
          <EyeIcon className="h-[18px] w-[18px]" />
        )}
      </button>
    </div>
  );
});

export default PasswordInput;
