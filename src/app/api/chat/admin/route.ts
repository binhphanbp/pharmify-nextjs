import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Rate limit for admin
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Optimized: Only fetch summary counts + recent stats ─
async function getBusinessSummary(supabase: SupabaseClient) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      productCount,
      activeProductCount,
      categoryCount,
      userCount,
      orderCount,
      recentOrders,
      topSellingProducts,
      categories,
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      // Total order count (head only, no data transfer)
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      // Recent orders (30 days) — limited to 200 for stats
      supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(200),
      // Top products by order frequency
      supabase
        .from('order_items')
        .select('product_id, quantity, products(name, price)')
        .limit(50),
      supabase.from('categories').select('id, name'),
    ]);

    // Revenue from recent orders
    const recent30 = recentOrders.data || [];
    const recent7 = recent30.filter(
      (o) => new Date(o.created_at) >= sevenDaysAgo,
    );
    const revenue30 = recent30.reduce((s, o) => s + (o.total_amount || 0), 0);
    const revenue7 = recent7.reduce((s, o) => s + (o.total_amount || 0), 0);

    // Status breakdown from recent orders
    const statusBreakdown: Record<string, number> = {};
    recent30.forEach((o) => {
      statusBreakdown[o.status || 'unknown'] =
        (statusBreakdown[o.status || 'unknown'] || 0) + 1;
    });

    // Aggregate top products
    const productSales: Record<
      string,
      { name: string; price: number; qty: number }
    > = {};
    topSellingProducts.data?.forEach((item: any) => {
      const id = item.product_id;
      if (!productSales[id]) {
        productSales[id] = {
          name: item.products?.name || 'N/A',
          price: item.products?.price || 0,
          qty: 0,
        };
      }
      productSales[id].qty += item.quantity || 1;
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

    return `
📊 DỮ LIỆU KINH DOANH PHARMIFY (realtime):

🏪 Tổng quan:
- Sản phẩm: ${productCount.count || 0} (hoạt động: ${activeProductCount.count || 0})
- Danh mục: ${categoryCount.count || 0}
- Tổng đơn hàng: ${orderCount.count || 0}
- Người dùng: ${userCount.count || 0}

📦 Đơn hàng 30 ngày gần đây (theo trạng thái):
${
  Object.entries(statusBreakdown)
    .map(([s, c]) => `- ${s}: ${c} đơn`)
    .join('\n') || '- Chưa có dữ liệu'
}

📈 30 ngày gần đây: ${recent30.length} đơn — ${fmt(revenue30)}₫
📈 7 ngày gần đây: ${recent7.length} đơn — ${fmt(revenue7)}₫

🏆 Top sản phẩm bán chạy:
${topProducts.map((p, i) => `${i + 1}. ${p.name} — ${p.qty} đơn vị bán — ${fmt(p.price)}₫`).join('\n') || '- Chưa có dữ liệu bán hàng'}

📂 Danh mục:
${categories.data?.map((c) => `- ${c.name}`).join('\n') || '- Chưa có'}`;
  } catch (error) {
    console.error('Error fetching business context:', error);
    return '⚠️ Không thể lấy dữ liệu kinh doanh. Vui lòng kiểm tra kết nối database.';
  }
}

// ─── System prompt for admin analytics chatbot ───────────
const SYSTEM_PROMPT_BASE = `Bạn là "AI Business Analyst Pharmify" — trợ lý phân tích kinh doanh thông minh cho hệ thống quản trị nhà thuốc online Pharmify.

🎯 VAI TRÒ:
- Phân tích doanh thu, xu hướng bán hàng
- Đánh giá hiệu suất sản phẩm, đơn hàng
- Phân tích hiệu quả sản phẩm, danh mục
- Dự đoán xu hướng và đề xuất hành động

📋 NGUYÊN TẮC:
1. Luôn trả lời bằng tiếng Việt, chuyên nghiệp
2. Phân tích dựa trên DỮ LIỆU THỰC được cung cấp — KHÔNG bịa số liệu
3. Sử dụng số liệu cụ thể khi trả lời
4. Đưa ra đề xuất hành động cụ thể, khả thi
5. Format response có cấu trúc: tiêu đề, bullet points, emoji
6. So sánh, đánh giá khách quan
7. Nếu thiếu dữ liệu, nói rõ giới hạn phân tích
8. Luôn tính toán % tăng trưởng, trung bình khi có đủ dữ liệu`;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Quá nhiều yêu cầu. Vui lòng đợi 1 phút.' },
        { status: 429 },
      );
    }

    // Verify admin session — REQUIRED
    const supabase = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }
    const token = authHeader.slice(7);
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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_YOUR_KEY_HERE') {
      return NextResponse.json(
        { error: 'GROQ_API_KEY chưa được cấu hình' },
        { status: 500 },
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages là bắt buộc' },
        { status: 400 },
      );
    }

    // Fetch optimized business data
    const businessContext = await getBusinessSummary(supabase);
    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${businessContext}`;

    const recentMessages = messages
      .slice(-12)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content.slice(0, 3000),
      }));

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        stream: true,
        temperature: 0.6,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Lỗi kết nối AI. Vui lòng thử lại.' },
        { status: response.status },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk
              .split('\n')
              .filter((line) => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ content })}\n\n`,
                      ),
                    );
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Admin Chat API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra. Vui lòng thử lại.' },
      { status: 500 },
    );
  }
}
