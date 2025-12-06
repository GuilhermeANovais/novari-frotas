import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          className={clsx(
            "w-full px-3 py-2 text-sm rounded-md shadow-sm transition-all duration-200",

            "bg-white text-zinc-900 placeholder:text-zinc-400",
            
            "border focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-100" 
              : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/5",
            
            className
          )}
          {...props}
        />
        
        {error && (
          <span className="text-xs text-red-500 mt-1 block font-medium animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
