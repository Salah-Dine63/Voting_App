import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import './index.css';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
      <main className="dashboard">
        <h1>Welcome, {user.name}!</h1>
        <p>You are successfully authenticated.</p>

        <button onClick={logout}>
          Logout
        </button>
      </main>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
  );
}