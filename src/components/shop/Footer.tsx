import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      {/* Benefits / USP Bar */}
      <section className="benefits-section">
        <div className="container">
          <div className="benefits-grid">
            <div className="benefit-card">
              <span className="material-icons benefit-icon">
                local_shipping
              </span>
              <div>
                <strong>Giao nhanh miễn phí</strong>
                <span>Từ 2h - Tại khu vực nội thành</span>
              </div>
            </div>
            <div className="benefit-card">
              <span className="material-icons benefit-icon">verified_user</span>
              <div>
                <strong>Cam kết 100% chính hãng</strong>
                <span>Đảm bảo chất lượng sản phẩm</span>
              </div>
            </div>
            <div className="benefit-card">
              <span className="material-icons benefit-icon">swap_horiz</span>
              <div>
                <strong>Đổi trả trong 30 ngày</strong>
                <span>Kể từ ngày mua hàng</span>
              </div>
            </div>
            <div className="benefit-card">
              <span className="material-icons benefit-icon">support_agent</span>
              <div>
                <strong>Tư vấn chuyên nghiệp</strong>
                <span>Đội ngũ Dược sĩ tận tâm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Main */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Về Pharmify */}
            <div className="footer-col">
              <h3 className="footer-title">VỀ PHARMIFY</h3>
              <ul className="footer-links">
                <li>
                  <Link href="/about">Giới thiệu</Link>
                </li>
                <li>
                  <Link href="/system">Hệ thống cửa hàng</Link>
                </li>
                <li>
                  <Link href="/policy">Chính sách đổi trả và bảo hành</Link>
                </li>
                <li>
                  <Link href="/policy">Chính sách giao hàng</Link>
                </li>
                <li>
                  <Link href="/policy">Chính sách bảo vệ dữ liệu cá nhân</Link>
                </li>
                <li>
                  <Link href="/faq">Câu hỏi thường gặp</Link>
                </li>
              </ul>
            </div>

            {/* Danh mục */}
            <div className="footer-col">
              <h3 className="footer-title">DANH MỤC</h3>
              <ul className="footer-links">
                <li>
                  <Link href="/category/thuoc">Thuốc</Link>
                </li>
                <li>
                  <Link href="/category/thuc-pham">
                    Thực phẩm bảo vệ sức khỏe
                  </Link>
                </li>
                <li>
                  <Link href="/category/cham-soc">Chăm sóc cá nhân</Link>
                </li>
                <li>
                  <Link href="/category/me-va-be">Mẹ và Bé</Link>
                </li>
                <li>
                  <Link href="/category/lam-dep">Chăm sóc sắc đẹp</Link>
                </li>
                <li>
                  <Link href="/category/thiet-bi">Thiết bị y tế</Link>
                </li>
              </ul>
            </div>

            {/* Tổng đài */}
            <div className="footer-col">
              <h3 className="footer-title">TỔNG ĐÀI MIỄN CƯỚC</h3>
              <div className="support-blocks">
                <div className="support-item">
                  <h4>Hỗ trợ đặt hàng</h4>
                  <p>1800 6821</p>
                </div>
                <div className="support-item">
                  <h4>Thông tin nhà thuốc, khuyến mãi</h4>
                  <p>1800 6821</p>
                </div>
                <div className="support-item">
                  <h4>Khiếu nại, góp ý</h4>
                  <p>1800 6821</p>
                </div>
              </div>
            </div>

            {/* Theo dõi */}
            <div className="footer-col">
              <h3 className="footer-title">THEO DÕI CHÚNG TÔI TRÊN</h3>
              <div className="social-links-row">
                <a href="#" className="social-icon fb">
                  <span className="material-icons">facebook</span>
                </a>
                <a href="#" className="social-icon yt">
                  <span className="material-icons">play_circle</span>
                </a>
                <a href="#" className="social-icon zl">
                  <span className="material-icons">chat</span>
                </a>
              </div>

              <h3 className="footer-title" style={{ marginTop: '24px' }}>
                CHỨNG NHẬN BỞI
              </h3>
              <div className="certs-row">
                <span className="cert-img border-cert">BỘ CÔNG THƯƠNG</span>
                <span className="cert-img border-dmca">DMCA PROTECTED</span>
              </div>

              <h3 className="footer-title" style={{ marginTop: '24px' }}>
                HỖ TRỢ THANH TOÁN
              </h3>
              <div className="payment-methods-grid">
                <span className="payment-badge">COD</span>
                <span className="payment-badge visa">VISA</span>
                <span className="payment-badge mastercard">MASTERCARD</span>
                <span className="payment-badge">JCB</span>
                <span className="payment-badge momo">MOMO</span>
                <span className="payment-badge zalopay">ZALOPAY</span>
                <span className="payment-badge">napas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
