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
    primary: "bg-green-600 hover:bg-green-700 text-white shadow-sm border border-transparent focus:ring-green-500",
    
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent focus:ring-red-500",
    
    outline: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm focus:ring-gray-500"
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        "w-full font-bold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2",
        variants[variant],
        (disabled || isLoading) && "opacity-60 cursor-not-allowed grayscale",
        className
      )}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
      {children}
    </button>
  );
};
