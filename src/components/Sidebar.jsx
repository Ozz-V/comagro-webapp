import { NavLink } from 'react-router-dom';
import { Search, MessageSquare, Calculator, LogOut, FileText, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

export default function Sidebar({ onOpenProfile }) {
  const { session, profile } = useAuth();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ width: '100%', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="https://www.chacomer.com.py/media/wysiwyg/comagro/LogosPNG/LOGO_COMAGRO_BLANCO.png" alt="Comagro S.A." style={{ width: '85%', maxHeight: '45px', objectFit: 'contain' }} />
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Search size={20} />
          <span>Catálogo</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Asistente IA</span>
        </NavLink>
        <NavLink to="/calculadora" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Calculator size={20} />
          <span>Calculadora</span>
        </NavLink>
        <NavLink to="/catalogos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Catálogos PDF</span>
        </NavLink>
        <NavLink to="/fichas" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Fichas PDF</span>
        </NavLink>
        
        {/* Mobile-only profile button */}
        <div 
          className="sidebar-link mobile-profile-btn" 
          onClick={onOpenProfile}
          style={{ cursor: 'pointer' }}
        >
          <img src={profile?.avatar_url || 'https://www.chacomer.com.py/media/wysiwyg/comagro/ISOLOGO_COMAGRO_COLOR.png'} alt="Perfil" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
          <span>Perfil</span>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <div 
          className="sidebar-user" 
          onClick={onOpenProfile}
          style={{ cursor: 'pointer', opacity: 1, transition: 'opacity 0.2s', padding: '8px', borderRadius: '8px' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="user-avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="user-avatar">{session?.user?.email?.charAt(0).toUpperCase() || 'U'}</div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name && profile.full_name !== 'EMPTY' ? profile.full_name : 'Completar Perfil'}
            </div>
            <div className="user-email" style={{ fontSize: '0.75rem', marginTop: '2px', color: 'rgba(255,255,255,0.7)' }}>{session?.user?.email}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} style={{ marginTop: '12px' }}>
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}
