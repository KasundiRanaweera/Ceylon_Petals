import { prisma } from '../lib/prisma.js'
import { conflict, notFound, unprocessable } from '../lib/errors.js'
import { toCategoryDto, type CategoryDto } from './catalog.js'
import { slugify } from './adminProducts.js'

// Category management. A category's public id is its slug, which is made from the name once and
// never changes, because the shop's web addresses and filters depend on it.

export interface CategoryAdminDto extends CategoryDto {
  /** All products in the category, hidden ones included. */
  productCount: number
}

export interface CategoryInput {
  name: string
  description: string
  imageUrl: string
  sortOrder: number
  isActive: boolean
}

const withCount = (row: Parameters<typeof toCategoryDto>[0] & { _count: { products: number } }): CategoryAdminDto => ({
  ...toCategoryDto(row),
  productCount: row._count.products,
})

export async function adminListCategories(): Promise<CategoryAdminDto[]> {
  const rows = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
  return rows.map(withCount)
}

export async function createCategory(input: CategoryInput): Promise<CategoryAdminDto> {
  const slug = slugify(input.name)
  if (!slug) throw unprocessable('Please use letters or numbers in the category name.')
  if (await prisma.category.findUnique({ where: { slug }, select: { id: true } })) {
    throw conflict('A category with this name already exists.')
  }
  const row = await prisma.category.create({ data: { ...input, slug }, include: { _count: { select: { products: true } } } })
  return withCount(row)
}

export async function updateCategory(slug: string, input: CategoryInput): Promise<CategoryAdminDto> {
  try {
    // The slug is not in `data`, so renaming a category never changes its address.
    const row = await prisma.category.update({ where: { slug }, data: input, include: { _count: { select: { products: true } } } })
    return withCount(row)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') throw notFound('Category not found')
    throw error
  }
}

export async function deleteCategory(slug: string): Promise<void> {
  const category = await prisma.category.findUnique({ where: { slug }, include: { _count: { select: { products: true } } } })
  if (!category) throw notFound('Category not found')
  const inUse = category._count.products
  if (inUse > 0) throw unprocessable(`Move or delete the ${inUse} ${inUse === 1 ? 'product' : 'products'} in this category first.`)
  await prisma.category.delete({ where: { slug } })
}
