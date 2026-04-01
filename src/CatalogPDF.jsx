import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const RED      = '#f83939';
const INK_SOFT = '#444444';
const BLUE     = '#1a4fb5';
const ITEMS_PER_PAGE = 4;

const s = StyleSheet.create({
  page: {
    backgroundColor: '#e2e2e2',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'column',
  },

  /* ── Header ─────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  hLeft: { flexDirection: 'row', alignItems: 'center' },
  hSubtitle: {
    fontSize: 6.5, fontFamily: 'Helvetica-Bold',
    color: '#555', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  hDiv: { fontSize: 6.5, color: '#aaa', marginHorizontal: 5 },
  hInfo: { fontSize: 5.5, color: '#888' },
  hRight: { flexDirection: 'row', alignItems: 'center' },
  hTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold',
    color: RED, textTransform: 'uppercase', letterSpacing: 1,
    marginRight: 6,
  },
  hEmblem: {
    width: 17, height: 17, backgroundColor: RED,
    borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },
  hEmblemTxt: { color: 'white', fontSize: 9, fontFamily: 'Helvetica-Bold' },

  /* ── Grid ────────────────────────────────────────────── */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },

  /* ── Card ────────────────────────────────────────────── */
  card: {
    width: '49%',
    height: 240,
    backgroundColor: 'white',
    flexDirection: 'column',
    borderRadius: 2,
    overflow: 'hidden',
  },
  cardTop: {
    backgroundColor: RED,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 4,
    minHeight: 24,
  },
  cardName: {
    fontSize: 9, fontFamily: 'Helvetica-Bold',
    color: 'white', textTransform: 'uppercase',
    flex: 1, letterSpacing: 0.3,
  },
  cardCat: {
    fontSize: 7, color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 5, paddingVertical: 3,
    borderRadius: 2, textTransform: 'uppercase',
    letterSpacing: 0.3, marginLeft: 5,
  },
  cardBody: {
    flexDirection: 'row',
    flex: 1,
    padding: 7,
    gap: 6,
  },
  featCol: { flex: 1, flexDirection: 'column' },
  featLabel: {
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.5,
    color: '#999', marginBottom: 3,
  },
  featDesc: { fontSize: 8, color: INK_SOFT, lineHeight: 1.45 },
  imgCol: {
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImg: { width: 110, height: 110, objectFit: 'contain' },

  /* ── REF bar ─────────────────────────────────────────── */
  refBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f4f4f4',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  refGroup: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  badge: {
    fontSize: 6, fontFamily: 'Helvetica-Bold',
    backgroundColor: RED, color: 'white',
    paddingHorizontal: 4, paddingVertical: 2,
    borderRadius: 1.5, textTransform: 'uppercase', letterSpacing: 0.3,
  },
  badgeOpt: {
    fontSize: 6, fontFamily: 'Helvetica-Bold',
    backgroundColor: '#555', color: 'white',
    paddingHorizontal: 4, paddingVertical: 2,
    borderRadius: 1.5, textTransform: 'uppercase', letterSpacing: 0.3,
  },
  skuTxt: { fontSize: 7, color: '#1c1c1c', fontFamily: 'Helvetica' },

  /* ── Footer ──────────────────────────────────────────── */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
  },
  footerNum:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#888' },
  footerCenter: { fontSize: 6, color: '#888' },
});

const CatalogDocument = ({ products }) => {
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const imgSrc = (image) => {
    if (!image) return null;
    if (image.startsWith('data:')) return image;   // pre-converted JPEG data URL
    if (image.startsWith('http')) return image;
    return `${origin}${image}`;
  };
  
  const formatSkuPDF = (sku) => {
    if (!sku) return null;
    const parts = sku.split('#');
    if (parts.length > 1) {
      return (
        <Text>
          {parts[0]}
          <Text style={{ color: BLUE }}>#{parts.slice(1).join('#')}</Text>
        </Text>
      );
    }
    return sku;
  };

  return (
    <Document title="MAP Diamond Tools Catalog 2026" author="M.A.P Diamond Tools">
      {Array.from({ length: totalPages }).map((_, pi) => {
        const slice = products.slice(pi * ITEMS_PER_PAGE, (pi + 1) * ITEMS_PER_PAGE);
        const pageNum = pi + 1;

        return (
          <Page key={pi} size="LETTER" orientation="landscape" style={s.page}>

            {/* Header */}
            <View style={s.header}>
              <View style={s.hLeft}>
                <Text style={s.hSubtitle}>Industrial Supply 2026</Text>
                <Text style={s.hDiv}>|</Text>
                <Text style={s.hInfo}>For orders and inquiries, contact your sales representative</Text>
              </View>
              <View style={s.hRight}>
                <Text style={s.hTitle}>M.A.P Diamond Tools</Text>
                <View style={s.hEmblem}>
                  <Text style={s.hEmblemTxt}>M</Text>
                </View>
              </View>
            </View>

            {/* Product grid */}
            <View style={s.grid}>
              {slice.map((product, i) => {
                const src = imgSrc(product.image);
                return (
                  <View key={i} style={s.card}>

                    {/* Title bar */}
                    <View style={s.cardTop}>
                      <Text style={s.cardName}>{product.title}</Text>
                      <Text style={s.cardCat}>{product.categories?.[0] || 'Tool'}</Text>
                    </View>

                    {/* Body: description + image */}
                    <View style={s.cardBody}>
                      <View style={s.featCol}>
                        <Text style={s.featLabel}>Features</Text>
                        <Text style={s.featDesc}>
                          {product.description?.trim() || 'No description available.'}
                        </Text>
                      </View>
                      {src && (
                        <View style={s.imgCol}>
                          <Image src={src} style={s.productImg} />
                        </View>
                      )}
                    </View>

                    {/* SKU / Option bar */}
                    <View style={s.refBar}>
                      <View style={s.refGroup}>
                        <Text style={s.badge}>SKU</Text>
                        <Text style={s.skuTxt}>{formatSkuPDF(product.sku)}</Text>
                      </View>
                      {product.option && (
                        <View style={s.refGroup}>
                          <Text style={s.badgeOpt}>OPTION</Text>
                          <Text style={s.skuTxt}>{formatSkuPDF(product.option)}</Text>
                        </View>
                      )}
                    </View>

                  </View>
                );
              })}
            </View>

            {/* Footer */}
            <View style={s.footer}>
              <Text style={s.footerNum}>{pageNum}</Text>
              <Text style={s.footerCenter}>M.A.P Diamond Tools · 718-689-6745</Text>
              <Text style={s.footerNum}>{pageNum}</Text>
            </View>

          </Page>
        );
      })}
    </Document>
  );
};

export default CatalogDocument;
