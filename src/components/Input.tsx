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
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          className={clsx(
            // Base styles
            "w-full px-3 py-2 text-sm rounded-md shadow-sm transition-all duration-200",
            
            // Cores de fundo e texto (Light/Dark)
            "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
            
            // Bordas e Focus
            "border focus:outline-none focus:ring-2 focus:ring-offset-0",
            
            // Estado de Erro vs Estado Normal
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20" 
              : "border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/10",
            
            className
          )}
          {...props}
        />
        
        {/* Mensagem de Erro com animação */}
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
