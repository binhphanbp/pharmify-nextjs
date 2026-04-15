import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ─── OpenAI Client (lazy init to avoid crash when env var missing) ─
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY chưa được cấu hình');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions, cheap & fast
const EMBEDDING_DIMENSIONS = 1536;

// ─── Supabase Admin Client ───────────────────────────────
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Build product text for embedding ────────────────────
// Combines all relevant fields into a single searchable text
export function buildProductText(product: {
  name: string;
  short_description?: string | null;
  description?: string | null;
  manufacturer?: string | null;
  category_name?: string | null;
  active_ingredient?: string | null;
  origin?: string | null;
}): string {
  const parts = [
    product.name,
    product.category_name && `Danh mục: ${product.category_name}`,
    product.manufacturer && `Nhà sản xuất: ${product.manufacturer}`,
    product.active_ingredient && `Hoạt chất: ${product.active_ingredient}`,
    product.origin && `Xuất xứ: ${product.origin}`,
    product.short_description,
    product.description?.slice(0, 500), // Limit description length
  ];
  return parts.filter(Boolean).join('. ');
}

// ─── Generate embedding for a single text ────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // Model limit safety
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

// ─── Generate & store embedding for a single product ─────
export async function embedProduct(productId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Fetch product with all text fields
  const { data: product, error } = await supabase
    .from('v_product_detail')
    .select('name, short_description, description, manufacturer, category_name, active_ingredient, origin')
    .eq('id', productId)
    .single();

  if (error || !product) {
    console.error(`Failed to fetch product ${productId}:`, error);
    return false;
  }

  const text = buildProductText(product);
  const embedding = await generateEmbedding(text);

  // pgvector in Supabase accepts stringified array format '[0.1,0.2,...]'
  const { error: updateError } = await supabase
    .from('products')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', productId);

  if (updateError) {
    console.error(`Failed to store embedding for ${productId}:`, updateError);
    return false;
  }

  return true;
}

// ─── Batch embed all products (for initial setup) ────────
export async function embedAllProducts(
  onProgress?: (done: number, total: number) => void,
): Promise<{ success: number; failed: number }> {
  const supabase = getSupabaseAdmin();

  const { data: products, error } = await supabase
    .from('v_product_detail')
    .select('id, name, short_description, description, manufacturer, category_name, active_ingredient, origin')
    .eq('is_active', true);

  if (error || !products) {
    throw new Error(`Failed to fetch products: ${error?.message}`);
  }

  let success = 0;
  let failed = 0;

  // Process in batches of 20 to avoid rate limits
  const BATCH_SIZE = 20;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    // Generate embeddings for batch
    const texts = batch.map((p) => buildProductText(p).slice(0, 8000));

    try {
      const response = await getOpenAI().embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      // Store each embedding
      for (let j = 0; j < batch.length; j++) {
        const embedding = response.data[j].embedding;
        const { error: updateError } = await supabase
          .from('products')
          .update({ embedding: JSON.stringify(embedding) })
          .eq('id', batch[j].id);

        if (updateError) {
          console.error(`Failed to store embedding for ${batch[j].name}:`, updateError);
          failed++;
        } else {
          success++;
        }
      }
    } catch (err) {
      console.error(`Batch embedding error at index ${i}:`, err);
      failed += batch.length;
    }

    onProgress?.(success + failed, products.length);

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < products.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return { success, failed };
}

// ─── Semantic search using pgvector ──────────────────────
export async function semanticSearchProducts(
  query: string,
  matchCount: number = 8,
  matchThreshold: number = 0.60,
) {
  const supabase = getSupabaseAdmin();
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('hybrid_search_products', {
    query_embedding: JSON.stringify(queryEmbedding),
    query_text: query,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error('Semantic search error:', error);
    // Fallback to text search
    return textSearchFallback(supabase, query);
  }

  return data || [];
}

// ─── Text search fallback (when vector search fails or OPENAI_API_KEY missing) ─
export async function textSearchFallback(queryOrSupabase: string | ReturnType<typeof createClient>, queryText?: string) {
  let supabase: ReturnType<typeof createClient>;
  let query: string;

  if (typeof queryOrSupabase === 'string') {
    supabase = getSupabaseAdmin();
    query = queryOrSupabase;
  } else {
    supabase = queryOrSupabase;
    query = queryText || '';
  }

  const words = query.split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return [];

  const conditions = words.map((w) => `name.ilike.%${w}%`).join(',');

  const { data } = await supabase
    .from('v_product_catalog')
    .select('id, name, slug, image_url, price, original_price, base_unit_name, base_unit_id, manufacturer, short_description, requires_prescription, category_name')
    .eq('is_active', true)
    .or(conditions)
    .limit(8);

  return data || [];
}
