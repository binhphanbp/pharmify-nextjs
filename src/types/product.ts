export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  short_description: string;
  description: string;
  image_url: string;
  manufacturer: string;
  origin: string;
  requires_prescription: boolean;
  is_active: boolean;
  price: number;
  original_price: number;
  base_unit_id: string;
  base_unit_name: string;
  discount_percent: number;
  created_at: string;
}

export interface ProductUnit {
  id: string;
  unit_id: string;
  product_id: string;
  unit_name: string;
  conversion_factor: number;
  is_base_unit: boolean;
  is_active: boolean;
  price: number;
  original_price: number;
}

export interface ProductDetail extends Product {
  units: ProductUnit[];
}
