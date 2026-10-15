import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/storefront/CartContext';
import CartDrawer from '@/components/storefront/CartDrawer';

export const metadata: Metadata = {
  metadataBase: new URL('https://totoelitemart.com'),
  title: 'Toto Elite Mart — Premium E-Commerce & Lifestyle Store in Bangladesh',
  description: 'Shop authentic gadgets, fashion, organic foods, and home essentials with Cash on Delivery nationwide.',
  keywords: 'e-commerce bangladesh, online shopping bd, smart gadgets, toto elite mart, cash on delivery dhaka, online shop bangladesh',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: 'https://cdn.jsdelivr.net/gh/YousufMax/image-server-001@main/toto%20elite%20mart%20logo%20final%20(1).png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Toto Elite Mart — Premium E-Commerce & Lifestyle Store in Bangladesh',
    description: 'Shop authentic gadgets, fashion, organic foods, and home essentials with Cash on Delivery nationwide.',
    url: 'https://totoelitemart.com',
    siteName: 'Toto Elite Mart',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://cdn.jsdelivr.net/gh/YousufMax/image-server-001@main/toto%20elite%20mart%20logo%20final%20(1).png',
        width: 1200,
        height: 630,
        alt: 'Toto Elite Mart Bangladesh',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toto Elite Mart — Premium E-Commerce & Lifestyle Store',
    description: '100% Genuine products with Cash on Delivery across Bangladesh.',
    images: ['https://cdn.jsdelivr.net/gh/YousufMax/image-server-001@main/toto%20elite%20mart%20logo%20final%20(1).png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationAndWebSiteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://totoelitemart.com/#organization',
      name: 'Toto Elite Mart',
      url: 'https://totoelitemart.com',
      logo: 'https://cdn.jsdelivr.net/gh/YousufMax/image-server-001@main/toto%20elite%20mart%20logo%20final%20(1).png',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+8809697192016',
          contactType: 'customer service',
          areaServed: 'BD',
          availableLanguage: ['Bengali', 'English'],
        },
      ],
      sameAs: [
        'https://www.facebook.com/totoelitemart/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://totoelitemart.com/#website',
      url: 'https://totoelitemart.com',
      name: 'Toto Elite Mart',
      description: 'Premium E-Commerce & Lifestyle Store in Bangladesh',
      publisher: {
        '@id': 'https://totoelitemart.com/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://totoelitemart.com/shop?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Google Knowledge Graph & Sitelinks Searchbox */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationAndWebSiteSchema) }}
        />
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
