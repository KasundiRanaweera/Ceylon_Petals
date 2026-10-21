import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { deleteCloudinaryImage, publicIdFromUrl } from '../lib/cloudinary.js'
import { deleteStoredImage, storedImageId } from './storedImages.js'
import { notFound, unprocessable } from '../lib/errors.js'
import { productInclude, toProductDto, type ProductDto } from './catalog.js'

// The owner's product management. Unlike the public catalogue, this sees hidden products too.

export interface ProductInput {
  name: string
  /** The category SLUG (the public id of a category). */
  categoryId: string
  shortDescription: string
  description: string
  price: number
  discountPrice?: number | null | undefined
  stock: number
  lowStockThreshold: number
  badge?: string | null | undefined
  isFeatured: boolean
  isActive: boolean
  sameDay: boolean
  occasions: string[]
  images: string[]
  details: string[]
  flowerTypes: string[]
  colours: string[]
  tags: string[]
  attributes?: Record<string, string> | null | undefined
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || 'product'
  let slug = root
  for (let i = 2; await prisma.product.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${root}-${i}`
  return slug
}

/** Checks the rules that depend on other data (the category and occasions must exist). */
async function resolveReferences(input: ProductInput) {
  if (input.discountPrice != null && input.discountPrice >= input.price) {
    throw unprocessable('The sale price must be lower than the regular price.')
  }
  const category = await prisma.category.findUnique({ where: { slug: input.categoryId }, select: { id: true } })
  if (!category) throw unprocessable('Please choose a category.')

  const occasions = [...new Set(input.occasions)]
  if (occasions.length > 0) {
    const found = await prisma.occasion.count({ where: { slug: { in: occasions } } })
    if (found !== occasions.length) throw unprocessable('One of the chosen occasions does not exist.')
  }
  return { categoryDbId: category.id, occasions }
}

function scalarData(input: ProductInput) {
  return {
    name: input.name,
    shortDescription: input.shortDescription,
    description: input.description,
    price: input.price,
    discountPrice: input.discountPrice ?? null,
    stock: input.stock,
    lowStockThreshold: input.lowStockThreshold,
    badge: input.badge || null,
    isFeatured: input.isFeatured,
    isActive: input.isActive,
    sameDay: input.sameDay,
    details: input.details,
    flowerTypes: input.flowerTypes,
    colours: input.colours,
    tags: input.tags,
    attributes: input.attributes ?? Prisma.JsonNull,
  }
}

/** After photos are removed from the shop, delete them from Cloudinary too, unless something else still uses them. */
async function cleanUpPhotos(urls: string[]): Promise<void> {
  for (const url of urls) {
    const publicId = publicIdFromUrl(url)
    const storedId = storedImageId(url)
    if (!publicId && !storedId) continue // not one of ours (e.g. a pasted link)
    const [inProducts, inCategories] = await Promise.all([
      prisma.productImage.count({ where: { url } }),
      prisma.category.count({ where: { imageUrl: url } }),
    ])
    if (inProducts > 0 || inCategories > 0) continue // still used somewhere else
    if (publicId) await deleteCloudinaryImage(publicId)
    if (storedId) await deleteStoredImage(storedId)
  }
}

// ---------------------------------------------------------------- reading

export async function adminListProducts(): Promise<ProductDto[]> {
  const rows = await prisma.product.findMany({ include: productInclude, orderBy: { createdAt: 'desc' } })
  return rows.map(toProductDto)
}

export async function adminGetProduct(id: string): Promise<ProductDto> {
  const row = await prisma.product.findUnique({ where: { id }, include: productInclude })
  if (!row) throw notFound('Product not found')
  return toProductDto(row)
}

// ---------------------------------------------------------------- writing

export async function createProduct(input: ProductInput): Promise<ProductDto> {
  const { categoryDbId, occasions } = await resolveReferences(input)
  const slug = await uniqueSlug(slugify(input.name))

  const created = await prisma.product.create({
    data: {
      ...scalarData(input),
      slug,
      categoryId: categoryDbId,
      occasions: { connect: occasions.map((s) => ({ slug: s })) },
      images: { create: input.images.map((url, position) => ({ url, position })) },
    },
    include: productInclude,
  })
  return toProductDto(created)
}

/** Replaces everything the owner can edit. The web address (slug) never changes, so shared links keep working. */
export async function updateProduct(id: string, input: ProductInput): Promise<ProductDto> {
  const existing = await prisma.product.findUnique({ where: { id }, include: { images: true } })
  if (!existing) throw notFound('Product not found')
  const { categoryDbId, occasions } = await resolveReferences(input)

  const updated = await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: id } })
    return tx.product.update({
      where: { id },
      data: {
        ...scalarData(input),
        categoryId: categoryDbId,
        occasions: { set: occasions.map((s) => ({ slug: s })) },
        images: { create: input.images.map((url, position) => ({ url, position })) },
      },
      include: productInclude,
    })
  })

  const removed = existing.images.map((i) => i.url).filter((url) => !input.images.includes(url))
  void cleanUpPhotos(removed)
  return toProductDto(updated)
}

export async function setProductActive(id: string, isActive: boolean): Promise<ProductDto> {
  try {
    const row = await prisma.product.update({ where: { id }, data: { isActive }, include: productInclude })
    return toProductDto(row)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') throw notFound('Product not found')
    throw error
  }
}

export async function setProductStock(id: string, stock: number): Promise<ProductDto> {
  try {
    const row = await prisma.product.update({ where: { id }, data: { stock }, include: productInclude })
    return toProductDto(row)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') throw notFound('Product not found')
    throw error
  }
}

/**
 * Past orders keep their own copy of the name, price and photo, so they are not affected.
 * A cart that still holds the product is stopped at checkout ("no longer available").
 */
export async function deleteProduct(id: string): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { id }, include: { images: true } })
  if (!existing) throw notFound('Product not found')
  await prisma.product.delete({ where: { id } })
  void cleanUpPhotos(existing.images.map((i) => i.url))
}
