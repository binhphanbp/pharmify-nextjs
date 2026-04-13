import Header from '@/components/shop/Header';
import Footer from '@/components/shop/Footer';
import ChatBot from '@/components/shop/ChatBot';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatBot />
    </>
  );
}

