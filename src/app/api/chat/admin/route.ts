import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function getBusinessContext() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const [products, categories, orders, users] = await Promise.all([
      supabase.from('products').select('id, name, price, is_active, created_at', { count: 'exact' }),
      supabase.from('categories').select('id, name', { count: 'exact' }),
      supabase.from('orders').select('id, total_amount, status, created_at', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
    ]);

    // Calculate real statistics
    const totalProducts = products.count || 0;
    const activeProducts = products.data?.filter((p) => p.is_active).length || 0;
    const totalCategories = categories.count || 0;
    const totalOrders = orders.count || 0;
    const totalUsers = users.count || 0;

    // Revenue calculation
    const totalRevenue = orders.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    // Order status breakdown
    const ordersByStatus: Record<string, number> = {};
    orders.data?.forEach((o) => {
      const status = o.status || 'unknown';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = orders.data?.filter(
      (o) => new Date(o.created_at) >= thirtyDaysAgo
    ).length || 0;

    // Top products by price
    const topProducts = products.data
      ?.sort((a, b) => b.price - a.price)
      .slice(0, 10)
      .map((p) => `${p.name} (${new Intl.NumberFormat('vi-VN').format(p.price)}₫)`) || [];

    return `
📊 DỮ LIỆU KINH DOANH THỰC TẾ CỦA PHARMIFY (cập nhật realtime):

🏪 Tổng quan:
- Tổng sản phẩm: ${totalProducts} (đang hoạt động: ${activeProducts})
- Tổng danh mục: ${totalCategories}
- Tổng đơn hàng: ${totalOrders}
- Tổng người dùng: ${totalUsers}
- Tổng doanh thu: ${new Intl.NumberFormat('vi-VN').format(totalRevenue)}₫

📦 Đơn hàng theo trạng thái:
${Object.entries(ordersByStatus).map(([status, count]) => `- ${status}: ${count} đơn`).join('\n')}

📈 Đơn hàng 30 ngày gần đây: ${recentOrders}

💰 Top 10 sản phẩm giá cao nhất:
${topProducts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

📂 Danh mục sản phẩm:
${categories.data?.map((c) => `- ${c.name}`).join('\n') || 'Chưa có dữ liệu'}
`;
  } catch (error) {
    console.error('Error fetching business context:', error);
    return '⚠️ Không thể lấy dữ liệu kinh doanh. Vui lòng kiểm tra kết nối database.';
  }
}

const SYSTEM_PROMPT_BASE = `Bạn là "Trợ Lý AI Phân Tích" — chuyên gia phân tích kinh doanh dược phẩm của nhà thuốc online Pharmify.

🎯 VAI TRÒ:
- Phân tích dữ liệu kinh doanh: doanh thu, đơn hàng, sản phẩm
- Đưa ra insights và xu hướng từ dữ liệu thực
- Đề xuất chiến lược cải thiện doanh số
- Phân tích hiệu quả sản phẩm, danh mục
- Dự đoán xu hướng và đề xuất hành động

📋 NGUYÊN TẮC:
1. Luôn trả lời bằng tiếng Việt, chuyên nghiệp
2. Phân tích dựa trên DỮ LIỆU THỰC được cung cấp bên dưới
3. Sử dụng số liệu cụ thể khi trả lời
4. Đưa ra đề xuất hành động cụ thể, khả thi
5. Format response có cấu trúc: tiêu đề, bullet points, emoji
6. So sánh, đánh giá khách quan
7. Nếu thiếu dữ liệu, nói rõ giới hạn phân tích`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_YOUR_KEY_HERE') {
      return NextResponse.json(
        { error: 'GROQ_API_KEY chưa được cấu hình' },
        { status: 500 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages là bắt buộc' },
        { status: 400 }
      );
    }

    // Fetch real business data from Supabase
    const businessContext = await getBusinessContext();

    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${businessContext}`;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
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
        { status: response.status }
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
            const lines = chunk.split('\n').filter((line) => line.trim() !== '');

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
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
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
      { status: 500 }
    );
  }
}
