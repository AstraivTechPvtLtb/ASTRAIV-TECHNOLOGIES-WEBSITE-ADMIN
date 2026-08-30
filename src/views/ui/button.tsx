import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20',
        destructive: 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
        outline: 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white',
        secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700',
        ghost: 'hover:bg-slate-800 text-slate-400 hover:text-white',
        link: 'text-blue-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 px-2.5 rounded-lg text-[11px]',
        sm: 'h-8.5 rounded-xl px-3',
        lg: 'h-11 rounded-xl px-6 text-sm',
        icon: 'h-8.5 w-8.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
