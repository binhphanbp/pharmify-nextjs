'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppDispatch } from '@/stores';
import { addCartItem } from '@/stores/cart-store';
import type { ChatMessage, ChatProduct } from '@/types/chat';

/* ─── Add-to-Cart Toast ───────────────────────────────── */
function CartToast({ productName, onClose }: { productName: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="cb-cart-toast">
      <span className="material-icons">check_circle</span>
      <span>Đã thêm <strong>{productName}</strong> vào giỏ!</span>
    </div>
  );
}

/* ─── Product Card Component ───────────────────────────── */
function ChatProductCard({
  product,
  onAddToCart,
}: {
  product: ChatProduct;
  onAddToCart: (p: ChatProduct) => void;
}) {
  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100
        )
      : 0;

  return (
    <div className="cb-product-card">
      <Link
        href={`/product/${product.slug}`}
        className="cb-product-link"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cb-product-img-wrap">
          <img
            src={
              product.image_url ||
              'https://placehold.co/120x120/f0f7ff/4A90D9?text=SP'
            }
            alt={product.name}
            className="cb-product-img"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/120x120/f0f7ff/4A90D9?text=SP';
            }}
          />
          {discount > 0 && (
            <span className="cb-badge-discount">-{discount}%</span>
          )}
          {product.requires_prescription && (
            <span className="cb-badge-rx">Rx</span>
          )}
        </div>
        <div className="cb-product-info">
          <h4 className="cb-product-name">{product.name}</h4>
          {product.manufacturer && (
            <span className="cb-product-brand">{product.manufacturer}</span>
          )}
          <div className="cb-product-pricing">
            <span className="cb-product-price">
              {new Intl.NumberFormat('vi-VN').format(product.price)}đ
            </span>
            {product.original_price > product.price && (
              <span className="cb-product-original">
                {new Intl.NumberFormat('vi-VN').format(product.original_price)}đ
              </span>
            )}
          </div>
          <span className="cb-product-unit">
            /{product.base_unit_name || 'Đơn vị'}
          </span>
        </div>
      </Link>
      {!product.requires_prescription ? (
        <button
          className="cb-add-cart-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          title="Thêm vào giỏ hàng"
        >
          <span className="material-icons">add_shopping_cart</span>
          <span>Thêm</span>
        </button>
      ) : (
        <Link
          href={`/product/${product.slug}`}
          className="cb-add-cart-btn cb-rx-btn"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-icons">info_outline</span>
          <span>Xem đơn</span>
        </Link>
      )}
    </div>
  );
}

