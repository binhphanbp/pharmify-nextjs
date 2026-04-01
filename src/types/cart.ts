export interface CartItem {
  product_id: string;
  unit_id: string;
  quantity: number;
}

export interface CartSummaryItem {
  product_id: string;
  product_name: string;
  product_image: string;
  product_slug: string;
  unit_id: string;
  unit_name: string;
  quantity: number;
  price: number;
  original_price: number;
  line_total: number;
}

export interface CartSummary {
  items: CartSummaryItem[];
  total_amount: number;
  total_items: number;
}
