import React from 'react'
import { cn } from '../../utils'
import { Loader2 } from 'lucide-react'

// ─── Button ────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-body font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-gold-500 text-ink-950 hover:bg-gold-400',
    ghost: 'border border-ink-600 text-ink-300 hover:border-ink-400 hover:text-ink-100',
    danger: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
  }
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

// ─── Input ─────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-field',
              icon && 'pl-10',
              error && 'error',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Select ────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'input-field appearance-none cursor-pointer',
            error && 'error',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ─── Spinner ───────────────────────────────────────────────────────────────

export function Spinner({ size = 24 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-gold-500" />
}

// ─── Card ──────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div className={cn(hover ? 'card-hover' : 'card', className)}>
      {children}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-ink-600">{icon}</div>
      <p className="text-ink-300 font-medium">{title}</p>
      {description && <p className="text-ink-500 text-sm mt-1">{description}</p>}
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer-bg rounded-lg', className)} />
}
