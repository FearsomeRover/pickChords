import { useEffect, useCallback, ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'max-w-[400px]',
  md: 'max-w-[500px]',
  lg: 'max-w-[600px]',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,27,46,0.7)] backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className={`bg-off-white rounded-2xl p-8 ${sizeClasses[size]} w-[90%] max-h-[90vh] overflow-y-auto border-2 border-[#D4C9BC] shadow-[0_12px_48px_rgba(15,27,46,0.2)] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="mb-6 text-2xl font-bold text-deep-navy">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return <div className="flex gap-3 justify-end mt-6">{children}</div>
}
