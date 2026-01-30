import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-deep-navy text-off-white hover:bg-[#001a3d] border-0',
  secondary:
    'bg-off-white text-deep-navy border-2 border-[#D4C9BC] hover:border-deep-navy',
  danger:
    'bg-off-white text-[#D64545] border-2 border-[#D4C9BC] hover:border-[#D64545]',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`px-5 py-2.5 text-base rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
