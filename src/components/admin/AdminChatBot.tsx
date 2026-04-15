'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/types/chat';

const QUICK_PROMPTS = [
  { icon: 'trending_up', label: 'Phân tích doanh thu tổng quan' },
  { icon: 'inventory_2', label: 'Top sản phẩm bán chạy & tồn kho' },
  { icon: 'shopping_cart', label: 'Phân tích xu hướng đơn hàng' },
  { icon: 'lightbulb', label: 'Đề xuất chiến lược tăng doanh số' },
  { icon: 'category', label: 'Phân tích hiệu quả danh mục' },
  { icon: 'people', label: 'Phân tích hành vi khách hàng' },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function AdminChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Load from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('pharmify-admin-chat');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('pharmify-admin-chat', JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const assistantId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const allMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Get auth token for admin verification
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/chat/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: allMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Lỗi kết nối');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullContent = '';
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const parts = sseBuffer.split('\n');
        sseBuffer = parts.pop() || '';
        const lines = parts.filter((l) => l.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: '❌ Có lỗi xảy ra. Vui lòng kiểm tra API key và thử lại.' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, messages]);

  const handleNewChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsStreaming(false);
    sessionStorage.removeItem('pharmify-admin-chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderContent = (content: string) => {
    if (!content) return <span className="admin-chat-typing"><span /><span /><span /></span>;

    return content.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={i} className="admin-chat-list-item">
            <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
          </div>
        );
      }

      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={i} className="admin-chat-list-item admin-chat-numbered">
            <span dangerouslySetInnerHTML={{ __html: processed }} />
          </div>
        );
      }

      if (line.startsWith('#')) {
        const text = line.replace(/^#+\s*/, '');
        return <div key={i} className="admin-chat-heading" dangerouslySetInnerHTML={{ __html: text }} />;
      }

      return line.trim() ? (
        <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />
      ) : (
        <br key={i} />
      );
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="admin-chatbot-toggle"
        className={`admin-chat-fab ${isOpen ? 'admin-chat-fab-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        title="Trợ Lý AI Phân Tích"
      >
        <span className="material-icons">auto_awesome</span>
        <span className="admin-chat-fab-badge">AI</span>
      </button>

      {/* Chat Panel */}
      <div className={`admin-chat-panel ${isOpen ? 'admin-chat-panel-open' : ''}`}>
        {/* Header */}
        <div className="admin-chat-header">
          <div className="admin-chat-header-info">
            <div className="admin-chat-icon">
              <span className="material-icons">psychology</span>
            </div>
            <div>
              <h3 className="admin-chat-title">Trợ Lý AI Phân Tích</h3>
              <span className="admin-chat-subtitle">Dữ liệu realtime từ Pharmify</span>
            </div>
          </div>
          <div className="admin-chat-header-actions">
            <button onClick={handleNewChat} title="Phiên mới" className="admin-chat-hdr-btn">
              <span className="material-icons">delete_sweep</span>
            </button>
            <button onClick={() => setIsOpen(false)} title="Đóng" className="admin-chat-hdr-btn">
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="admin-chat-body">
          {messages.length === 0 && (
            <div className="admin-chat-welcome">
              <div className="admin-chat-welcome-icon">
                <span className="material-icons">insights</span>
              </div>
              <h4>Trợ Lý Phân Tích AI</h4>
              <p>
                Tôi phân tích dữ liệu kinh doanh thực của Pharmify. Hãy hỏi tôi
                về doanh thu, sản phẩm, đơn hàng, hoặc đề xuất chiến lược.
              </p>
              <div className="admin-chat-prompts">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    className="admin-chat-prompt-btn"
                    onClick={() => sendMessage(p.label)}
                  >
                    <span className="material-icons">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`admin-chat-msg ${msg.role === 'user' ? 'admin-chat-msg-user' : 'admin-chat-msg-bot'}`}
            >
              {msg.role === 'assistant' && (
                <div className="admin-chat-msg-avatar">
                  <span className="material-icons">psychology</span>
                </div>
              )}
              <div className="admin-chat-msg-bubble">
                <div className="admin-chat-msg-content">
                  {renderContent(msg.content)}
                </div>
                {msg.role === 'assistant' && msg.content && (
                  <button
                    className="admin-chat-copy-btn"
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    title="Copy"
                  >
                    <span className="material-icons">
                      {copied === msg.id ? 'check' : 'content_copy'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Quick prompts after messages */}
          {messages.length > 0 && !isStreaming && (
            <div className="admin-chat-follow-up">
              {QUICK_PROMPTS.slice(0, 3).map((p) => (
                <button
                  key={p.label}
                  className="admin-chat-followup-btn"
                  onClick={() => sendMessage(p.label)}
                >
                  <span className="material-icons">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="admin-chat-input-area">
          <div className="admin-chat-input-wrap">
            <textarea
              ref={inputRef}
              placeholder="Hỏi về doanh thu, sản phẩm, đơn hàng..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              className="admin-chat-input"
              rows={1}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="admin-chat-send-btn"
            >
              <span className="material-icons">
                {isStreaming ? 'hourglass_top' : 'send'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div className="admin-chat-backdrop" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
