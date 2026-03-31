import React, { useState, useEffect, useMemo } from 'react';
import productsData from './data/products.json';
import { FileText, Download, Printer, Search, X } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import CatalogDocument from './CatalogPDF';

const ITEMS_PER_PAGE = 9;

function App() {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatingPage, setGeneratingPage] = useState(null);
  const [pageScale, setPageScale] = useState(1);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const updateScale = () => {
      const padding = 80;
      const availableWidth  = window.innerWidth  - padding;
      const scale = Math.min(availableWidth / 1056, 1.5);
      setPageScale(scale > 0 ? scale : 1);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productsData;
    return productsData.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.categories?.some(c => c.toLowerCase().includes(q))
    );
  }, [query]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  /* ── PDF helpers ─────────────────────────────────────────── */

  // @react-pdf/renderer does NOT support WebP.
  // Convert each product image to a JPEG data URL via canvas before building the PDF.
  const toJpegDataUrl = (src) =>
    new Promise((resolve) => {
      if (!src) return resolve(null);
      const absUrl = src.startsWith('/') ? `${window.location.origin}${src}` : src;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width  = img.naturalWidth  || 1;
          c.height = img.naturalHeight || 1;
          c.getContext('2d').drawImage(img, 0, 0);
          resolve(c.toDataURL('image/jpeg', 0.88));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = absUrl;
    });

  const buildBlob = async (products) => {
    const converted = await Promise.all(
      products.map(async (p) => {
        const jpeg = await toJpegDataUrl(p.image);
        return { ...p, image: jpeg };
      })
    );
    return pdf(<CatalogDocument products={converted} />).toBlob();
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* Full catalog */
  const downloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const blob = await buildBlob(filteredProducts);
      triggerDownload(blob, 'MAP_Diamond_Tools_Catalog.pdf');
    } catch (err) {
      console.error(err);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /* Single page — download */
  const downloadPagePdf = async (pageIndex) => {
    try {
      setGeneratingPage(pageIndex);
      const slice = productsData.slice(pageIndex * ITEMS_PER_PAGE, (pageIndex + 1) * ITEMS_PER_PAGE);
      const blob  = await buildBlob(slice);
      triggerDownload(blob, `MAP_Diamond_Tools_Page_${pageIndex + 1}.pdf`);
    } catch (err) {
      console.error(err);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setGeneratingPage(null);
    }
  };

  /* Single page — print (open PDF in new tab) */
  const printPage = async (pageIndex) => {
    try {
      setGeneratingPage(pageIndex);
      const slice = productsData.slice(pageIndex * ITEMS_PER_PAGE, (pageIndex + 1) * ITEMS_PER_PAGE);
      const blob  = await buildBlob(slice);
      const url   = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error(err);
      alert('프린트 준비에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setGeneratingPage(null);
    }
  };


  /* ── Card renderer ──────────────────────────────────────── */
  const renderCard = (product, idx) => (
    <div key={`${product.sku}-${idx}`} className="c-item">

      {/* ① TOP — 제품명 (빨간 배경) */}
      <div className="c-item-top">
        <div className="c-name-area">
          <h3 className="c-item-name">{product.title}</h3>
        </div>
        <div className="c-top-meta">
          <span className="c-item-cat">{product.categories?.[0] || 'Tool'}</span>
        </div>
      </div>

      {/* ② MIDDLE — Features 텍스트 (좌) + 이미지 (우) */}
      <div className="c-item-body">
        <div className="c-feat-col">
          <span className="c-feat-label">Features</span>
          <p className="c-item-desc">
            {product.description?.trim() || 'No description available.'}
          </p>
        </div>
        <div className="c-img-col">
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            onError={e => {
              e.target.onerror = null;
              e.target.style.opacity = '0';
            }}
          />
        </div>
      </div>

      {/* ③ BOTTOM — REF 바 */}
      <div className="c-ref-bar">
        <div className="c-ref-group">
          <span className="c-ref-badge">SKU</span>
          <span className="c-ref-sku">{product.sku}</span>
        </div>

        {product.option && (
          <div className="c-ref-group c-opt-group">
            <span className="c-ref-badge opt">OPTION</span>
            <span className="c-ref-sku">{product.option}</span>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Page template ──────────────────────────────────────── */
  const PageHeader = ({ pageNum }) => (
    <div className="c-header">
      <div className="c-header-left">
        <span className="c-header-subtitle">Industrial Supply 2026</span>
        <span className="c-header-divider">|</span>
        <span className="c-header-info">For orders and inquiries, contact your sales representative</span>
      </div>
      <div className="c-header-right-wrap">
        <div className="c-header-right-blue" />
        <div className="c-header-right">
          <span className="c-header-title">M.A.P Diamond Tools</span>
          <div className="c-header-emblem"><span>M</span></div>
        </div>
      </div>
    </div>
  );

  const PageFooter = ({ pageNum }) => (
    <div className="c-footer">
      <span className="c-footer-num">{pageNum}</span>
      <span className="c-footer-center">M.A.P Diamond Tools &nbsp;·&nbsp; 718-689-6745</span>
      <span className="c-footer-num">{pageNum}</span>
    </div>
  );

  return (
    <div className="app-shell">

      {/* Toolbar */}
      <div className="viewer-toolbar">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Search by product, SKU, category…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <span className="search-count">
          {filteredProducts.length} / {productsData.length}
        </span>
        <button className="btn-icon primary" onClick={downloadPdf} disabled={isGeneratingPdf || filteredProducts.length === 0}>
          <FileText size={16} /><span>Full Catalog</span>
        </button>
      </div>

      {/* Viewer */}
      <main className="catalog-workspace">
        <div className="pages-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          padding: '72px 20px 40px',
          width: '100%',
          minWidth: '100%'
        }}>
          {filteredProducts.length === 0 && (
            <div className="no-results">
              <Search size={32} opacity={0.3} />
              <p>검색 결과가 없습니다.</p>
              <span>"{query}"</span>
            </div>
          )}

          {Array.from({ length: totalPages }).map((_, pi) => {
            const slice    = filteredProducts.slice(pi * ITEMS_PER_PAGE, (pi + 1) * ITEMS_PER_PAGE);
            const isBusy   = generatingPage !== null || isGeneratingPdf;
            const isThisPage = generatingPage === pi;
            return (
              <div key={pi} className="page-group" style={{ width: 1056 * pageScale, flexShrink: 0 }}>

                {/* Per-page action bar */}
                <div className="page-actions">
                  <span className="page-label">Page {pi + 1} / {totalPages}</span>
                  <button
                    className="btn-page"
                    onClick={() => downloadPagePdf(pi)}
                    disabled={isBusy}
                  >
                    <Download size={13} />
                    {isThisPage && generatingPage !== null ? '생성 중…' : 'Download'}
                  </button>
                  <button
                    className="btn-page print-btn"
                    onClick={() => printPage(pi)}
                    disabled={isBusy}
                  >
                    <Printer size={13} />
                    Print
                  </button>
                </div>

                {/* Catalog page */}
                <div
                  className="page-wrapper"
                  style={{
                    width: 1056 * pageScale,
                    height: 816 * pageScale,
                    display: 'block',
                    position: 'relative',
                  }}
                >
                  <div
                    className="c-page"
                    style={{
                      transform: `scale(${pageScale})`,
                      transformOrigin: 'top left',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  >
                    <PageHeader pageNum={pi + 1} />
                    <div className="c-grid">
                      {slice.map((p, i) => renderCard(p, i))}
                    </div>
                    <PageFooter pageNum={pi + 1} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;
