-- Owner-editable storefront settings: the announcement bar and social profile links.
ALTER TABLE "ShopSettings" ADD COLUMN "announcement" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "instagramUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "facebookUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "tiktokUrl" TEXT NOT NULL DEFAULT '';
