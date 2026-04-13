export interface ChatProduct {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  price: number;
  original_price: number;
  base_unit_name: string;
  base_unit_id: string;
  manufacturer: string;
  short_description: string;
  requires_prescription: boolean;
  category_name?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProduct[];
  searchingProducts?: boolean;
  timestamp: number;
}

export interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason: string | null;
  }>;
}
