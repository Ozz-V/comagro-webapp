import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Mail, CheckCircle, Loader2, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LOGO_URL = 'https://www.chacomer.com.py/media/wysiwyg/comagro/ISOLOGO_COMAGRO_COLOR.png';

export default function Login() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Correo, 2 = Código OTP, 3 = PIN SuperUser
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Send OTP (Step 1)
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim().endsWith('@comagro.com.py')) {
      setError('Solo se admiten correos corporativos (@comagro.com.py)');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Check if super user
      const { data: superData } = await supabase
        .from('super_users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (superData) {
        setIsSuperUser(true);
        setStep(3);
        setLoading(false);
        return;
      }

      // 2. Normal OTP flow
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      });
      if (error) throw error;
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error al enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP or PIN
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError(isSuperUser ? 'Ingresa tu PIN.' : 'El código debe tener 6 dígitos.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isSuperUser) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: otp.trim()
        });
        if (error) throw new Error('PIN incorrecto.');
      } else {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otp.trim(),
          type: 'email'
        });
        if (error) throw new Error('Código inválido o expirado.');
      }
      
      // Redirect on success
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--sidebar-bg)', flexDirection: 'column', padding: '20px' }}>
      <img 
        src={LOGO_URL}
        alt="Comagro Logo" 
        style={{ height: '50px', margin: '0 auto', display: 'block', marginBottom: '32px', filter: 'brightness(0) invert(1)' }} 
      />
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px', background: '#FFFFFF' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Portal de Ventas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Accede al catálogo interactivo y asistente IA
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Correo Corporativo
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="nombre@comagro.com.py"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>
            
            {error && (
              <div style={{ color: '#EF4444', fontSize: '13px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '4px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Solicitar Código de Acceso'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                if (!email.trim().endsWith('@comagro.com.py')) {
                  setError('Ingresa tu correo primero');
                  return;
                }
                setIsSuperUser(true);
                setStep(3);
                setError(null);
              }}
              style={{ width: '100%', marginTop: '4px', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: '13px' }}
            >
              Ya tengo un PIN de acceso
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <CheckCircle size={32} color="var(--accent-color)" style={{ margin: '0 auto', marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {isSuperUser ? (
                  <>Ingresá el PIN de acceso para <strong>{email}</strong></>
                ) : (
                  <>Te enviamos un código de 6 dígitos a <strong>{email}</strong></>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isSuperUser ? 'PIN de Acceso' : 'Código de 6 Dígitos'}
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type={isSuperUser ? "password" : "text"}
                  maxLength={isSuperUser ? 20 : 6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={isSuperUser ? "••••" : "Ej: 123456"}
                  style={{ width: '100%', paddingLeft: '40px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px' }}
                  required
                />
              </div>
            </div>
            
            {error && (
              <div style={{ color: '#EF4444', fontSize: '13px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '4px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verificar y Entrar'}
            </button>
            <button 
              type="button" 
              onClick={() => { setStep(1); setOtp(''); setError(null); setIsSuperUser(false); }}
              style={{ width: '100%', marginTop: '4px', background: 'transparent', border: 'none' }}
            >
              Volver atrás
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
