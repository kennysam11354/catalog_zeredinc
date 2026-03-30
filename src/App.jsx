import React, { useState, useMemo, useEffect } from 'react';
import productsData from './data/products.json';
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ITEMS_PER_PAGE = 9;

function App() {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pageScale, setPageScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const padding = 80;
      const availableWidth  = window.innerWidth  - padding;
      // For vertical scrolling, we only constrain by width
      const scale = Math.min(availableWidth / 1056, 1.5);
      setPageScale(scale > 0 ? scale : 1);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const totalPages = Math.ceil(productsData.length / ITEMS_PER_PAGE);

  /* ── PDF export ─────────────────────────────────────────── */

  // Converts an img element's src to a base64 data URL via a temporary canvas.
  // Works for same-origin and CORS-enabled images. Falls back silently.
  const imgToDataUrl = (img) =>
    new Promise(resolve => {
      const src = img.src;
      if (!src || src.startsWith('data:')) return resolve(src);

      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width  = image.naturalWidth  || 200;
          c.height = image.naturalHeight || 200;
          c.getContext('2d').drawImage(image, 0, 0);
          resolve(c.toDataURL('image/webp'));
        } catch {
          resolve(src); // tainted canvas — keep original
        }
      };
      image.onerror = () => resolve(src);
      image.src = src;
    });

  const downloadPdf = async (fullCatalog = false) => {
    try {
      setIsGeneratingPdf(true);
      setPageScale(1);
      await new Promise(r => setTimeout(r, 150));

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });

      if (fullCatalog) {
        const pages = document.querySelectorAll('.catalog-workspace .c-page');

        for (let i = 0; i < pages.length; i++) {
          // Pre-convert all images in this page to data URLs so html2canvas
          // can capture them without hitting CORS restrictions.
          const imgs = pages[i].querySelectorAll('img');
          const origSrcs = [];
          await Promise.all([...imgs].map(async (img, j) => {
            origSrcs[j] = img.src;
            const dataUrl = await imgToDataUrl(img);
            img.src = dataUrl;
          }));

          const canvas = await html2canvas(pages[i], {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: '#e4e4e4',
            width:  pages[i].offsetWidth,
            height: pages[i].offsetHeight,
          });

          // Restore original src values
          imgs.forEach((img, j) => { img.src = origSrcs[j]; });

          if (i > 0) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 11, 8.5, undefined, 'FAST');
        }

        pdf.save('MAP_Diamond_Tools_Catalog.pdf');
      }
    } catch (err) {
      console.error(err);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPdf(false);
      window.dispatchEvent(new Event('resize'));
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
      <div className="c-header-right">
        <span className="c-header-title">M.A.P Diamond Tools</span>
        <div className="c-header-emblem"><span>M</span></div>
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
        <button className="btn-icon primary" onClick={() => downloadPdf(true)} disabled={isGeneratingPdf}>
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
          padding: '40px 20px',
          width: '100%',
          minWidth: '100%'
        }}>
          {Array.from({ length: totalPages }).map((_, pi) => {
            const slice = productsData.slice(pi * ITEMS_PER_PAGE, (pi + 1) * ITEMS_PER_PAGE);
            return (
              <div 
                key={pi} 
                className="page-wrapper" 
                style={{ 
                  width: 1056 * pageScale, 
                  height: 816 * pageScale,
                  display: 'block',
                  position: 'relative',
                  flexShrink: 0
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
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;
