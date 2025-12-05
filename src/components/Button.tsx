import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'danger' | 'outline';
  isLoading?: boolean;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className, 
  disabled, 
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white",
    danger: "bg-danger hover:bg-danger-hover text-white",
    outline: "bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700"
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        "w-full font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center",
        variants[variant],
        (disabled || isLoading) && "opacity-70 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
      {children}
    </button>
  );
};
