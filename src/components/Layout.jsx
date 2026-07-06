import { useState } from 'react';
import Sidebar from './Sidebar';
import ProfileModal from './ProfileModal';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { profile, loading, session } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Consider profile incomplete if we have a session, but no profile or no full name
  const isProfileIncomplete = !loading && session && (!profile || !profile.full_name || profile.full_name === 'EMPTY');

  return (
    <div className="layout-container">
      <Sidebar onOpenProfile={() => setShowProfileModal(true)} />
      <main className="layout-content" style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      
      {(isProfileIncomplete || showProfileModal) && (
        <ProfileModal 
          isForced={isProfileIncomplete} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </div>
  );
}
