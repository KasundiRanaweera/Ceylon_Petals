import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { FormError, TextAreaField, TextField } from '../../components/ui/Field'
import { adminListReviews, deleteReview, saveReview, type ReviewInput } from '../../services/reviews'
import { useToast } from '../../hooks/useToast'
import type { Review } from '../../types'

type Draft = ReviewInput & { id?: string }

const BLANK: Draft = { name: '', location: '', rating: 5, message: '', orderedItem: '', isPublished: true, sortOrder: 0 }

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} aria-hidden="true" className={i < rating ? 'fill-[#d4af37] text-[#d4af37]' : 'text-outline-variant'} />
      ))}
    </span>
  )
}

// Customer reviews shown on the home page: add, edit, hide or show, put in order, delete.
export default function Reviews() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { data: reviews = [], isLoading } = useQuery({ queryKey: ['admin', 'reviews'], queryFn: adminListReviews })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState<Review | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    queryClient.invalidateQueries({ queryKey: ['reviews'] })
  }
  const save = useMutation({
    mutationFn: saveReview,
    onSuccess: (r) => {
      refresh()
      showToast(`Review from ${r.name} saved`)
      setDraft(null)
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      refresh()
      showToast('Review deleted')
    },
    onError: (err) => showToast(err.message, 'error'),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (draft) save.mutate({ ...draft, sortOrder: Number(draft.sortOrder) || 0 })
  }

  const published = reviews.filter((r) => r.isPublished)
  const average = published.length ? (published.reduce((sum, r) => sum + r.rating, 0) / published.length).toFixed(1) : '—'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageHeader
        eyebrow="People"
        title="Reviews"
        subtitle={`What customers say on the home page. ${published.length} shown, average ${average} stars. Hidden reviews stay here but are not shown.`}
        actions={
          <button
            type="button"
            onClick={() => setDraft({ ...BLANK, sortOrder: reviews.length })}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md hover:bg-primary-container"
          >
            <Plus size={18} /> Add review
          </button>
        }
      />

      {draft && (
        <form onSubmit={submit} className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-display text-headline-sm text-primary">{draft.id ? `Edit review from ${draft.name}` : 'New review'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField id="review-name" label="Customer's name" required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField id="review-location" label="Town or area" placeholder="e.g. Colombo 05" maxLength={80} value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          </div>
          <fieldset>
            <legend className="text-label-md text-on-surface mb-2">Rating</legend>
            <div className="flex items-center gap-1" role="radiogroup">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={draft.rating === n}
                  aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                  onClick={() => setDraft({ ...draft, rating: n })}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg hover:bg-surface-container-low"
                >
                  <Star size={22} className={n <= draft.rating ? 'fill-[#d4af37] text-[#d4af37]' : 'text-outline-variant'} />
                </button>
              ))}
            </div>
          </fieldset>
          <TextAreaField id="review-message" label="What they said" required rows={3} maxLength={600} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
            <TextField
              id="review-item"
              label="What they ordered"
              placeholder="e.g. Ordered 'Classic Red Rose Dozen'"
              hint="Optional. Shown under their name."
              maxLength={120}
              value={draft.orderedItem}
              onChange={(e) => setDraft({ ...draft, orderedItem: e.target.value })}
            />
            <TextField id="review-order" label="Order on page" type="number" hint="Lower shows first." value={String(draft.sortOrder)} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
          </div>
          <label className="flex items-center gap-2 text-body-md cursor-pointer">
            <input type="checkbox" checked={draft.isPublished} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} className="accent-primary w-4 h-4" />
            Show on the website
          </label>
          <FormError message={save.error ? save.error.message : null} />
          <div className="flex gap-2">
            <button type="submit" disabled={save.isPending} className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-md disabled:opacity-60">Save</button>
            <button type="button" onClick={() => setDraft(null)} className="px-5 py-2.5 rounded-lg bg-surface-container text-on-surface text-label-md">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl h-64 animate-pulse" aria-busy="true" />
      ) : reviews.length === 0 ? (
        <p className="bg-surface-container-lowest rounded-xl shadow-sm p-8 text-center text-body-md text-secondary">
          No reviews yet. Add the kind words customers send you, and they will appear on the home page.
        </p>
      ) : (
        <ul className="bg-surface-container-lowest rounded-xl shadow-sm divide-y divide-surface-container">
          {reviews.map((r) => (
            <li key={r.id} className={`flex items-start gap-4 p-4 ${r.isPublished ? '' : 'opacity-60'}`}>
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-[14px] font-semibold text-tertiary">
                {r.initials}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-title-md text-primary">{r.name}</span>
                  <Stars rating={r.rating} />
                  {r.location && <span className="text-body-sm text-secondary">{r.location}</span>}
                  {!r.isPublished && <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">Hidden</span>}
                </div>
                <p className="mt-1 text-body-sm text-on-surface line-clamp-2">&ldquo;{r.message}&rdquo;</p>
                {r.orderedItem && <p className="mt-1 text-[12.5px] text-tertiary truncate">{r.orderedItem}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => save.mutate({ ...r, isPublished: !r.isPublished })}
                  title={r.isPublished ? 'Hide' : 'Show'}
                  aria-label={r.isPublished ? `Hide the review from ${r.name}` : `Show the review from ${r.name}`}
                  className="w-8 h-8 rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center"
                >
                  {r.isPublished ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button type="button" onClick={() => setDraft(r)} title="Edit" aria-label={`Edit the review from ${r.name}`} className="w-8 h-8 rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center">
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => setDeleting(r)} title="Delete" aria-label={`Delete the review from ${r.name}`} className="w-8 h-8 rounded-lg bg-surface-container-low text-error hover:bg-error hover:text-on-error flex items-center justify-center">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete the review from ${deleting?.name ?? ''}?`}
        message="This cannot be undone. To stop showing it but keep it, hide it instead."
        confirmLabel="Delete"
        cancelLabel="Keep"
        tone="danger"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id)
          setDeleting(null)
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
