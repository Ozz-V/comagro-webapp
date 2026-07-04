import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './screens/Login';
import Productos from './screens/Productos';
import Layout from './components/Layout';
import ChatIA from './screens/ChatIA';
import Calculadora from './screens/Calculadora';
import Catalogos from './screens/Catalogos';
import Fichas from './screens/Fichas';
import { Loader2 } from 'lucide-react';

function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Loader2 size={32} className="animate-spin" color="var(--accent-color)" />
      </div>
    );
  }
  
  return session ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Productos />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/chat" element={
            <PrivateRoute>
              <Layout>
                <ChatIA />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/calculadora" element={
            <PrivateRoute>
              <Layout>
                <Calculadora />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/catalogos" element={
            <PrivateRoute>
              <Layout>
                <Catalogos />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/fichas" element={
            <PrivateRoute>
              <Layout>
                <Fichas />
              </Layout>
            </PrivateRoute>
          } />
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
