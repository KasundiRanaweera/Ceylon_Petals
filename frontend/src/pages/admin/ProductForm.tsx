import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ImagePlus, Trash2, Star, Link2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { FormError, SelectField, TextAreaField, TextField } from '../../components/ui/Field'
import { adminGetProduct, adminListCategories, deleteProduct, saveProduct, type ProductInput } from '../../services/catalog'
import { OCCASIONS } from '../../data/catalog'
import { useToast } from '../../hooks/useToast'
import { uploadPhoto } from '../../services/uploads'
import { formatLKR } from '../../lib/format'
import type { OccasionSlug, Product } from '../../types'

// Text versions of the list fields, so the owner can type them naturally.
interface FormState {
  name: string
  categoryId: string
  shortDescription: string
  description: string
  price: string
  discountPrice: string
  stock: string
  lowStockThreshold: string
  badge: string
  isFeatured: boolean
  isActive: boolean
  sameDay: boolean
  occasions: OccasionSlug[]
  images: string[]
  details: string
  flowerTypes: string
  colours: string
  tags: string
}

function toForm(p?: Product | null): FormState {
  return {
    name: p?.name ?? '',
    categoryId: p?.categoryId ?? 'fresh-bouquets',
    shortDescription: p?.shortDescription ?? '',
    description: p?.description ?? '',
    price: p ? String(p.price) : '',
    discountPrice: p?.discountPrice ? String(p.discountPrice) : '',
    stock: p ? String(p.stock) : '10',
    lowStockThreshold: p ? String(p.lowStockThreshold) : '5',
    badge: p?.badge ?? '',
    isFeatured: p?.isFeatured ?? false,
    isActive: p?.isActive ?? true,
    sameDay: p?.sameDay ?? true,
    occasions: p?.occasions ?? [],
    images: p?.images ?? [],
    details: p?.details.join('\n') ?? '',
    flowerTypes: p?.flowerTypes.join(', ') ?? '',
    colours: p?.colours.join(', ') ?? '',
    tags: p?.tags.join(', ') ?? '',
  }
}

const list = (text: string, sep: RegExp) => text.split(sep).map((s) => s.trim()).filter(Boolean)

export default function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => adminGetProduct(id!),
    enabled: Boolean(id),
  })

  if (id && isLoading) return <div className="max-w-5xl mx-auto bg-surface-container-lowest rounded-xl h-96 animate-pulse" aria-busy="true" />
  if (id && !product) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-3 py-16">
        <h1 className="font-display text-headline-md text-primary">Product not found</h1>
        <Link to="/admin/products" className="text-label-md text-primary hover:underline">Back to products</Link>
      </div>
    )
  }
  return <Editor key={id ?? 'new'} product={product ?? null} />
}

