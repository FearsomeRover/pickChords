import { InputHTMLAttributes, forwardRef } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="mb-5">
        {label && (
          <label className="block mb-2 font-medium text-deep-navy">
            {label}
            {props.required && ' *'}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2.5 text-base border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy focus:shadow-[0_0_0_3px_rgba(0,22,45,0.1)] placeholder:text-light-gray ${
            error ? 'border-[#D64545]' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[#D64545] text-sm mt-1">{error}</p>}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput
