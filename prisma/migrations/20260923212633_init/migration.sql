-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VISITOR', 'OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'VISITOR',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province_id" INTEGER NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "BusinessStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "district_id" INTEGER NOT NULL,
    "sector" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "price_level" SMALLINT,
    "owner_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_categories" (
    "business_id" UUID NOT NULL,
    "category_id" INTEGER NOT NULL,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "business_categories_pkey" PRIMARY KEY ("business_id","category_id")
);

-- CreateTable
CREATE TABLE "opening_hours" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "opens_at" SMALLINT NOT NULL,
    "closes_at" SMALLINT NOT NULL,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "alt_text" TEXT NOT NULL,
    "position" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_sections" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "showcase_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_items" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_rwf" INTEGER,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "showcase_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_slug_key" ON "provinces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_name_key" ON "provinces"("name");

-- CreateIndex
CREATE UNIQUE INDEX "districts_slug_key" ON "districts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "districts_name_key" ON "districts"("name");

-- CreateIndex
CREATE INDEX "districts_province_id_idx" ON "districts"("province_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_status_district_id_idx" ON "businesses"("status", "district_id");

-- CreateIndex
CREATE INDEX "businesses_owner_id_idx" ON "businesses"("owner_id");

-- CreateIndex
CREATE INDEX "business_categories_category_id_idx" ON "business_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_categories_business_id_position_key" ON "business_categories"("business_id", "position");

-- CreateIndex
CREATE INDEX "opening_hours_business_id_day_of_week_idx" ON "opening_hours"("business_id", "day_of_week");

-- CreateIndex
CREATE INDEX "photos_business_id_position_idx" ON "photos"("business_id", "position");

-- CreateIndex
CREATE INDEX "showcase_sections_business_id_position_idx" ON "showcase_sections"("business_id", "position");

-- CreateIndex
CREATE INDEX "showcase_items_section_id_position_idx" ON "showcase_items"("section_id", "position");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_sections" ADD CONSTRAINT "showcase_sections_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_items" ADD CONSTRAINT "showcase_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "showcase_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
