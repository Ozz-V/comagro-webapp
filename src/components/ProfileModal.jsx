import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Camera, Save, LogOut } from 'lucide-react';

export default function ProfileModal({ isForced = false, onClose }) {
  const { session, profile, updateProfileContext } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name && profile.full_name !== 'EMPTY' ? profile.full_name : '');
      setPhone(profile.telefono && profile.telefono !== '+595' ? profile.telefono : '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Comprimir la imagen antes de guardarla
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        
        let width = img.width;
        let height = img.height;

        if (scaleSize < 1) {
          width = MAX_WIDTH;
          height = img.height * scaleSize;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a JPEG con calidad 70%
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            setAvatarFile(compressedFile);
            setAvatarUrl(URL.createObjectURL(compressedFile));
          }
        }, 'image/jpeg', 0.7);
        
        URL.revokeObjectURL(objectUrl);
      };
      
      img.src = objectUrl;
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || fullName.trim() === 'EMPTY') {
      setErrorMsg('El nombre completo es obligatorio.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMsg('El teléfono es obligatorio y debe ser válido.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const userId = session?.user?.id;
      if (!userId) throw new Error('No user found');

      let finalAvatarUrl = avatarUrl;

      // 1. Upload avatar if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}_avatar.jpg`; // Consistent with APK

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        finalAvatarUrl = publicUrl + '?t=' + Date.now(); // Cache busting
      }

      // 2. Update profile
      const updatedData = {
        id: userId,
        full_name: fullName.trim(),
        telefono: phone.trim(),
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updatedData, { onConflict: 'id' });

      if (updateError) {
        throw updateError;
      }

      // 3. Update context
      await updateProfileContext();
      
      // 4. Close modal
      if (onClose) onClose();

    } catch (err) {
      console.error(err);
      setErrorMsg('Hubo un error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '450px', background: 'var(--surface)', 
        borderRadius: 'var(--radius-lg)', padding: '32px', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        {!isForced && (
          <button onClick={onClose} style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer'
          }}>
            <X size={20} color="var(--text-primary)" />
          </button>
        )}

        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
          {isForced ? 'Completa tu Perfil' : 'Editar Perfil'}
        </h2>
        {isForced && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
            Por favor, completa tus datos para continuar. El nombre y el teléfono son obligatorios.
          </p>
        )}
        {!isForced && <div style={{ height: '24px' }}></div>}

        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              width: '100px', height: '100px', borderRadius: '50%', 
              backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid var(--sidebar-bg)', cursor: 'pointer'
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '32px', color: 'var(--text-tertiary)' }}>👤</span>
            )}
          </div>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-color)',
              color: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <Camera size={16} />
          </div>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }} 
          />
        </div>

        {errorMsg && (
          <div style={{ width: '100%', padding: '12px', background: '#FEE2E2', color: '#EF4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>Nombre completo *</label>
            <input 
              type="text" 
              placeholder="Ej. Juan Pérez" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>Número de Teléfono *</label>
            <input 
              type="tel" 
              placeholder="Ej. +595 981 123 456" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={loading}
          style={{ 
            width: '100%', padding: '14px', background: 'var(--accent-color)', 
            color: 'white', border: 'none', borderRadius: '12px', 
            fontWeight: '600', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Guardando...' : <><Save size={20} /> Guardar Perfil</>}
        </button>

        {isForced && (
          <button 
            onClick={handleLogout}
            style={{ 
              marginTop: '16px', background: 'transparent', border: 'none', 
              color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <LogOut size={16} /> Usar otra cuenta
          </button>
        )}
      </div>
    </div>
  );
}
