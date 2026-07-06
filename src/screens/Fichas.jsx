import { useState, useEffect } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_KEY } from '../supabase';
import { FileText, Loader2, BookOpen, Search } from 'lucide-react';

const CATEGORIAS = ['BOMBAS DE AGUA', 'SOLDADORES', 'GENERADORES', 'MOTORES ELECTRICOS', 'COMPRESORES'];

export default function Fichas() {
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [catActual, setCatActual] = useState('TODAS');
  const [abriendo, setAbriendo] = useState(null);

  useEffect(() => {
    fetchFichas();
  }, []);

  const fetchFichas = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      let allPdfs = [];
      
      for (const cat of CATEGORIAS) {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/Fichas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_KEY,
          },
          body: JSON.stringify({
            prefix: cat + '/',
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          })
        });
        
        if (!res.ok) {
          console.error(`Error loading category ${cat}`);
          continue;
        }
        
        const data = await res.json();
        const categoryPdfs = (data || [])
          .filter(f => f.name && f.name.toLowerCase().endsWith('.pdf'))
          .map(f => {
            const path = `${cat}/${f.name}`;
            return {
              name: f.name,
              category: cat,
              path: path,
              displayName: f.name.replace('.pdf', '').replace(/_/g, ' ')
            };
          });
          
        allPdfs = [...allPdfs, ...categoryPdfs];
      }
        
      setFichas(allPdfs);
    } catch (e) {
      console.error('Error cargando fichas:', e);
    }
    setLoading(false);
  };

  const fichasFiltradas = fichas.filter(f => 
    (catActual === 'TODAS' || f.category === catActual) && 
    f.displayName.toLowerCase().includes(busqueda.toLowerCase())
  );
  
  const categoriasPresentes = catActual === 'TODAS' 
    ? [...new Set(fichasFiltradas.map(f => f.category))] 
    : [catActual];

  const handleOpenPdf = async (ficha) => {
    setAbriendo(ficha.path);
    try {
      const { data, error } = await supabase.storage.from('Fichas').createSignedUrl(ficha.path, 3600);
      if (error) throw error;
      if (data && data.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (e) {
      console.error('Error opening PDF', e);
      alert('Error al abrir el PDF. Por favor, intente de nuevo.');
    }
    setAbriendo(null);
  };

  return (
    <div className="app-container">
      <main className="main-content container" style={{ paddingTop: '40px' }}>
        <div className="flex-between" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Fichas Técnicas PDF</h1>
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Buscar ficha..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px', borderRadius: 'var(--radius-xl)' }}
            />
          </div>
        </div>
        
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
          <button 
            onClick={() => setCatActual('TODAS')}
            style={{ 
              background: catActual === 'TODAS' ? 'var(--accent-color)' : 'transparent',
              color: catActual === 'TODAS' ? '#fff' : 'var(--text-secondary)',
              borderColor: catActual === 'TODAS' ? 'var(--accent-color)' : 'var(--border-color)',
              borderRadius: '20px', padding: '6px 16px', whiteSpace: 'nowrap'
            }}
          >
            TODAS
          </button>
          {CATEGORIAS.map(cat => (
            <button 
              key={cat}
              onClick={() => setCatActual(cat)}
              style={{ 
                background: catActual === cat ? 'var(--accent-color)' : 'transparent',
                color: catActual === cat ? '#fff' : 'var(--text-secondary)',
                borderColor: catActual === cat ? 'var(--accent-color)' : 'var(--border-color)',
                borderRadius: '20px', padding: '6px 16px', whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex-center" style={{ height: '300px' }}>
            <Loader2 className="animate-spin" size={32} color="var(--accent-color)" />
          </div>
        ) : fichasFiltradas.length === 0 ? (
          <div className="flex-center" style={{ height: '200px', color: 'var(--text-tertiary)' }}>
            No se encontraron fichas.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {categoriasPresentes.map(cat => {
              const fichasCat = fichasFiltradas.filter(f => f.category === cat);
              return (
                <div key={cat}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    {cat}
                  </h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '16px',
                    width: '100%'
                  }}>
                    {fichasCat.map(ficha => (
                      <div 
                        key={ficha.path}
                        onClick={() => handleOpenPdf(ficha)}
                        className="product-card animate-fade-in"
                        style={{ 
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', 
                          alignItems: 'center', padding: '16px 8px', gap: '12px', textAlign: 'center',
                          opacity: abriendo === ficha.path ? 0.5 : 1
                        }}
                      >
                        <div style={{ background: 'rgba(59,130,246,0.1)', padding: '16px', borderRadius: '50%', position: 'relative' }}>
                          {abriendo === ficha.path ? (
                            <Loader2 size={32} color="var(--accent-color)" className="animate-spin" />
                          ) : (
                            <BookOpen size={32} color="var(--accent-color)" />
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '12px' }}>
                            {ficha.displayName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
