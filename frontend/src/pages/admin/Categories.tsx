import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, ImagePlus } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { FormError, TextAreaField, TextField } from '../../components/ui/Field'
import { adminListCategories, deleteCategory, saveCategory } from '../../services/catalog'
import { useToast } from '../../hooks/useToast'
import { uploadPhoto } from '../../services/uploads'
import type { Category } from '../../types'

type Draft = Omit<Category, 'id' | 'slug'> & { id?: string }

const BLANK: Draft = { name: '', description: '', imageUrl: '', sortOrder: 10, isActive: true }

export default function Categories() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { data: categories = [], isLoading } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminListCategories })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function uploadImage(file: File | undefined) {
    if (!file || !draft) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadPhoto(file)
      setDraft((d) => (d ? { ...d, imageUrl: url } : d))
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }
  const save = useMutation({
    mutationFn: saveCategory,
    onSuccess: (c) => {
      refresh()
      showToast(`${c.name} saved`)
      setDraft(null)
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      refresh()
      showToast('Category deleted')
    },
    onError: (err) => showToast(err.message, 'error'),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (draft) save.mutate({ ...draft, sortOrder: Number(draft.sortOrder) || 0 })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Categories"
        subtitle="The groups customers browse in the shop menu. Hidden categories also hide their products."
        actions={
          <button type="button" onClick={() => setDraft({ ...BLANK, sortOrder: categories.length + 1 })} className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md hover:bg-primary-container">
            <Plus size={18} /> Add category
          </button>
        }
      />

      {draft && (
        <form onSubmit={submit} className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-display text-headline-sm text-primary">{draft.id ? `Edit ${draft.name}` : 'New category'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
            <TextField id="cat-name" label="Name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField id="cat-order" label="Menu order" type="number" value={String(draft.sortOrder)} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
          </div>
          <TextAreaField id="cat-desc" label="Description" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-end">
            <div className="flex items-center gap-3">
              {draft.imageUrl ? (
                <img src={draft.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-surface-container shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-surface-container shrink-0" />
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary text-label-md cursor-pointer hover:bg-primary-container">
                <ImagePlus size={16} /> {uploading ? 'Uploading…' : 'Upload photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif" disabled={uploading} className="sr-only" onChange={(e) => { void uploadImage(e.target.files?.[0]); e.target.value = '' }} />
              </label>
            </div>
            <TextField id="cat-image" label="…or image link" placeholder="https://…" hint="Shown on the home page category cards." value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} />
          </div>
          <FormError message={uploadError} />
          <label className="flex items-center gap-2 text-body-md cursor-pointer">
            <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} className="accent-primary w-4 h-4" />
            Show in the shop
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
      ) : (
        <ul className="bg-surface-container-lowest rounded-xl shadow-sm divide-y divide-surface-container">
          {categories.map((c) => (
            <li key={c.id} className={`flex items-center gap-4 p-4 ${c.isActive ? '' : 'opacity-60'}`}>
              {c.imageUrl ? (
                <img src={c.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-surface-container shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-surface-container shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-title-md text-primary">{c.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-secondary">{c.productCount} products</span>
                  {!c.isActive && <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">Hidden</span>}
                </div>
                <p className="text-body-sm text-secondary truncate">{c.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => save.mutate({ ...c, isActive: !c.isActive })}
                  title={c.isActive ? 'Hide' : 'Show'}
                  aria-label={c.isActive ? `Hide ${c.name}` : `Show ${c.name}`}
                  className="w-8 h-8 rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center"
                >
                  {c.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <a href={`/products/${c.slug}`} target="_blank" rel="noopener noreferrer" title="View in shop" aria-label={`View ${c.name} in the shop`} className="w-8 h-8 rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center">
                  <ExternalLink size={15} />
                </a>
                <button type="button" onClick={() => setDraft(c)} title="Edit" aria-label={`Edit ${c.name}`} className="w-8 h-8 rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center">
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => setDeleting(c)} title="Delete" aria-label={`Delete ${c.name}`} className="w-8 h-8 rounded-lg bg-surface-container-low text-error hover:bg-error hover:text-on-error flex items-center justify-center">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? ''}?`}
        message="Only empty categories can be deleted. To keep the products but stop showing the category, hide it instead."
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
