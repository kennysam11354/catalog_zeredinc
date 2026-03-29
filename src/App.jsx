import React, { useState, useMemo, useEffect } from 'react';
import productsData from './data/products.json';
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ITEMS_PER_PAGE = 4;

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pageScale, setPageScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const padding = 80;
      const availableWidth  = window.innerWidth  - padding;
      const availableHeight = window.innerHeight - padding;
      const scale = Math.min(availableWidth / 1056, availableHeight / 816, 1.5);
      setPageScale(scale > 0 ? scale : 1);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const totalPages    = Math.ceil(productsData.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return productsData.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage]);

  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 0));

  /* ── PDF export ─────────────────────────────────────────── */
  const downloadPdf = async (fullCatalog = false) => {
    try {
      setIsGeneratingPdf(true);
      setPageScale(1);
      await new Promise(r => setTimeout(r, 150));

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });

      if (fullCatalog) {
        const pages = document.querySelectorAll('#hidden-full-catalog .c-page');
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], {
            scale: 2, useCORS: true, logging: false,
            backgroundColor: '#e4e4e4',
            width: pages[i].offsetWidth, height: pages[i].offsetHeight,
          });
          if (i > 0) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 11, 8.5, undefined, 'FAST');
        }
        pdf.save('Zered_Full_Catalog.pdf');
      } else {
        const el = document.querySelector('.visible-page');
        if (!el) throw new Error('No page found');
        const canvas = await html2canvas(el, {
          scale: 2, useCORS: true, logging: false,
          backgroundColor: '#e4e4e4',
          width: el.offsetWidth, height: el.offsetHeight,
        });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 11, 8.5, undefined, 'FAST');
        pdf.save(`Zered_Catalog_Page_${currentPage + 1}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPdf(false);
      window.dispatchEvent(new Event('resize'));
    }
  };

  /* ── 이미지 로딩: 로컬(SKU명) → CDN URL 순서로 폴백 ──────── */
  const handleImgError = (e, sku, cdnUrl) => {
    const src = e.target.getAttribute('src') || '';
    if (src.endsWith(`${sku}.png`)) {
      e.target.src = `/products/${sku}.jpg`;
    } else if (src.endsWith(`${sku}.jpg`)) {
      e.target.src = `/products/${sku}.jpeg`;
    } else if (src.endsWith(`${sku}.jpeg`)) {
      e.target.src = `/products/${sku}.webp`;
    } else if (src.endsWith(`${sku}.webp`)) {
      // 로컬 파일 없음 → CDN URL 사용
      if (cdnUrl) {
        e.target.src = cdnUrl;
      } else {
        e.target.onerror = null;
        e.target.style.opacity = '0';
      }
    } else {
      // CDN도 실패 → 이미지 숨김
      e.target.onerror = null;
      e.target.style.opacity = '0';
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
          <div className="c-qr-mark">
            <svg viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="7" height="7" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="2.5" y="2.5" width="4" height="4" fill="currentColor"/>
              <rect x="12" y="1" width="7" height="7" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="13.5" y="2.5" width="4" height="4" fill="currentColor"/>
              <rect x="1" y="12" width="7" height="7" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="2.5" y="13.5" width="4" height="4" fill="currentColor"/>
              <rect x="12" y="12" width="3" height="3" fill="currentColor"/>
              <rect x="17" y="12" width="3" height="3" fill="currentColor"/>
              <rect x="12" y="17" width="3" height="3" fill="currentColor"/>
              <rect x="17" y="17" width="3" height="3" fill="currentColor"/>
            </svg>
          </div>
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
          {/* 우선순위: /products/{SKU}.png → .jpg → .jpeg → .webp → CDN URL */}
          <img
            src={`/products/${product.sku}.png`}
            alt={product.title}
            loading="lazy"
            onError={e => handleImgError(e, product.sku, product.image)}
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
      <div className="c-header-right">
        <span className="c-header-title">ZERED TOOLS &amp; EQUIPMENT</span>
        <div className="c-header-emblem"><span>Z</span></div>
      </div>
    </div>
  );

  const PageFooter = ({ pageNum }) => (
    <div className="c-footer">
      <span className="c-footer-num">{pageNum}</span>
      <span className="c-footer-center">zeredinc.com &nbsp;·&nbsp; 1-800-ZERED-INC</span>
      <span className="c-footer-num">{pageNum}</span>
    </div>
  );

  return (
    <div className="app-shell">

      {/* Toolbar */}
      <div className="viewer-toolbar">
        <button className="btn-icon" onClick={() => downloadPdf(false)} disabled={isGeneratingPdf}>
          <Download size={16} /><span>Page PDF</span>
        </button>
        <button className="btn-icon primary" onClick={() => downloadPdf(true)} disabled={isGeneratingPdf}>
          <FileText size={16} /><span>Full Catalog</span>
        </button>
      </div>

      {/* Viewer */}
      <main className="catalog-workspace">
        {currentPage > 0 && (
          <button className="viewer-nav left" onClick={prevPage}><ChevronLeft size={26} /></button>
        )}
        {currentPage < totalPages - 1 && (
          <button className="viewer-nav right" onClick={nextPage}><ChevronRight size={26} /></button>
        )}

        <div className="page-wrapper">
          <div className="c-page visible-page" style={{ transform: `scale(${pageScale})` }}>
            <PageHeader pageNum={currentPage + 1} />
            <div className="c-grid">
              {currentProducts.map((p, i) => renderCard(p, i))}
            </div>
            <PageFooter pageNum={currentPage + 1} />
          </div>
        </div>
      </main>

      {/* Hidden pages for full-catalog PDF */}
      <div id="hidden-full-catalog" className="hidden-catalog">
        {Array.from({ length: totalPages }).map((_, pi) => {
          const slice = productsData.slice(pi * ITEMS_PER_PAGE, (pi + 1) * ITEMS_PER_PAGE);
          return (
            <div key={pi} className="c-page">
              <PageHeader pageNum={pi + 1} />
              <div className="c-grid">{slice.map((p, i) => renderCard(p, i))}</div>
              <PageFooter pageNum={pi + 1} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
