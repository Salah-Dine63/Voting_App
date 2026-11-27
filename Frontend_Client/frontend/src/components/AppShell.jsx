import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';

export default function AppShell() {
    const { user, logout } = useAuth();

    return (
        <div className="app-shell">
            <header className="site-header">
                <Link className="wordmark" to="/">Commonplace<span>.</span></Link>
                <nav aria-label="Main navigation">
                    <NavLink to="/" end>Explore</NavLink>
                    {user && <NavLink to="/dashboard">Your space</NavLink>}
                </nav>
                <div className="header-account">
                    {user ? (
                        <>
                            <span className="header-user">{user.first_name}</span>
                            <button className="button button-quiet" onClick={logout}>Sign out</button>
                        </>
                    ) : (
                        <Link className="button button-quiet" to="/login">Sign in</Link>
                    )}
                </div>
            </header>
            <Outlet />
            <footer className="site-footer">
                <span>Commonplace</span>
                <span>Thoughtful questions. Clearer choices.</span>
            </footer>
        </div>
    );
}
