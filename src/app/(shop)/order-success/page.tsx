import Link from 'next/link';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-bg-primary px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-icons text-4xl text-success">
            check_circle
          </span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Đặt hàng thành công!
        </h1>
        <p className="text-text-secondary mb-8">
          Cảm ơn bạn đã mua hàng tại Pharmify. Đơn hàng của bạn đã được ghi nhận
          và sẽ được xử lý trong thời gian sớm nhất.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <span className="material-icons">home</span>
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
