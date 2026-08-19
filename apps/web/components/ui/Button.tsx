import type { ButtonHTMLAttributes } from 'react';

type Variant = 'cta' | 'secondary' | 'ghost' | 'delete' | 'icon';

const VARIANT_CLASSES: Record<Variant, string> = {
  cta: 'rounded-2xl px-5 py-2.5 text-[13px] font-semibold bg-cta-bg text-cta-text hover:bg-cta-hover',
  secondary:
    'rounded-2xl px-4.5 py-2.5 text-[13px] font-medium bg-accent text-bg hover:bg-accent-h',
  ghost: 'rounded-lg px-3 py-2.5 text-[13px] bg-transparent text-tx2 hover:underline',
  delete: 'rounded-lg px-3 py-2.5 text-[13px] bg-transparent text-red opacity-85 hover:opacity-100',
  icon: 'h-8.5 w-8.5 rounded-lg border border-border bg-surface text-tx2 hover:border-border-hi hover:text-tx1',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`focus-ring cursor-pointer font-sans transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
