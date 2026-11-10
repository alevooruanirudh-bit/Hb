import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'xl';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-on shadow-soft hover:brightness-110 active:brightness-95',
  secondary: 'bg-secondary text-secondary-on shadow-soft hover:brightness-110 active:brightness-95',
  outline: 'border-2 border-primary/60 text-primary bg-transparent hover:bg-primary/5',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-severity-severe text-white shadow-soft hover:brightness-110',
};

const sizes: Record<Size, string> = {
  md: 'min-h-touch px-4 text-base gap-2',
  lg: 'min-h-[56px] px-6 text-lg gap-3',
  xl: 'min-h-[72px] px-7 text-h3 gap-3',
};

/**
 * Primary action button. Always ≥ 48px tall; main actions should pass an `icon`
 * so every important button has icon + text (helps low-literacy users).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'lg',
    icon: Icon,
    iconRight: IconRight,
    fullWidth,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const iconSize = size === 'xl' ? 28 : size === 'lg' ? 22 : 20;
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-2xl font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {Icon && <Icon size={iconSize} aria-hidden strokeWidth={2.2} />}
      {children}
      {IconRight && <IconRight size={iconSize} aria-hidden strokeWidth={2.2} />}
    </button>
  );
});
