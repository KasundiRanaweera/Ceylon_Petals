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
      <p className="text-body-sm text-secondary">
        Showing <span className="font-bold text-primary">{shownRange}</span> of{' '}
        <span className="font-bold text-primary">{totalCount}</span> items
      </p>
      <div className="flex items-center gap-1 text-label-md">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label="Previous page"
          disabled={currentPage === 1}
          className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:text-primary transition-colors disabled:opacity-50"
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
                ? 'w-10 h-10 rounded-lg bg-primary text-on-primary font-bold'
                : 'w-10 h-10 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors'
            }
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          aria-label="Next page"
          disabled={currentPage === totalPages}
          className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}