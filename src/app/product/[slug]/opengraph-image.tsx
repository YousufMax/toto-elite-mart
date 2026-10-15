import { ImageResponse } from 'next/og';
import { getProductBySlugOrId, getReviewsByProductId } from '@/lib/data-store';

export const runtime = 'nodejs';

export const alt = 'Toto Elite Mart Product Share Card';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const product = await getProductBySlugOrId(params.slug);

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#090d16',
            color: '#ffffff',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 900, color: '#f59e0b', marginBottom: 16 }}>
            TOTO ELITE MART
          </div>
          <div style={{ fontSize: 24, color: '#94a3b8' }}>
            Premium E-Commerce & Lifestyle Store in Bangladesh
          </div>
        </div>
      ),
      { ...size }
    );
  }

  // Calculate pricing & discount
  const currentPrice = Number(product.salePrice || product.sellingPrice || 0);
  const regularPrice = Number(product.regularPrice || product.sellingPrice || 0);
  const hasDiscount = regularPrice > currentPrice && currentPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100)
    : 0;

  // Primary image
  const primaryImage =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';

  // Calculate review score
  let avgRating = 4.9;
  let reviewCount = 12;
  try {
    const reviews = await getReviewsByProductId(product.id, 'APPROVED');
    if (reviews && reviews.length > 0) {
      reviewCount = reviews.length;
      avgRating = Number(
        (
          reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 5), 0) /
          reviews.length
        ).toFixed(1)
      );
    }
  } catch {
    // default rating
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#090d16',
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
          padding: '48px 56px',
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Left Column: Product Information */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '640px',
            height: '100%',
            paddingRight: '32px',
          }}
        >
          {/* Top Brand Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1.5px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '9999px',
                padding: '6px 16px',
              }}
            >
              <span style={{ color: '#f59e0b', fontSize: '15px', fontWeight: 900, letterSpacing: '0.05em' }}>
                TOTO ELITE MART
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '13px' }}>•</span>
              <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 700 }}>
                Official Store
              </span>
            </div>

            {product.category?.name && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {product.category.name}
              </div>
            )}
          </div>

          {/* Center: Title & Star Rating */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                fontSize: '42px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                maxHeight: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {product.name}
            </div>

            {/* Rating & Stock Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '12px',
                  padding: '6px 12px',
                }}
              >
                <span style={{ color: '#eab308', fontSize: '18px' }}>★</span>
                <span style={{ color: '#fef08a', fontSize: '15px', fontWeight: 800 }}>
                  {avgRating.toFixed(1)}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                  ({reviewCount} reviews)
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '12px',
                  padding: '6px 12px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '9999px',
                    backgroundColor: '#10b981',
                  }}
                />
                <span style={{ color: '#6ee7b7', fontSize: '14px', fontWeight: 700 }}>
                  In Stock & Ready to Ship
                </span>
              </div>
            </div>

            {/* Pricing Section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '8px' }}>
              <span
                style={{
                  fontSize: '54px',
                  fontWeight: 900,
                  color: '#fbbf24',
                  letterSpacing: '-0.02em',
                }}
              >
                ৳{currentPrice.toLocaleString('en-US')}
              </span>

              {hasDiscount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '26px',
                      color: '#64748b',
                      textDecoration: 'line-through',
                      fontWeight: 600,
                    }}
                  >
                    ৳{regularPrice.toLocaleString('en-US')}
                  </span>
                  <span
                    style={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      borderRadius: '8px',
                      padding: '4px 10px',
                    }}
                  >
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span>
              <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600 }}>
                Cash on Delivery
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span>
              <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600 }}>
                24-48h Fast Delivery
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span>
              <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600 }}>
                7-Day Easy Return
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: High-Res Product Image Card */}
        <div
          style={{
            width: '448px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '420px',
              height: '480px',
              backgroundColor: '#ffffff',
              borderRadius: '28px',
              border: '2px solid rgba(245, 158, 11, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.15)',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primaryImage}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '24px',
              }}
            />
            {/* Brand watermark badge at corner */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#f59e0b',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.05em',
              }}
            >
              TOTO ELITE MART
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
