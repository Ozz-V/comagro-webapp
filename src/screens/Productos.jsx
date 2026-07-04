import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { searchProducts } from '../utils/database';
import { Search, LogOut, Filter, ChevronRight, Zap } from 'lucide-react';
import ProductDetail from '../components/ProductDetail';

const LOGO_BASE = 'https://www.chacomer.com.py/media/wysiwyg/comagro/brands2025/';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('Todas');
  const [modalProd, setModalProd] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, [busqueda, filtroMarca, filtroSubcategoria]);

  const fetchData = async () => {
    setLoading(true);
    const data = await searchProducts(filtroMarca || 'Todas', filtroSubcategoria || 'Todas', busqueda);
    setProductos(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <div className="container flex-between" style={{ height: '70px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="https://www.chacomer.com.py/media/wysiwyg/comagro/ISOLOGO_COMAGRO_COLOR.png" alt="Comagro" className="mobile-logo-only" style={{ height: '32px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '500px', margin: '0 8px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Buscar por modelo o descripción..." 
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  if (e.target.value && !filtroMarca) {
                    setFiltroSubcategoria('Todas');
                  }
                }}
                style={{ width: '100%', paddingLeft: '40px', borderRadius: 'var(--radius-xl)' }}
              />
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', padding: '8px' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content container">
        <div className="flex-between" style={{ marginTop: '32px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600' }}>
            {filtroMarca ? `Catálogo: ${filtroMarca}` : busqueda ? 'Resultados de Búsqueda' : 'Marcas'}
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            {filtroMarca && (
              <button onClick={() => { setFiltroMarca(''); setFiltroSubcategoria('Todas'); }} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent' }}>
                Ver todas las marcas
              </button>
            )}
          </div>
        </div>

        {filtroMarca && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { key: 'Todas', label: 'Todos' },
              { key: '__productos__', label: 'Productos' },
              { key: '__acc__', label: 'Accesorios / Repuestos' }
            ].map(btn => {
              const isActive = filtroSubcategoria === btn.key;
              return (
                <button
                  key={btn.key}
                  onClick={() => setFiltroSubcategoria(btn.key)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-color)' : 'var(--border-color)',
                    backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex-center" style={{ height: '40vh' }}>
            <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Cargando catálogo...</div>
          </div>
        ) : (
          <>
            {(!filtroMarca && !busqueda.trim()) ? (
              // VISTA DE MARCAS
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '16px',
                width: '100%'
              }}>
                {[...new Set(productos.map(p => p.marca).filter(Boolean))].sort().map(marca => {
                  const marcaSlug = marca.toUpperCase().replace(/\s+/g, '_');
                  const logoUrl = `${LOGO_BASE}${marcaSlug}.jpg`;
                  return (
                    <div key={marca} onClick={() => setFiltroMarca(marca)} className="product-card animate-fade-in flex-center" style={{ padding: '24px 16px', cursor: 'pointer', height: '120px' }}>
                      <img src={logoUrl} alt={marca} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  );
                })}
              </div>
            ) : (
              // VISTA DE PRODUCTOS
              <div className="grid-catalog">
                {productos.map((prod) => {
                  const marcaSlug = (prod.marca || '').toUpperCase().replace(/\s+/g, '_');
                  const logoUrl = `${LOGO_BASE}${marcaSlug}.jpg`;
                  
                  return (
                    <div key={prod.modelo} className="product-card animate-fade-in" onClick={() => setModalProd(prod)}>
                      <div className="product-image-container">
                        <img src={prod.imagen || logoUrl} alt={prod.modelo} loading="lazy" />
                      </div>
                      <div className="product-info">
                        <div className="flex-between" style={{ marginBottom: '8px', alignItems: 'flex-start' }}>
                          <span className="product-brand" style={{ marginTop: '4px' }}>{prod.marca}</span>
                          <img src={logoUrl} alt={prod.marca} style={{ height: '40px', maxWidth: '100px', objectFit: 'contain' }} />
                        </div>
                        <h3 className="product-model">{prod.modelo}</h3>
                        
                        <div className="product-specs" style={{ marginTop: '16px' }}>
                          <div className="spec-line">
                            <ChevronRight size={14} color="var(--accent-color)" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {prod.descripcion}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {modalProd && (
        <ProductDetail producto={modalProd} onClose={() => setModalProd(null)} />
      )}
    </div>
  );
}
