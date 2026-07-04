import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { FileText, Loader2 } from 'lucide-react';

export default function Catalogos() {
  const [catalogos, setCatalogos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalogos();
  }, []);

  const fetchCatalogos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('catalogos').list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
      
      if (error) throw error;
      
        const pdfFiles = (data || [])
          .filter(f => f.name && f.name.toLowerCase().endsWith('.pdf'))
          .map(f => {
            const { data: { publicUrl } } = supabase.storage.from('catalogos').getPublicUrl(f.name);
            const baseName = f.name.replace('.pdf', '');
            let brand = '';
            let title = baseName;
            if (baseName.includes('-')) {
              const parts = baseName.split('-');
              brand = parts[0].trim();
              title = parts.slice(1).join('-').trim().replace(/_/g, ' ');
            } else {
              title = title.replace(/_/g, ' ');
            }
            return {
              name: f.name,
              brand: brand.toUpperCase().replace(/\s+/g, '_'),
              displayName: title,
              url: publicUrl
            };
          });
        
      setCatalogos(pdfFiles);
    } catch (e) {
      console.error('Error cargando catálogos:', e);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <main className="main-content container" style={{ paddingTop: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px' }}>Catálogos PDF Generales</h1>
        
        {loading ? (
          <div className="flex-center" style={{ height: '300px' }}>
            <Loader2 className="animate-spin" size={32} color="var(--accent-color)" />
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '24px',
            width: '100%'
          }}>
            {catalogos.map(cat => (
              <a 
                key={cat.name} 
                href={cat.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="product-card animate-fade-in"
                style={{ 
                  textDecoration: 'none', display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', padding: '32px 16px', gap: '16px', textAlign: 'center'
                }}
              >
                {cat.brand ? (
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center' }}>
                    <img src={`https://www.chacomer.com.py/media/wysiwyg/comagro/brands2025/${cat.brand}.jpg`} alt={cat.brand} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ background: 'rgba(28,159,75,0.1)', padding: '24px', borderRadius: '50%' }}>
                    <FileText size={48} color="var(--accent-color)" />
                  </div>
                )}
                <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>
                  {cat.displayName}
                </span>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
