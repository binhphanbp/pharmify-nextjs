import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `Bạn là "Dược Sĩ AI Pharmify" — trợ lý dược phẩm ảo chuyên nghiệp của nhà thuốc online Pharmify.

🎯 VAI TRÒ:
- Tư vấn thuốc, thực phẩm chức năng, thiết bị y tế
- Hỗ trợ tìm kiếm sản phẩm phù hợp
- Giải đáp thắc mắc về cách dùng thuốc, liều lượng, tác dụng phụ
- Tư vấn sức khỏe cơ bản, chế độ dinh dưỡng

📋 NGUYÊN TẮC:
1. Luôn trả lời bằng tiếng Việt, lịch sự, dễ hiểu
2. Khi tư vấn thuốc, LUÔN nhắc: "Vui lòng tham khảo ý kiến bác sĩ/dược sĩ trước khi sử dụng thuốc"
3. KHÔNG được kê đơn thuốc — chỉ cung cấp thông tin tham khảo
4. Nếu triệu chứng nghiêm trọng, khuyên khách đi khám bác sĩ ngay
5. Trả lời ngắn gọn, có cấu trúc (dùng emoji phù hợp, bullet points)
6. Khi khách hỏi về sản phẩm cụ thể, gợi ý tìm trên Pharmify
7. Nếu câu hỏi không liên quan đến sức khỏe/dược phẩm, nhẹ nhàng hướng lại chủ đề

🏥 THÔNG TIN PHARMIFY:
- Nhà thuốc trực tuyến uy tín
- Cung cấp: Thuốc, thực phẩm chức năng, thiết bị y tế, mỹ phẩm chăm sóc
- Đảm bảo hàng chính hãng, giá tốt
- Giao hàng nhanh toàn quốc

🔍 GỢI Ý SẢN PHẨM:
- Khi khách hỏi về triệu chứng, bệnh, hoặc nhu cầu sức khỏe, HÃY đề xuất nhóm từ khóa sản phẩm phù hợp
- Cuối mỗi câu trả lời tư vấn, thêm CHÍNH XÁC 1 dòng cuối cùng có format:
  [SEARCH_PRODUCTS: từ_khóa_1, từ_khóa_2, từ_khóa_3]
- Ví dụ nếu khách hỏi về cảm cúm: [SEARCH_PRODUCTS: paracetamol, cảm cúm, hạ sốt, vitamin C]
- Ví dụ nếu khách hỏi vitamin cho bà bầu: [SEARCH_PRODUCTS: vitamin bà bầu, sắt, acid folic, DHA, canxi]
- Ví dụ nếu khách hỏi về đau dạ dày: [SEARCH_PRODUCTS: dạ dày, antacid, omeprazol, gastropulgite]
- Từ khóa phải liên quan đến sản phẩm dược phẩm thực tế có thể có trong nhà thuốc
- KHÔNG bao giờ đề cập dòng [SEARCH_PRODUCTS:...] trong nội dung giải thích, đây là lệnh tìm kiếm ẩn
- Nếu câu hỏi KHÔNG liên quan đến sản phẩm hoặc sức khỏe, KHÔNG thêm dòng này
- LUÔN thêm dòng này khi câu hỏi có liên quan đến sức khỏe hoặc sản phẩm dù là gián tiếp`;

// Extract search keywords from AI response
function extractSearchKeywords(text: string): { cleanText: string; keywords: string[] } {
  const regex = /\[SEARCH_PRODUCTS:\s*(.*?)\]/gi;
  const match = regex.exec(text);

  if (!match) return { cleanText: text, keywords: [] };

  const cleanText = text.replace(regex, '').trim();
  const keywords = match[1]
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  return { cleanText, keywords };
}

// Search products from Supabase with multi-strategy approach
async function searchProducts(keywords: string[]) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const selectFields =
      'id, name, slug, image_url, price, original_price, base_unit_name, base_unit_id, manufacturer, short_description, requires_prescription, category_name';

    // Strategy 1: OR query across name + short_description with all keywords
    const nameConditions = keywords.map((kw) => `name.ilike.%${kw}%`).join(',');
    const descConditions = keywords.map((kw) => `short_description.ilike.%${kw}%`).join(',');
    const allConditions = [nameConditions, descConditions].join(',');

    const { data } = await supabase
      .from('v_product_catalog')
      .select(selectFields)
      .eq('is_active', true)
      .or(allConditions)
      .limit(8);

    if (data && data.length > 0) return data;

    // Strategy 2: Individual keyword search on product name
    for (const keyword of keywords.slice(0, 4)) {
      const { data: fallbackData } = await supabase
        .from('v_product_catalog')
        .select(selectFields)
        .eq('is_active', true)
        .ilike('name', `%${keyword}%`)
        .limit(8);

      if (fallbackData && fallbackData.length > 0) return fallbackData;
    }

    // Strategy 3: Search by category name
    for (const keyword of keywords.slice(0, 3)) {
      const { data: catData } = await supabase
        .from('v_product_catalog')
        .select(selectFields)
        .eq('is_active', true)
        .ilike('category_name', `%${keyword}%`)
        .limit(8);

      if (catData && catData.length > 0) return catData;
    }

    // Strategy 4: Search by manufacturer
    for (const keyword of keywords.slice(0, 2)) {
      const { data: mfgData } = await supabase
        .from('v_product_catalog')
        .select(selectFields)
        .eq('is_active', true)
        .ilike('manufacturer', `%${keyword}%`)
        .limit(8);

      if (mfgData && mfgData.length > 0) return mfgData;
    }

    return [];
  } catch (error) {
    console.error('Product search error:', error);
    return [];
  }
}

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

    // Build messages array with system prompt
    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Call Groq API with streaming
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
        temperature: 0.7,
        max_tokens: 1024,
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

    // Stream the response, then search for products at the end
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let fullContent = '';

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
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullContent += content;
                    // Stream each token to client (remove [SEARCH_PRODUCTS:...] in real-time)
                    const cleanContent = content.replace(/\[SEARCH_PRODUCTS:.*?\]/gi, '');
                    if (cleanContent) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: cleanContent })}\n\n`)
                      );
                    }
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }

          // After streaming is done, extract keywords and search products
          const { keywords } = extractSearchKeywords(fullContent);

          if (keywords.length > 0) {
            // Signal client that product search is starting
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ searchingProducts: true })}\n\n`)
            );

            const products = await searchProducts(keywords);
            if (products.length > 0) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ products })}\n\n`
                )
              );
            } else {
              // Signal: no products found
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ searchingProducts: false, noResults: true })}\n\n`)
              );
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
      { status: 500 }
    );
  }
}
