'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSearch } from '@/contexts/SearchContext';
import ProductCard from '@/components/shop/ProductCard';
import QuickViewModal from '@/components/shop/QuickViewModal';
import FlashSaleBar from '@/components/shop/FlashSaleBar';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import type { Banner, Brand } from '@/types/banner';

interface HomeData {
  banners: Banner[];
  sub_banners: Banner[];
  categories: Category[];
  hot_products: Product[];
  new_products: Product[];
  brands: Brand[];
  flash_sale: {
    end_time: string;
    products: Array<{
      id: string;
      name: string;
      image_url: string;
      slug: string;
      flash_price: number;
      original_price: number;
      discount_percent: number;
      sold_quantity: number;
      total_quantity: number;
    }>;
  } | null;
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const {
    query: heroQuery,
    setQuery: setHeroQuery,
    submitSearch,
  } = useSearch();
  const categoryRef = useRef<HTMLDivElement>(null);
  const hotProductsRef = useRef<HTMLDivElement>(null);
  const newProductsRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    const supabase = createClient();
    const { data: result } = await supabase.rpc('get_home_page_data');
    if (result) {
      setData({
        banners: result.hero_banners || result.banners || [],
        sub_banners: result.sub_banners || [],
        categories: result.categories || [],
        hot_products: result.hot_products || [],
        new_products: result.new_products || [],
        brands: result.brands || [],
        flash_sale: result.flash_sale || null,
      });
    } else {
      setData({
        banners: [],
        sub_banners: [],
        categories: [],
        hot_products: [],
        new_products: [],
        brands: [],
        flash_sale: null,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement | null>,
    dir: 'left' | 'right',
  ) => {
    if (!ref.current) return;
    const amount = dir === 'left' ? -300 : 300;
    ref.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="home-page">
        <section className="hero-section">
          <div className="container">
            <div
              className="banner-skeleton skeleton"
              style={{ height: 360, borderRadius: 16 }}
            />
          </div>
        </section>
        <div className="container" style={{ padding: '40px 16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 16,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 320, borderRadius: 14 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="home-page">
      {/* ===== HERO SECTION ===== */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-banner-wrap">
            {data.banners.length > 0 && (
              <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                navigation
                loop
                className="hero-swiper"
              >
                {data.banners.map((b) => (
                  <SwiperSlide key={b.id}>
                    <Link href={b.link_url || '/'} className="banner-slide">
                      <img
                        src={b.image_url}
                        alt={b.title}
                        className="banner-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/1200x400/004D95/FFF?text=Pharmify';
                        }}
                      />
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}

            {/* Pharmacity-style Hero Search Panel */}
            <div className="hero-search-panel">
              <form
                className="search-input-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch();
                }}
              >
                <span className="material-icons search-icon">search</span>
                <input
                  type="text"
                  placeholder="Bạn đang tìm gì hôm nay..."
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                />
              </form>
              <div className="panel-divider" />
              <div className="search-tags-row">
                <Link href="/search?q=khẩu trang">khẩu trang</Link>
                <Link href="/search?q=sữa dinh dưỡng">sữa dinh dưỡng</Link>
                <Link href="/search?q=collagen">collagen</Link>
                <Link href="/search?q=mặt nạ">mặt nạ</Link>
                <Link href="/search?q=thực phẩm bảo vệ sức khỏe">
                  Thực phẩm bảo vệ sức khỏe
                </Link>
                <Link href="/search?q=probiotics">probiotics</Link>
                <Link href="/search?q=Mua 1 Tặng 1">Mua 1 Tặng 1</Link>
              </div>
              <div className="panel-divider" />
              <div className="quick-actions-row">
                <Link href="/category/thuoc" className="action-item">
                  <div className="icon-text">
                    <div className="icon-bg bg-blue-light">
                      <span className="material-icons icon-blue">vaccines</span>
                    </div>
                    <span className="text-dark">Đặt đơn thuốc</span>
                  </div>
                  <span className="material-icons arrow">chevron_right</span>
                </Link>
                <div className="v-divider" />
                <a href="#" className="action-item">
                  <div className="icon-text">
                    <div className="icon-bg bg-blue-light">
                      <span className="material-icons icon-blue">
                        support_agent
                      </span>
                    </div>
                    <span className="text-dark">Liên hệ dược sĩ</span>
                  </div>
                  <span className="material-icons arrow">chevron_right</span>
                </a>
                <div className="v-divider" />
                <a href="#" className="action-item">
                  <div className="icon-text">
                    <div className="icon-bg bg-blue-light">
                      <span className="material-icons icon-blue">
                        storefront
                      </span>
                    </div>
                    <span className="text-dark">Tìm nhà thuốc</span>
                  </div>
                  <span className="material-icons arrow">chevron_right</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sub Banners Carousel */}
      {data.sub_banners.length > 0 && (
        <section className="sub-banners">
          <div className="container">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              navigation
              loop
              slidesPerView={2}
              spaceBetween={16}
              className="sub-banner-swiper"
            >
              {data.sub_banners.map((b) => (
                <SwiperSlide key={b.id}>
                  <Link href={b.link_url || '/'} className="sub-banner-item">
                    <img
                      src={b.image_url}
                      alt={b.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/600x300/0072BC/FFF?text=Pharmify+Sale';
                      }}
                    />
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* Flash Sale */}
      {data.flash_sale && data.flash_sale.products.length > 0 && (
        <FlashSaleBar
          endTime={data.flash_sale.end_time}
          products={data.flash_sale.products}
        />
      )}

      {/* Category Icons */}
      {data.categories.length > 0 && (
        <section className="categories-section">
          <div className="container" style={{ position: 'relative' }}>
            <h2 className="section-title text-dark">Danh mục tủ thuốc</h2>
            <div
              className="category-grid-wrap"
              style={{ position: 'relative' }}
            >
              <button
                className="nav-arrow nav-left"
                onClick={() => scrollCarousel(categoryRef, 'left')}
              >
                <span className="material-icons">chevron_left</span>
              </button>
              <div className="category-grid hide-scroll" ref={categoryRef}>
                {data.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="category-item"
                  >
                    <div className="cat-icon-wrap">
                      <span className="material-icons">
                        {cat.icon || 'vaccines'}
                      </span>
                    </div>
                    <span className="cat-name">{cat.name}</span>
                  </Link>
                ))}
              </div>
              <button
                className="nav-arrow nav-right"
                onClick={() => scrollCarousel(categoryRef, 'right')}
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Section: Tủ thuốc chuẩn chăm sóc cả nhà */}
      {data.hot_products.length > 0 && (
        <section className="product-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title text-dark">
                Tủ thuốc chuẩn chăm sóc cả nhà
              </h2>
              <Link href="/category" className="view-all-link">
                Xem tất cả <span className="material-icons">arrow_forward</span>
              </Link>
            </div>
            <div className="product-grid-wrap" style={{ position: 'relative' }}>
              <button
                className="nav-arrow nav-left"
                onClick={() => scrollCarousel(hotProductsRef, 'left')}
              >
                <span className="material-icons">chevron_left</span>
              </button>
              <div
                className="product-carousel hide-scroll"
                ref={hotProductsRef}
              >
                {data.hot_products.map((p) => (
                  <div key={p.id} style={{ flex: '0 0 220px', minWidth: 220 }}>
                    <ProductCard
                      product={p}
                      onQuickView={setQuickViewProduct}
                    />
                  </div>
                ))}
              </div>
              <button
                className="nav-arrow nav-right"
                onClick={() => scrollCarousel(hotProductsRef, 'right')}
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Section: Ưu đãi độc quyền */}
      {data.new_products.length > 0 && (
        <section className="product-section bg-gray">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title text-dark">Ưu đãi độc quyền</h2>
              <Link href="/category" className="view-all-link">
                Xem tất cả <span className="material-icons">arrow_forward</span>
              </Link>
            </div>
            <div className="product-grid-wrap" style={{ position: 'relative' }}>
              <button
                className="nav-arrow nav-left"
                onClick={() => scrollCarousel(newProductsRef, 'left')}
              >
                <span className="material-icons">chevron_left</span>
              </button>
              <div
                className="product-carousel hide-scroll"
                ref={newProductsRef}
              >
                {data.new_products.map((p) => (
                  <div key={p.id} style={{ flex: '0 0 220px', minWidth: 220 }}>
                    <ProductCard
                      product={p}
                      onQuickView={setQuickViewProduct}
                    />
                  </div>
                ))}
              </div>
              <button
                className="nav-arrow nav-right"
                onClick={() => scrollCarousel(newProductsRef, 'right')}
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Brands Section */}
      {data.brands.length > 0 && (
        <section className="brands-section">
          <div className="container">
            <h2 className="section-title">
              <span className="material-icons text-primary">
                workspace_premium
              </span>
              Thương hiệu nổi bật
            </h2>
            <div className="brand-grid">
              {data.brands.map((b) => (
                <a
                  key={b.id}
                  className="brand-item"
                  href={b.website_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={
                      b.logo_url ||
                      'https://placehold.co/120x60/fff/ccc?text=Brand'
                    }
                    alt={b.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/120x60/fff/ccc?text=Brand';
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
