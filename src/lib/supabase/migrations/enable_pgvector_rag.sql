-- ============================================================
-- Pharmify RAG: Enable pgvector + Semantic Search
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to products table
-- Using 1536 dimensions (OpenAI text-embedding-3-small)
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 2b. IMPORTANT: If v_product_catalog view does NOT include the embedding column,
-- you need to recreate the view. Check with:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'v_product_catalog' AND column_name = 'embedding';
-- If no result, recreate the view to include the embedding column.
-- Example (adjust to match your existing view definition):
--   CREATE OR REPLACE VIEW v_product_catalog AS
--   SELECT p.*, c.name AS category_name FROM products p
--   LEFT JOIN categories c ON c.id = p.category_id;

-- 3. Create index for fast similarity search (IVFFlat)
-- Note: Run this AFTER you have generated embeddings for existing products
-- IVFFlat requires at least some rows with non-null embeddings
-- For < 1000 products, lists=50 is fine. Scale up for larger datasets.
CREATE INDEX IF NOT EXISTS idx_products_embedding
  ON products
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- 4. Create semantic search function
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.68,
  match_count int DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  image_url text,
  price numeric,
  original_price numeric,
  base_unit_name text,
  base_unit_id uuid,
  manufacturer text,
  short_description text,
  requires_prescription boolean,
  category_name text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    p.image_url,
    p.price,
    p.original_price,
    p.base_unit_name,
    p.base_unit_id,
    p.manufacturer,
    p.short_description,
    p.requires_prescription,
    p.category_name,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM v_product_catalog p
  WHERE p.is_active = true
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 5. Create hybrid search function (vector + text fallback)
CREATE OR REPLACE FUNCTION hybrid_search_products(
  query_embedding vector(1536),
  query_text text DEFAULT '',
  match_threshold float DEFAULT 0.60,
  match_count int DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  image_url text,
  price numeric,
  original_price numeric,
  base_unit_name text,
  base_unit_id uuid,
  manufacturer text,
  short_description text,
  requires_prescription boolean,
  category_name text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  -- Vector search results
  (
    SELECT
      p.id, p.name, p.slug, p.image_url, p.price, p.original_price,
      p.base_unit_name, p.base_unit_id, p.manufacturer, p.short_description,
      p.requires_prescription, p.category_name,
      1 - (p.embedding <=> query_embedding) AS similarity
    FROM v_product_catalog p
    WHERE p.is_active = true
      AND p.embedding IS NOT NULL
      AND 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count
  )
  UNION
  -- Text fallback (for products without embeddings yet)
  (
    SELECT
      p.id, p.name, p.slug, p.image_url, p.price, p.original_price,
      p.base_unit_name, p.base_unit_id, p.manufacturer, p.short_description,
      p.requires_prescription, p.category_name,
      0.5::float AS similarity
    FROM v_product_catalog p
    WHERE p.is_active = true
      AND p.embedding IS NULL
      AND query_text <> ''
      AND (
        p.name ILIKE '%' || query_text || '%'
        OR p.short_description ILIKE '%' || query_text || '%'
        OR p.category_name ILIKE '%' || query_text || '%'
      )
    LIMIT 4
  )
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
