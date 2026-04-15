import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { embedAllProducts, embedProduct } from '@/lib/embedding';

// Admin-only endpoint for managing product embeddings
// POST /api/embeddings { action: "generate-all" | "generate-one", productId?: string }

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth via Supabase session
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY chưa được cấu hình' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { action, productId } = body;

    if (action === 'generate-one' && productId) {
      const success = await embedProduct(productId);
      return NextResponse.json({
        success,
        message: success
          ? 'Embedding đã được tạo thành công'
          : 'Không thể tạo embedding cho sản phẩm này',
      });
    }

    if (action === 'generate-all') {
      const result = await embedAllProducts();
      return NextResponse.json({
        success: true,
        message: `Hoàn tất: ${result.success} thành công, ${result.failed} thất bại`,
        stats: result,
      });
    }

    return NextResponse.json(
      { error: 'Action không hợp lệ. Dùng "generate-all" hoặc "generate-one"' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Embedding API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo embedding' },
      { status: 500 },
    );
  }
}
