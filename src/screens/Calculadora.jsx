import { useState, useEffect } from 'react';
import { getProductsBySubcategory } from '../utils/database';
import { Calculator as CalcIcon, Zap, Droplets, Settings, ChevronRight, X } from 'lucide-react';
import ProductDetail from '../components/ProductDetail';

export default function Calculadora() {
  const [calcMode, setCalcMode] = useState('');
  const [calcInput, setCalcInput] = useState('');
  const [pumpWizard, setPumpWizard] = useState({ type: '' });
  const [calcResult, setCalcResult] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (!calcMode) {
      setCalcResult(null);
      setCalcInput('');
      setPumpWizard({ type: '' });
    }
  }, [calcMode]);

  function extractNum(val) {
    if (!val || typeof val !== 'string') return null;
    const m = val.match(/([\d]+[\.,]?[\d]*)/);
    if (!m) return null;
    return parseFloat(m[1].replace(',', '.'));
  }

  async function handleCalculate() {
    if (calcMode === 'bomba' && !pumpWizard.type) {
      alert("Por favor seleccioná el tipo de bomba.");
      return;
    }
    
    let filtered = [];
    try {
      if (calcMode === 'gen') {
        const target = parseFloat(calcInput) || 0;
        const dbProducts = await getProductsBySubcategory('GENERADOR');
        filtered = dbProducts.map(p => {
          let val = 0;
          if (p.specs) {
            Object.entries(p.specs).forEach(([k, v]) => {
              const key = k.toUpperCase();
              if (key.includes('POTENCIA') || key.includes('KVA')) {
                const n = extractNum(v);
                if (n) val = n;
              }
            });
          }
          return { ...p, calcVal: val };
        }).sort((a,b) => Math.abs(a.calcVal - target) - Math.abs(b.calcVal - target)).slice(0, 5);
      } else if (calcMode === 'motor') {
        const target = parseFloat(calcInput) || 0;
        const dbProducts = await getProductsBySubcategory('MOTOR');
        filtered = dbProducts.filter(p => {
          const sub = String(p.subcategoria).toUpperCase();
          return sub.includes('ELEC') || sub.includes('ELÉC');
        }).map(p => {
          let val = 0;
          if (p.specs) {
            Object.entries(p.specs).forEach(([k, v]) => {
              const key = k.toUpperCase();
              if (key.includes('HP') || key.includes('POTENCIA')) {
                const n = extractNum(v);
                if (n) val = n;
              }
            });
          }
          return { ...p, calcVal: val };
        }).sort((a,b) => Math.abs(a.calcVal - target) - Math.abs(b.calcVal - target)).slice(0, 5);
      } else if (calcMode === 'bomba') {
        const target = parseFloat(calcInput) || 0;
        const dbProducts = await getProductsBySubcategory('BOMBA');
        filtered = dbProducts.map(p => {
           let hpVal = 0;
            if (p.specs) {
              Object.entries(p.specs).forEach(([k, v]) => {
                const key = k.toUpperCase();
                const valStr = String(v).toUpperCase();
                if (key.includes('HP') || key.includes('POTENCIA') || valStr.includes('HP') || valStr.includes('CV')) {
                   let n = extractNum(valStr);
                   if (n) {
                      if (valStr.includes('KW')) n = n * 1.34;
                      if (valStr.includes(' W') || valStr.match(/\d+W/)) n = n * 0.00134;
                      if (n > hpVal) hpVal = n;
                   }
                }
              });
            }
           return { ...p, calcVal: hpVal };
         }).filter(p => {
            if (p.calcVal <= 0) return false;
            const sub = String(p.subcategoria).toUpperCase();
            const name = String(p.modelo + ' ' + (p.descripcion || '')).toUpperCase();
            const fullText = `${sub} ${name} ${JSON.stringify(p.specs || {})}`.toUpperCase();
            
            // Filtro GLOBAL: Descartar repuestos para TODAS las calculadoras
            if (sub.includes('REPUESTO') || sub.includes('ACCESORIO') || sub.includes('COMPONENTE')) {
              return false;
            }

            if (fullText.includes('SOLAR') || fullText.includes('96V')) return false;

            if (pumpWizard.type === 'hogar' && !sub.includes('AGUA') && !sub.includes('CENTRÍFUGA') && !sub.includes('PRESURIZA') && !sub.includes('PERIFÉRICA')) return false;
            if (pumpWizard.type === 'pozo' && !sub.includes('SUMERGIBLE') && !sub.includes('PROFUNDO')) return false;
            if (pumpWizard.type === 'drenaje' && !sub.includes('ACHIQUE') && !sub.includes('DRENAJE') && !sub.includes('SUCIA')) return false;
            if (pumpWizard.type === 'piscina' && !sub.includes('PISCINA') && !sub.includes('PILETA')) return false;
            if (pumpWizard.type === 'combustion') {
              let isCombustion = false;
              
              // 1. Revisar si la ficha técnica dice explícitamente el tipo de combustible
              if (p.specs) {
                for (const key in p.specs) {
                  const val = String(p.specs[key]).toUpperCase();
                  if (val.includes('NAFTA') || val.includes('GASOLINA') || val.includes('DIESEL') || val.includes('DIÉSEL')) {
                    isCombustion = true;
                  }
                }
              }
              
              // 2. Revisar si el nombre del producto lo dice claramente
              if (name.includes('NAFTERA') || name.includes('NAFTA') || name.includes('DIESEL') || name.includes('DIÉSEL') || name.includes('GASOLINA')) {
                isCombustion = true;
              }

              // Si no dice el combustible por ninguna parte, la descartamos
              if (!isCombustion) {
                return false;
              }
            }
            return true;
         }).sort((a,b) => {
            return Math.abs(a.calcVal - target) - Math.abs(b.calcVal - target);
         }).slice(0, 5);
      }
    } catch (e) {
      console.log('Error calculando productos', e);
    }
    setCalcResult(filtered);
  }

  return (
    <div className="calc-container">
      <div className="chat-header">
        <div className="chat-header-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
          <CalcIcon size={24} />
        </div>
        <div>
          <h2>Calculadora de Equipos</h2>
          <p>Herramienta rápida de dimensionamiento</p>
        </div>
        {calcMode && (
          <button className="chat-clear-btn" onClick={() => setCalcMode('')}>Volver</button>
        )}
      </div>

      <div className="calc-content">
        {!calcMode ? (
          <div className="calc-options">
            <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>Selecciona un tipo de equipo:</h3>
            
            <button className="calc-option-btn" onClick={() => setCalcMode('gen')}>
              <div className="co-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Zap size={28} /></div>
              <div className="co-text">
                <h4>Generador (KVA)</h4>
                <p>Encuentra el generador ideal según la carga.</p>
              </div>
              <ChevronRight color="var(--text-tertiary)" />
            </button>
            
            <button className="calc-option-btn" onClick={() => setCalcMode('motor')}>
              <div className="co-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><Settings size={28} /></div>
              <div className="co-text">
                <h4>Motor Eléctrico (HP)</h4>
                <p>Busca motores por potencia exacta o aproximada.</p>
              </div>
              <ChevronRight color="var(--text-tertiary)" />
            </button>
            
            <button className="calc-option-btn" onClick={() => setCalcMode('bomba')}>
              <div className="co-icon" style={{ background: '#dbeafe', color: '#2563eb' }}><Droplets size={28} /></div>
              <div className="co-text">
                <h4>Bomba de Agua (HP)</h4>
                <p>Dimensionamiento según aplicación y potencia.</p>
              </div>
              <ChevronRight color="var(--text-tertiary)" />
            </button>
          </div>
        ) : (
          <div className="calc-form">
            <h3>Calculando: {calcMode === 'gen' ? 'Generador' : calcMode === 'motor' ? 'Motor' : 'Bomba'}</h3>
            
            {calcMode === 'bomba' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Aplicación de la Bomba</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['hogar', 'pozo', 'drenaje', 'piscina', 'combustion'].map(tipo => (
                    <button 
                      key={tipo}
                      onClick={() => setPumpWizard({ type: tipo })}
                      style={{ 
                        padding: '8px 16px', borderRadius: '20px', textTransform: 'capitalize',
                        background: pumpWizard.type === tipo ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                        color: pumpWizard.type === tipo ? 'var(--bg-primary)' : 'var(--text-primary)',
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Potencia Requerida ({calcMode === 'gen' ? 'KVA' : 'HP'})
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="number" 
                  value={calcInput}
                  onChange={(e) => setCalcInput(e.target.value)}
                  placeholder="Ej: 5.5"
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                    color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
                  }}
                />
                <button 
                  onClick={handleCalculate}
                  style={{
                    padding: '0 24px', borderRadius: '8px', background: 'var(--accent-color)',
                    color: 'var(--bg-primary)', border: 'none', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Calcular
                </button>
              </div>
            </div>

            {calcResult && (
              <div className="calc-results">
                <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Mejores Opciones Encontradas:</h4>
                {calcResult.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)' }}>No se encontraron productos que coincidan.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {calcResult.map((p, idx) => (
                      <div key={p.modelo} onClick={() => setSelectedProduct(p)} style={{
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                        background: 'var(--surface)', border: '1px solid var(--border-color)',
                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                      }} className="calc-result-card">
                        <div style={{ width: '48px', height: '48px', background: '#FFF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <img src={p.imagen || 'https://www.chacomer.com.py/media/wysiwyg/comagro/ISOLOGO_COMAGRO_COLOR.png'} alt={p.modelo} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{p.marca}</span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>{p.calcVal} {calcMode === 'gen' ? 'KVA' : 'HP'}</span>
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{p.modelo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetail producto={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
