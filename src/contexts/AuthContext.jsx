import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        // Si no hay avatar_url en la BD, buscamos en el bucket por si se subió manualmente
        if (!data.avatar_url) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`${userId}_avatar.jpg`);
          try {
             const res = await fetch(publicUrl, { method: 'HEAD' });
             if (res.ok) {
                data.avatar_url = publicUrl + '?t=' + Date.now();
             }
          } catch(e) {}
        } else if (data.avatar_url && !data.avatar_url.startsWith('http')) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
          data.avatar_url = publicUrl;
        }

        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfileContext = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, updateProfileContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

