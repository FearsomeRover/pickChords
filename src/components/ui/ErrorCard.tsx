interface ErrorCardProps {
  message: string
  className?: string
}

export default function ErrorCard({ message, className = '' }: ErrorCardProps) {
  return (
    <div
      className={`text-[#D64545] bg-[rgba(214,69,69,0.1)] border-2 border-[#D64545] rounded-lg text-center p-5 ${className}`}
    >
      Error: {message}
    </div>
  )
}
