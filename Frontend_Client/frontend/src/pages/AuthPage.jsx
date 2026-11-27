import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';

export default function AuthPage({ isRegister = false }) {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            if (isRegister) {
                await register(firstName, lastName, email, password);
            } else {
                await login(email, password);
            }
            const returnPath = location.state?.from;
            navigate(
                (typeof returnPath === 'string' ? returnPath : returnPath?.pathname) || '/dashboard',
                { replace: true }
            );
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-panel">
                <Link className="wordmark" to="/">Commonplace<span>.</span></Link>
                <p className="eyebrow">{isRegister ? 'Join the conversation' : 'A better way to ask'}</p>
                <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
                <p className="auth-intro">
                    {isRegister
                        ? 'Start a poll, invite people in, and see what your community thinks.'
                        : 'Sign in to manage your polls and take part in the ones that matter.'}
                </p>

                <form className="stack-form" onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-row">
                            <label>
                                First name
                                <input
                                    autoComplete="given-name"
                                    value={firstName}
                                    onChange={(event) => setFirstName(event.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Last name
                                <input
                                    autoComplete="family-name"
                                    value={lastName}
                                    onChange={(event) => setLastName(event.target.value)}
                                    required
                                />
                            </label>
                        </div>
                    )}
                    <label>
                        Email address
                        <input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            autoComplete={isRegister ? 'new-password' : 'current-password'}
                            minLength={8}
                            maxLength={72}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button className="button button-primary button-wide" disabled={submitting}>
                        {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
                    </button>
                </form>

                <p className="auth-switch">
                    {isRegister ? 'Already have an account?' : 'New to Commonplace?'}
                    {' '}
                    <Link to={isRegister ? '/login' : '/register'}>
                        {isRegister ? 'Sign in' : 'Create an account'}
                    </Link>
                </p>
            </section>
            <aside className="auth-note">
                <span className="note-mark">“</span>
                <blockquote>Good questions make room for better decisions.</blockquote>
                <span className="note-caption">A little more signal, a little less noise.</span>
            </aside>
        </main>
    );
}