/* ─── Product Carousel ─────────────────────────────────── */
function ProductCarousel({
  products,
  onAddToCart,
}: {
  products: ChatProduct[];
  onAddToCart: (p: ChatProduct) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [checkScroll, products]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div className="cb-products-section">
      <div className="cb-products-header">
        <span className="material-icons">local_pharmacy</span>
        <span>Sản phẩm gợi ý ({products.length})</span>
      </div>
      <div className="cb-carousel-wrap">
        {canScrollLeft && (
          <button
            className="cb-scroll-btn cb-scroll-left"
            onClick={() => scroll('left')}
          >
            <span className="material-icons">chevron_left</span>
          </button>
        )}
        <div className="cb-carousel" ref={scrollRef}>
          {products.map((product) => (
            <ChatProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
        {canScrollRight && (
          <button
            className="cb-scroll-btn cb-scroll-right"
            onClick={() => scroll('right')}
          >
            <span className="material-icons">chevron_right</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Product Search Loading Indicator ─────────────────── */
function ProductSearchIndicator() {
  return (
    <div className="cb-search-indicator">
      <div className="cb-search-spinner" />
      <span>Đang tìm sản phẩm phù hợp...</span>
    </div>
  );
}

/* ─── Render message content with formatting ───────────── */
function renderFormattedText(text: string) {
  // Clean up any remaining search tags
  const cleanText = text.replace(/\[SEARCH_PRODUCTS:.*?\]/gi, '').trim();
  if (!cleanText) return null;

  const lines = cleanText.split('\n');

  return lines.map((line, i) => {
    // Bold text: **text**
    let formatted = line.replace(
      /\*\*(.*?)\*\*/g,
      '<strong>$1</strong>'
    );

    // Inline code: `text`
    formatted = formatted.replace(
      /`(.*?)`/g,
      '<code>$1</code>'
    );

    // Emoji bullets
    if (/^[•\-\*]\s/.test(formatted)) {
      formatted = formatted.replace(/^[•\-\*]\s/, '');
      return (
        <div key={i} className="cb-bullet">
          <span className="cb-bullet-dot">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      );
    }

    // Numbered list
    if (/^\d+\.\s/.test(formatted)) {
      const num = formatted.match(/^(\d+)\.\s/)?.[1];
      formatted = formatted.replace(/^\d+\.\s/, '');
      return (
        <div key={i} className="cb-bullet">
          <span className="cb-bullet-num">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      );
    }

    if (formatted.trim() === '') {
      return <div key={i} className="cb-line-break" />;
    }

    return (
      <p key={i} className="cb-paragraph" dangerouslySetInnerHTML={{ __html: formatted }} />
    );
  });
}

/* ─── Quick Reply Chips ────────────────────────────────── */
function QuickReplies({
  options,
  onSelect,
}: {
  options: string[];
  onSelect: (text: string) => void;
}) {
  return (
    <div className="cb-quick-replies">
      {options.map((opt, i) => (
        <button key={i} className="cb-quick-chip" onClick={() => onSelect(opt)}>
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ─── Main ChatBot Component ───────────────────────────── */
export default function ChatBot() {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('pharmify_chat');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.map((m: ChatMessage) => ({ ...m, searchingProducts: false })));
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Save to session
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('pharmify_chat', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Hide pulse after some time
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleAddToCart = useCallback((product: ChatProduct) => {
    if (!product.base_unit_id) return;
    dispatch(
      addCartItem({
        productId: product.id,
        unitId: product.base_unit_id,
        quantity: 1,
      })
    );
    setCartToast(product.name);
  }, [dispatch]);

  const sendMessage = async (overrideText?: string) => {
    const trimmed = (overrideText || input).trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    const assistantMessage: ChatMessage = {
      id: `asst_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const chatHistory = [...messages, userMessage].slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Chat API failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let accumulated = '';

      let sseBuffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const parts = sseBuffer.split('\n');
        // Keep last part as it may be incomplete
        sseBuffer = parts.pop() || '';
        const lines = parts.filter((l) => l.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);

              // Handle product search loading state
              if (parsed.searchingProducts !== undefined) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, searchingProducts: parsed.searchingProducts }
                      : m
                  )
                );
                continue;
              }

              // Handle product data
              if (parsed.products) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, products: parsed.products, searchingProducts: false }
                      : m
                  )
                );
                continue;
              }

              // Handle no results
              if (parsed.noResults) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, searchingProducts: false }
                      : m
                  )
                );
                continue;
              }

              // Handle text content
              if (parsed.content) {
                accumulated += parsed.content;
                const currentText = accumulated;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: currentText }
                      : m
                  )
                );
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: `❌ ${errorMessage === 'Chat API failed' ? 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.' : errorMessage}`,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsLoading(false);
    sessionStorage.removeItem('pharmify_chat');
  };

  const suggestions = [
    { icon: '💊', text: 'Đau đầu nên dùng thuốc gì?' },
    { icon: '🤧', text: 'Cảm cúm sốt nên uống gì?' },
    { icon: '🍊', text: 'Vitamin tăng đề kháng' },
    { icon: '🦴', text: 'Bổ sung canxi cho người lớn' },
    { icon: '👶', text: 'Thuốc phù hợp cho trẻ em' },
    { icon: '🌿', text: 'Sản phẩm chăm sóc da' },
  ];

  const quickReplies = [
    'Xem thêm sản phẩm tương tự',
    'Cách sử dụng thuốc này?',
    'Có tác dụng phụ không?',
    'Giá các loại khác?',
  ];

  // Check if last assistant message has products (for showing quick replies)
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const showQuickReplies =
    !isLoading &&
    lastAssistantMsg?.products &&
    lastAssistantMsg.products.length > 0 &&
    messages[messages.length - 1]?.role === 'assistant';

  return (
    <>
      {/* Cart Toast */}
      {cartToast && (
        <CartToast
          productName={cartToast}
          onClose={() => setCartToast(null)}
        />
      )}

      {/* Floating Toggle Button */}
      <button
        className={`cb-toggle ${isOpen ? 'cb-toggle-open' : ''} ${showPulse && !isOpen ? 'cb-pulse' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowPulse(false);
        }}
        aria-label="Mở chat tư vấn"
      >
        {isOpen ? (
          <span className="material-icons">close</span>
        ) : (
          <>
            <span className="material-icons">medication</span>
            {showPulse && <span className="cb-toggle-label">Hỏi Dược Sĩ AI</span>}
          </>
        )}
      </button>

      {/* Chat Window */}
      <div className={`cb-window ${isOpen ? 'cb-window-open' : ''}`}>
        {/* Header */}
        <div className="cb-header">
          <div className="cb-header-info">
            <div className="cb-header-avatar">
              <span className="material-icons">local_pharmacy</span>
            </div>
            <div>
              <h3 className="cb-header-title">Dược Sĩ AI Pharmify</h3>
              <span className="cb-header-status">
                <span className="cb-status-dot" />
                Trực tuyến — Sẵn sàng tư vấn
              </span>
            </div>
          </div>
          <div className="cb-header-actions">
            <button onClick={clearChat} title="Xóa lịch sử chat">
              <span className="material-icons">delete_outline</span>
            </button>
            <button onClick={() => setIsOpen(false)} title="Thu nhỏ">
              <span className="material-icons">remove</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="cb-messages">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="cb-welcome">
              <div className="cb-welcome-icon">
                <span className="material-icons">health_and_safety</span>
              </div>
              <h4>Xin chào! 👋</h4>
              <p>
                Tôi là <strong>Dược Sĩ AI</strong> của Pharmify. Tôi có thể tư vấn thuốc,
                tìm sản phẩm phù hợp và <strong>thêm ngay vào giỏ hàng</strong> cho bạn.
              </p>
              <div className="cb-welcome-features">
                <div className="cb-feature">
                  <span className="material-icons">search</span>
                  <span>Tìm thuốc thông minh</span>
                </div>
                <div className="cb-feature">
                  <span className="material-icons">add_shopping_cart</span>
                  <span>Mua ngay trong chat</span>
                </div>
                <div className="cb-feature">
                  <span className="material-icons">verified</span>
                  <span>Tư vấn chuyên nghiệp</span>
                </div>
              </div>
              <div className="cb-suggestions">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="cb-suggestion-btn"
                    onClick={() => sendMessage(s.text)}
                  >
                    <span>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`cb-msg cb-msg-${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="cb-msg-avatar">
                  <span className="material-icons">local_pharmacy</span>
                </div>
              )}
              <div className="cb-msg-content">
                <div className={`cb-bubble cb-bubble-${msg.role}`}>
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : msg.content ? (
                    <div className="cb-ai-text">
                      {renderFormattedText(msg.content)}
                    </div>
                  ) : (
                    <div className="cb-typing">
                      <span /><span /><span />
                    </div>
                  )}
                </div>

                {/* Product Search Loading */}
                {msg.role === 'assistant' && msg.searchingProducts && (
                  <ProductSearchIndicator />
                )}

                {/* Product Cards */}
                {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
                  <ProductCarousel
                    products={msg.products}
                    onAddToCart={handleAddToCart}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Quick Reply Chips */}
          {showQuickReplies && (
            <QuickReplies
              options={quickReplies}
              onSelect={(text) => sendMessage(text)}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="cb-input-area">
          <div className="cb-input-wrap">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi về thuốc, triệu chứng, sản phẩm..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className="cb-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
            >
              <span className="material-icons">send</span>
            </button>
          </div>
          <div className="cb-disclaimer">
            ⚕️ Thông tin chỉ mang tính tham khảo, không thay thế y lệnh bác sĩ
          </div>
        </div>
      </div>
    </>
  );
}