function Editor({ product }: { product: Product | null }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState>(() => toForm(product))
  const [imageUrl, setImageUrl] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminListCategories })

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))
  const text = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never)

  const save = useMutation({
    mutationFn: (input: ProductInput) => saveProduct(input),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      showToast(product ? `${saved.name} saved` : `${saved.name} added to the shop`)
      navigate('/admin/products')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      showToast(`${product?.name ?? 'Product'} was deleted`)
      navigate('/admin/products')
    },
  })

  async function addFiles(files: FileList | null) {
    if (!files) return
    setUploadError(null)
    setUploading(true)
    // One at a time, so a bad photo is reported by name and the good ones before it are kept.
    for (const file of files) {
      try {
        const url = await uploadPhoto(file)
        setForm((f) => ({ ...f, images: [...f.images, url] }))
      } catch (err) {
        setUploadError((err as Error).message)
        break
      }
    }
    setUploading(false)
  }

  function addUrl() {
    if (!/^https:\/\//.test(imageUrl.trim())) {
      setUploadError('Paste a full image link starting with https://')
      return
    }
    setForm((f) => ({ ...f, images: [...f.images, imageUrl.trim()] }))
    setImageUrl('')
    setUploadError(null)
  }

  function makeMain(i: number) {
    setForm((f) => ({ ...f, images: [f.images[i], ...f.images.filter((_, j) => j !== i)] }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const discount = form.discountPrice.trim() ? Number(form.discountPrice) : undefined
    save.mutate({
      id: product?.id,
      slug: product?.slug,
      name: form.name.trim(),
      categoryId: form.categoryId,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim() || form.shortDescription.trim(),
      price: Number(form.price),
      discountPrice: discount,
      stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
      lowStockThreshold: Math.max(0, Math.floor(Number(form.lowStockThreshold) || 0)),
      badge: form.badge.trim() || undefined,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      sameDay: form.sameDay,
      occasions: form.occasions,
      images: form.images,
      details: list(form.details, /\n/),
      flowerTypes: list(form.flowerTypes, /,/),
      colours: list(form.colours, /,/),
      tags: list(form.tags, /,/),
      attributes: product?.attributes,
    })
  }

  const price = Number(form.price) || 0
  const sale = Number(form.discountPrice) || 0
  const pct = price > 0 && sale > 0 && sale < price ? Math.round(((price - sale) / price) * 100) : 0

  return (
    <form onSubmit={submit} className="max-w-5xl mx-auto space-y-6">
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-label-md text-primary hover:underline">
        <ArrowLeft size={15} /> All products
      </Link>
      <AdminPageHeader eyebrow="Catalogue" title={product ? `Edit ${product.name}` : 'Add a product'} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-display text-headline-sm text-primary">Details</h2>
            <TextField id="name" label="Product name" required value={form.name} onChange={text('name')} />
            <SelectField id="categoryId" label="Category" required value={form.categoryId} onChange={text('categoryId')}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (hidden)'}</option>)}
            </SelectField>
            <TextField id="shortDescription" label="Short description" required maxLength={140} hint="One line shown on product cards." value={form.shortDescription} onChange={text('shortDescription')} />
            <TextAreaField id="description" label="Full description" rows={4} value={form.description} onChange={text('description')} />
            <TextAreaField id="details" label="What's included" rows={4} hint="One item per line, e.g. “24 red roses”." value={form.details} onChange={text('details')} />
          </section>

          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-display text-headline-sm text-primary">Photos</h2>
            <p className="text-body-sm text-secondary">The first photo is the main one on cards. Square or portrait photos look best.</p>
            {form.images.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {form.images.map((src, i) => (
                  <li key={`${src.slice(-24)}-${i}`} className="relative group rounded-lg overflow-hidden bg-surface-container aspect-[4/5]">
                    <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute top-2 left-2 bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded-sm">Main</span>}
                    <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1">
                      {i > 0 && (
                        <button type="button" onClick={() => makeMain(i)} className="w-8 h-8 rounded-lg bg-surface-container-lowest/95 text-primary flex items-center justify-center" aria-label={`Make photo ${i + 1} the main photo`} title="Make main photo">
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                        className="ml-auto w-8 h-8 rounded-lg bg-surface-container-lowest/95 text-error flex items-center justify-center"
                        aria-label={`Remove photo ${i + 1}`}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary text-label-md cursor-pointer hover:bg-primary-container">
                <ImagePlus size={16} /> {uploading ? 'Uploading…' : 'Upload photos'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading} className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
              </label>
              <div className="flex flex-1 gap-2">
                <label htmlFor="image-url" className="sr-only">Image link</label>
                <input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="…or paste an image link"
                  className="flex-1 min-w-0 bg-surface-container-low rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="button" onClick={addUrl} className="inline-flex items-center gap-1 px-3 rounded-lg bg-surface-container-high text-primary text-label-md">
                  <Link2 size={14} /> Add
                </button>
              </div>
            </div>
            <FormError message={uploadError} />
          </section>

          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-display text-headline-sm text-primary">Filters & occasions</h2>
            <fieldset>
              <legend className="text-label-md text-primary mb-2">Occasions</legend>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((o) => {
                  const on = form.occasions.includes(o.slug)
                  return (
                    <button
                      key={o.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set('occasions', on ? form.occasions.filter((x) => x !== o.slug) : [...form.occasions, o.slug])}
                      className={`px-3 py-1.5 rounded-sm text-label-md ${on ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                      {o.name}
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField id="flowerTypes" label="Flowers" placeholder="Roses, Lilies" hint="Comma separated" value={form.flowerTypes} onChange={text('flowerTypes')} />
              <TextField id="colours" label="Colours" placeholder="Red, White" hint="Comma separated" value={form.colours} onChange={text('colours')} />
              <TextField id="tags" label="Collection tags" placeholder="tea, choc" hint="Hampers: tea, choc, executive, wellness. Plants: low-light, air-purifying, rare-orchids." className="sm:col-span-2" value={form.tags} onChange={text('tags')} />
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-28">
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-display text-headline-sm text-primary">Price & stock</h2>
            <TextField id="price" label="Price (Rs.)" required type="number" min={1} inputMode="numeric" value={form.price} onChange={text('price')} />
            <TextField
              id="discountPrice"
              label="Sale price (Rs.)"
              type="number"
              min={1}
              inputMode="numeric"
              hint={pct > 0 ? `${pct}% off — customers see ${formatLKR(sale)} instead of ${formatLKR(price)}` : 'Leave empty for no discount.'}
              value={form.discountPrice}
              onChange={text('discountPrice')}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField id="stock" label="In stock" type="number" min={0} inputMode="numeric" value={form.stock} onChange={text('stock')} />
              <TextField id="lowStockThreshold" label="Warn below" type="number" min={0} inputMode="numeric" value={form.lowStockThreshold} onChange={text('lowStockThreshold')} />
            </div>
            <TextField id="badge" label="Badge" placeholder="e.g. Bestseller, New" value={form.badge} onChange={text('badge')} />
          </section>

          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-3">
            <h2 className="font-display text-headline-sm text-primary">Visibility</h2>
            {[
              { key: 'isActive' as const, label: 'Show in the shop', hint: 'Turn off to hide it without deleting.' },
              { key: 'isFeatured' as const, label: 'Featured on the home page', hint: 'Appears in “Most-loved arrangements”.' },
              { key: 'sameDay' as const, label: 'Same-day delivery', hint: 'Can be made and delivered on the day.' },
            ].map((o) => (
              <label key={o.key} className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form[o.key]} onChange={(e) => set(o.key, e.target.checked)} className="accent-primary w-4 h-4 mt-1" />
                <span>
                  <span className="block text-title-md text-on-surface">{o.label}</span>
                  <span className="block text-body-sm text-secondary">{o.hint}</span>
                </span>
              </label>
            ))}
          </section>

          <FormError message={save.error ? save.error.message : remove.error ? remove.error.message : null} />
          <div className="flex gap-2">
            <button type="submit" disabled={save.isPending} className="flex-1 bg-primary text-on-primary hover:bg-primary-container text-title-md py-3 rounded-lg disabled:opacity-60">
              {save.isPending ? 'Saving…' : product ? 'Save changes' : 'Add product'}
            </button>
            <Link to="/admin/products" className="px-4 py-3 rounded-lg bg-surface-container text-on-surface text-title-md">Cancel</Link>
          </div>
          {product && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={remove.isPending}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-error/40 py-3 text-title-md text-error hover:bg-error hover:text-on-error disabled:opacity-60"
            >
              <Trash2 size={16} /> {remove.isPending ? 'Deleting…' : 'Delete product'}
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${product?.name ?? ''}?`}
        message="This removes the product from the shop for good. Past orders keep their details. To take it off sale for a while, untick “Show in the shop” instead."
        confirmLabel="Delete product"
        cancelLabel="Keep"
        tone="danger"
        onConfirm={() => {
          if (product) remove.mutate(product.id)
          setConfirmDelete(false)
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  )
}
