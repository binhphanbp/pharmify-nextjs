export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  position: 'hero' | 'sub' | 'popup' | 'sidebar';
  sort_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  website_url: string;
  sort_order: number;
  is_active: boolean;
}
