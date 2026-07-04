import { useState, useEffect } from 'react';
import { findSimilarProducts } from '../utils/productLogic';
import { X, Cpu, Tag } from 'lucide-react';
import { generateAndPrintFicha } from '../utils/pdfService';

const LOGO_BASE = 'https://www.chacomer.com.py/media/wysiwyg/comagro/brands2025/';

export default function ProductDetail({ producto, onClose }) {
  const [similares, setSimilares] = useState([]);

  useEffect(() => {
    if (producto) {
      findSimilarProducts(producto).then(res => setSimilares(res.similares));
    }
  }, [producto]);

  if (!producto) return null;
  const marcaSlug = (producto.marca || '').toUpperCase().replace(/\s+/g, '_');
  const logoUrl = `${LOGO_BASE}${marcaSlug}.jpg`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '800px', maxHeight: '90vh',
        overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column',
        background: '#FFFFFF'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', padding: '8px'
        }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', padding: '32px' }}>
          <div style={{ flex: '1 1 300px', background: '#FFF', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={producto.imagen || logoUrl} alt={producto.modelo} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
          </div>

          <div style={{ flex: '2 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img src={logoUrl} alt={producto.marca} style={{ height: '48px', objectFit: 'contain' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{producto.subcategoria}</span>
            </div>
            
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>{producto.modelo}</h2>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button 
                onClick={() => generateAndPrintFicha(producto, logoUrl)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  padding: '8px 16px', background: 'var(--accent-color)', 
                  color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600' 
                }}>
                <Tag size={16} /> Ficha Técnica PDF
              </button>
            </div>
            {producto.descripcion && <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '24px' }}>{producto.descripcion}</p>}

            {/* AI SALES PITCH REMOVED */}

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} /> Especificaciones
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {producto.specs && Object.entries(producto.specs).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{key}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
