import { supabase, EDGE_URL } from '../supabase';

const CACHE_KEY = 'comagro_webapp_catalog';
const CACHE_TIME_KEY = 'comagro_webapp_catalog_time';
const HORAS_VIGENCIA = 24;

const parseRawProducts = (rawData) => {
  const COLS_EXCLUIDAS = new Set(['SKU','imagen 1','imagen 2','imagen 3','imagen 4','imagen 5','Brand','Marca','id','ID','Tipo de Producto','Categoria Magento','url_key','visibility','status','price','Precio']);
  
  let jsonArray = [];
  try {
    jsonArray = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  } catch(e) { return []; }

  return jsonArray.map(row => {
    const marca = (row['Brand'] || row['Marca'] || row['marca'] || row['MARCA'] || '').toString().trim();
    const subcategoria = (row['Tipo de Producto'] || row['Categoria Magento'] || 'General').toString().trim().toUpperCase();
    const imagen = row['imagen 1'] || row['imagen'] || null;
    const specs = {};
    for (const [col, val] of Object.entries(row)) {
      if (!COLS_EXCLUIDAS.has(col) && !col.startsWith('_')) {
        if (val !== null && val !== undefined && val !== '') {
          const s = String(val).trim().toLowerCase();
          if (s.length > 0 && !/^0([.,]0+)?$/.test(s)) {
            const basura = ['n/a','na','n.a','n.a.','no aplica','sin dato','sin datos','no','no tiene','no disponible','pim','-','--','---','st','sin información'];
            if (!basura.includes(s)) {
              specs[col] = String(val).trim();
            }
          }
        }
      }
    }
    return { 
      modelo: (row['SKU'] || '').toString().trim(), 
      marca, 
      subcategoria, 
      imagen, 
      specs,
      descripcion: row['descripcion'] || row['name'] || ''
    };
  });
};

export const syncCatalog = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Need to be logged in
    
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}` 
    };
    
    const res = await fetch(EDGE_URL, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const parsed = parseRawProducts(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      }
    }
  } catch (error) {
    console.error('Error syncing catalog:', error);
  }
};

const isAccessory = (p) => {
  const txt = `${p.modelo} ${p.marca} ${p.subcategoria} ${p.descripcion}`.toLowerCase();
  return txt.includes('accesorio') || txt.includes('repuesto') || txt.includes('pieza') || txt.includes('kit');
};

export const searchProducts = async (marca = 'Todas', subcategoria = 'Todas', busqueda = '') => {
  try {
    const fechaCache = localStorage.getItem(CACHE_TIME_KEY);
    const cacheVigente = fechaCache && (Date.now() - parseInt(fechaCache)) < HORAS_VIGENCIA * 3600000;
    
    let cachedData = localStorage.getItem(CACHE_KEY);
    
    if (!cachedData || !cacheVigente) {
      if (!cachedData) {
        await syncCatalog();
        cachedData = localStorage.getItem(CACHE_KEY);
      } else {
        syncCatalog();
      }
    }
    
    if (!cachedData) return [];
    
    let products = JSON.parse(cachedData);
    
    if (marca && marca !== 'Todas') {
      products = products.filter(p => p.marca === marca);
    }
    
    if (subcategoria && subcategoria !== 'Todas') {
      if (subcategoria === '__acc__') {
        products = products.filter(p => isAccessory(p));
      } else if (subcategoria === '__productos__') {
        products = products.filter(p => !isAccessory(p));
      } else {
        products = products.filter(p => p.subcategoria === subcategoria);
      }
    }
    
    if (busqueda && busqueda.trim() !== '') {
      const q = busqueda.toLowerCase();
      products = products.filter(p => 
        (p.modelo || '').toLowerCase().includes(q) || 
        (p.descripcion || '').toLowerCase().includes(q)
      );
    }
    
    products.sort((a, b) => {
      const aAcc = isAccessory(a) ? 1 : 0;
      const bAcc = isAccessory(b) ? 1 : 0;
      if (aAcc !== bAcc) return aAcc - bAcc; // Productos (0) primero, Accesorios (1) después
      if (a.subcategoria !== b.subcategoria) return (a.subcategoria || '').localeCompare(b.subcategoria || '');
      return (a.modelo || '').localeCompare(b.modelo || '');
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getProductsBySubcategory = async (subcategoria, exact = false) => {
  try {
    let cachedData = localStorage.getItem(CACHE_KEY);
    if (!cachedData) {
      await syncCatalog();
      cachedData = localStorage.getItem(CACHE_KEY);
    }
    
    if (!cachedData) return [];
    
    let products = JSON.parse(cachedData);
    
    return products.filter(p => {
      const sub = String(p.subcategoria).toUpperCase();
      const target = String(subcategoria).toUpperCase();
      return exact ? sub === target : sub.includes(target);
    });
  } catch (e) {
    console.error('Error fetching subcategory products:', e);
    return [];
  }
};
