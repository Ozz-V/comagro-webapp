import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, Bot, User, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import ProductDetail from '../components/ProductDetail';
import { searchProducts } from '../utils/database';

export default function ChatIA() {
  const { session, profile } = useAuth();
  const userName = profile?.full_name && profile.full_name !== 'EMPTY' 
    ? profile.full_name.split(' ')[0] 
    : session?.user?.email?.split('@')[0] || '';

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `¡Hola ${userName}! Soy el Asistente IA de Comagro. Estoy conectado a la base de datos de productos. ¿En qué te puedo ayudar hoy?` }
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Filtrar el saludo inicial para evitar error 400 en Gemini si el primer msj es 'assistant'
      const historyForApi = newMessages.filter(msg => !(msg.role === 'assistant' && msg.content.includes('Soy el Asistente IA')));
      
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: historyForApi,
          user_id: session?.user?.id || 'anon'
        }
      });

      if (error) throw new Error(error.message);

      if (data && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('Sin respuesta');
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `[Error de conexión: ${err.message}]` }]);
    } finally {
      setLoading(false);
    }
  };

  const parseMessage = (text) => {
    const skuRegex = /\[SKU:\s*([^\]]+)\]/gi;
    let match;
    const skus = [];
    let cleanText = text;

    while ((match = skuRegex.exec(text)) !== null) {
      skus.push(match[1].trim());
      cleanText = cleanText.replace(match[0], '');
    }
    return { cleanText: cleanText.trim(), skus };
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-icon"><Bot size={24} /></div>
        <div>
          <h2>Comagro AI Bot</h2>
          <p>Conectado a la base de datos oficial</p>
        </div>
        <button className="chat-clear-btn" onClick={() => setMessages([{ role: 'assistant', content: `¡Hola ${userName}! ¿En qué te puedo ayudar?` }])}>Limpiar</button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => {
          const { cleanText, skus } = msg.role === 'assistant' ? parseMessage(msg.content) : { cleanText: msg.content, skus: [] };
          return (
            <div key={idx} className={`message-wrapper ${msg.role === 'user' ? 'message-user' : 'message-bot'}`}>
              <div className="message-bubble">
                <div className="message-role-icon">
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="message-content">
                  <p>{cleanText}</p>
                  {skus.length > 0 && (
                    <div className="chat-product-cards">
                      {skus.map(sku => (
                        <ChatProductCard key={sku} sku={sku} onClick={setSelectedProduct} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="message-wrapper message-bot">
            <div className="message-bubble">
              <div className="message-role-icon"><Bot size={16} /></div>
              <div className="message-content">
                <Loader2 className="animate-spin" size={20} color="var(--accent-color)" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta aquí..."
          disabled={loading}
        />
        <button type="submit" disabled={!input.trim() || loading}>
          <Send size={20} />
        </button>
      </form>

      {selectedProduct && (
        <ProductDetail producto={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}

// Subcomponente para renderizar una tarjeta de producto resumida dentro del chat
function ChatProductCard({ sku, onClick }) {
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProd() {
      // Usamos el buscador que ya tenemos pero filtramos exactamente por el modelo
      const results = await searchProducts('Todas', 'Todas', sku);
      // Podría devolver varios si el SKU es parcial, tomamos el primero que coincida exacto o el primero en la lista
      const exact = results.find(p => p.modelo.toUpperCase() === sku.toUpperCase());
      if (exact) setProducto(exact);
      else if (results.length > 0) setProducto(results[0]);
      
      setLoading(false);
    }
    fetchProd();
  }, [sku]);

  if (loading) {
    return <div className="chat-card-loading"><Loader2 size={16} className="animate-spin" /> Buscando {sku}...</div>;
  }

  if (!producto) {
    return null; // Si el SKU no existe, no mostramos tarjeta rota
  }

  return (
    <div className="chat-product-card" onClick={() => onClick(producto)}>
      <div className="cpc-img">
        <img src={producto.imagen || 'https://www.chacomer.com.py/media/wysiwyg/comagro/ISOLOGO_COMAGRO_COLOR.png'} alt={producto.modelo} />
      </div>
      <div className="cpc-info">
        <span className="cpc-marca">{producto.marca}</span>
        <span className="cpc-modelo">{producto.modelo}</span>
      </div>
      <ArrowRight size={16} color="var(--accent-color)" />
    </div>
  );
}
