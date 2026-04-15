import { NextRequest, NextResponse } from 'next/server';
import { semanticSearchProducts, textSearchFallback as textFallback } from '@/lib/embedding';
import type { ChatProduct } from '@/types/chat';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Rate limit: simple in-memory tracker (per-IP, resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

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

// ─── Build system prompt with product context ────────────
function buildSystemPrompt(products: ChatProduct[]): string {
  const productContext =
    products.length > 0
      ? `\n\n📦 SẢN PHẨM LIÊN QUAN TÌM ĐƯỢC TỪ KHO PHARMIFY (dữ liệu thật):
${products
  .map(
    (p, i) =>
      `${i + 1}. **${p.name}** — ${new Intl.NumberFormat('vi-VN').format(p.price)}đ/${p.base_unit_name || 'Đơn vị'}${p.manufacturer ? ` | NSX: ${p.manufacturer}` : ''}${p.requires_prescription ? ' | ⚠️ Cần đơn thuốc' : ''}${p.short_description ? ` | ${p.short_description.slice(0, 100)}` : ''}`,
  )
  .join('\n')}

📋 HƯỚNG DẪN TƯ VẤN SẢN PHẨM:
- CHỈ giới thiệu các sản phẩm trong danh sách trên — KHÔNG bịa ra sản phẩm không có
- Giải thích TẠI SAO sản phẩm đó phù hợp với nhu cầu khách hàng
- Nêu rõ giá, đơn vị, nhà sản xuất nếu có
- Đề cập nếu sản phẩm cần đơn thuốc (requires_prescription)
- Nếu không có sản phẩm phù hợp, nói rõ ràng và tư vấn chung`
      : `\n\n📦 Không tìm thấy sản phẩm trực tiếp liên quan trong kho. Hãy tư vấn chung và gợi ý khách hàng tìm kiếm trên trang web.`;

  return `Bạn là "Dược Sĩ AI Pharmify" — trợ lý dược phẩm ảo chuyên nghiệp của nhà thuốc online Pharmify.

🎯 VAI TRÒ:
- Tư vấn thuốc, thực phẩm chức năng, thiết bị y tế DỰA TRÊN sản phẩm thật trong kho
- Hỗ trợ tìm kiếm sản phẩm phù hợp với nhu cầu khách hàng
- Giải đáp thắc mắc về cách dùng thuốc, liều lượng, tác dụng phụ
- Tư vấn sức khỏe cơ bản, chế độ dinh dưỡng

📋 NGUYÊN TẮC QUAN TRỌNG:
1. Luôn trả lời bằng tiếng Việt, lịch sự, dễ hiểu
2. CHỈ giới thiệu sản phẩm CÓ TRONG DANH SÁCH bên dưới — TUYỆT ĐỐI không bịa sản phẩm
3. Khi tư vấn thuốc, LUÔN nhắc: "Vui lòng tham khảo ý kiến bác sĩ/dược sĩ trước khi sử dụng"
4. KHÔNG được kê đơn thuốc — chỉ cung cấp thông tin tham khảo
5. Nếu triệu chứng nghiêm trọng, khuyên khách đi khám bác sĩ ngay
6. Trả lời ngắn gọn, có cấu trúc (dùng emoji phù hợp, bullet points)
7. Nếu câu hỏi không liên quan đến sức khỏe/dược phẩm, nhẹ nhàng hướng lại chủ đề
8. Nếu danh sách sản phẩm trống, tư vấn kiến thức chung và gợi ý khách tìm kiếm trên web

🏥 THÔNG TIN PHARMIFY:
- Nhà thuốc trực tuyến uy tín
- Cung cấp: Thuốc, thực phẩm chức năng, thiết bị y tế, mỹ phẩm chăm sóc
- Đảm bảo hàng chính hãng, giá tốt
- Giao hàng nhanh toàn quốc${productContext}`;
}

// ─── Detect if user message needs product search ─────────
function shouldSearchProducts(messages: { role: string; content: string }[]): boolean {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg) return false;

  const text = lastUserMsg.content.toLowerCase();

  // Greeting or very short generic messages — no search needed
  const greetings = ['xin chào', 'hello', 'hi', 'chào', 'hey', 'cảm ơn', 'thank', 'ok', 'được', 'bye', 'tạm biệt'];
  if (greetings.some((g) => text.trim() === g)) return false;

  // Health/product-related keywords — definitely search
  const healthKeywords = [
    'thuốc', 'đau', 'sốt', 'ho', 'cảm', 'viêm', 'dị ứng', 'vitamin',
    'bổ sung', 'canxi', 'sắt', 'omega', 'kháng sinh', 'giảm đau',
    'tiêu hóa', 'dạ dày', 'mắt', 'da', 'tóc', 'xương', 'khớp',
    'huyết áp', 'tiểu đường', 'cholesterol', 'miễn dịch', 'giấc ngủ',
    'mệt mỏi', 'stress', 'trẻ em', 'bà bầu', 'người già', 'sản phẩm',
    'mua', 'giá', 'tìm', 'gợi ý', 'đề xuất', 'nên dùng', 'nên uống',
    'chăm sóc', 'mỹ phẩm', 'kem', 'gel', 'dung dịch', 'băng', 'gạc',
    'nhiệt kế', 'máy đo', 'khẩu trang', 'sát khuẩn', 'paracetamol',
    'ibuprofen', 'aspirin', 'kẽm', 'DHA', 'probiotic', 'men vi sinh',
  ];

  return healthKeywords.some((kw) => text.includes(kw)) || text.length > 15;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút.' },
        { status: 429 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_YOUR_KEY_HERE') {
      return NextResponse.json(
        { error: 'GROQ_API_KEY chưa được cấu hình' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages là bắt buộc' },
        { status: 400 },
      );
    }

    // Limit message history to prevent abuse
    const recentMessages = messages.slice(-10).map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content.slice(0, 2000), // Limit each message length
    }));

    // ─── RAG Step 1: Semantic search for relevant products ───
    let products: ChatProduct[] = [];
    const needsSearch = shouldSearchProducts(recentMessages);

    if (needsSearch) {
      const lastUserMsg = [...recentMessages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        try {
          if (process.env.OPENAI_API_KEY) {
            // RAG: Vector semantic search
            products = await semanticSearchProducts(lastUserMsg.content, 8, 0.55);
          } else {
            // Fallback: Text-based search (still useful without embeddings)
            products = await textFallback(lastUserMsg.content);
          }
        } catch (err) {
          console.error('Product search failed, continuing without products:', err);
        }
      }
    }

    // ─── RAG Step 2: Build context-aware system prompt ───────
    const systemPrompt = buildSystemPrompt(products);

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
    ];

    // ─── RAG Step 3: Stream AI response ──────────────────────
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
        max_tokens: 1024,
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
        // Send products immediately if found (before AI starts responding)
        if (products.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ searchingProducts: true })}\n\n`),
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ products })}\n\n`),
          );
        }

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
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
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
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra. Vui lòng thử lại.' },
      { status: 500 },
    );
  }
}
