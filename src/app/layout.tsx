import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/storefront/CartContext';
import CartDrawer from '@/components/storefront/CartDrawer';

export const metadata: Metadata = {
  title: 'Toto Elite Mart — Premium E-Commerce & Lifestyle Store in Bangladesh',
  description: 'Shop authentic gadgets, fashion, organic foods, and home essentials with Cash on Delivery nationwide.',
  keywords: 'e-commerce bangladesh, online shopping bd, smart gadgets, toto elite mart, cash on delivery dhaka',
  icons: {
    icon: 'https://cdn.jsdelivr.net/gh/YousufMax/image-server-001@main/toto%20elite%20mart%20logo%20final%20(1).png',
    apple: 'https://cdn.jsdelivr.net/gh/YousufMax/image-server-001@main/toto%20elite%20mart%20logo%20final%20(1).png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function filterExtensionError(e) {
                  var src = (e && (e.filename || (e.error && e.error.stack) || (e.reason && e.reason.stack) || '')) + '';
                  if (src.indexOf('chrome-extension://') !== -1 || src.indexOf('moz-extension://') !== -1) {
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    if (e.preventDefault) e.preventDefault();
                    return true;
                  }
                  return false;
                }
                if (typeof window !== 'undefined') {
                  window.addEventListener('error', filterExtensionError, true);
                  window.addEventListener('unhandledrejection', filterExtensionError, true);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col font-sans">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
