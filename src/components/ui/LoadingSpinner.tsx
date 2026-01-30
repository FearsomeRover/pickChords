interface LoadingSpinnerProps {
  text?: string
  className?: string
}

export default function LoadingSpinner({
  text = 'Loading...',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`text-center py-10 text-light-gray ${className}`}>
      {text}
    </div>
  )
}
