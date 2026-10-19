import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  shownRange: string
  totalCount: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, shownRange, totalCount, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="mt-10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-body-sm text-on-surface-variant">
        Showing <span className="font-semibold text-on-surface">{shownRange}</span> of{' '}
        <span className="font-semibold text-on-surface">{totalCount}</span> items
      </p>
      <div className="flex items-center gap-1 text-label-md">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label="Previous page"
          disabled={currentPage === 1}
          className="w-10 h-10 rounded-lg ring-1 ring-outline-variant/60 bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:ring-[#d4af37] hover:text-tertiary transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={20} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={
              p === currentPage
                ? 'w-10 h-10 rounded-lg bg-[#d4af37] text-on-tertiary-container font-semibold'
                : 'w-10 h-10 rounded-lg ring-1 ring-outline-variant/60 bg-surface-container-lowest hover:ring-[#d4af37] hover:text-tertiary text-on-surface transition-colors'
            }
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          aria-label="Next page"
          disabled={currentPage === totalPages}
          className="w-10 h-10 rounded-lg ring-1 ring-outline-variant/60 bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:ring-[#d4af37] hover:text-tertiary transition-colors disabled:opacity-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}