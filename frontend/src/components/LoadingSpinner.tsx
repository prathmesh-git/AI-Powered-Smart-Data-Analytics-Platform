export default function LoadingSpinner({ size = 'md', label = '' }: { size?: 'sm' | 'md' | 'lg', label?: string }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeMap[size]} border-3 border-brand-500 border-t-transparent rounded-full animate-spin`}
           style={{ borderWidth: size === 'sm' ? 2 : 3 }} />
      {label && <p className="text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>{label}</p>}
    </div>
  )
}
