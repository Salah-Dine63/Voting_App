import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import { useAuth } from './Context/useAuth';
import AppShell from './components/AppShell';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/ExplorePage';
import PollPage from './pages/PollPage';
import PollResultsPage from './pages/PollResultsPage';
import PollEditorPage from './pages/PollEditorPage';
import './index.css';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <main className="page container"><p className="loading-state">Restoring your session…</p></main>;
    }
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route element={<AppShell />}>
                <Route index element={<ExplorePage />} />
                <Route path="login" element={<AuthPage />} />
                <Route path="register" element={<AuthPage isRegister />} />
                <Route path="polls/:publicId" element={<PollPage />} />
                <Route path="polls/:publicId/results" element={<PollResultsPage />} />
                <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="polls/new" element={<ProtectedRoute><PollEditorPage /></ProtectedRoute>} />
                <Route path="polls/:publicId/edit" element={<ProtectedRoute><PollEditorPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}